// app/criador/onboarding/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import { getOrCreateCreatorProfile } from "../../lib/creatorProfile";
import PasskeyUpsellModal from "../../componentes/auth/PasskeyUpsellModal";

export default function CriadorOnboardingPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleContinuar = async () => {
    setErro(null);

    if (!aceito) {
      setErro(
        "Você precisa aceitar que o 3ustaquio é arena de alto risco antes de continuar."
      );
      return;
    }

    setLoading(true);

    try {
      await getOrCreateCreatorProfile();
      // se deu tudo certo, segue para criação do token
      router.push("/criador/token/novo");
    } catch (err: any) {
      console.error("Erro no onboarding do criador:", err);

      if (err?.message === "NOT_AUTH") {
        setErro("Você precisa estar logado para continuar.");
        router.push("/criador/login");
      } else {
        setErro(
          "Não foi possível preparar sua Arena agora. Faça login novamente ou tente mais tarde."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PasskeyUpsellModal />
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          {/* Cabeçalho rápido do onboarding */}
          <header className="creator-header">
            <span className="creator-kicker">Jornada do Criador</span>
            <h1 className="creator-title">
              Antes de lançar moeda, alinhamos o risco.
            </h1>
            <p className="creator-subtitle">
              3ustaquio é uma arena de especulação de alto risco. Você entra como
              <strong> criador de narrativa</strong>, não como vendedor de investimento
              garantido.
            </p>
          </header>

          {/* Bloco de aceitação de risco */}
          <section>
            <div className="creator-card">
              <h2 className="section-title">Qual é o combinado?</h2>
              <p className="section-subtitle">
                Ao seguir para criar seu token, você assume que está construindo um
                experimento especulativo com a sua comunidade – não um produto financeiro
                seguro.
              </p>

              <ul className="hero-bullets">
                <li>Seu token pode subir, cair rápido ou simplesmente não andar.</li>
                <li>
                  3ustaquio é ferramenta de código e transparência, não banco nem corretora.
                </li>
                <li>
                  Você é responsável pela forma como comunica isso para a sua audiência.
                </li>
              </ul>

              <div className="creator-risk-box" style={{ marginTop: "16px" }}>
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

              {erro && (
                <p
                  className="cta-note"
                  style={{ color: "var(--accent-primary)", marginTop: 8 }}
                >
                  {erro}
                </p>
              )}

              <div className="creator-footer" style={{ marginTop: "18px" }}>
                <div className="creator-footer-left">
                  <p className="creator-footer-hint">
                    Você ainda não está lançando nenhuma moeda. O próximo passo é desenhar o
                    token; o lançamento só acontece depois do checkout e da sua confirmação.
                  </p>
                </div>
                <div className="creator-footer-right">
                  <button
                    type="button"
                    className="btn-primary creator-nav-btn"
                    disabled={!aceito || loading}
                    onClick={handleContinuar}
                  >
                    {loading
                      ? "Preparando sua Arena..."
                      : "Começar a criar minha moeda"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
