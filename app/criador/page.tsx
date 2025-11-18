// app/criador/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../componentes/ui/layout/Footer3ustaquio";

export default function CriadorGatePage() {
  const router = useRouter();

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <section className="creator-hero">
            <div className="creator-hero-left">
              <span className="creator-kicker">Jornada do Criador</span>
              <h1 className="creator-title">
                Quer ter uma <span>moeda sua</span>? Primeiro você precisa entender o jogo.
              </h1>
              <p className="creator-subtitle">
                O 3ustaquio é uma arena de especulação consciente. Nada aqui é investimento seguro,
                nada aqui é promessa de milagre financeiro.
              </p>

              <ul className="creator-list">
                <li>Tokens aqui podem valer muito, pouco ou zero.</li>
                <li>A narrativa é sua, o risco também.</li>
                <li>A plataforma é ferramenta, não corretora nem banco.</li>
              </ul>

              <div className="hero-ctas-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => router.push("/criador/login")}
                >
                  Entrar como criador
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => router.push("/criador/onboarding")}
                >
                  Quero entender melhor antes
                </button>
              </div>
            </div>

            <aside className="creator-hero-right">
              <div className="creator-alert-card">
                <h2>Antes de entrar, você precisa saber:</h2>
                <p>
                  Os tokens negociados no 3ustaquio <strong>não são produtos de investimento
                  regulados</strong>. Você pode perder 100% do valor colocado em qualquer token.
                </p>
                <p className="creator-alert-strong">
                  Se você está procurando renda segura, esse não é o lugar. E tá tudo bem.
                </p>
              </div>
            </aside>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
