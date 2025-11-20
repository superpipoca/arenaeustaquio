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
type OrderType = "MARKET" | "LIMIT";

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

type TradeResp = {
  id: string;
  side: "BUY" | "SELL";
  amount_coin: number;
  amount_base: number;
  price_effective: number;
  fee_total_base: number;
  executed_at: string;
};

type LimitOrderResp = {
  id: string;
  coin_id: string;
  side: "BUY" | "SELL";
  type: "LIMIT";
  price_limit: number;
  amount_base: number | null;
  amount_coin: number | null;
  filled_base_total: number;
  filled_coin_total: number;
  status: "OPEN" | "PARTIAL" | "FILLED" | "CANCELLED";
  created_at: string;
};

type PlaceOrderResp = {
  trade?: TradeResp | null;
  order?: LimitOrderResp | any;
  context: ContextResp;
};

type CandlePoint = {
  ts: number;
  label: string;
  price: number;
  volume_base?: number;
};

type BookLevel = {
  coin_id: string;
  side: "BUY" | "SELL";
  price: number;
  qty_coin: number;
  orders: number;
};

type OrderbookResp = {
  bids: BookLevel[];
  asks: BookLevel[];
  depth: number;
};

type LimitCrossPreview = {
  willCross: boolean;
  executedPct: number;
  execCoin: number;
  execBase: number;
  vwap: number;
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

// ------------------------------------------------------
// Helpers de log seguro para error.context
// ------------------------------------------------------
const safeStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (k, v) => {
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    },
    2
  );
};

const redactHeaders = (h: any) => {
  if (!h || typeof h !== "object") return h;
  const copy: any = { ...h };
  for (const key of Object.keys(copy)) {
    const lk = key.toLowerCase();
    if (
      lk.includes("authorization") ||
      lk.includes("apikey") ||
      lk.includes("token") ||
      lk.includes("cookie")
    ) {
      copy[key] = "[REDACTED]";
    }
  }
  return copy;
};


// ✅ agora a Edge manda erro em TEXTO PURO.
// então o extractor prioriza string crua antes de tentar JSON.
const extractInvokeErrorMessage = (error: any): string | null => {
  if (!error) return null;

  const generic =
    typeof error?.message === "string" &&
    error.message.toLowerCase().includes("non-2xx");

  const bodyCandidates = [
    error?.context?.responseText,
    error?.context?.body,
    error?.body,
    error?.details,
    error?.cause,
  ];

  for (const cand of bodyCandidates) {
    if (!cand) continue;

    if (typeof cand === "string" && cand.trim()) {
      return cand.trim();
    }

    if (typeof cand === "object") {
      const msg = cand?.error || cand?.message;
      if (msg) return String(msg);
    }
  }

  return generic ? null : error?.message || null;
};

// ✅ NOVO: tenta ler body quando context é Response
const tryReadResponseBody = async (resp: Response): Promise<string | null> => {
  try {
    const clone = resp.clone(); // não consome o original
    const txt = await clone.text();
    if (!txt || !txt.trim()) return null;

    // se parece JSON, tenta extrair message/error
    try {
      const j = JSON.parse(txt);
      const msg = j?.error || j?.message || j?.detail;
      return msg ? String(msg) : txt.trim();
    } catch {
      return txt.trim();
    }
  } catch {
    return null;
  }
};


// ✅ wrapper único: loga error.context e nunca deixa `invoke` vazar erro genérico
const invokeArenaOrThrow = async <T = any>(body: any): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("arena-trade", {
    body,
  });

  if (error) {
    // LOG DETALHADO
    console.groupCollapsed("[arena-trade] invoke error");
    console.log("request body:", body);
    console.log("error:", error);
    console.log("error.message:", error.message);
    console.log("error.context (raw):", (error as any).context);

    let responseBody: string | null = null;

    // se context é Response -> lê o body
    const ctx = (error as any).context;
    if (ctx instanceof Response) {
      responseBody = await tryReadResponseBody(ctx);
      console.log("error.context.status:", ctx.status);
      console.log("error.context.body (read):", responseBody);
    } else {
      // senão loga contexto seguro normal
      try {
        const safeCtx = {
          ...ctx,
          headers: redactHeaders(ctx?.headers),
          responseHeaders: redactHeaders(ctx?.responseHeaders),
        };
        console.log("error.context (safe):\n", safeStringify(safeCtx));
      } catch (e) {
        console.warn("[arena-trade] failed to stringify error.context", e);
      }
    }

    console.groupEnd();

    // monta msg final
    const serverMsg =
      responseBody || extractInvokeErrorMessage(error);

    throw new Error(serverMsg || error.message || "Falha na Edge Function.");
  }

  if (data && typeof data === "object" && (data as any).error) {
    throw new Error(String((data as any).error));
  }

  return data as T;
};


export function InlineTokenTradePanel({
  token,
  onClose,
}: InlineTokenTradePanelProps) {
  const [mode, setMode] = useState<TradeMode>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");

  const [amountBase, setAmountBase] = useState("100");
  const [amountCoin, setAmountCoin] = useState("");
  const [priceLimit, setPriceLimit] = useState("");

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

  // book + orders
  const [book, setBook] = useState<OrderbookResp | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  const [myOrders, setMyOrders] = useState<LimitOrderResp[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(true);
  const [myOrdersError, setMyOrdersError] = useState<string | null>(null);

  const parsedBase = useMemo(() => safeParse(amountBase), [amountBase]);
  const parsedCoin = useMemo(() => safeParse(amountCoin), [amountCoin]);
  const parsedLimit = useMemo(() => safeParse(priceLimit), [priceLimit]);
  const parsedSlippage = useMemo(
    () => clamp(safeParse(slippagePct), 0, 50),
    [slippagePct]
  );

  const isBuy = mode === "BUY";
  const isMarket = orderType === "MARKET";
  const isLimit = orderType === "LIMIT";

  // ---------------------------
  // Edge context loader
  // ---------------------------
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadContext() {
      setLoadingCtx(true);
      setCtxError(null);

      try {
        const data = await invokeArenaOrThrow<ContextResp>({
          action: "context",
          coin_id: token.id,
        });

        if (!data?.market?.coin_id) throw new Error("Contexto incompleto.");

        if (cancelled) return;
        setCtx(data);

        channel = supabase
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

              // ponto fantasma no gráfico
              setCandles((prev) => {
                if (!prev.length) return prev;
                const nowTs = Date.now();
                const last = prev[prev.length - 1];
                const priceNow = Number(next.price_current);

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
                return [
                  ...prev,
                  { ts: nowTs, label: toHHMM(nowTs), price: priceNow },
                ].slice(-240);
              });
            }
          )
          .subscribe();
      } catch (err: any) {
        console.error(err);
        if (!cancelled)
          setCtxError(err?.message || "Falha ao carregar contexto.");
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    }

    loadContext();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [token.id]);

  // ---------------------------
  // Orderbook loader (15min)
  // ---------------------------
  useEffect(() => {
    let cancelled = false;
    let timer: any;

    async function loadBook() {
      setLoadingBook(true);
      setBookError(null);
      try {
        const data = await invokeArenaOrThrow<OrderbookResp>({
          action: "orderbook",
          coin_id: token.id,
          depth: 12,
        });

        if (!cancelled) setBook(data);
      } catch (err: any) {
        console.error(err);
        if (!cancelled)
          setBookError(err?.message || "Falha ao carregar book.");
      } finally {
        if (!cancelled) setLoadingBook(false);
      }
    }

    loadBook();
    timer = setInterval(loadBook, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [token.id]);

  // ---------------------------
  // My orders loader (15min)
  // ---------------------------
  useEffect(() => {
    let cancelled = false;
    let timer: any;

    async function loadMyOrders() {
      setLoadingMyOrders(true);
      setMyOrdersError(null);
      try {
        const data = await invokeArenaOrThrow<{ orders: LimitOrderResp[] }>({
          action: "my_orders",
          coin_id: token.id,
        });

        const orders = (data?.orders ?? []) as LimitOrderResp[];
        if (!cancelled) setMyOrders(orders);
      } catch (err: any) {
        console.error(err);
        if (!cancelled)
          setMyOrdersError(err?.message || "Falha ao carregar suas ordens.");
      } finally {
        if (!cancelled) setLoadingMyOrders(false);
      }
    }

    loadMyOrders();
    timer = setInterval(loadMyOrders, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [token.id]);

  // ---------------------------
 // Candles loader
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadCandles() {
      setLoadingCandles(true);
      setCandlesError(null);

      try {
        const now = Date.now();
        const cutoffMs =
          range === "1h"
            ? 1 * 60 * 60 * 1000
            : range === "4h"
            ? 4 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

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

        const basePrice = ctx?.market.price_current ?? token.price ?? 1;
        const points = 40;
        const step = cutoffMs / points;
        const mapped: CandlePoint[] = Array.from({ length: points }).map(
          (_, i) => {
            const ts = now - cutoffMs + i * step;
            const noise =
              (Math.sin(i / 3) + Math.cos(i / 5)) * 0.0025;
            return {
              ts,
              label: toHHMM(ts),
              price: basePrice * (1 + noise),
            };
          }
        );

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
  // Best bid/ask helpers
  // ---------------------------
  const bestBid = book?.bids?.[0]?.price ?? null;
  const bestAsk = book?.asks?.[0]?.price ?? null;

  const useBestBidAsk = () => {
    if (isBuy && bestAsk) setPriceLimit(String(bestAsk));
    if (!isBuy && bestBid) setPriceLimit(String(bestBid));
  };

  const bookPositionPct = useMemo(() => {
    if (!isLimit || parsedLimit <= 0 || !book) return null;
    const bids = book.bids ?? [];
    const asks = book.asks ?? [];

    if (isBuy) {
      if (!bids.length) return null;
      const idx = bids.findIndex((b) => Number(b.price) <= parsedLimit);
      const pos = idx === -1 ? bids.length : idx;
      const pct = ((bids.length - pos) / bids.length) * 100;
      return clamp(pct, 0, 100);
    } else {
      if (!asks.length) return null;
      const idx = asks.findIndex((a) => Number(a.price) >= parsedLimit);
      const pos = idx === -1 ? asks.length : idx;
      const pct = ((asks.length - pos) / asks.length) * 100;
      return clamp(pct, 0, 100);
    }
  }, [isLimit, parsedLimit, book, isBuy]);

  const crossWarning = useMemo(() => {
    if (!isLimit || parsedLimit <= 0) return null;
    if (isBuy && bestAsk && parsedLimit >= bestAsk)
      return "Esse BUY LIMIT cruza o ASK e parte pode executar na hora.";
    if (!isBuy && bestBid && parsedLimit <= bestBid)
      return "Esse SELL LIMIT cruza o BID e parte pode executar na hora.";
    return null;
  }, [isLimit, parsedLimit, bestAsk, bestBid, isBuy]);

  // ---------------------------
  // LIMIT cross preview
  // ---------------------------
  const limitCrossPreview = useMemo<LimitCrossPreview | null>(() => {
    if (!isLimit || parsedLimit <= 0 || !book) return null;

    if (isBuy) {
      if (!parsedBase || parsedBase <= 0) return null;

      const asks = (book.asks ?? [])
        .filter((a) => Number(a.price) <= parsedLimit)
        .sort((a, b) => Number(a.price) - Number(b.price));

      if (!asks.length) return null;

      let remainingBase = parsedBase;
      let execCoin = 0;
      let execBase = 0;

      for (const lvl of asks) {
        if (remainingBase <= 0) break;
        const p = Number(lvl.price);
        const lvlCoin = Number(lvl.qty_coin);
        if (!p || !lvlCoin) continue;

        const maxCoinAtLevel = remainingBase / p;
        const tradedCoin = Math.min(lvlCoin, maxCoinAtLevel);
        const tradedBase = tradedCoin * p;

        if (tradedCoin <= 0 || tradedBase <= 0) continue;

        execCoin += tradedCoin;
        execBase += tradedBase;
        remainingBase -= tradedBase;
      }

      if (execCoin <= 0 || execBase <= 0) return null;

      const executedPct = (execBase / parsedBase) * 100;
      const vwap = execBase / execCoin;

      return {
        willCross: executedPct > 0,
        executedPct,
        execCoin,
        execBase,
        vwap,
      };
    }

    if (!isBuy) {
      if (!parsedCoin || parsedCoin <= 0) return null;

      const bids = (book.bids ?? [])
        .filter((b) => Number(b.price) >= parsedLimit)
        .sort((a, b) => Number(b.price) - Number(a.price)); // desc

      if (!bids.length) return null;

      let remainingCoin = parsedCoin;
      let execCoin = 0;
      let execBase = 0;

      for (const lvl of bids) {
        if (remainingCoin <= 0) break;
        const p = Number(lvl.price);
        const lvlCoin = Number(lvl.qty_coin);
        if (!p || !lvlCoin) continue;

        const tradedCoin = Math.min(lvlCoin, remainingCoin);
        const tradedBase = tradedCoin * p;

        if (tradedCoin <= 0 || tradedBase <= 0) continue;

        execCoin += tradedCoin;
        execBase += tradedBase;
        remainingCoin -= tradedCoin;
      }

      if (execCoin <= 0 || execBase <= 0) return null;

      const executedPct = (execCoin / parsedCoin) * 100;
      const vwap = execBase / execCoin;

      return {
        willCross: executedPct > 0,
        executedPct,
        execCoin,
        execBase,
        vwap,
      };
    }

    return null;
  }, [isLimit, parsedLimit, isBuy, parsedBase, parsedCoin, book]);

  // ---------------------------
  // AMM Estimates (MARKET)
  // ---------------------------
  const buyEst = useMemo(() => {
    if (!price || parsedBase <= 0 || baseReserve <= 0 || coinReserve <= 0)
      return null;

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
    if (!price || parsedCoin <= 0 || baseReserve <= 0 || coinReserve <= 0)
      return null;

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

  // ---------------------------
  // LIMIT preview
  // ---------------------------
  const limitPreview = useMemo(() => {
    if (!isLimit || parsedLimit <= 0) return null;

    if (isBuy) {
      if (parsedBase <= 0) return null;
      const qtyCoin = parsedBase / parsedLimit;
      return { qtyCoin, costBase: parsedBase };
    } else {
      if (parsedCoin <= 0) return null;
      const grossBase = parsedCoin * parsedLimit;
      return { qtyCoin: parsedCoin, grossBase };
    }
  }, [isLimit, parsedLimit, isBuy, parsedBase, parsedCoin]);

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

  const canBuyMarket = parsedBase > 0 && parsedBase <= baseBalance;
  const canSellMarket = parsedCoin > 0 && parsedCoin <= coinBalance;

  const canBuyLimit =
    parsedLimit > 0 && parsedBase > 0 && parsedBase <= baseBalance;

  const canSellLimit =
    parsedLimit > 0 && parsedCoin > 0 && parsedCoin <= coinBalance;

  const canSubmit =
    isMarket
      ? isBuy
        ? canBuyMarket
        : canSellMarket
      : isBuy
      ? canBuyLimit
      : canSellLimit;

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
  // Cancel order
  // ---------------------------
  const handleCancelOrder = async (orderId: string) => {
    try {
      const data = await invokeArenaOrThrow<{ ok: boolean }>({
        action: "cancel_order",
        order_id: orderId,
      });

      if (data?.ok) {
        setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
        setFeedback("Ordem cancelada.");
      }
    } catch (err: any) {
      console.error(err);
      setFeedback(err?.message || "Falha ao cancelar ordem.");
    }
  };

  // ---------------------------
  // Place order (MARKET/LIMIT)
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!canSubmit) {
      setFeedback("Valores inválidos ou saldo insuficiente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: any = {
        action: "place_order",
        coin_id: token.id,
        side: mode,
        type: orderType,
      };

      if (orderType === "MARKET") {
        body.slippage_pct = parsedSlippage;
        if (isBuy) body.amount_base = parsedBase;
        else body.amount_coin = parsedCoin;
      } else {
        body.price_limit = parsedLimit;
        if (isBuy) body.amount_base = parsedBase;
        else body.amount_coin = parsedCoin;
      }

      const resp = await invokeArenaOrThrow<PlaceOrderResp>(body);

      if (!resp?.context?.market?.coin_id) {
        throw new Error("Resposta incompleta do servidor.");
      }

      setCtx(resp.context);

      if (resp.trade) {
        const t = resp.trade;
        if (mode === "BUY") {
          setFeedback(
            `Compra executada. Recebeu ${formatCoin(t.amount_coin)} ${
              token.ticker
            } a ${formatCurrency(t.price_effective)}.`
          );
        } else {
          setFeedback(
            `Venda executada. Vendeu ${formatCoin(t.amount_coin)} ${
              token.ticker
            } e recebeu ${formatCurrency(
              t.amount_base - t.fee_total_base
            )} aprox. após taxas.`
          );
        }
      } else if (resp.order) {
        const o = resp.order as LimitOrderResp;
        setFeedback(
          `Ordem LIMIT criada (#${String(o.id).slice(0, 6)}). ${
            mode === "BUY" ? "Comprando" : "Vendendo"
          } a ${formatCurrency(Number(o.price_limit))}.`
        );
        setMyOrders((prev) => [o, ...prev]);
      } else {
        setFeedback("Operação enviada, mas sem retorno de trade.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Falhou. Verifique pool/policies.";

      if (
        msg.includes("IMPACT_BREAKER") ||
        msg.includes("circuit breaker triggered")
      ) {
        const impactRaw = msg.match(/impact=([0-9.]+)/)?.[1];
        const slippageRaw = msg.match(/slippage=([0-9.]+)/)?.[1];

        const impactTxt = impactRaw
          ? Number(impactRaw).toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })
          : null;

        const slipTxt = slippageRaw
          ? Number(slippageRaw).toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })
          : null;

        setFeedback(
          `Ordem doida demais pro pool — corta o tamanho ou para de querer quebrar o mercado. ` +
            `Proteção anti-impacto acionada (circuit breaker). ` +
            `Essa ordem daria impacto${impactTxt ? ` ~${impactTxt}%` : ""} ` +
            `e slippage${slipTxt ? ` ~${slipTxt}%` : ""} no pool. ` +
            `Reduza o valor ou use uma LIMIT mais distante do spread.`
        );
        return;
      }

      if (msg.includes("slippage too high")) {
        setFeedback("Slippage alto demais. Aumente tolerância ou reduza valor.");
      } else if (
        msg.includes("Saldo base insuficiente") ||
        msg.includes("insufficient base balance")
      ) {
        setFeedback("Saldo base insuficiente.");
      } else if (
        msg.includes("Saldo de tokens insuficiente") ||
        msg.includes("insufficient coin balance")
      ) {
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
          <div className="inline-sum-value">{formatCurrency(baseBalance)}</div>
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
                className={"inline-range-pill " + (range === r ? "active" : "")}
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
            <div
              className="inline-feedback inline-feedback--error"
              style={{ padding: 10 }}
            >
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

      {/* BOOK (mini) */}
      <div className="inline-book">
        <div className="inline-book-head">
          <div className="inline-book-title">Livro de ofertas</div>
          <div className="inline-book-best">
            <span>BID: {bestBid ? formatCurrency(bestBid) : "--"}</span>
            <span>ASK: {bestAsk ? formatCurrency(bestAsk) : "--"}</span>
          </div>
        </div>

        {loadingBook ? (
          <div className="inline-feedback">Carregando book…</div>
        ) : bookError ? (
          <div className="inline-feedback inline-feedback--error">
            {bookError}
          </div>
        ) : (
          <div className="inline-book-grid">
            <div className="inline-book-col">
              <div className="inline-book-col-title">BIDs (compra)</div>
              {(book?.bids ?? []).slice(0, 8).map((b, i) => (
                <div key={`b-${i}`} className="inline-book-row bid">
                  <span className="p">{formatCurrency(Number(b.price))}</span>
                  <span className="q">{formatCoin(Number(b.qty_coin))}</span>
                </div>
              ))}
            </div>
            <div className="inline-book-col">
              <div className="inline-book-col-title">ASKs (venda)</div>
              {(book?.asks ?? []).slice(0, 8).map((a, i) => (
                <div key={`a-${i}`} className="inline-book-row ask">
                  <span className="p">{formatCurrency(Number(a.price))}</span>
                  <span className="q">{formatCoin(Number(a.qty_coin))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* ORDER TYPE */}
      <div className="inline-ordertype-toggle">
        <button
          type="button"
          className={"inline-ordertype " + (isMarket ? "active" : "")}
          onClick={() => setOrderType("MARKET")}
        >
          MARKET
        </button>
        <button
          type="button"
          className={"inline-ordertype " + (isLimit ? "active" : "")}
          onClick={() => setOrderType("LIMIT")}
        >
          LIMIT
        </button>
      </div>

      {/* FORM */}
      <form className="inline-trade-form" onSubmit={handleSubmit}>
        {/* LIMIT PRICE */}
        {isLimit && (
          <label className="inline-field">
            <span className="inline-field-label">
              Preço limite ({isBuy ? "máximo pra comprar" : "mínimo pra vender"})
            </span>
            <div className="inline-input-wrap">
              <span className="inline-prefix">R$</span>
              <input
                type="number"
                min="0"
                step="0.000001"
                value={priceLimit}
                onChange={(e) => setPriceLimit(e.target.value)}
                className="inline-input"
                placeholder={isBuy ? "0.50" : "0.60"}
              />
              <button
                type="button"
                className="inline-best-btn"
                title="Usar melhor BID/ASK"
                onClick={useBestBidAsk}
              >
                usar melhor {isBuy ? "ASK" : "BID"}
              </button>
            </div>

            {bookPositionPct != null && (
              <small className="inline-bookpos">
                Sua ordem fica ~{bookPositionPct.toFixed(0)}% no topo do book
              </small>
            )}
            {crossWarning && (
              <small className="inline-crosswarn">{crossWarning}</small>
            )}

            {limitCrossPreview && limitCrossPreview.willCross && (
              <div className="inline-crosspreview">
                <div className="inline-crosspreview-title">Se mandar agora:</div>
                <div className="inline-crosspreview-line">
                  <span>
                    {limitCrossPreview.executedPct.toFixed(0)}% executa na hora (
                    {formatCoin(limitCrossPreview.execCoin)} {token.ticker})
                  </span>
                  <span>Pmédio ~ {formatCurrency(limitCrossPreview.vwap)}</span>
                </div>
                <small className="inline-crosspreview-foot">
                  O restante entra no book a {formatCurrency(parsedLimit)}.
                </small>
              </div>
            )}
          </label>
        )}

        {/* AMOUNT */}
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

            {isMarket ? (
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
            ) : (
              <div className="inline-est">
                <span>Preview LIMIT</span>
                <strong>
                  {limitPreview
                    ? `${formatCoin(limitPreview.qtyCoin)} ${token.ticker}`
                    : "--"}
                </strong>
                <small>
                  Custo total:{" "}
                  {limitPreview
                    ? formatCurrency(limitPreview.costBase)
                    : "--"}
                </small>
              </div>
            )}
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

            {isMarket ? (
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
                  {sellEst ? formatCurrency(sellEst.minGrossOut) : "--"}
                </small>
              </div>
            ) : (
              <div className="inline-est">
                <span>Preview LIMIT</span>
                <strong>
                  {limitPreview
                    ? formatCurrency(limitPreview.grossBase)
                    : "--"}
                </strong>
                <small>
                  Recebimento bruto:{" "}
                  {limitPreview
                    ? formatCurrency(limitPreview.grossBase)
                    : "--"}
                </small>
              </div>
            )}
          </>
        )}

        {/* ADVANCED only for MARKET */}
        {isMarket && (
          <>
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
                    Quanto maior, mais chance de executar — e maior a chance de
                    tomar preço ruim.
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
          </>
        )}

        <button
          type="submit"
          className="btn-primary inline-submit"
          disabled={isSubmitting || !canSubmit}
          aria-disabled={isSubmitting || !canSubmit}
          title={!canSubmit ? "Preencha corretamente e tenha saldo" : undefined}
        >
          {isSubmitting
            ? "Executando..."
            : isBuy
            ? isMarket
              ? "Comprar MARKET assumindo o risco"
              : "Criar BUY LIMIT"
            : isMarket
            ? "Vender MARKET assumindo o risco"
            : "Criar SELL LIMIT"}
        </button>

        {!isSubmitting && !canSubmit && (
          <p className="inline-feedback inline-feedback--error">
            {isMarket
              ? "Valor inválido ou saldo insuficiente."
              : "Preencha o preço limite e um valor válido (e tenha saldo)."}
          </p>
        )}

        {feedback && <p className="inline-feedback">{feedback}</p>}
      </form>

      {/* MY ORDERS */}
      <div className="inline-orders">
        <div className="inline-orders-head">Minhas ordens abertas</div>

        {loadingMyOrders ? (
          <div className="inline-feedback">Carregando suas ordens…</div>
        ) : myOrdersError ? (
          <div className="inline-feedback inline-feedback--error">
            {myOrdersError}
          </div>
        ) : !myOrders.length ? (
          <div className="inline-feedback">Nenhuma ordem aberta.</div>
        ) : (
          <div className="inline-orders-list">
            {myOrders.map((o) => {
              const filledPct =
                o.amount_coin
                  ? (o.filled_coin_total / o.amount_coin) * 100
                  : o.amount_base
                  ? (o.filled_base_total / o.amount_base) * 100
                  : 0;

              return (
                <div key={o.id} className="inline-order-row">
                  <div className="inline-order-main">
                    <div
                      className={
                        "inline-order-side " +
                        (o.side === "BUY" ? "buy" : "sell")
                      }
                    >
                      {o.side}
                    </div>
                    <div className="inline-order-price">
                      {formatCurrency(Number(o.price_limit))}
                    </div>
                    <div className="inline-order-qty">
                      {o.amount_coin != null
                        ? `${formatCoin(o.amount_coin)} ${token.ticker}`
                        : `${formatCurrency(o.amount_base ?? 0)} base`}
                    </div>
                  </div>

                  <div className="inline-order-sub">
                    <small>Status: {o.status}</small>
                    <small>Fill: {filledPct.toFixed(1)}%</small>
                  </div>

                  <button
                    type="button"
                    className="btn-outline inline-cancel-btn"
                    onClick={() => handleCancelOrder(o.id)}
                  >
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="inline-risk">
        <strong>Risco:</strong> {token.riskNote}
      </div>
    </section>
  );
}
