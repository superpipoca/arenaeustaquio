// app/arena/components/MarketTicker.tsx
"use client";

import React, { useEffect, useState } from "react";

type MarketZone = "FRIO" | "HYPE" | "BOLHA";
type TokenType = "PESSOA" | "LOCAL" | "PROJETO" | "COMUNIDADE";

type ArenaTokenForTicker = {
  id: string;
  name: string;
  ticker: string;
  price: number;
  change24h: number;
  type?: TokenType;
  zone?: MarketZone;
};

type MarketTickerProps = {
  tokens: ArenaTokenForTicker[];
};

export function MarketTicker({ tokens }: MarketTickerProps) {
  const [items, setItems] = useState<ArenaTokenForTicker[]>(() => tokens);

  // Mantém sincronizado se a lista de tokens mudar
  useEffect(() => {
    setItems(tokens);
  }, [tokens]);

  // Micro jitter pra dar sensação de mercado vivo
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) =>
        prev.map((t) => {
          const jitter = (Math.random() - 0.5) * 0.6; // -0,3% ~ +0,3%
          const newPrice = t.price * (1 + jitter / 100);
          return { ...t, price: parseFloat(newPrice.toFixed(2)) };
        })
      );
    }, 5000);

    return () => clearInterval(id);
  }, []);

  const formatPrice = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;

  const formatChange = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const getZoneLabel = (zone?: MarketZone) => {
    if (!zone) return null;
    if (zone === "HYPE") return "Hype ativo";
    if (zone === "BOLHA") return "Zona da bolha";
    return "Mercado frio";
  };

  const getZoneClass = (zone?: MarketZone) => {
    if (!zone) return "";
    if (zone === "HYPE") return "market-ticker-zone--hype";
    if (zone === "BOLHA") return "market-ticker-zone--bolha";
    return "market-ticker-zone--frio";
  };

  if (!items.length) return null;

  const renderItem = (token: ArenaTokenForTicker, clone?: boolean) => {
    const isPositive = token.change24h >= 0;
    const zoneLabel = getZoneLabel(token.zone);
    const zoneClass = getZoneClass(token.zone);

    return (
      <div
        key={token.id + (clone ? "-clone" : "")}
        className="market-ticker-item"
        aria-label={`${token.ticker} cotação e variação`}
      >
        <div className="market-ticker-main">
          <span className="market-ticker-ticker">{token.ticker}</span>

          <div className="market-ticker-price-block">
            <span className="market-ticker-price">
              {formatPrice(token.price)}
            </span>
            <span
              className={
                "market-ticker-change " +
                (isPositive
                  ? "market-ticker-change--up"
                  : "market-ticker-change--down")
              }
            >
              {isPositive ? "↑ " : "↓ "}
              {formatChange(token.change24h)}
            </span>
          </div>
        </div>

        <div className="market-ticker-meta">
          <span className="market-ticker-name">{token.name}</span>
          {zoneLabel && (
            <span className={`market-ticker-zone ${zoneClass}`}>
              {zoneLabel}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="market-ticker" aria-label="Ticker de cotações da Arena">
      <div className="market-ticker-strip">
        <div className="market-ticker-track">
          {items.map((token) => renderItem(token, false))}
          {items.map((token) => renderItem(token, true))}
        </div>
      </div>

      <p className="market-ticker-note">
        Fluxo especulativo em tempo real. Nada aqui é recomendação ou promessa
        de retorno — é só o mercado de narrativas piscando pra você.
      </p>
    </div>
  );
}
