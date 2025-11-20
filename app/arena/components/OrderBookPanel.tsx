"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Side = "BUY" | "SELL";
type Level = { price: number; qty_coin: number; orders: number };
const FEE_PLATFORM_RATE = 0.0075;
const FEE_CREATOR_RATE = 0.0025;

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCoin = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 8 });

export default function OrderBookPanel({
  coinId,
  ticker,
}: {
  coinId: string;
  ticker: string;
}) {
  const [depth, setDepth] = useState(10);
  const [asks, setAsks] = useState<Level[]>([]);
  const [bids, setBids] = useState<Level[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [side, setSide] = useState<Side>("BUY");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==== carregar book ====
  const loadBook = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("arena-trade", {
        body: { action: "orderbook", coin_id: coinId, depth },
      });
      if (error) throw error;
      setAsks(data.asks ?? []);
      setBids(data.bids ?? []);
    } catch (err: any) {
      setError(err.message || "Falha ao carregar book");
    } finally {
      setLoading(false);
    }
  }, [coinId, depth]);

  useEffect(() => {
    loadBook();
    // atualiza só a cada 15min
    const id = setInterval(loadBook, 900000);
    return () => clearInterval(id);
  }, [loadBook]);

  const midPrice = useMemo(() => {
    const bestAsk = asks[0]?.price;
    const bestBid = bids[0]?.price;
    if (!bestAsk || !bestBid) return 0;
    return (bestAsk + bestBid) / 2;
  }, [asks, bids]);

  // ==== preview ====
  useEffect(() => {
    const p = Number(price);
    const a = Number(amount);
    if (!p || !a) {
      setPreview(null);
      return;
    }

    const gross = a * p;
    const feePlat = gross * FEE_PLATFORM_RATE;
    const feeCr = gross * FEE_CREATOR_RATE;
    const total = side === "BUY" ? gross + feePlat + feeCr : gross - feePlat - feeCr;
    setPreview({
      gross,
      feePlat,
      feeCr,
      total,
      pct: side === "BUY"
        ? (p / (asks[0]?.price || p)) * 100
        : (p / (bids[0]?.price || p)) * 100,
    });
  }, [price, amount, side, asks, bids]);

  // ==== enviar order ====
  const placeLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);
    try {
      const body = {
        action: "place_order",
        coin_id: coinId,
        side,
        type: "LIMIT",
        price_limit: Number(price),
        amount_base: side === "BUY" ? Number(amount) : undefined,
        amount_coin: side === "SELL" ? Number(amount) : undefined,
      };
      const { data, error } = await supabase.functions.invoke("arena-trade", {
        body,
      });
      if (error) throw error;
      setFeedback("Ordem LIMIT registrada com sucesso!");
      loadBook();
    } catch (err: any) {
      setFeedback(err?.message || "Erro ao registrar ordem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickBest = (dir: Side) => {
    if (dir === "BUY" && asks.length) setPrice(String(asks[0].price));
    if (dir === "SELL" && bids.length) setPrice(String(bids[0].price));
    setSide(dir);
  };

  return (
    <section className="orderbook-panel">
      <div className="ob-head">
        <h3 className="ob-title">Livro de Ofertas</h3>
        <div className="ob-sub">
          Mid: <strong>{midPrice ? fmtBRL(midPrice) : "—"}</strong>
        </div>
        <div className="ob-depth">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              className={`ob-depth-btn ${depth === n ? "active" : ""}`}
              onClick={() => setDepth(n)}
            >
              {n}
            </button>
          ))}
          <button onClick={loadBook} className="ob-refresh">
            atualizar
          </button>
        </div>
      </div>

      {error && <div className="ob-empty ob-empty--error">{error}</div>}

      <div className="ob-columns">
        <div>
          <div className="ob-side-title ask">Vendas (ASK)</div>
          {loading ? (
            <div className="ob-empty">carregando...</div>
          ) : (
            asks.map((l, i) => (
              <div key={i} className="ob-row ob-row--sell">
                <span className="ob-price">{fmtBRL(l.price)}</span>
                <span className="ob-qty">{fmtCoin(l.qty_coin)}</span>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="ob-side-title bid">Compras (BID)</div>
          {loading ? (
            <div className="ob-empty">carregando...</div>
          ) : (
            bids.map((l, i) => (
              <div key={i} className="ob-row ob-row--buy">
                <span className="ob-price">{fmtBRL(l.price)}</span>
                <span className="ob-qty">{fmtCoin(l.qty_coin)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ob-form">
        <div className="ob-form-tabs">
          <button
            className={side === "BUY" ? "active" : ""}
            onClick={() => setSide("BUY")}
          >
            Comprar
          </button>
          <button
            className={side === "SELL" ? "active" : ""}
            onClick={() => setSide("SELL")}
          >
            Vender
          </button>
        </div>

        <form onSubmit={placeLimit}>
          <label>
            Preço
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
            <div className="ob-helpers">
              <button type="button" onClick={() => pickBest("BUY")}>
                Melhor ASK
              </button>
              <button type="button" onClick={() => pickBest("SELL")}>
                Melhor BID
              </button>
            </div>
          </label>

          <label>
            {side === "BUY" ? "Valor em base (R$)" : `Qtd ${ticker}`}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </label>

          {preview && (
            <div className="ob-preview">
              <div>
                <small>Taxa Plataforma</small>
                <strong>{fmtBRL(preview.feePlat)}</strong>
              </div>
              <div>
                <small>Taxa Criador</small>
                <strong>{fmtBRL(preview.feeCr)}</strong>
              </div>
              <div>
                <small>Total {side === "BUY" ? "a pagar" : "a receber"}</small>
                <strong>{fmtBRL(preview.total)}</strong>
              </div>
              <div>
                <small>% posição no book</small>
                <strong>{preview.pct.toFixed(2)}%</strong>
              </div>
            </div>
          )}

          <button type="submit" className="ob-submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Enviando..."
              : side === "BUY"
              ? "Registrar compra"
              : "Registrar venda"}
          </button>
          {feedback && <p className="ob-feedback">{feedback}</p>}
        </form>
      </div>
    </section>
  );
}
