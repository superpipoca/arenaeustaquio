// // app/criador/token/checkout/page.tsx
// "use client";

// import React, { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";
// // import { supabaseClient } from "../../../lib/supabaseClient";
// import { SupabaseClient } from "@supabase/supabase-js";
// import { getOrCreateCreatorProfile } from "../../../lib/creatorProfile";

// const RISK_DISCLAIMER = `
// Este token é um experimento especulativo de narrativa.
// Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno.
// Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.
// `.trim();

// function slugifyToken(ticker: string, tokenName: string): string {
//   const base = (ticker || tokenName || "token")
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");

//   return base || "token";
// }

// export default function CheckoutTokenPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const supabase = SupabaseClient as any;

//   const type = searchParams.get("type") || "TOKEN";
//   const publicName = searchParams.get("publicName") || "Criador";
//   const tokenName = searchParams.get("tokenName") || "Seu token";
//   const ticker = (searchParams.get("ticker") || "TICKER").toUpperCase();
//   const headline = searchParams.get("headline") || "";
//   const story = searchParams.get("story") || "";

//   const [aceito, setAceito] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [erro, setErro] = useState<string | null>(null);

//   const tokenUrl = `https://app.3ustaquio.com/token/${ticker.toLowerCase()}`;

//   const handleLaunch = async () => {
//     setErro(null);
//     setLoading(true);

//     try {
//       // garante user + creator
//       const { creatorId } = await getOrCreateCreatorProfile();

//       // pega coin_type_id associado a 'MEME'
//       // (por enquanto tratamos tudo como narrativa pura;
//       // depois você pode mapear para LASTREADA/COMUNIDADE por tipo)
//       const { data: coinType, error: coinTypeError } = await supabase
//         .from("coin_types")
//         .select("id, code")
//         .eq("code", "MEME")
//         .single();

//       if (coinTypeError || !coinType) {
//         throw new Error("Não foi possível localizar o tipo de moeda MEME.");
//       }

//       const slug = slugifyToken(ticker, tokenName);

//       const narrativeShort =
//         headline.trim().length > 0
//           ? headline.trim().slice(0, 240)
//           : `Token de narrativa criado por ${publicName} na plataforma 3ustaquio. Experimento especulativo de alto risco, sem promessa de retorno.`;

//       const tags: string[] = [
//         `tipo_criador:${type.toLowerCase()}`,
//         "origem:3ustaquio-ui",
//       ];

//       const { data: newCoin, error: insertError } = await supabase
//         .from("coins")
//         .insert({
//           slug,
//           symbol: ticker,
//           name: tokenName,
//           creator_id: creatorId,
//           coin_type_id: coinType.id,
//           status: "ACTIVE", // já nasce ativa na Arena
//           narrative_short: narrativeShort,
//           narrative_long: story || null,
//           risk_disclaimer: RISK_DISCLAIMER,
//           tags,
//         })
//         .select("id, slug, symbol, name")
//         .single();

//       if (insertError || !newCoin) {
//         console.error(insertError);
//         throw new Error("Erro ao salvar o token na base 3ustaquio.");
//       }

//       // Aqui daria para chamar init_coin_market_state via RPC
//       // se você já tiver pool_wallet + reservas configuradas.
//       // Exemplo (deixa comentado até ter estrutura pronta):
//       //
//       // await supabase.rpc("init_coin_market_state", {
//       //   p_coin_id: newCoin.id,
//       //   p_base_reserve: 1000,
//       //   p_coin_reserve: 1000,
//       // });

//       const params = new URLSearchParams({
//         tokenId: newCoin.id,
//         slug: newCoin.slug,
//         tokenName: newCoin.name,
//         ticker: newCoin.symbol,
//       });

//       router.push(`/criador/token/sucesso?${params.toString()}`);
//     } catch (err: any) {
//       console.error(err);
//       setErro(
//         err?.message ||
//           "Não foi possível lançar o token. Verifique sua sessão e tente novamente."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Header3ustaquio />
//       <main className="creator-screen">
//         <div className="container creator-shell">
//           <header className="creator-header">
//             <span className="creator-kicker">Passo – Pagar taxa & lançar</span>
//             <h1 className="creator-title">
//               Revise seu <span>token</span> antes de apertar o botão vermelho
//             </h1>
//             <p className="creator-subtitle">
//               Essa é a hora de conferir se você está confortável com o que vai jogar na Arena —
//               e com os riscos que vêm junto.
//             </p>
//           </header>

//           <section className="creator-main">
//             {/* Esquerda – resumo (igual ao que você já tinha) */}
//             <div className="creator-form-side">
//               <div className="creator-card">
//                 <div className="section-label">Resumo do token</div>
//                 <h2 className="section-title">O que você está lançando</h2>

//                 <div className="creator-two-cols">
//                   <div className="creator-summary-block">
//                     <h3>Dados principais</h3>
//                     <ul>
//                       <li>
//                         <span>Tipo:</span> <strong>{type}</strong>
//                       </li>
//                       <li>
//                         <span>Criador:</span> <strong>{publicName}</strong>
//                       </li>
//                       <li>
//                         <span>Nome:</span> <strong>{tokenName}</strong>
//                       </li>
//                       <li>
//                         <span>Ticker:</span> <strong>{ticker}</strong>
//                       </li>
//                     </ul>

//                     <h4>Frase curta</h4>
//                     <p>{headline || "Você ainda não definiu a frase curta."}</p>
//                   </div>

//                   <div className="creator-summary-block">
//                     <h3>Narrativa</h3>
//                     <p className="creator-summary-story">
//                       {story
//                         ? story
//                         : "Você ainda não escreveu a narrativa. Volte e explique por que esse token existe."}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="creator-summary-block" style={{ marginTop: "10px" }}>
//                   <h3>Link da Arena (exemplo visual)</h3>
//                   <p className="creator-summary-url">{tokenUrl}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Direita – pagamento & risco */}
//             <aside className="creator-preview-side">
//               <div className="creator-card">
//                 <div className="section-label">Pagamento & compromisso</div>
//                 <h2 className="section-title">Taxa 3ustaquio & riscos</h2>

//                 <div className="creator-summary-block">
//                   <h3>Resumo financeiro</h3>
//                   <ul>
//                     <li>
//                       <span>Taxa 3ustaquio:</span> <strong>R$ 199,00</strong>
//                     </li>
//                     <li>
//                       <span>Custos de rede (estimado):</span> <strong>R$ 12,00</strong>
//                     </li>
//                     <li>
//                       <span>Total:</span> <strong>R$ 211,00</strong>
//                     </li>
//                   </ul>
//                   <p className="field-help">
//                     Taxa de infraestrutura e listagem. Não é taxa de gestão de investimento.
//                   </p>
//                 </div>

//                 <div className="creator-risk-box" style={{ marginTop: "10px" }}>
//                   <p>
//                     Ao lançar, você está criando um token <strong>especulativo</strong>, não um
//                     investimento seguro. Ninguém tem garantia de retorno.
//                   </p>

//                   <label className="creator-risk-check">
//                     <input
//                       type="checkbox"
//                       checked={aceito}
//                       onChange={(e) => setAceito(e.target.checked)}
//                     />
//                     <span>
//                       Eu entendo que este token não é investimento seguro, que o preço pode ir a zero
//                       e que o 3ustaquio é infraestrutura de código, não banco/corretora.
//                     </span>
//                   </label>
//                 </div>

//                 {erro && (
//                   <p
//                     className="cta-note"
//                     style={{ color: "var(--accent-primary)", marginTop: 8 }}
//                   >
//                     {erro}
//                   </p>
//                 )}

//                 <button
//                   type="button"
//                   className="btn-primary creator-nav-btn"
//                   disabled={!aceito || loading}
//                   onClick={handleLaunch}
//                   style={{ marginTop: "14px" }}
//                 >
//                   {loading
//                     ? "Lançando token..."
//                     : "Entendo o risco e quero lançar meu token"}
//                 </button>
//               </div>
//             </aside>
//           </section>
//         </div>
//         <Footer3ustaquio />
//       </main>
//     </>
//   );
// }
// app/criador/token/checkout/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";
import { supabase } from "../../../lib/supabaseClient";

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

export default function CheckoutTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Dados enviados da etapa anterior
  const tokenType = (searchParams.get("type") || "") as TokenType;
  const publicName = searchParams.get("publicName") || "";
  const tokenName = searchParams.get("tokenName") || "";
  const ticker = searchParams.get("ticker") || "";
  const headline = searchParams.get("headline") || "";
  const story = searchParams.get("story") || "";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ✅ Aqui é onde estava quebrando: supabase.auth tem que existir
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          setAuthError(
            "Você precisa estar logado para finalizar o lançamento do token."
          );
          setLoading(false);
          return;
        }

        setUserEmail(data.user.email ?? null);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar usuário no Supabase:", err);
        setAuthError(
          "Não foi possível validar seu login. Tente recarregar a página ou entrar novamente."
        );
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleConfirmLaunch = async () => {
    // aqui depois você chama uma route handler (API) ou RPC para:
    // - criar coin em `coins`
    // - criar pool wallet
    // - chamar init_coin_market_state
    // - etc.
    alert("Aqui entra a chamada para criar a moeda no banco (coins / AMM).");
  };

  if (loading) {
    return (
      <>
        <Header3ustaquio />
        <main className="creator-screen">
          <div className="container creator-shell">
            <p>Carregando informações de autenticação...</p>
          </div>
          <Footer3ustaquio />
        </main>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Header3ustaquio />
        <main className="creator-screen">
          <div className="container creator-shell">
            <div className="creator-card">
              <h1 className="section-title">Login necessário</h1>
              <p className="section-subtitle">{authError}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => router.push("/login")}
              >
                Entrar na Arena
              </button>
            </div>
          </div>
          <Footer3ustaquio />
        </main>
      </>
    );
  }

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Jornada do Criador</span>
            <h1 className="creator-title">
              Revisar & lançar <span>seu token de narrativa</span>
            </h1>
            <p className="creator-subtitle">
              Última etapa antes da Arena. Revise o que você está lançando e confirme
              que entende o risco. Nenhuma promessa de retorno, nenhum conto de fada.
            </p>
          </header>

          <section className="creator-main">
            <div className="creator-form-side">
              <div className="creator-card">
                <div className="section-label">Passo – Pagar taxa & lançar</div>
                <h2 className="section-title">Resumo do token</h2>

                <div className="creator-summary-block">
                  <p>
                    <strong>Tipo:</strong> {tokenType || "Não informado"}
                  </p>
                  <p>
                    <strong>Nome público:</strong> {publicName}
                  </p>
                  <p>
                    <strong>Nome do token:</strong> {tokenName}
                  </p>
                  <p>
                    <strong>Ticker:</strong> {ticker}
                  </p>
                  <p>
                    <strong>Frase curta:</strong> {headline}
                  </p>
                </div>

                <div className="creator-summary-block">
                  <h3 className="creator-summary-title">Narrativa completa</h3>
                  <p className="creator-summary-text">{story}</p>
                </div>

                <div className="creator-summary-block">
                  <h3 className="creator-summary-title">Dados da conta</h3>
                  <p className="creator-summary-text">
                    Você está lançando esse token logado como:
                    <br />
                    <strong>{userEmail || "usuário sem e-mail visível"}</strong>
                  </p>
                </div>

                <div className="creator-risk-box">
                  <p>
                    <strong>Confirmação final de risco:</strong> ao continuar, você reafirma que
                    este token é especulativo, pode não ter utilidade prática e pode valer zero.
                    Você é criador de narrativa, não gerente de investimento.
                  </p>
                </div>

                {/* Aqui depois você adiciona os detalhes de taxa (valores reais) */}
                <div className="creator-summary-block">
                  <h3 className="creator-summary-title">Taxa 3ustaquio (simulada)</h3>
                  <p className="creator-summary-text">
                    Taxa de criação e listagem na Arena: <strong>R$ 99,00</strong> (exemplo).  
                    Valores reais serão definidos na integração com o meio de pagamento.
                  </p>
                </div>

                <div className="creator-footer">
                  <div className="creator-footer-left">
                    <p className="creator-footer-hint">
                      Ao confirmar, você não está prometendo retorno para ninguém. Você está
                      lançando um experimento de narrativa de alto risco.
                    </p>
                  </div>
                  <div className="creator-footer-right">
                    <button
                      type="button"
                      className="btn-primary creator-nav-btn"
                      onClick={handleConfirmLaunch}
                    >
                      Entendo o risco e quero lançar meu token
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita - poderia ser um preview resumido / card da Arena */}
            <aside className="creator-preview-side">
              <div className="creator-preview-card">
                <div className="creator-preview-header">
                  <span className="creator-preview-pill">Preview na Arena</span>
                  <span className="creator-preview-status">
                    Alto risco · Especulação consciente
                  </span>
                </div>

                <div className="creator-preview-main">
                  <div className="creator-preview-title-row">
                    <h3 className="creator-preview-title">
                      {tokenName || "Seu token aqui"}
                    </h3>
                    <span className="creator-preview-ticker">
                      {ticker || "TICKER"}
                    </span>
                  </div>

                  <p className="creator-preview-creator">
                    por <strong>{publicName || "Criador anônimo"}</strong>
                  </p>

                  <p className="creator-preview-headline">{headline}</p>

                  <div className="creator-preview-riskband">
                    <span className="creator-preview-riskdot" />
                    <span>
                      Não é produto financeiro regulado. Preço pode ir a zero. Entre por conta e risco.
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>

        <Footer3ustaquio />
      </main>
    </>
  );
}
