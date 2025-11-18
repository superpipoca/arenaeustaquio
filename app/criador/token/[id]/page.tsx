// app/criador/token/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";
import { supabaseClient } from "../../../lib/supabaseClient";

type DbCoin = {
  id: string;
  slug: string;
  symbol: string;
  name: string;
  narrative_short: string | null;
  narrative_long: string | null;
  risk_disclaimer: string | null;
  created_at: string;
};

type DbMarket = {
  price_current: string | null;
  volume_24h_base: string | null;
  volume_24h_coin: string | null;
  trades_24h: number | null;
  risk_zone: "FRIO" | "HYPE" | "BOLHA" | "NEUTRO" | null;
};

export default function TokenDetailPage() {
  const params = useParams();
  const supabase = supabaseClient as any;

  const slug = params?.id as string;

  const [coin, setCoin] = useState<DbCoin | null>(null);
  const [market, setMarket] = useState<DbMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErro(null);

      try {
        // 1) Busca coin por slug
        const { data: c, error: coinError } = await supabase
          .from("coins")
          .select(
            "id, slug, symbol, name, narrative_short, narrative_long, risk_disclaimer, created_at"
          )
          .eq("slug", slug)
          .maybeSingle();

        if (coinError) throw coinError;
        if (!c) {
          throw new Error("Token não encontrado.");
        }

        if (!cancelled) setCoin(c);

        // 2) Busca estado de mercado (se existir)
        const { data: m, error: mError } = await supabase
          .from("coin_market_state")
          .select(
            "price_current, volume_24h_base, volume_24h_coin, trades_24h, risk_zone"
          )
          .eq("coin_id", c.id)
          .maybeSingle();

        if (mError) {
          // se só der erro aqui, não quebra a tela toda
          console.warn("Erro ao carregar market_state:", mError);
        }

        if (!cancelled && m) setMarket(m);
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setErro(err?.message || "Erro ao carregar dados do token.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) load();

    return () => {
      cancelled = true;
    };
  }, [slug, supabase]);

  const riskZone = market?.risk_zone || "NEUTRO";

  const riskText =
    riskZone === "HYPE"
      ? "Sua moeda está em hype: entrou volume forte em pouco tempo. Isso quase nunca dura. É o momento em que você mais precisa reforçar o risco, não a promessa."
      : riskZone === "BOLHA"
      ? "Sua moeda está em zona de bolha: subida rápida demais. Bonito no gráfico, perigoso na prática. Não use isso para prometer lucro."
      : riskZone === "FRIO"
      ? "Mercado frio: pouco volume, pouca movimentação. Nada de errado com isso — só não inventa foguete onde ainda não tem fogo."
      : "Sem leitura de mercado suficiente para definir zona. Ainda assim, o risco continua alto por definição.";

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          {loading && <p className="cta-note">Carregando token...</p>}

          {erro && (
            <p className="cta-note" style={{ color: "var(--accent-primary)" }}>
              {erro}
            </p>
          )}

          {!loading && coin && (
            <>
              <header className="creator-header">
                <span className="creator-kicker">Token na Arena</span>
                <h1 className="creator-title">
                  {coin.name} <span>{coin.symbol}</span>
                </h1>
                <p className="creator-subtitle">
                  {coin.narrative_short ||
                    "Token de narrativa da comunidade. Especulação consciente, risco alto por definição."}
                </p>
              </header>

              <section className="creator-main">
                <div className="creator-form-side">
                  <div className="creator-card">
                    <div className="section-label">Números principais</div>
                    <div className="creator-token-metrics big">
                      <div>
                        <span className="metric-label">Preço atual</span>
                        <span className="metric-value">
                          {market?.price_current
                            ? `~ ${market.price_current}`
                            : "Sem dados ainda"}
                        </span>
                      </div>
                      <div>
                        <span className="metric-label">Volume 24h (base)</span>
                        <span className="metric-value">
                          {market?.volume_24h_base ?? "0"}
                        </span>
                      </div>
                      <div>
                        <span className="metric-label">Trades 24h</span>
                        <span className="metric-value">
                          {market?.trades_24h ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="creator-card" style={{ marginTop: 14 }}>
                    <div className="section-label">Narrativa</div>
                    <p className="creator-summary-story">
                      {coin.narrative_long ||
                        coin.narrative_short ||
                        "Este token ainda não tem uma narrativa longa cadastrada."}
                    </p>
                  </div>
                </div>

                <aside className="creator-preview-side">
                  <div className="creator-card">
                    <div className="section-label">Leitura da Arena</div>
                    <h2 className="section-title">
                      Zona de risco:{" "}
                      {riskZone === "HYPE" && "HYPE"}
                      {riskZone === "BOLHA" && "BOLHA"}
                      {riskZone === "FRIO" && "FRIO"}
                      {riskZone === "NEUTRO" && "NEUTRO"}
                    </h2>

                    <p className="creator-summary-story">{riskText}</p>

                    <div className="creator-risk-box" style={{ marginTop: 10 }}>
                      <p>
                        Lembre sua comunidade, sempre: isso é jogo de alto risco. Você é
                        criador de narrativa, não gerente de investimento. O 3ustaquio cuida
                        do código e da transparência de risco — não da forma como você vende
                        a história.
                      </p>
                      {coin.risk_disclaimer && (
                        <p className="field-help" style={{ marginTop: 6 }}>
                          {coin.risk_disclaimer}
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </section>
            </>
          )}
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
