"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type MarketZone = "FRIO" | "HYPE" | "BOLHA" | "NEUTRO";

type ArenaTokenForPanel = {
  id: string;
  name: string;
  ticker: string;
  price: number;
  zone: MarketZone;
  change24h: number;
  change7d: number;
  riskNote: string;
  storyHook?: string;
};

type TradeMode = "BUY" | "SELL";

type InlineTokenTradePanelProps = {
  token: ArenaTokenForPanel;
  onClose: () => void;
};

type WalletLite = {
  id: string;
  balance_base: number;
};

type MarketStateLite = {
  coin_id: string;
  base_reserve: number;
  coin_reserve: number;
  price_current: number;
  risk_zone: MarketZone;
  hype_score: number | null;
  volume_24h_base: number;
  trades_24h: number;
};

type ContextResp = {
  user_id: string;
  wallet: WalletLite;
  balances: { base: number; coin: number };
  market: MarketStateLite;
};

type SwapResp = {
  trade: {
    id: string;
    side: "BUY" | "SELL";
    amount_coin: number;
    amount_base: number;
    price_effective: number;
    fee_total_base: number;
    executed_at: string;
  };
  context: ContextResp;
};

type CandlePoint = {
  ts: number;        // epoch ms
  label: string;     // HH:mm
  price: number;
  volume_base?: number;
};

const FEE_PLATFORM_RATE = 0.0075;
const FEE_CREATOR_RATE = 0.0025;

const safeParse = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const toHHMM = (ts: number) => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export function InlineTokenTradePanel({
  token,
  onClose,
}: InlineTokenTradePanelProps) {
  const [mode, setMode] = useState<TradeMode>("BUY");
  const [amountBase, setAmountBase] = useState("100");
  const [amountCoin, setAmountCoin] = useState("");

  const [slippagePct, setSlippagePct] = useState("1");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [loadingCtx, setLoadingCtx] = useState(true);
  const [ctxError, setCtxError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ContextResp | null>(null);

  // chart state
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(true);
  const [candlesError, setCandlesError] = useState<string | null>(null);
  const [range, setRange] = useState<"1h" | "4h" | "24h">("4h");

  const parsedBase = useMemo(() => safeParse(amountBase), [amountBase]);
  const parsedCoin = useMemo(() => safeParse(amountCoin), [amountCoin]);
  const parsedSlippage = useMemo(
    () => clamp(safeParse(slippagePct), 0, 50),
    [slippagePct]
  );

  const isBuy = mode === "BUY";

  // ---------------------------
  // Edge context loader
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      setLoadingCtx(true);
      setCtxError(null);

      try {
        const { data, error } = await supabase.functions.invoke("arena-trade", {
          body: { action: "context", coin_id: token.id },
        });

        if (error) throw error;
        if (!data?.market?.coin_id) {
          throw new Error("Contexto incompleto.");
        }

        if (cancelled) return;
        setCtx(data as ContextResp);

        // realtime opcional (se sua RLS deixar ler market)
        const ch = supabase
          .channel(`cms:${token.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "coin_market_state",
              filter: `coin_id=eq.${token.id}`,
            },
            (payload) => {
              const next = payload.new as any;
              setCtx((prev) =>
                prev
                  ? {
                      ...prev,
                      market: {
                        ...prev.market,
                        base_reserve: Number(next.base_reserve),
                        coin_reserve: Number(next.coin_reserve),
                        price_current: Number(next.price_current),
                        risk_zone: next.risk_zone,
                        hype_score: next.hype_score,
                        volume_24h_base: Number(next.volume_24h_base),
                        trades_24h: Number(next.trades_24h),
                      },
                    }
                  : prev
              );

              // empurra preço realtime no gráfico (ponto fantasma)
              setCandles((prev) => {
                if (!prev.length) return prev;
                const nowTs = Date.now();
                const last = prev[prev.length - 1];
                const priceNow = Number(next.price_current);
                // se último ponto tem menos de 30s, só atualiza close
                if (nowTs - last.ts < 30_000) {
                  const copy = prev.slice();
                  copy[copy.length - 1] = {
                    ...last,
                    price: priceNow,
                    label: toHHMM(nowTs),
                    ts: nowTs,
                  };
                  return copy;
                }
                // senão adiciona ponto novo
                return [
                  ...prev,
                  { ts: nowTs, label: toHHMM(nowTs), price: priceNow },
                ].slice(-240);
              });
            }
          )
          .subscribe();

        return () => supabase.removeChannel(ch);
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setCtxError(err?.message || "Falha ao carregar contexto.");
        }
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [token.id]);

  // ---------------------------
  // Candles loader (1m -> fallback trades -> fallback synthetic)
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadCandles() {
      setLoadingCandles(true);
      setCandlesError(null);

      try {
        const now = Date.now();
        const cutoffMs =
          range === "1h" ? 1 * 60 * 60 * 1000 :
          range === "4h" ? 4 * 60 * 60 * 1000 :
          24 * 60 * 60 * 1000;

        // tentativa 1: candles 1m
        const { data: c1m, error: cErr } = await supabase
          .from("coin_candles_1m")
          .select("bucket_time, close_price, volume_base")
          .eq("coin_id", token.id)
          .gte("bucket_time", new Date(now - cutoffMs).toISOString())
          .order("bucket_time", { ascending: true })
          .limit(range === "24h" ? 1440 : range === "4h" ? 240 : 120);

        if (!cErr && c1m && c1m.length > 1) {
          const mapped: CandlePoint[] = c1m.map((r: any) => {
            const ts = new Date(r.bucket_time).getTime();
            return {
              ts,
              label: toHHMM(ts),
              price: Number(r.close_price),
              volume_base: Number(r.volume_base ?? 0),
            };
          });

          if (!cancelled) setCandles(mapped);
          return;
        }

        // tentativa 2: trades (ticker de última execução)
        const { data: trades, error: tErr } = await supabase
          .from("trades")
          .select("executed_at, price_effective")
          .eq("coin_id", token.id)
          .gte("executed_at", new Date(now - cutoffMs).toISOString())
          .order("executed_at", { ascending: true })
          .limit(range === "24h" ? 1440 : range === "4h" ? 240 : 120);

        if (!tErr && trades && trades.length > 1) {
          const mapped: CandlePoint[] = trades.map((r: any) => {
            const ts = new Date(r.executed_at).getTime();
            return {
              ts,
              label: toHHMM(ts),
              price: Number(r.price_effective),
            };
          });

          if (!cancelled) setCandles(mapped);
          return;
        }

        // fallback 3: sintético (quando não há histórico)
        const basePrice = ctx?.market.price_current ?? token.price ?? 1;
        const points = 40;
        const step = cutoffMs / points;
        const mapped: CandlePoint[] = Array.from({ length: points }).map((_, i) => {
          const ts = now - cutoffMs + i * step;
          // ruído bem leve só pra visual
          const noise = (Math.sin(i / 3) + Math.cos(i / 5)) * 0.0025; // 0.25%
          return {
            ts,
            label: toHHMM(ts),
            price: basePrice * (1 + noise),
          };
        });

        if (!cancelled) setCandles(mapped);
      } catch (err: any) {
        console.error(err);
        if (!cancelled) setCandlesError("Sem histórico para gráfico ainda.");
      } finally {
        if (!cancelled) setLoadingCandles(false);
      }
    }

    loadCandles();
    return () => {
      cancelled = true;
    };
  }, [token.id, range, ctx?.market.price_current]);

  const price = ctx?.market.price_current ?? token.price ?? 0;
  const baseReserve = ctx?.market.base_reserve ?? 0;
  const coinReserve = ctx?.market.coin_reserve ?? 0;
  const baseBalance = ctx?.balances.base ?? 0;
  const coinBalance = ctx?.balances.coin ?? 0;

  // ---------------------------
  // AMM Estimates (client hard)
  // ---------------------------
  const buyEst = useMemo(() => {
    if (!price || parsedBase <= 0 || baseReserve <= 0 || coinReserve <= 0) {
      return null;
    }

    const feePlatform = parsedBase * FEE_PLATFORM_RATE;
    const feeCreator = parsedBase * FEE_CREATOR_RATE;
    const baseNet = parsedBase - feePlatform - feeCreator;

    if (baseNet <= 0) return null;

    const k = baseReserve * coinReserve;
    const newBase = baseReserve + baseNet;
    const newCoin = k / newBase;
    const coinOut = coinReserve - newCoin;

    if (coinOut <= 0) return null;

    const minOut = coinOut * (1 - parsedSlippage / 100);
    const priceEffective = parsedBase / coinOut;
    const impactPct = (priceEffective / price - 1) * 100;
    const newPrice = newBase / newCoin;

    return {
      feePlatform,
      feeCreator,
      baseNet,
      coinOut,
      minOut,
      priceEffective,
      impactPct,
      newPrice,
    };
  }, [parsedBase, parsedSlippage, price, baseReserve, coinReserve]);

  const sellEst = useMemo(() => {
    if (!price || parsedCoin <= 0 || baseReserve <= 0 || coinReserve <= 0) {
      return null;
    }

    const k = baseReserve * coinReserve;
    const newCoin = coinReserve + parsedCoin;
    const newBase = k / newCoin;
    const baseOutGross = baseReserve - newBase;

    if (baseOutGross <= 0) return null;

    const feePlatform = baseOutGross * FEE_PLATFORM_RATE;
    const feeCreator = baseOutGross * FEE_CREATOR_RATE;
    const baseOutNet = baseOutGross - feePlatform - feeCreator;

    const minGrossOut = baseOutGross * (1 - parsedSlippage / 100);
    const priceEffective = baseOutGross / parsedCoin;
    const impactPct = (priceEffective / price - 1) * 100;
    const newPrice = newBase / newCoin;

    return {
      baseOutGross,
      feePlatform,
      feeCreator,
      baseOutNet,
      minGrossOut,
      priceEffective,
      impactPct,
      newPrice,
    };
  }, [parsedCoin, parsedSlippage, price, baseReserve, coinReserve]);

  const zoneLabel =
    token.zone === "HYPE"
      ? "Hype ativo"
      : token.zone === "BOLHA"
      ? "Zona da bolha"
      : token.zone === "FRIO"
      ? "Mercado frio"
      : "Neutro";

  const zoneClass =
    token.zone === "HYPE"
      ? "zone-hype"
      : token.zone === "BOLHA"
      ? "zone-bolha"
      : token.zone === "FRIO"
      ? "zone-frio"
      : "zone-neutro";

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });

  const formatCoin = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });

  const canBuy = parsedBase > 0 && parsedBase <= baseBalance;
  const canSell = parsedCoin > 0 && parsedCoin <= coinBalance;

  // chart domain
  const yDomain = useMemo<[number, number]>(() => {
    if (!candles.length) return [0, 1];
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const p of candles) {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
    const pad = (max - min) * 0.15 || min * 0.02 || 0.0001;
    return [Math.max(0, min - pad), max + pad];
  }, [candles]);

  // ---------------------------
  // Edge swap submit
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isBuy) {
      if (!canBuy) {
        setFeedback("Saldo base insuficiente.");
        return;
      }
      if (!buyEst) {
        setFeedback("Estimativa indisponível.");
        return;
      }
    } else {
      if (!canSell) {
        setFeedback("Saldo de tokens insuficiente.");
        return;
      }
      if (!sellEst) {
        setFeedback("Estimativa indisponível.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("arena-trade", {
        body: {
          action: "swap",
          coin_id: token.id,
          mode,
          amount_base: isBuy ? parsedBase : undefined,
          amount_coin: !isBuy ? parsedCoin : undefined,
          slippage_pct: parsedSlippage,
        },
      });

      if (error) throw error;

      const resp = data as SwapResp;

      // atualiza contexto com verdade do servidor
      setCtx(resp.context);

      if (mode === "BUY") {
        setFeedback(
          `Compra executada. Recebeu ${formatCoin(resp.trade.amount_coin)} ${
            token.ticker
          } a ${formatCurrency(resp.trade.price_effective)}.`
        );
      } else {
        setFeedback(
          `Venda executada. Vendeu ${formatCoin(resp.trade.amount_coin)} ${
            token.ticker
          } e recebeu ${formatCurrency(
            resp.trade.amount_base - resp.trade.fee_total_base
          )} aprox. após taxas.`
        );
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Falhou. Verifique pool/policies.";

      if (msg.includes("slippage too high")) {
        setFeedback("Slippage alto demais. Aumente tolerância ou reduza valor.");
      } else if (msg.includes("insufficient base balance")) {
        setFeedback("Saldo base insuficiente.");
      } else if (msg.includes("insufficient coin balance")) {
        setFeedback("Saldo de tokens insuficiente.");
      } else if (msg.includes("coin must be ACTIVE")) {
        setFeedback("Token pausado/bloqueado. Sem trade agora.");
      } else {
        setFeedback(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCtx) {
    return (
      <section className="inline-trade-panel">
        <div className="inline-feedback">Carregando painel de trade...</div>
      </section>
    );
  }

  if (ctxError) {
    return (
      <section className="inline-trade-panel">
        <div className="inline-feedback inline-feedback--error">{ctxError}</div>
        <button
          type="button"
          className="btn-outline inline-submit"
          onClick={onClose}
        >
          Fechar
        </button>
      </section>
    );
  }

  return (
    <section
      className="inline-trade-panel"
      aria-label={`Negociação de ${token.ticker}`}
    >
      {/* HEAD */}
      <div className="inline-trade-head">
        <div className="inline-trade-left">
          <div className="inline-trade-title-row">
            <span className="inline-trade-ticker">{token.ticker}</span>
            <span className={`inline-trade-zone ${zoneClass}`}>
              {zoneLabel}
            </span>
          </div>
          <div className="inline-trade-name">{token.name}</div>
          {token.storyHook && (
            <div className="inline-trade-story">{token.storyHook}</div>
          )}
        </div>

        <button
          type="button"
          className="inline-trade-close"
          onClick={onClose}
        >
          fechar ✕
        </button>
      </div>

      {/* SUMMARY */}
      <div className="inline-trade-summary">
        <div className="inline-sum-box">
          <div className="inline-sum-label">Preço agora</div>
          <div className="inline-sum-value">{formatCurrency(price)}</div>
        </div>
        <div className="inline-sum-box">
          <div className="inline-sum-label">Saldo base</div>
          <div className="inline-sum-value">
            {formatCurrency(baseBalance)}
          </div>
        </div>
        <div className="inline-sum-box">
          <div className="inline-sum-label">Saldo {token.ticker}</div>
          <div className="inline-sum-value">{formatCoin(coinBalance)}</div>
        </div>
      </div>

      {/* CHART */}
      <div className="inline-chart" style={{ marginTop: 10 }}>
        <div
          className="inline-chart-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Oscilação recente (fechamento)
          </div>
          <div
            className="inline-chart-range"
            style={{ display: "flex", gap: 6 }}
          >
            {(["1h", "4h", "24h"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={
                  "inline-range-pill " + (range === r ? "active" : "")
                }
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 999,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div
          className="inline-chart-body"
          style={{
            height: 170,
            width: "100%",
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {loadingCandles ? (
            <div className="inline-feedback" style={{ padding: 10 }}>
              Carregando gráfico…
            </div>
          ) : candlesError ? (
            <div className="inline-feedback inline-feedback--error" style={{ padding: 10 }}>
              {candlesError}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={candles}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  width={60}
                  tickFormatter={(v) =>
                    Number(v).toLocaleString("pt-BR", {
                      maximumFractionDigits: 6,
                    })
                  }
                />
                <Tooltip
                  formatter={(value: any) => [
                    formatCurrency(Number(value)),
                    "Preço",
                  ]}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as CandlePoint | undefined;
                    if (!p) return "";
                    return new Date(p.ts).toLocaleString("pt-BR");
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="inline-trade-tabs" role="tablist">
        <button
          type="button"
          className={"inline-tab " + (isBuy ? "active" : "")}
          onClick={() => {
            setMode("BUY");
            setFeedback(null);
          }}
        >
          Comprar
        </button>
        <button
          type="button"
          className={"inline-tab " + (!isBuy ? "active" : "")}
          onClick={() => {
            setMode("SELL");
            setFeedback(null);
          }}
        >
          Vender
        </button>
      </div>

      {/* FORM */}
      <form className="inline-trade-form" onSubmit={handleSubmit}>
        {isBuy ? (
          <>
            <label className="inline-field">
              <span className="inline-field-label">
                Quanto em base você quer colocar?
              </span>
              <div className="inline-input-wrap">
                <span className="inline-prefix">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountBase}
                  onChange={(e) => setAmountBase(e.target.value)}
                  className="inline-input"
                  placeholder="100"
                />
              </div>
            </label>

            <div className="inline-est">
              <span>Estimativa de recebimento</span>
              <strong>
                {buyEst
                  ? `${formatCoin(buyEst.coinOut)} ${token.ticker}`
                  : "--"}
              </strong>
              <small>
                Mínimo com slippage ({parsedSlippage}%):{" "}
                {buyEst
                  ? `${formatCoin(buyEst.minOut)} ${token.ticker}`
                  : "--"}
              </small>
            </div>
          </>
        ) : (
          <>
            <label className="inline-field">
              <span className="inline-field-label">
                Quantos tokens você quer vender?
              </span>
              <div className="inline-input-wrap">
                <span className="inline-prefix">{token.ticker}</span>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={amountCoin}
                  onChange={(e) => setAmountCoin(e.target.value)}
                  className="inline-input"
                  placeholder="50"
                />
              </div>
            </label>

            <div className="inline-est">
              <span>Estimativa de recebimento (bruto)</span>
              <strong>
                {sellEst ? formatCurrency(sellEst.baseOutGross) : "--"}
              </strong>
              <small>
                Líquido estimado após taxas:{" "}
                {sellEst ? formatCurrency(sellEst.baseOutNet) : "--"}
              </small>
              <small>
                Mínimo bruto com slippage ({parsedSlippage}%):{" "}
                {sellEst
                  ? formatCurrency(sellEst.minGrossOut)
                  : "--"}
              </small>
            </div>
          </>
        )}

        {/* ADVANCED */}
        <button
          type="button"
          className="inline-advanced-toggle"
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? "Ocultar avançado" : "Mostrar avançado"}
        </button>

        {showAdvanced && (
          <div className="inline-advanced">
            <label className="inline-field">
              <span className="inline-field-label">
                Slippage tolerado (%)
              </span>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={slippagePct}
                onChange={(e) => setSlippagePct(e.target.value)}
                className="inline-input"
                placeholder="1"
              />
              <small>
                Quanto maior, mais chance de executar — e maior a chance
                de tomar preço ruim.
              </small>
            </label>

            <div className="inline-advanced-grid">
              <div className="inline-adv-box">
                <div className="inline-adv-label">Taxa plataforma</div>
                <div className="inline-adv-value">
                  {(FEE_PLATFORM_RATE * 100).toFixed(2)}%
                </div>
              </div>
              <div className="inline-adv-box">
                <div className="inline-adv-label">Taxa criador</div>
                <div className="inline-adv-value">
                  {(FEE_CREATOR_RATE * 100).toFixed(2)}%
                </div>
              </div>
              <div className="inline-adv-box">
                <div className="inline-adv-label">Impacto estimado</div>
                <div className="inline-adv-value">
                  {isBuy
                    ? buyEst
                      ? `${buyEst.impactPct.toFixed(2)}%`
                      : "--"
                    : sellEst
                    ? `${sellEst.impactPct.toFixed(2)}%`
                    : "--"}
                </div>
              </div>
              <div className="inline-adv-box">
                <div className="inline-adv-label">Preço após trade</div>
                <div className="inline-adv-value">
                  {isBuy
                    ? buyEst
                      ? formatCurrency(buyEst.newPrice)
                      : "--"
                    : sellEst
                    ? formatCurrency(sellEst.newPrice)
                    : "--"}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary inline-submit"
          disabled={isSubmitting || (isBuy ? !canBuy : !canSell)}
        >
          {isSubmitting
            ? "Executando..."
            : isBuy
            ? "Comprar assumindo o risco"
            : "Vender assumindo o risco"}
        </button>

        {!isSubmitting && isBuy && parsedBase > 0 && !canBuy && (
          <p className="inline-feedback inline-feedback--error">
            Saldo base insuficiente.
          </p>
        )}

        {!isSubmitting && !isBuy && parsedCoin > 0 && !canSell && (
          <p className="inline-feedback inline-feedback--error">
            Saldo de tokens insuficiente.
          </p>
        )}

        {feedback && <p className="inline-feedback">{feedback}</p>}
      </form>

      <div className="inline-risk">
        <strong>Risco:</strong> {token.riskNote}
      </div>
    </section>
  );
}
