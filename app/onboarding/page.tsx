"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../componentes/ui/layout/Footer3ustaquio";
import PasskeyUpsellModal from "../componentes/auth/PasskeyUpsellModal";
import { useAuth, useUser } from "@clerk/nextjs";
//import { getOrCreateUserProfile } from "../lib/userProfile"; // ✅ crie igual ao creatorProfile
import { getOrCreateUserProfile } from "../lib/userProfile.client";

const NEXT_STEP = "/criador/token/novo"; // ✅ TROCA pra onde o usuário deve ir após o onboarding

export default function UsuarioOnboardingPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // se não estiver logado, manda pro login
  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) router.replace("/login"); // ou "/criador/login" se quiser unificar
  }, [authLoaded, isSignedIn, router]);

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
      await getOrCreateUserProfile();

      // ✅ próximo passo do usuário
      router.push(NEXT_STEP);
    } catch (err: any) {
      console.error("Erro no onboarding do usuário:", err);

      if (err?.message === "NOT_AUTH") {
        setErro("Você precisa estar logado para continuar.");
        router.replace("/login");
      } else {
        setErro(
          "Não foi possível preparar sua Arena agora. Faça login novamente ou tente mais tarde."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // enquanto clerk carrega evita piscar
  if (!authLoaded || !userLoaded) {
    return (
      <>
        <Header3ustaquio />
        <main className="creator-screen">
          <div className="container creator-shell">
            <section className="creator-card">
              <p className="cta-note">Carregando sua Arena...</p>
            </section>
          </div>
          <Footer3ustaquio />
        </main>
      </>
    );
  }

  return (
    <>
      <PasskeyUpsellModal />

      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          {/* Cabeçalho rápido do onboarding */}
          <header className="creator-header">
            <span className="creator-kicker">Jornada do Usuário</span>

            <h1 className="creator-title">
              Bem-vindo à Arena. Aqui o risco é transparente.
            </h1>

            <p className="creator-subtitle">
              Você entra como <strong>especulador consciente</strong>.  
              O 3ustaquio não promete retorno, não protege contra perda,  
              e não é banco/corretora. É mercado de narrativa.
            </p>

            {/* Identidade rápida do usuário */}
            {!!user?.primaryEmailAddress?.emailAddress && (
              <p className="cta-note" style={{ marginTop: 6 }}>
                Logado como:{" "}
                <b>{user.primaryEmailAddress.emailAddress}</b>
              </p>
            )}
          </header>

          {/* Bloco de aceitação de risco */}
          <section>
            <div className="creator-card">
              <h2 className="section-title">Qual é o combinado?</h2>
              <p className="section-subtitle">
                Antes de entrar no book, você precisa aceitar o jogo:
                aqui é especulação, não “investimento seguro”.
              </p>

              <ul className="hero-bullets">
                <li>Você pode perder 100% do valor colocado.</li>
                <li>Preço pode explodir, colapsar ou ficar morto.</li>
                <li>Você opera por conta própria, sem garantia de liquidez.</li>
                <li>
                  O risco é parte do produto. Transparência brutal, zero promessa.
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
                    Você ainda não comprou nada.  
                    O próximo passo é explorar moedas, ver risco e escolher onde entrar.
                  </p>
                </div>

                <div className="creator-footer-right">
                  <button
                    type="button"
                    className="btn-primary creator-nav-btn"
                    disabled={!aceito || loading}
                    onClick={handleContinuar}
                  >
                    {loading ? "Preparando sua Arena..." : "Entrar na Arena"}
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
