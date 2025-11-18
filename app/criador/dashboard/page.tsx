// app/criador/dashboard/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";

const MOCK_TOKENS = [
  {
    id: "zetk",
    name: "ZETOKEN",
    ticker: "ZETK",
    zone: "HYPE",
    holders: 128,
    volume24h: "R$ 12.300",
    change24h: "+38%",
  },
  {
    id: "hypebrenel",
    name: "HYPEBRENEL",
    ticker: "BRNL",
    zone: "BOLHA",
    holders: 74,
    volume24h: "R$ 8.900",
    change24h: "+120%",
  },
  {
    id: "crew",
    name: "CREW DA PISTA",
    ticker: "CREW",
    zone: "FRIO",
    holders: 21,
    volume24h: "R$ 540",
    change24h: "-12%",
  },
];

export default function CriadorDashboardPage() {
  const router = useRouter();

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Painel do criador</span>
            <h1 className="creator-title">
              Seus <span>tokens</span> na Arena
            </h1>
            <p className="creator-subtitle">
              Aqui você acompanha a narrativa em tempo real — não uma planilha de promessa.
            </p>
          </header>

          <section className="creator-token-list">
            {MOCK_TOKENS.map((t) => (
              <article
                key={t.id}
                className="creator-token-card"
                onClick={() => router.push(`/criador/token/${t.id}`)}
              >
                <header className="creator-token-card-header">
                  <div>
                    <h2>{t.name}</h2>
                    <p className="creator-token-ticker">{t.ticker}</p>
                  </div>
                  <span className={`creator-zone-badge zone-${t.zone.toLowerCase()}`}>
                    {t.zone === "HYPE" && "Zona de hype"}
                    {t.zone === "BOLHA" && "Zona de bolha"}
                    {t.zone === "FRIO" && "Mercado frio"}
                  </span>
                </header>

                <div className="creator-token-metrics">
                  <div>
                    <span className="metric-label">Holders</span>
                    <span className="metric-value">{t.holders}</span>
                  </div>
                  <div>
                    <span className="metric-label">Volume 24h</span>
                    <span className="metric-value">{t.volume24h}</span>
                  </div>
                  <div>
                    <span className="metric-label">Variação 24h</span>
                    <span className="metric-value">{t.change24h}</span>
                  </div>
                </div>

                <footer className="creator-token-card-footer">
                  <span>Ver detalhes</span>
                </footer>
              </article>
            ))}
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
