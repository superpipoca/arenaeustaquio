// // app/criador/onboarding/page.tsx
// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
// import { getOrCreateCreatorProfile } from "../../lib/creatorProfile";
// import PasskeyUpsellModal from "../../componentes/auth/PasskeyUpsellModal";

// export default function CriadorOnboardingPage() {
//   const router = useRouter();
//   const [aceito, setAceito] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [erro, setErro] = useState<string | null>(null);

//   const handleContinuar = async () => {
//     setErro(null);

//     if (!aceito) {
//       setErro(
//         "Você precisa aceitar que o 3ustaquio é arena de alto risco antes de continuar."
//       );
//       return;
//     }

//     setLoading(true);

//     try {
//       await getOrCreateCreatorProfile();
//       // se deu tudo certo, segue para criação do token
//       router.push("/criador/token/novo");
//     } catch (err: any) {
//       console.error("Erro no onboarding do criador:", err);

//       if (err?.message === "NOT_AUTH") {
//         setErro("Você precisa estar logado para continuar.");
//         router.push("/criador/login");
//       } else {
//         setErro(
//           "Não foi possível preparar sua Arena agora. Faça login novamente ou tente mais tarde."
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <PasskeyUpsellModal />
//       <Header3ustaquio />
//       <main className="creator-screen">
//         <div className="container creator-shell">
//           {/* Cabeçalho rápido do onboarding */}
//           <header className="creator-header">
//             <span className="creator-kicker">Jornada do Criador</span>
//             <h1 className="creator-title">
//               Antes de lançar moeda, alinhamos o risco.
//             </h1>
//             <p className="creator-subtitle">
//               3ustaquio é uma arena de especulação de alto risco. Você entra como
//               <strong> criador de narrativa</strong>, não como vendedor de investimento
//               garantido.
//             </p>
//           </header>

//           {/* Bloco de aceitação de risco */}
//           <section>
//             <div className="creator-card">
//               <h2 className="section-title">Qual é o combinado?</h2>
//               <p className="section-subtitle">
//                 Ao seguir para criar seu token, você assume que está construindo um
//                 experimento especulativo com a sua comunidade – não um produto financeiro
//                 seguro.
//               </p>

//               <ul className="hero-bullets">
//                 <li>Seu token pode subir, cair rápido ou simplesmente não andar.</li>
//                 <li>
//                   3ustaquio é ferramenta de código e transparência, não banco nem corretora.
//                 </li>
//                 <li>
//                   Você é responsável pela forma como comunica isso para a sua audiência.
//                 </li>
//               </ul>

//               <div className="creator-risk-box" style={{ marginTop: "16px" }}>
//                 <label className="creator-risk-check">
//                   <input
//                     type="checkbox"
//                     checked={aceito}
//                     onChange={(e) => setAceito(e.target.checked)}
//                   />
//                   <span>
//                     Eu li e entendi que o 3ustaquio é uma arena de especulação de alto risco,
//                     <strong> não</strong> um produto financeiro seguro.
//                   </span>
//                 </label>
//               </div>

//               {erro && (
//                 <p
//                   className="cta-note"
//                   style={{ color: "var(--accent-primary)", marginTop: 8 }}
//                 >
//                   {erro}
//                 </p>
//               )}

//               <div className="creator-footer" style={{ marginTop: "18px" }}>
//                 <div className="creator-footer-left">
//                   <p className="creator-footer-hint">
//                     Você ainda não está lançando nenhuma moeda. O próximo passo é desenhar o
//                     token; o lançamento só acontece depois do checkout e da sua confirmação.
//                   </p>
//                 </div>
//                 <div className="creator-footer-right">
//                   <button
//                     type="button"
//                     className="btn-primary creator-nav-btn"
//                     disabled={!aceito || loading}
//                     onClick={handleContinuar}
//                   >
//                     {loading
//                       ? "Preparando sua Arena..."
//                       : "Começar a criar minha moeda"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </div>
//         <Footer3ustaquio />
//       </main>
//     </>
//   );
// }
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import PasskeyUpsellModal from "../../componentes/auth/PasskeyUpsellModal";

const ENSURE_TIMEOUT_MS = 5000;

async function safeJson(res: Response) {
  // lê texto primeiro (pode vir vazio / não-json)
  const txt = await res.text().catch(() => "");
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export default function CriadorOnboardingPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // evita clique duplo
  const runningRef = useRef(false);

  const handleContinuar = async () => {
    setErro(null);

    if (!aceito) {
      setErro(
        "Você precisa aceitar que o 3ustaquio é uma arena de alto risco antes de continuar."
      );
      return;
    }

    if (!userId) {
      setErro("Sessão não identificada. Tente recarregar a página.");
      return;
    }

    if (runningRef.current) return;
    runningRef.current = true;
    setLoading(true);

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), ENSURE_TIMEOUT_MS);

      const res = await fetch("/api/ensure-user-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(t);

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/criador/login");
          return;
        }

        const body = await safeJson(res);
        const details =
          body?.details || body?.error || `status_${res.status}`;

        throw new Error(details);
      }

      const json = await safeJson(res);

      if (json?.error) {
        console.log("Erro nessa merda " + JSON.stringify(json));
        throw new Error(
          typeof json.error === "string" ? json.error : "rpc_failed"
        );
      }

      // sucesso -> navega
      router.push("/criador/token/novo");
    } catch (err: any) {
      console.error("Erro no onboarding:", err);

      const msg =
        err?.name === "AbortError"
          ? "Demorou demais para preparar sua conta. Tente novamente."
          : "Não conseguimos preparar sua conta agora. Tente recarregar a página.";

      setErro(msg);
    } finally {
      setLoading(false);
      runningRef.current = false;
    }
  };

  // 1) Loading inicial do Clerk
  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffbd]" />
        <p className="text-sm text-neutral-400 animate-pulse">
          Sincronizando Arena...
        </p>
      </div>
    );
  }

  // 2) Não logado (sem loop)
  if (!isSignedIn || !user) {
    return (
      <>
        <Header3ustaquio />
        <main className="creator-screen">
          <div className="container creator-shell flex flex-col items-center justify-center py-20 text-center">
            <h1 className="creator-title mb-4">Sessão Expirada</h1>
            <p className="creator-subtitle mb-8 max-w-md mx-auto">
              Não conseguimos validar suas credenciais. Isso acontece se a
              autenticação demorou para sincronizar.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => router.push("/criador/login")}
                className="auth-toggle-btn"
              >
                Voltar para Login
              </button>
            </div>
          </div>
          <Footer3ustaquio />
        </main>
      </>
    );
  }

  // 3) Logado (conteúdo real)
  return (
    <>
      <PasskeyUpsellModal />
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Jornada do Criador</span>
            <h1 className="creator-title">
              Antes de lançar moeda, alinhamos o risco.
            </h1>
            <p className="creator-subtitle">
              3ustaquio é uma arena de especulação de alto risco. Você entra
              como <strong>criador de narrativa</strong>, não como vendedor de
              investimento garantido.
            </p>
          </header>

          <section>
            <div className="creator-card">
              <h2 className="section-title">Qual é o combinado?</h2>
              <p className="section-subtitle">
                Ao seguir para criar seu token, você assume que está construindo
                um experimento especulativo – não um produto financeiro seguro.
              </p>

              <ul className="hero-bullets">
                <li>Seu token pode subir, cair rápido ou simplesmente não andar.</li>
                <li>3ustaquio é ferramenta de código e transparência, não banco nem corretora.</li>
                <li>Você é responsável pela forma como comunica isso para a sua audiência.</li>
              </ul>

              <div className="creator-risk-box" style={{ marginTop: "16px" }}>
                <label className="creator-risk-check">
                  <input
                    type="checkbox"
                    checked={aceito}
                    onChange={(e) => setAceito(e.target.checked)}
                  />
                  <span>
                    Eu li e entendi que o 3ustaquio é uma arena de especulação de
                    alto risco, <strong>não</strong> um produto financeiro seguro.
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
                    Você está logado como{" "}
                    <strong>{user.primaryEmailAddress?.emailAddress}</strong>.
                    <br />
                    O lançamento só acontece depois do checkout.
                  </p>
                </div>

                <div className="creator-footer-right">
                  <button
                    type="button"
                    className="btn-primary creator-nav-btn"
                    disabled={!aceito || loading}
                    onClick={handleContinuar}
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Preparando sua Arena..." : "Começar a criar minha moeda"}
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
