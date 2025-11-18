// app/criador/onboarding/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";

export default function CriadorOnboardingPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Antes de criar sua moeda</span>
            <h1 className="creator-title">
              O que <span>é</span> e o que <span>não é</span> ter um token no 3ustaquio
            </h1>
            <p className="creator-subtitle">
              Você está prestes a jogar sua narrativa em um mercado de alto risco.
              Melhor alinhar as expectativas agora do que se arrepender depois.
            </p>
          </header>

          <section className="grid-3 onboarding-grid">
            <div className="card">
              <h3>É isso aqui</h3>
              <p>Um código que transforma sua narrativa em jogo de mercado.</p>
              <p>Uma forma de medir o hype da sua comunidade.</p>
              <p>Um experimento assumidamente especulativo.</p>
            </div>

            <div className="card">
              <h3>Não é isso aqui</h3>
              <p>Plano de aposentadoria.</p>
              <p>Produto financeiro garantido.</p>
              <p>Promessa de multiplicar patrimônio.</p>
            </div>

            <div className="card">
              <h3>Seu papel</h3>
              <p>Deixar claro que é jogo de alto risco.</p>
              <p>Não vender ilusão de retorno certo.</p>
              <p>Lembrar a comunidade que pode virar pó.</p>
            </div>
          </section>

          <section>
            <div className="creator-risk-box">
              <label className="creator-risk-check">
                <input
                  type="checkbox"
                  checked={aceito}
                  onChange={(e) => setAceito(e.target.checked)}
                />
                <span>
                  Eu li e entendi que o 3ustaquio é uma arena de especulação de alto risco,
                  <strong> não</strong> um produto financeiro seguro.
                </span>
              </label>
            </div>

            <div className="creator-footer" style={{ marginTop: "18px" }}>
              <div className="creator-footer-left" />
              <div className="creator-footer-right">
                <button
                  type="button"
                  className="btn-primary creator-nav-btn"
                  disabled={!aceito}
                  onClick={() => router.push("/criador/token/novo")}
                >
                  Começar a criar minha moeda
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
