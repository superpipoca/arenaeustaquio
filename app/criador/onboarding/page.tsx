// app/criador/onboarding/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import { getOrCreateCreatorProfile } from "../../lib/creatorProfile";

export default function CriadorOnboardingPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleContinuar = async () => {
    setErro(null);
    setLoading(true);
    try {
      await getOrCreateCreatorProfile();
      router.push("/criador/token/novo");
    } catch (err: any) {
      console.error(err);
      setErro(
        "Você precisa estar logado para continuar. Faça login ou tente novamente."
      );
      router.push("/criador/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          {/* ... cabeçalho e cards iguais aos que já fizemos ... */}

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

            {erro && (
              <p className="cta-note" style={{ color: "var(--accent-primary)", marginTop: 8 }}>
                {erro}
              </p>
            )}

            <div className="creator-footer" style={{ marginTop: "18px" }}>
              <div className="creator-footer-left" />
              <div className="creator-footer-right">
                <button
                  type="button"
                  className="btn-primary creator-nav-btn"
                  disabled={!aceito || loading}
                  onClick={handleContinuar}
                >
                  {loading ? "Preparando sua Arena..." : "Começar a criar minha moeda"}
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
