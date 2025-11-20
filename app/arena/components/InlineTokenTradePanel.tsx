"use client";

import React, { useMemo, useState } from "react";

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

const safeParse = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function InlineTokenTradePanel({ token, onClose }: InlineTokenTradePanelProps) {
  const [mode, setMode] = useState<TradeMode>("BUY");
  const [amountBase, setAmountBase] = useState("100");
  const [amountCoin, setAmountCoin] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const price = token.price || 0;

  const parsedBase = useMemo(() => safeParse(amountBase), [amountBase]);
  const parsedCoin = useMemo(() => safeParse(amountCoin), [amountCoin]);

  const isBuy = mode === "BUY";

  const estimatedCoinOut = useMemo(() => {
    if (!price || parsedBase <= 0) return 0;
    return parsedBase / price;
  }, [parsedBase, price]);

  const estimatedBaseOut = useMemo(() => {
    if (!price || parsedCoin <= 0) return 0;
    return parsedCoin * price;
  }, [parsedCoin, price]);

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
      minimumFractionDigits: 2
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isBuy && parsedBase <= 0) {
      setFeedback("Define um valor de base maior que zero.");
      return;
    }
    if (!isBuy && parsedCoin <= 0) {
      setFeedback("Define uma quantidade de tokens maior que zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      // troca por swap_buy / swap_sell depois
      await new Promise((r) => setTimeout(r, 700));

      setFeedback(
        isBuy
          ? "Simulação concluída: compra executada (demo)."
          : "Simulação concluída: venda executada (demo)."
      );
    } catch (err) {
      console.error(err);
      setFeedback("Falhou. Confere conexão/config do token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="inline-trade-panel" aria-label={`Negociação de ${token.ticker}`}>
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

        <button type="button" className="inline-trade-close" onClick={onClose}>
          fechar ✕
        </button>
      </div>

      <div className="inline-trade-summary">
        <div className="inline-sum-box">
          <div className="inline-sum-label">Preço agora</div>
          <div className="inline-sum-value">{formatCurrency(price)}</div>
        </div>
        <div className="inline-sum-box">
          <div className="inline-sum-label">24h</div>
          <div
            className={
              "inline-sum-value " +
              (token.change24h >= 0 ? "arena-value-pos" : "arena-value-neg")
            }
          >
            {token.change24h >= 0 ? "+" : ""}
            {token.change24h.toFixed(1)}%
          </div>
        </div>
        <div className="inline-sum-box">
          <div className="inline-sum-label">7d</div>
          <div className="inline-sum-value">
            {token.change7d >= 0 ? "+" : ""}
            {token.change7d.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Form */}
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
              <span>Você receberia aprox.</span>
              <strong>
                {estimatedCoinOut > 0
                  ? `${estimatedCoinOut.toFixed(4)} ${token.ticker}`
                  : "--"}
              </strong>
              <small>slippage pode mudar isso na vida real.</small>
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
              <span>Você receberia aprox.</span>
              <strong>
                {estimatedBaseOut > 0 ? formatCurrency(estimatedBaseOut) : "--"}
              </strong>
              <small>curva AMM pode alterar o final.</small>
            </div>
          </>
        )}

        <button
          type="submit"
          className="btn-primary inline-submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Simulando..."
            : isBuy
            ? "Simular compra consciente"
            : "Simular venda consciente"}
        </button>

        {feedback && <p className="inline-feedback">{feedback}</p>}
      </form>

      <div className="inline-risk">
        <strong>Risco:</strong> {token.riskNote}
      </div>
    </section>
  );
}
