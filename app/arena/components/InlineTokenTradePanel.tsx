// "use client";

// import React, { useMemo, useState } from "react";

// type MarketZone = "FRIO" | "HYPE" | "BOLHA" | "NEUTRO";

// type ArenaTokenForPanel = {
//   id: string;
//   name: string;
//   ticker: string;
//   price: number;
//   zone: MarketZone;
//   change24h: number;
//   change7d: number;
//   riskNote: string;
//   storyHook?: string;
// };

// type TradeMode = "BUY" | "SELL";

// type InlineTokenTradePanelProps = {
//   token: ArenaTokenForPanel;
//   onClose: () => void;
// };

// const safeParse = (v: string) => {
//   if (!v) return 0;
//   const n = Number(v.replace(",", "."));
//   return Number.isFinite(n) && n > 0 ? n : 0;
// };

// export function InlineTokenTradePanel({ token, onClose }: InlineTokenTradePanelProps) {
//   const [mode, setMode] = useState<TradeMode>("BUY");
//   const [amountBase, setAmountBase] = useState("100");
//   const [amountCoin, setAmountCoin] = useState("50");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [feedback, setFeedback] = useState<string | null>(null);

//   const price = token.price || 0;

//   const parsedBase = useMemo(() => safeParse(amountBase), [amountBase]);
//   const parsedCoin = useMemo(() => safeParse(amountCoin), [amountCoin]);

//   const isBuy = mode === "BUY";

//   const estimatedCoinOut = useMemo(() => {
//     if (!price || parsedBase <= 0) return 0;
//     return parsedBase / price;
//   }, [parsedBase, price]);

//   const estimatedBaseOut = useMemo(() => {
//     if (!price || parsedCoin <= 0) return 0;
//     return parsedCoin * price;
//   }, [parsedCoin, price]);

//   const zoneLabel =
//     token.zone === "HYPE"
//       ? "Hype ativo"
//       : token.zone === "BOLHA"
//       ? "Zona da bolha"
//       : token.zone === "FRIO"
//       ? "Mercado frio"
//       : "Neutro";

//   const zoneClass =
//     token.zone === "HYPE"
//       ? "zone-hype"
//       : token.zone === "BOLHA"
//       ? "zone-bolha"
//       : token.zone === "FRIO"
//       ? "zone-frio"
//       : "zone-neutro";

//   const formatCurrency = (value: number) =>
//     value.toLocaleString("pt-BR", {
//       style: "currency",
//       currency: "BRL",
//       minimumFractionDigits: 2
//     });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setFeedback(null);

//     if (isBuy && parsedBase <= 0) {
//       setFeedback("Define um valor de base maior que zero.");
//       return;
//     }
//     if (!isBuy && parsedCoin <= 0) {
//       setFeedback("Define uma quantidade de tokens maior que zero.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // troca por swap_buy / swap_sell depois
//       await new Promise((r) => setTimeout(r, 700));

//       setFeedback(
//         isBuy
//           ? "Simulação concluída: compra executada (demo)."
//           : "Simulação concluída: venda executada (demo)."
//       );
//     } catch (err) {
//       console.error(err);
//       setFeedback("Falhou. Confere conexão/config do token.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <section className="inline-trade-panel" aria-label={`Negociação de ${token.ticker}`}>
//       <div className="inline-trade-head">
//         <div className="inline-trade-left">
//           <div className="inline-trade-title-row">
//             <span className="inline-trade-ticker">{token.ticker}</span>
//             <span className={`inline-trade-zone ${zoneClass}`}>{zoneLabel}</span>
//           </div>
//           <div className="inline-trade-name">{token.name}</div>
//           {token.storyHook && (
//             <div className="inline-trade-story">{token.storyHook}</div>
//           )}
//         </div>

//         <button type="button" className="inline-trade-close" onClick={onClose}>
//           fechar ✕
//         </button>
//       </div>

//       <div className="inline-trade-summary">
//         <div className="inline-sum-box">
//           <div className="inline-sum-label">Preço agora</div>
//           <div className="inline-sum-value">{formatCurrency(price)}</div>
//         </div>
//         <div className="inline-sum-box">
//           <div className="inline-sum-label">24h</div>
//           <div
//             className={
//               "inline-sum-value " +
//               (token.change24h >= 0 ? "arena-value-pos" : "arena-value-neg")
//             }
//           >
//             {token.change24h >= 0 ? "+" : ""}
//             {token.change24h.toFixed(1)}%
//           </div>
//         </div>
//         <div className="inline-sum-box">
//           <div className="inline-sum-label">7d</div>
//           <div className="inline-sum-value">
//             {token.change7d >= 0 ? "+" : ""}
//             {token.change7d.toFixed(1)}%
//           </div>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="inline-trade-tabs" role="tablist">
//         <button
//           type="button"
//           className={"inline-tab " + (isBuy ? "active" : "")}
//           onClick={() => {
//             setMode("BUY");
//             setFeedback(null);
//           }}
//         >
//           Comprar
//         </button>
//         <button
//           type="button"
//           className={"inline-tab " + (!isBuy ? "active" : "")}
//           onClick={() => {
//             setMode("SELL");
//             setFeedback(null);
//           }}
//         >
//           Vender
//         </button>
//       </div>

//       {/* Form */}
//       <form className="inline-trade-form" onSubmit={handleSubmit}>
//         {isBuy ? (
//           <>
//             <label className="inline-field">
//               <span className="inline-field-label">
//                 Quanto em base você quer colocar?
//               </span>
//               <div className="inline-input-wrap">
//                 <span className="inline-prefix">R$</span>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.01"
//                   value={amountBase}
//                   onChange={(e) => setAmountBase(e.target.value)}
//                   className="inline-input"
//                   placeholder="100"
//                 />
//               </div>
//             </label>

//             <div className="inline-est">
//               <span>Você receberia aprox.</span>
//               <strong>
//                 {estimatedCoinOut > 0
//                   ? `${estimatedCoinOut.toFixed(4)} ${token.ticker}`
//                   : "--"}
//               </strong>
//               <small>slippage pode mudar isso na vida real.</small>
//             </div>
//           </>
//         ) : (
//           <>
//             <label className="inline-field">
//               <span className="inline-field-label">
//                 Quantos tokens você quer vender?
//               </span>
//               <div className="inline-input-wrap">
//                 <span className="inline-prefix">{token.ticker}</span>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.0001"
//                   value={amountCoin}
//                   onChange={(e) => setAmountCoin(e.target.value)}
//                   className="inline-input"
//                   placeholder="50"
//                 />
//               </div>
//             </label>

//             <div className="inline-est">
//               <span>Você receberia aprox.</span>
//               <strong>
//                 {estimatedBaseOut > 0 ? formatCurrency(estimatedBaseOut) : "--"}
//               </strong>
//               <small>curva AMM pode alterar o final.</small>
//             </div>
//           </>
//         )}

//         <button
//           type="submit"
//           className="btn-primary inline-submit"
//           disabled={isSubmitting}
//         >
//           {isSubmitting
//             ? "Simulando..."
//             : isBuy
//             ? "Simular compra consciente"
//             : "Simular venda consciente"}
//         </button>

//         {feedback && <p className="inline-feedback">{feedback}</p>}
//       </form>

//       <div className="inline-risk">
//         <strong>Risco:</strong> {token.riskNote}
//       </div>
//     </section>
//   );
// }
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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

type WalletRow = {
  id: string;
  user_id: string | null;
  wallet_type: "USER" | "CREATOR_TREASURY" | "PLATFORM_TREASURY" | "POOL";
  balance_base: number;
  is_active: boolean;
};

type MarketStateRow = {
  coin_id: string;
  base_reserve: number;
  coin_reserve: number;
  price_current: number;
  risk_zone: MarketZone;
  hype_score: number | null;
  volume_24h_base: number;
  trades_24h: number;
};

type TradeRow = {
  id: string;
  side: "BUY" | "SELL";
  amount_coin: number;
  amount_base: number;
  price_effective: number;
  fee_total_base: number;
  executed_at: string;
};

const FEE_PLATFORM_RATE = 0.0075; // 0.75%
const FEE_CREATOR_RATE = 0.0025;  // 0.25%
const FEE_TOTAL_RATE = FEE_PLATFORM_RATE + FEE_CREATOR_RATE;

const safeParse = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function InlineTokenTradePanel({
  token,
  onClose,
}: InlineTokenTradePanelProps) {
  const [mode, setMode] = useState<TradeMode>("BUY");
  const [amountBase, setAmountBase] = useState("100");
  const [amountCoin, setAmountCoin] = useState("");

  const [slippagePct, setSlippagePct] = useState("1"); // 1% default
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [loadingCtx, setLoadingCtx] = useState(true);
  const [ctxError, setCtxError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletRow | null>(null);

  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [coinBalance, setCoinBalance] = useState<number>(0);

  const [market, setMarket] = useState<MarketStateRow | null>(null);

  const parsedBase = useMemo(() => safeParse(amountBase), [amountBase]);
  const parsedCoin = useMemo(() => safeParse(amountCoin), [amountCoin]);
  const parsedSlippage = useMemo(
    () => clamp(safeParse(slippagePct), 0, 50),
    [slippagePct]
  );

  const isBuy = mode === "BUY";

  // ---------------------------
  // Load auth user -> public.users -> wallet -> balances -> market
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      setLoadingCtx(true);
      setCtxError(null);

      try {
        const { data: authData, error: authErr } =
          await supabase.auth.getUser();

        if (authErr) throw authErr;

        const authUser = authData?.user;
        if (!authUser) {
          setCtxError("Você precisa estar logado pra operar.");
          return;
        }

        // pega user interno
        const { data: uRow, error: uErr } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (uErr) throw uErr;
        if (!uRow?.id) {
          setCtxError("Perfil interno não encontrado. Crie seu usuário primeiro.");
          return;
        }
        if (cancelled) return;

        setUserId(uRow.id);

        // carteira USER ativa
        let { data: wRow, error: wErr } = await supabase
          .from("wallets")
          .select("id,user_id,wallet_type,balance_base,is_active")
          .eq("user_id", uRow.id)
          .eq("wallet_type", "USER")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (wErr) throw wErr;

        // se não existe, tenta criar (se policy permitir)
        if (!wRow?.id) {
          const { data: created, error: cErr } = await supabase
            .from("wallets")
            .insert({
              user_id: uRow.id,
              wallet_type: "USER",
              label: "Carteira principal",
              provider: "INTERNAL",
              balance_base: 0,
              is_active: true,
            })
            .select("id,user_id,wallet_type,balance_base,is_active")
            .maybeSingle();

          if (cErr) {
            setCtxError(
              "Sem carteira. Deposite ou crie uma USER wallet antes de operar."
            );
            return;
          }
          wRow = created as any;
        }

        if (cancelled) return;

        setWallet(wRow as WalletRow);
        setBaseBalance(Number(wRow?.balance_base ?? 0));

        // saldo de coin na wallet
        const { data: balRow, error: balErr } = await supabase
          .from("wallet_balances")
          .select("balance_available")
          .eq("wallet_id", wRow!.id)
          .eq("coin_id", token.id)
          .maybeSingle();

        if (balErr) throw balErr;

        if (cancelled) return;

        setCoinBalance(Number(balRow?.balance_available ?? 0));

        // market state
        const { data: mRow, error: mErr } = await supabase
          .from("coin_market_state")
          .select(
            "coin_id,base_reserve,coin_reserve,price_current,risk_zone,hype_score,volume_24h_base,trades_24h"
          )
          .eq("coin_id", token.id)
          .maybeSingle();

        if (mErr) throw mErr;
        if (!mRow?.coin_id) {
          setCtxError(
            "Mercado não inicializado pra essa coin. Rode init_coin_market_state."
          );
          return;
        }

        if (cancelled) return;

        setMarket({
          ...mRow,
          base_reserve: Number(mRow.base_reserve),
          coin_reserve: Number(mRow.coin_reserve),
          price_current: Number(mRow.price_current),
          volume_24h_base: Number(mRow.volume_24h_base),
        } as MarketStateRow);

        // realtime pra atualizar preço enquanto panel aberto
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
              setMarket((prev) =>
                prev
                  ? {
                      ...prev,
                      base_reserve: Number(next.base_reserve),
                      coin_reserve: Number(next.coin_reserve),
                      price_current: Number(next.price_current),
                      risk_zone: next.risk_zone,
                      hype_score: next.hype_score,
                      volume_24h_base: Number(next.volume_24h_base),
                      trades_24h: Number(next.trades_24h),
                    }
                  : prev
              );
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(ch);
        };
      } catch (err: any) {
        console.error(err);
        setCtxError(
          err?.message ||
            "Falha ao carregar contexto. Verifique policies / conexão."
        );
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [token.id]);

  const price = market?.price_current ?? token.price ?? 0;
  const baseReserve = market?.base_reserve ?? 0;
  const coinReserve = market?.coin_reserve ?? 0;

  // ---------------------------
  // AMM Estimates (igual SQL)
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
    const impactPct = ((priceEffective / price) - 1) * 100;
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
    const impactPct = ((priceEffective / price) - 1) * 100;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!wallet?.id || !userId) {
      setFeedback("Sem carteira ativa. Faça login e deposite primeiro.");
      return;
    }

    if (isBuy) {
      if (parsedBase <= 0) {
        setFeedback("Define um valor de base maior que zero.");
        return;
      }
      if (parsedBase > baseBalance) {
        setFeedback("Saldo base insuficiente.");
        return;
      }
      if (!buyEst) {
        setFeedback("Estimativa indisponível. Reserva zero ou mercado inválido.");
        return;
      }
    } else {
      if (parsedCoin <= 0) {
        setFeedback("Define uma quantidade de tokens maior que zero.");
        return;
      }
      if (parsedCoin > coinBalance) {
        setFeedback("Saldo de tokens insuficiente.");
        return;
      }
      if (!sellEst) {
        setFeedback("Estimativa indisponível. Reserva zero ou mercado inválido.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isBuy && buyEst) {
        const minOut = buyEst.minOut;

        const { data, error } = await supabase.rpc("swap_buy", {
          p_coin_id: token.id,
          p_buyer_wallet_id: wallet.id,
          p_amount_base_in: parsedBase,
          p_min_amount_out: minOut,
        });

        if (error) throw error;

        const trade = data as TradeRow;

        setFeedback(
          `Compra executada. Recebeu ${formatCoin(trade.amount_coin)} ${
            token.ticker
          } a ${formatCurrency(trade.price_effective)}.`
        );

        // atualiza saldos localmente
        setBaseBalance((b) => b - parsedBase);
        setCoinBalance((c) => c + Number(trade.amount_coin));
      }

      if (!isBuy && sellEst) {
        const minGross = sellEst.minGrossOut;

        const { data, error } = await supabase.rpc("swap_sell", {
          p_coin_id: token.id,
          p_seller_wallet_id: wallet.id,
          p_amount_coin_in: parsedCoin,
          p_min_base_out: minGross,
        });

        if (error) throw error;

        const trade = data as TradeRow;

        const baseNetApprox = sellEst.baseOutNet;

        setFeedback(
          `Venda executada. Vendeu ${formatCoin(trade.amount_coin)} ${
            token.ticker
          } e recebeu aprox. ${formatCurrency(baseNetApprox)} após taxas.`
        );

        setCoinBalance((c) => c - parsedCoin);
        setBaseBalance((b) => b + baseNetApprox);
      }
    } catch (err: any) {
      console.error(err);

      const msg =
        err?.message ||
        "Falhou. Confere conexão / policies / init da pool.";

      // mensagens mais humanas
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
            <span className={`inline-trade-zone ${zoneClass}`}>{zoneLabel}</span>
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
                {buyEst ? `${formatCoin(buyEst.minOut)} ${token.ticker}` : "--"}
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
                {sellEst ? formatCurrency(sellEst.minGrossOut) : "--"}
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
              <span className="inline-field-label">Slippage tolerado (%)</span>
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
                Quanto maior, mais chance de executar — e maior a chance de tomar
                preço ruim.
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
