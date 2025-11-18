// // app/criador/login/page.tsx
// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
// import { supabase } from "../../lib/supabaseClient"; // ✅ usa o client real

// export default function CriadorLoginPage() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [senha, setSenha] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [erro, setErro] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErro(null);

//     if (!email.trim() || !senha.trim()) {
//       setErro("Preencha e-mail e senha.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email,
//         password: senha,
//       });

//       if (error) {
//         console.error("Erro Supabase login:", error);
//         setErro(error.message || "Não foi possível entrar.");
//         return;
//       }

//       // Depois do login, manda pro onboarding do criador
//       router.push("/criador/onboarding");
//     } catch (err: any) {
//       console.error("Erro inesperado ao tentar logar:", err);
//       setErro("Erro inesperado ao tentar logar.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Header3ustaquio />
//       <main className="creator-screen">
//         <div className="container creator-shell auth-shell">
//           <section className="auth-card">
//             <h1 className="creator-title">Entrar como criador</h1>
//             <p className="creator-subtitle">
//               Você está entrando em uma plataforma de especulação consciente.
//               Nada aqui é investimento seguro.
//             </p>

//             <form onSubmit={handleSubmit} className="auth-form">
//               <div className="creator-field-group">
//                 <label className="field-label">E-mail</label>
//                 <input
//                   className="field-input"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="seunome@exemplo.com"
//                   required
//                 />
//               </div>

//               <div className="creator-field-group">
//                 <label className="field-label">Senha</label>
//                 <input
//                   className="field-input"
//                   type="password"
//                   value={senha}
//                   onChange={(e) => setSenha(e.target.value)}
//                   required
//                 />
//               </div>

//               {erro && (
//                 <p className="cta-note" style={{ color: "var(--accent-primary)" }}>
//                   {erro}
//                 </p>
//               )}

//               <button
//                 type="submit"
//                 className="btn-primary auth-submit"
//                 disabled={loading}
//               >
//                 {loading ? "Entrando..." : "Entrar"}
//               </button>
//             </form>

//             <div className="auth-footer">
//               <p className="cta-note">
//                 Ao continuar, você concorda com os{" "}
//                 <a href="#">termos & aviso de risco</a>.
//               </p>
//             </div>
//           </section>
//         </div>
//         <Footer3ustaquio />
//       </main>
//     </>
//   );
// }
// app/criador/login/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import { supabase } from "../../lib/supabaseClient";

type Challenge = {
  a: number;
  b: number;
  answer: number;
};

export default function CriadorLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<Challenge>({
    a: 0,
    b: 0,
    answer: 0,
  });
  const [challengeInput, setChallengeInput] = useState("");

  // Gera um desafio anti-bot simples
  const gerarDesafio = () => {
    const a = Math.floor(Math.random() * 5) + 3; // 3–7
    const b = Math.floor(Math.random() * 5) + 2; // 2–6
    setChallenge({ a, b, answer: a + b });
    setChallengeInput("");
  };

  useEffect(() => {
    gerarDesafio();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    // valida desafio anti-bot
    const userAnswer = parseInt(challengeInput.replace(/\D/g, ""), 10);
    if (Number.isNaN(userAnswer) || userAnswer !== challenge.answer) {
      setErro("Desafio incorreto. Prove que você não é um bot e tente de novo.");
      gerarDesafio();
      return;
    }

    setLoading(true);

    try {
      console.log("[LOGIN] Tentando login com Supabase...");
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

      if (!signInError && signInData?.session) {
        console.log("[LOGIN] Login bem-sucedido, indo para /criador/onboarding");
        router.push("/criador/onboarding");
        return;
      }

      // Se deu erro no login, tentamos criar a conta
      console.warn("[LOGIN] Falha no login, tentando criar usuário:", signInError);

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: senha,
        });

      if (signUpError) {
        console.error("[LOGIN] Erro ao criar usuário:", signUpError);

        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists")) {
          setErro(
            "Este e-mail já está cadastrado. Se esqueceu a senha, use a recuperação."
          );
        } else {
          setErro(signUpError.message || "Não foi possível criar sua conta.");
        }
        return;
      }

      console.log("[LOGIN] Usuário criado com sucesso:", signUpData);
      // Dependendo da config do Supabase, pode exigir confirmação por e-mail.
      // Aqui a jornada já vai pro onboarding do criador.
      router.push("/criador/onboarding");
    } catch (err: any) {
      console.error("Erro inesperado no fluxo login/criação:", err);
      setErro("Erro inesperado ao tentar logar/criar conta.");
    } finally {
      setLoading(false);
      // gera novo desafio a cada tentativa completa
      gerarDesafio();
    }
  };

  const desafioLabel = `Quanto é ${challenge.a} + ${challenge.b}?`;

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell auth-shell">
          <section className="auth-card">
            <h1 className="creator-title">Entrar ou criar conta de criador</h1>
            <p className="creator-subtitle">
              Um login. Uma conta. Você entra na Arena de especulação consciente.
              Nada aqui é investimento seguro.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="creator-field-group">
                <label className="field-label">E-mail</label>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seunome@exemplo.com"
                  required
                />
              </div>

              <div className="creator-field-group">
                <label className="field-label">Senha</label>
                <input
                  className="field-input"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <p className="field-help">
                  Se ainda não tem conta, usaremos essa senha para criar uma agora.
                </p>
              </div>

              {/* Desafio anti-bot */}
              <div className="creator-field-group">
                <label className="field-label">
                  Prova de humanidade (anti-bot)
                </label>
                <div className="creator-two-cols" style={{ gap: "8px" }}>
                  <div style={{ flex: 2 }}>
                    <p className="field-help">
                      {desafioLabel} Responda em números.
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      className="field-input"
                      type="text"
                      value={challengeInput}
                      onChange={(e) => setChallengeInput(e.target.value)}
                      placeholder="Resposta"
                      required
                    />
                  </div>
                </div>
              </div>

              {erro && (
                <p
                  className="cta-note"
                  style={{ color: "var(--accent-primary)", marginTop: 8 }}
                >
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "Processando..." : "Entrar ou criar minha conta"}
              </button>
            </form>

            <div className="auth-footer">
              <p className="cta-note">
                Ao continuar, você concorda com os{" "}
                <a href="#">termos & aviso de risco</a>.
              </p>
            </div>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
