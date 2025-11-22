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

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import PasskeyUpsellModal from "../../componentes/auth/PasskeyUpsellModal";

export default function CriadorOnboardingPage() {
  const router = useRouter();
  // Usamos useUser também para garantir que os dados do usuário foram hidratados
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  
  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Se estiver "deslogado" após carregar, NÃO redirecionamos automaticamente.
  // Isso evita o loop infinito caso o cookie esteja com delay de propagação.
  // O conteúdo protegido será bloqueado via renderização condicional abaixo.

  const handleContinuar = async () => {
    setErro(null);

    if (!aceito) {
      setErro(
        "Você precisa aceitar que o 3ustaquio é uma arena de alto risco antes de continuar."
      );
      return;
    }

    // Redundância: garante auth antes de chamar API
    if (!userId) {
      setErro("Sessão não identificada. Tente recarregar a página.");
      return;
    }

    setLoading(true);

    try {
      // Chama a API robusta que ajustamos anteriormente
      const res = await fetch("/api/ensure-user-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        if (res.status === 401) {
           // Apenas aqui, numa ação explícita, redirecionamos se der 401 real
           router.push("/criador/login");
           return;
        }
        throw new Error("Falha ao preparar carteira");
      }

      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      // Sucesso total
      router.push("/criador/token/novo");

    } catch (err: any) {
      console.error("Erro no onboarding:", err);
      setErro(
        "Não conseguimos preparar sua conta agora. Tente recarregar a página."
      );
    } finally {
      // Só remove loading se houver erro (se for sucesso, vai navegar)
      if (erro) setLoading(false);
    }
  };

  // 1. Estado de Carregamento Inicial do Clerk
  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffbd]"></div>
        <p className="text-sm text-neutral-400 animate-pulse">Sincronizando Arena...</p>
      </div>
    );
  }

  // 2. Estado "Não Logado" (Quebra o Loop)
  // Em vez de router.replace automático, mostramos uma UI bloqueada.
  if (!isSignedIn || !user) {
    return (
      <>
        <Header3ustaquio />
        <main className="creator-screen">
          <div className="container creator-shell flex flex-col items-center justify-center py-20 text-center">
            <h1 className="creator-title mb-4">Sessão Expirada</h1>
            <p className="creator-subtitle mb-8 max-w-md mx-auto">
              Não conseguimos validar suas credenciais. Isso acontece se a autenticação demorou para sincronizar.
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

  // 3. Estado Logado (Conteúdo Real)
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
              3ustaquio é uma arena de especulação de alto risco. Você entra como
              <strong> criador de narrativa</strong>, não como vendedor de investimento
              garantido.
            </p>
          </header>

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
                    Você está logado como <strong>{user.primaryEmailAddress?.emailAddress}</strong>.
                    <br/>
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