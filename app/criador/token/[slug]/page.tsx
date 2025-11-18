"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header3ustaquio from "@/app/componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "@/app/componentes/ui/layout/Footer3ustaquio";
import { supabase } from "@/app/lib/supabaseClient";

type RiskZone = "FRIO" | "HYPE" | "BOLHA" | "NEUTRO";

type CoinView = {
  id: string;
  slug: string;
  symbol: string;
  name: string;
  narrative_short: string | null;
  narrative_long: string | null;
  risk_disclaimer: string | null;
  supply_max: string | null;
  supply_initial: string | null;
  supply_circulating: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "BLOCKED";
  created_at: string;
  coin_type?: {
    code: string;
    name: string;
  } | null;
  creator?: {
    handle: string | null;
  } | null;
};

type MarketState = {
  coin_id: string;
  base_reserve: string;
  coin_reserve: string;
  price_current: string;
  k_last: string;
  volume_24h_base: string;
  volume_24h_coin: string;
  trades_24h: number;
  risk_zone: RiskZone;
  volatility_score: string | null;
  hype_score: string | null;
  last_trade_at: string | null;
};

export default function TokenArenaPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [coin, setCoin] = useState<CoinView | null>(null);
  const [market, setMarket] = useState<MarketState | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErro(null);

      try {
        // 1) Carrega a coin por slug + coin_type + creator
        const { data: coinData, error: coinError } = await supabase
          .from("coins")
          .select(
            `
            id,
            slug,
            symbol,
            name,
            narrative_short,
            narrative_long,
            risk_disclaimer,
            supply_max,
            supply_initial,
            supply_circulating,
            status,
            created_at,
            coin_type:coin_types ( code, name ),
            creator:creators ( handle )
          `
          )
          .eq("slug", slug)
          .single();

        if (coinError || !coinData) {
          throw new Error("Token não encontrado na Arena.");
        }

        if (cancelled) return;

        setCoin(coinData as CoinView);

        // 2) Carrega estado de mercado
        const { data: marketData, error: marketError } = await supabase
          .from("coin_market_state")
          .select("*")
          .eq("coin_id", coinData.id)
          .single();

        if (!cancelled) {
          if (marketError) {
            console.warn("Sem estado de mercado para esta coin:", marketError);
          } else {
            setMarket(marketData as MarketState);
          }
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setErro(err?.message || "Erro ao carregar a Arena desse token.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ==========================
  // Cálculos derivados
  // ==========================
  const supplyInitial = coin ? Number(coin.supply_initial || 0) : 0;
  const circulating = coin ? Number(coin.supply_circulating || 0) : 0;
  const supplyMax = coin ? Number(coin.supply_max || 0) : 0;

  const poolCoins = circulating;
  const bagCoins = Math.max(supplyInitial - poolCoins, 0);

  const poolPercent =
    supplyInitial > 0 ? (poolCoins / supplyInitial) * 100 : 0;
  const bagPercent =
    supplyInitial > 0 ? (bagCoins / supplyInitial) * 100 : 0;

  const priceCurrent = market ? Number(market.price_current || 0) : 0;
  const baseReserve = market ? Number(market.base_reserve || 0) : 0;
  const coinReserve = market ? Number(market.coin_reserve || 0) : 0;

  const marketCap = priceCurrent * circulating;

  const riskZone: RiskZone = market?.risk_zone || "NEUTRO";

  const riskLabel =
    riskZone === "HYPE"
      ? "Zona HYPE · Fogo na largada"
      : riskZone === "BOLHA"
      ? "Zona BOLHA · Cuidado com o estouro"
      : riskZone === "FRIO"
      ? "Zona FRIA · Pouco fluxo, pouca fumaça"
      : "Zona NEUTRA · Jogo começando";

  const riskClass =
    riskZone === "HYPE"
      ? "zone-hype"
      : riskZone === "BOLHA"
      ? "zone-bolha"
      : riskZone === "FRIO"
      ? "zone-frio"
      : "";

  const tokenTypeLabel = coin?.coin_type?.name || "Token de narrativa";

  const createdDate = coin
    ? new Date(coin.created_at).toLocaleDateString("pt-BR")
    : "";

  const arenaLink = coin
    ? `https://app.3ustaquio.com/token/${coin.slug}`
    : "";

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          {/* HEADER */}
          <header className="creator-header">
            <span className="creator-kicker">Arena 3ustaquio</span>
            {loading ? (
              <h1 className="creator-title">
                Carregando <span>token...</span>
              </h1>
            ) : coin ? (
              <h1 className="creator-title">
                {coin.name} <span>({coin.symbol})</span>
              </h1>
            ) : (
              <h1 className="creator-title">
                Token <span>não encontrado</span>
              </h1>
            )}

            <p className="creator-subtitle">
              Aqui é especulação consciente: sem promessa de retorno, sem
              romance financeiro. Só narrativa, risco e fluxo de mercado.
            </p>
          </header>

          {erro && (
            <p
              className="cta-note"
              style={{ color: "var(--accent-primary)", marginBottom: 16 }}
            >
              {erro}
            </p>
          )}

          {/* Se não tem coin, mostra erro e botão voltar */}
          {!loading && !coin && (
            <section className="creator-main">
              <div className="creator-card">
                <p className="section-subtitle">
                  Não encontramos esse token na Arena. Ele pode não existir ou
                  ainda não ter sido lançado.
                </p>
                <button
                  type="button"
                  className="btn-primary creator-nav-btn"
                  onClick={() => router.push("/criador")}
                  style={{ marginTop: 16 }}
                >
                  Voltar para a área do criador
                </button>
              </div>
            </section>
          )}

          {/* CONTEÚDO PRINCIPAL */}
          {coin && (
            <section className="creator-main">
              {/* LEFT: Narrativa / texto */}
              <div className="creator-form-side">
                <div className="creator-card">
                  <div className="section-label">{tokenTypeLabel}</div>
                  <h2 className="section-title">
                    Narrativa oficial do token
                  </h2>
                  <p
                    className="section-subtitle"
                    style={{
                      fontSize: "1rem",
                      maxWidth: "56rem",
                    }}
                  >
                    Essa é a história que está sendo tokenizada. Não é plano de
                    aposentadoria, é jogo de reputação, hype e risco. Leia com
                    calma antes de entrar.
                  </p>

                  <div
                    style={{
                      marginTop: 16,
                      fontSize: "1.05rem",
                      lineHeight: 1.8,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 600,
                        marginBottom: 8,
                        fontSize: "1.1rem",
                      }}
                    >
                      {coin.narrative_short ||
                        "Sem headline definida. O criador pode atualizar a narrativa em breve."}
                    </p>
                    <p style={{ whiteSpace: "pre-line", marginTop: 12 }}>
                      {coin.narrative_long ||
                        "O criador ainda não escreveu a narrativa longa desse token."}
                    </p>
                  </div>

                  <div
                    className="creator-risk-box"
                    style={{ marginTop: 24, fontSize: "0.95rem" }}
                  >
                    <p>
                      <strong>Aviso de risco do criador:</strong>
                    </p>
                    <p style={{ marginTop: 8 }}>
                      {coin.risk_disclaimer ||
                        "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui."}
                    </p>
                  </div>

                  <div className="creator-footer" style={{ marginTop: 18 }}>
                    <div className="creator-footer-left">
                      <p className="creator-footer-hint">
                        Criado em <strong>{createdDate}</strong>. Status:{" "}
                        <strong>{coin.status}</strong>.
                      </p>
                    </div>
                    <div className="creator-footer-right">
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() =>
                          navigator.clipboard
                            .writeText(arenaLink)
                            .catch((e) =>
                              console.error("Erro ao copiar link:", e)
                            )
                        }
                      >
                        Copiar link da Arena
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Métricas & risco */}
              <aside className="creator-preview-side">
                {/* CARD PRINCIPAL DE MERCADO */}
                <div className="creator-preview-card">
                  <div className="creator-preview-header">
                    <span className="creator-preview-pill">
                      {coin.symbol}
                    </span>
                    <span
                      className={`creator-zone-badge ${riskClass}`}
                      style={{ fontSize: "0.8rem" }}
                    >
                      {riskLabel}
                    </span>
                  </div>

                  <div className="creator-preview-main">
                    <div className="creator-preview-title-row">
                      <h3 className="creator-preview-title">
                        {coin.name || "Token sem nome"}
                      </h3>
                      <span className="creator-preview-ticker">
                        {coin.symbol || "TICKER"}
                      </span>
                    </div>

                    <p className="creator-preview-creator">
                      {coin.creator?.handle ? (
                        <>
                          por <strong>@{coin.creator.handle}</strong>
                        </>
                      ) : (
                        <>
                          por <strong>Criador anônimo</strong>
                        </>
                      )}
                    </p>

                    {/* Preço e market cap */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: "12px 14px",
                        borderRadius: 12,
                        background:
                          "linear-gradient(90deg, rgba(255,0,85,0.14), rgba(0,255,255,0.05))",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 16,
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                          Preço atual
                        </span>
                        <strong
                          style={{
                            fontSize: "1.6rem",
                            letterSpacing: "0.03em",
                          }}
                        >
                          R$ {priceCurrent.toFixed(4)}
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          opacity: 0.95,
                        }}
                      >
                        <span>Market cap (teórico)</span>
                        <span>
                          R${" "}
                          {marketCap.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Distribuição de supply */}
                    <div
                      style={{
                        marginTop: 18,
                        fontSize: "0.85rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div>
                        <strong>Supply total:</strong>{" "}
                        {supplyInitial
                          ? supplyInitial.toLocaleString("pt-BR")
                          : "—"}{" "}
                        tokens
                      </div>
                      <div>
                        <strong>Pool de lançamento:</strong>{" "}
                        {poolCoins.toLocaleString("pt-BR")} tokens (
                        {poolPercent.toFixed(1)}%)
                      </div>
                      <div>
                        <strong>Bag do criador:</strong>{" "}
                        {bagCoins.toLocaleString("pt-BR")} tokens (
                        {bagPercent.toFixed(1)}%)
                      </div>
                    </div>

                    {/* Reservas da pool */}
                    {market && (
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 12,
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          fontSize: "0.8rem",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ opacity: 0.7 }}>Reserva base (BRL)</div>
                          <div>
                            R{" "}
                            {baseReserve.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ opacity: 0.7 }}>
                            Reserva de tokens na pool
                          </div>
                          <div>
                            {coinReserve.toLocaleString("pt-BR", {
                              maximumFractionDigits: 4,
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ opacity: 0.7 }}>
                            Volume 24h (base)
                          </div>
                          <div>
                            R{" "}
                            {Number(
                              market.volume_24h_base || 0
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ opacity: 0.7 }}>
                            Negócios 24h (trades)
                          </div>
                          <div>{market.trades_24h}</div>
                        </div>
                      </div>
                    )}

                    {/* Faixa de risco */}
                    <div className="creator-preview-riskband" style={{ marginTop: 18 }}>
                      <span className="creator-preview-riskdot" />
                      <span>
                        Não é produto financeiro regulado. Preço pode ir a zero.
                        Cada compra e venda gera taxa para o criador e para a
                        plataforma. Entre por conta e risco.
                      </span>
                    </div>
                  </div>

                  <div className="creator-preview-footer">
                    <span className="creator-preview-link-label">
                      Link público da Arena
                    </span>
                    <span className="creator-preview-link">{arenaLink}</span>
                  </div>
                </div>
              </aside>
            </section>
          )}
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
