"use client";

import React, { useState } from "react";

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

type TokenTradePanelProps = {
  token: ArenaTokenForPanel | null;
  open: boolean;
  onClose: () => void;
};

type TradeMode = "BUY" | "SELL";

const parsePositiveNumber = (value: string): number => {
  if (!value) return 0;
  const normalized = value.replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) return 0;
  return num;
};

export function TokenTradePanel({ token, open, onClose }: TokenTradePanelProps) {
  const [mode, setMode] = useState<TradeMode>("BUY");
  const [amount, setAmount] = useState<string>("100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!open || !token) return null;

  const price = token.price || 0;
  const isBuy = mode === "BUY";
  const parsed = parsePositiveNumber(amount);

  const estimatedCoin =
    isBuy && price > 0 && parsed > 0 ? parsed / price : 0;
  const estimatedBase =
    !isBuy && price > 0 && parsed > 0 ? parsed * price : 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (parsed <= 0) {
      setFeedback(
        isBuy
          ? "Coloca um valor em base maior que zero pra simular a compra."
          : "Coloca uma quantidade de tokens maior que zero pra simular a venda."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Aqui entra swap_buy / swap_sell depois.
      await new Promise((resolve) => setTimeout(resolve, 800));

      setFeedback(
        isBuy
          ? "Simulação concluída: compra executada (modo demo). Depois é só ligar no swap_buy."
          : "Simulação concluída: venda executada (modo demo). Depois é só ligar no swap_sell."
      );
    } catch (err) {
      console.error("[TRADE_PANEL] erro simulando trade:", err);
      setFeedback("Algo falhou na simulação. Confere conexão e configuração.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* BACKDROP RESPONSIVO */}
      <div className="trade-panel-backdrop" onClick={onClose} />

      {/* DRAWER RESPONSIVO */}
      <aside className="trade-panel trade-panel--compact">
        <div className="trade-panel-scroll">
          <header className="trade-panel-header">
            <div>
              <div className="trade-panel-token-id">
                <span className="trade-panel-token-ticker">{token.ticker}</span>
                <span className={`trade-panel-zone-pill ${zoneClass}`}>
                  {zoneLabel}
                </span>
              </div>
              <h2 className="trade-panel-title">{token.name}</h2>
              <p className="trade-panel-subtitle">
                Painel de negociação rápida em modo demo. Não é plano de
                aposentadoria, é atalho pra especular consciente.
              </p>
            </div>

            <button
              type="button"
              className="trade-panel-close-btn"
              onClick={onClose}
              aria-label="Fechar painel de negociação"
            >
              ✕
            </button>
          </header>

          {/* Mini resumo */}
          <section className="trade-panel-summary-row">
            <div className="trade-summary-chip">
              <span className="trade-summary-chip-label">Preço</span>
              <span className="trade-summary-chip-value">
                {price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </span>
            </div>
            <div className="trade-summary-chip">
              <span className="trade-summary-chip-label">24h</span>
              <span
                className={
                  "trade-summary-chip-value " +
                  (token.change24h >= 0 ? "arena-value-pos" : "arena-value-neg")
                }
              >
                {token.change24h >= 0 ? "+" : ""}
                {token.change24h.toFixed(1)}%
              </span>
            </div>
            <div className="trade-summary-chip">
              <span className="trade-summary-chip-label">7d</span>
              <span className="trade-summary-chip-value">
                {token.change7d >= 0 ? "+" : ""}
                {token.change7d.toFixed(1)}%
              </span>
            </div>
          </section>

          {/* Toggle Comprar / Vender */}
          <div className="trade-mode-toggle" role="tablist">
            <button
              type="button"
              className={
                "trade-mode-btn" + (isBuy ? " trade-mode-btn--active" : "")
              }
              onClick={() => {
                setMode("BUY");
                setFeedback(null);
              }}
            >
              Quero comprar
            </button>
            <button
              type="button"
              className={
                "trade-mode-btn" + (!isBuy ? " trade-mode-btn--active" : "")
              }
              onClick={() => {
                setMode("SELL");
                setFeedback(null);
              }}
            >
              Quero vender
            </button>
          </div>

          {/* Form compacto */}
          <form
            className="trade-form trade-form--compact"
            onSubmit={handleSubmit}
          >
            <label className="trade-form-field">
              <span className="trade-field-label">
                {isBuy
                  ? "Quanto em base (BRL interno) você quer arriscar nesse token?"
                  : "Quantos tokens você quer colocar na mesa?"}
              </span>
              <div className="trade-input-wrapper">
                <span className="trade-input-prefix">
                  {isBuy ? "R$" : token.ticker}
                </span>
                <input
                  type="number"
                  min="0"
                  step={isBuy ? "0.01" : "0.0001"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="trade-input"
                  placeholder={isBuy ? "Ex.: 100" : "Ex.: 50"}
                />
              </div>
            </label>

            <div className="trade-estimate-line">
              <span className="trade-estimate-label">Estimativa:</span>
              <span className="trade-estimate-value">
                {isBuy
                  ? estimatedCoin > 0
                    ? `${estimatedCoin.toFixed(4)} ${token.ticker}`
                    : "--"
                  : estimatedBase > 0
                  ? estimatedBase.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })
                  : "--"}
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary trade-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Simulando operação..."
                : isBuy
                ? "Simular compra consciente"
                : "Simular venda consciente"}
            </button>

            {feedback && <p className="trade-feedback">{feedback}</p>}
          </form>

          {/* Disclaimer enxuto */}
          <section className="trade-panel-disclaimer trade-panel-disclaimer--compact">
            <p>
              <strong>Brutalmente honesto:</strong> isso aqui é interface de
              especulação consciente. Não é banco, não é corretora, não é
              recomendação. Você pode ganhar, perder ou zerar.
            </p>
            <p className="trade-panel-risk-note">{token.riskNote}</p>
          </section>
        </div>
      </aside>
    </>
  );
}
