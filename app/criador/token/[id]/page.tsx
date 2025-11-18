// app/criador/token/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";

const MOCK_TOKEN_DETAIL = {
  name: "ZETOKEN",
  ticker: "ZETK",
  creator: "Bar do Zé",
  zone: "HYPE",
  holders: 128,
  volume24h: "R$ 12.300",
  volume7d: "R$ 47.800",
  change24h: "+38%",
  change7d: "+92%",
  liquidity: "R$ 25.000",
  narrative:
    "Token do Bar do Zé para brincar de mercado com o hype do bairro. Não é programa de fidelidade, não é promessa de lucro — é jogo assumido.",
};

export default function TokenDetailPage() {
  const params = useParams();
  const id = params?.id;

  // TODO: aqui você buscaria os dados reais pelo id/ticker
  const t = MOCK_TOKEN_DETAIL;

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Token na Arena</span>
            <h1 className="creator-title">
              {t.name} <span>{t.ticker}</span>
            </h1>
            <p className="creator-subtitle">
              por {t.creator}. Zona atual:{" "}
              <strong>
                {t.zone === "HYPE" && "hype forte"}
                {t.zone === "BOLHA" && "bolha perigosa"}
                {t.zone === "FRIO" && "mercado frio"}
              </strong>
              .
            </p>
          </header>

          <section className="creator-main">
            <div className="creator-form-side">
              <div className="creator-card">
                <div className="section-label">Números principais</div>
                <div className="creator-token-metrics big">
                  <div>
                    <span className="metric-label">Holders</span>
                    <span className="metric-value">{t.holders}</span>
                  </div>
                  <div>
                    <span className="metric-label">Volume 24h</span>
                    <span className="metric-value">{t.volume24h}</span>
                  </div>
                  <div>
                    <span className="metric-label">Volume 7d</span>
                    <span className="metric-value">{t.volume7d}</span>
                  </div>
                  <div>
                    <span className="metric-label">Variação 24h</span>
                    <span className="metric-value">{t.change24h}</span>
                  </div>
                  <div>
                    <span className="metric-label">Variação 7d</span>
                    <span className="metric-value">{t.change7d}</span>
                  </div>
                  <div>
                    <span className="metric-label">Liquidez aproximada</span>
                    <span className="metric-value">{t.liquidity}</span>
                  </div>
                </div>
              </div>

              <div className="creator-card" style={{ marginTop: 14 }}>
                <div className="section-label">Narrativa</div>
                <p className="creator-summary-story">{t.narrative}</p>
              </div>
            </div>

            <aside className="creator-preview-side">
              <div className="creator-card">
                <div className="section-label">Leitura da Arena</div>
                <h2 className="section-title">O que esses números estão contando</h2>

                {t.zone === "HYPE" && (
                  <p className="creator-summary-story">
                    Sua moeda está em <strong>hype</strong>: entrou muito volume em pouco tempo.
                    Isso quase nunca dura. É o tipo de momento em que você mais precisa lembrar a
                    comunidade de que o preço pode despencar.
                  </p>
                )}

                {t.zone === "BOLHA" && (
                  <p className="creator-summary-story">
                    Você está em <strong>zona de bolha</strong>: subida rápida demais em tempo
                    demais. Isso é bonito no gráfico, mas perigoso na prática. Não use esse
                    momento para reforçar promessas — use para reforçar avisos.
                  </p>
                )}

                {t.zone === "FRIO" && (
                  <p className="creator-summary-story">
                    Mercado <strong>frio</strong>: pouco volume, pouca movimentação. Nada errado
                    com isso — só não inventa história de foguete se o gráfico está mais pra
                    eletrocardiograma de plantinha.
                  </p>
                )}

                <div className="creator-risk-box" style={{ marginTop: 10 }}>
                  <p>
                    Lembre sua comunidade, sempre: isso é jogo de alto risco. Você é criador de
                    narrativa, não gerente de investimento. O 3ustaquio cuida do código e da
                    transparência de risco — não da forma como você vende a história.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
