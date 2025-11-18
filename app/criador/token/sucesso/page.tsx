// app/criador/token/sucesso/page.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";

export default function TokenSucessoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenName = searchParams.get("tokenName") || "Seu token";
  const ticker = searchParams.get("ticker") || "TICKER";
  const publicName = searchParams.get("publicName") || "Criador";

  const tokenUrl = `https://app.3ustaquio.com/token/${ticker.toLowerCase()}`;

  const shareText = `Lancei um token da minha comunidade no 3ustaquio.
Não é investimento seguro, é jogo de narrativa de alto risco.
Se você não gosta de risco, não entra.

${tokenUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tokenUrl);
      alert("Link copiado para a área de transferência.");
    } catch {
      alert("Não foi possível copiar o link.");
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Texto copiado para a área de transferência.");
    } catch {
      alert("Não foi possível copiar o texto.");
    }
  };

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <section className="creator-hero">
            <div className="creator-hero-left">
              <span className="creator-kicker">Token lançado na Arena</span>
              <h1 className="creator-title">
                Seu token <span>{ticker}</span> está vivo.
              </h1>
              <p className="creator-subtitle">
                Agora a narrativa é com você e com a sua comunidade. Este é o link que você vai jogar no mundo —
                e este é o jeito ético de falar sobre ele.
              </p>

              <div className="creator-card" style={{ marginTop: 12 }}>
                <div className="section-label">Link da Arena</div>
                <p className="creator-summary-url">{tokenUrl}</p>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleCopyLink}
                  style={{ marginTop: 8 }}
                >
                  Copiar link
                </button>
              </div>
            </div>

            <aside className="creator-hero-right">
              <div className="creator-card">
                <div className="section-label">Texto pronto para redes</div>
                <h2 className="section-title">Use, adapte, mas não apague os riscos</h2>
                <textarea
                  className="field-textarea"
                  rows={8}
                  readOnly
                  value={shareText}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopyText}
                  style={{ marginTop: 8 }}
                >
                  Copiar texto de divulgação
                </button>
                <p className="field-help" style={{ marginTop: 6 }}>
                  Você pode adaptar pro seu tom, só não apaga os avisos de risco.
                  É isso que separa o {tokenName} de uma promessa vazia.
                </p>
              </div>
            </aside>
          </section>

          <section>
            <div className="creator-footer">
              <div className="creator-footer-left">
                <p className="creator-footer-hint">
                  Lembre sempre sua comunidade: isso é um jogo de alto risco.
                  Você é criador de narrativa, não gerente de investimento.
                </p>
              </div>
              <div className="creator-footer-right">
                <button
                  type="button"
                  className="btn-outline creator-nav-btn"
                  onClick={() => router.push("/criador/dashboard")}
                >
                  Ver todos os meus tokens
                </button>
              </div>
            </div>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
