// app/criador/token/checkout/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";

export default function CheckoutTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") || "TOKEN";
  const publicName = searchParams.get("publicName") || "Criador";
  const tokenName = searchParams.get("tokenName") || "Seu token";
  const ticker = searchParams.get("ticker") || "TICKER";
  const headline = searchParams.get("headline") || "";
  const story = searchParams.get("story") || "";

  const [aceito, setAceito] = useState(false);

  const tokenUrl = `https://app.3ustaquio.com/token/${ticker.toLowerCase()}`;

  const handleLaunch = () => {
    const params = new URLSearchParams({
      type,
      publicName,
      tokenName,
      ticker,
    });
    router.push(`/criador/token/sucesso?${params.toString()}`);
  };

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Passo – Pagar taxa & lançar</span>
            <h1 className="creator-title">
              Revise seu <span>token</span> antes de apertar o botão vermelho
            </h1>
            <p className="creator-subtitle">
              Essa é a hora de conferir se você está confortável com o que vai jogar na Arena —
              e com os riscos que vêm junto.
            </p>
          </header>

          <section className="creator-main">
            {/* Esquerda – resumo */}
            <div className="creator-form-side">
              <div className="creator-card">
                <div className="section-label">Resumo do token</div>
                <h2 className="section-title">O que você está lançando</h2>

                <div className="creator-two-cols">
                  <div className="creator-summary-block">
                    <h3>Dados principais</h3>
                    <ul>
                      <li>
                        <span>Tipo:</span> <strong>{type}</strong>
                      </li>
                      <li>
                        <span>Criador:</span> <strong>{publicName}</strong>
                      </li>
                      <li>
                        <span>Nome:</span> <strong>{tokenName}</strong>
                      </li>
                      <li>
                        <span>Ticker:</span> <strong>{ticker}</strong>
                      </li>
                    </ul>

                    <h4>Frase curta</h4>
                    <p>{headline || "Você ainda não definiu a frase curta."}</p>
                  </div>

                  <div className="creator-summary-block">
                    <h3>Narrativa</h3>
                    <p className="creator-summary-story">
                      {story
                        ? story
                        : "Você ainda não escreveu a narrativa. Volte e explique por que esse token existe."}
                    </p>
                  </div>
                </div>

                <div className="creator-summary-block" style={{ marginTop: "10px" }}>
                  <h3>Link da Arena (simulado)</h3>
                  <p className="creator-summary-url">{tokenUrl}</p>
                </div>
              </div>
            </div>

            {/* Direita – pagamento & risco */}
            <aside className="creator-preview-side">
              <div className="creator-card">
                <div className="section-label">Pagamento & compromisso</div>
                <h2 className="section-title">Taxa 3ustaquio & riscos</h2>

                <div className="creator-summary-block">
                  <h3>Resumo financeiro</h3>
                  <ul>
                    <li>
                      <span>Taxa 3ustaquio:</span> <strong>R$ 199,00</strong>
                    </li>
                    <li>
                      <span>Custos de rede (estimado):</span> <strong>R$ 12,00</strong>
                    </li>
                    <li>
                      <span>Total:</span> <strong>R$ 211,00</strong>
                    </li>
                  </ul>
                  <p className="field-help">
                    Taxa de infraestrutura e listagem. Não é taxa de gestão de investimento.
                  </p>
                </div>

                <div className="creator-risk-box" style={{ marginTop: "10px" }}>
                  <p>
                    Ao lançar, você está criando um token <strong>especulativo</strong>, não um
                    investimento seguro. Ninguém tem garantia de retorno.
                  </p>

                  <label className="creator-risk-check">
                    <input
                      type="checkbox"
                      checked={aceito}
                      onChange={(e) => setAceito(e.target.checked)}
                    />
                    <span>
                      Eu entendo que este token não é investimento seguro, que o preço pode ir a zero
                      e que o 3ustaquio é infraestrutura de código, não banco/corretora.
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  className="btn-primary creator-nav-btn"
                  disabled={!aceito}
                  onClick={handleLaunch}
                  style={{ marginTop: "14px" }}
                >
                  Entendo o risco e quero lançar meu token
                </button>
              </div>
            </aside>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
