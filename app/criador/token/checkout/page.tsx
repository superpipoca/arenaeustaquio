// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Header3ustaquio from "@/app/componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "@/app/componentes/ui/layout/Footer3ustaquio";
// import { supabase } from "../../../lib/supabaseClient";
// import { createPixCharge } from "../../../lib/pixPayment";
// import { launchTokenAfterPix } from "@/app/lib/launchToken";

// type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

// const LAUNCH_FEE = 19.9;

// // 🔢 Helper pra parsear números vindos da URL
// function parseNumberParam(raw: string | null): number {
//   if (!raw) return NaN;
//   const normalized = raw
//     .trim()
//     .replace(/\s/g, "")
//     // se em algum momento vier "1.000.000" ou "1,000,000"
//     .replace(/\./g, "")
//     .replace(/,/g, ".");
//   const n = Number(normalized);
//   return Number.isFinite(n) ? n : NaN;
// }

// export default function CriadorTokenCheckoutPage() {
//   const router = useRouter();
//   const search = useSearchParams();

//   // Dados vindos da tela anterior
//   const tokenType = (search.get("type") as TokenType) || "";
//   const publicName = search.get("publicName") || "";
//   const tokenName = search.get("tokenName") || "";
//   const ticker = search.get("ticker") || "";
//   const headline = search.get("headline") || "";
//   const story = search.get("story") || "";

//   // 👇 supply/pool/face vindos da URL
//   // tenta primeiro "totalSupply"; se não tiver, aceita "initialSupply" pra não quebrar fluxo antigo
//   const totalSupplyParam =
//     search.get("totalSupply") ?? search.get("initialSupply");
//   const poolPercentParam = search.get("poolPercent");
//   const faceValueParam = search.get("faceValue");

//   const totalSupply = parseNumberParam(totalSupplyParam);
//   const poolPercent = parseNumberParam(poolPercentParam);
//   const faceValue = parseNumberParam(faceValueParam);

//   const supplyConfigValid =
//     Number.isFinite(totalSupply) &&
//     totalSupply > 0 &&
//     Number.isFinite(poolPercent) &&
//     poolPercent > 0 &&
//     poolPercent <= 100 &&
//     Number.isFinite(faceValue) &&
//     faceValue > 0;

//   console.log("[CHECKOUT] supply/pool/face params brutos", {
//     totalSupplyParam,
//     poolPercentParam,
//     faceValueParam,
//   });

//   console.log("[CHECKOUT] supply/pool/face parseados", {
//     totalSupply,
//     poolPercent,
//     faceValue,
//     supplyConfigValid,
//   });

//   console.log("[CHECKOUT] Params lidos da URL:", {
//     tokenType,
//     publicName,
//     tokenName,
//     ticker,
//     totalSupply,
//     poolPercent,
//     faceValue,
//   });

//   // Dados do pagador
//   const [cpf, setCpf] = useState("");
//   const [nome, setNome] = useState(publicName);
//   const [email, setEmail] = useState("");

//   // Estado de PIX
//   const [generating, setGenerating] = useState(false);
//   const [pixData, setPixData] = useState<any | null>(null);
//   const [pixError, setPixError] = useState<string | null>(null);

//   // Estado do lançamento
//   const [launching, setLaunching] = useState(false);
//   const [launchError, setLaunchError] = useState<string | null>(null);

//   // Estado de fluxo
//   const [step, setStep] = useState<"REVIEW" | "PIX">("REVIEW");

//   // Tenta puxar e-mail do usuário logado pra facilitar
//   useEffect(() => {
//     let cancelled = false;

//     async function loadUserEmail() {
//       const { data, error } = await supabase.auth.getUser();
//       if (error || !data?.user || cancelled) return;

//       const userEmail =
//         data.user.email ||
//         (Array.isArray(data.user.identities) &&
//           data.user.identities[0]?.email) ||
//         "";

//       if (!cancelled && userEmail) {
//         setEmail(userEmail);
//       }
//     }

//     loadUserEmail();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const typeLabel =
//     tokenType === "PESSOA"
//       ? "Token de Pessoa"
//       : tokenType === "PROJETO"
//       ? "Token de Projeto"
//       : tokenType === "COMUNIDADE"
//       ? "Token de Comunidade"
//       : "Token de Narrativa";

//   const tokenUrl = `https://app.3ustaquio.com/criador/token/${(ticker || "TOKEN")
//     .toLowerCase()
//     .replace(/\s+/g, "")}`;

//   function mascararCpf(v: string) {
//     let value = v.replace(/\D/g, "").slice(0, 11);
//     if (value.length >= 3) value = value.replace(/(\d{3})(\d)/, "$1.$2");
//     if (value.length >= 7)
//       value = value.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
//     if (value.length >= 11)
//       value = value.replace(
//         /(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
//         "$1.$2.$3-$4"
//       );
//     return value;
//   }

//   function cpfValido(cpf: string) {
//     const clean = cpf.replace(/\D/g, "");
//     return clean.length === 11;
//   }

//   const canGeneratePix =
//     !!nome.trim() && !!email.trim() && cpfValido(cpf) && !generating;

//   const handleGeneratePix = async () => {
//     if (!canGeneratePix) return;

//     try {
//       setGenerating(true);
//       setPixError(null);

//       console.log("[CHECKOUT] Gerando PIX com payload:", {
//         value: LAUNCH_FEE,
//         cpf,
//         name: nome.trim(),
//         email: email.trim(),
//         tokenName,
//         ticker,
//       });

//       const response = await createPixCharge({
//         value: LAUNCH_FEE,
//         cpf,
//         name: nome.trim(),
//         email: email.trim(),
//         description: `Taxa de criação do token ${tokenName || ticker}`,
//         metadata: {
//           tokenType,
//           publicName,
//           tokenName,
//           ticker,
//         },
//       });

//       console.log("[CHECKOUT] Resposta PIX:", response);
//       setPixData(response);
//       setStep("PIX");
//     } catch (err: any) {
//       console.error("Erro ao gerar PIX:", err);
//       setPixError(
//         err?.message ||
//           "Não foi possível gerar o PIX. Tente novamente em alguns instantes."
//       );
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const handleCopyCode = () => {
//     if (!pixData) return;

//     const firstTx = pixData?.Charge?.Transactions?.[0];
//     const copyCode = firstTx?.Pix?.qrCode || "";

//     if (!copyCode) return;

//     navigator.clipboard
//       .writeText(copyCode)
//       .catch((err) => console.error("Erro ao copiar PIX:", err));
//   };

//   const handleFinishLaunch = async () => {
//     if (!pixData) {
//       setLaunchError("Gere e pague o PIX antes de lançar o token.");
//       return;
//     }

//     if (!supplyConfigValid) {
//       console.warn(
//         "[CHECKOUT] Configuração de supply/pool/face inválida no checkout",
//         {
//           totalSupply,
//           poolPercent,
//           faceValue,
//         }
//       );
//       setLaunchError(
//         "Configuração de supply/pool/face não encontrada. Volte e revise os dados do token."
//       );
//       return;
//     }

//     try {
//       setLaunching(true);
//       setLaunchError(null);

//       console.log("[CHECKOUT] Chamando launchTokenAfterPix com:", {
//         tokenType,
//         publicName,
//         tokenName,
//         ticker,
//         headline,
//         story,
//         totalSupply,
//         poolPercent,
//         faceValue,
//       });

//       const { slug } = await launchTokenAfterPix({
//         tokenType,
//         publicName,
//         tokenName,
//         ticker,
//         headline,
//         story,
//         totalSupply,
//         poolPercent,
//         faceValue,
//         pixData,
//       });

//       console.log("[CHECKOUT] Token lançado, redirecionando para slug:", slug);
//       router.push(`/criador/token/${slug}?novo=1`);
//     } catch (err: any) {
//       console.error("[CHECKOUT] Erro ao lançar token depois do PIX:", err);
//       setLaunchError(
//         err?.message ||
//           "Erro ao lançar o token depois do pagamento. Tente novamente."
//       );
//     } finally {
//       setLaunching(false);
//     }
//   };

//   // tenta achar imagem do QR Code via URL
//   const qrCodeImageUrl =
//     pixData?.Charge?.Transactions?.[0]?.Pix?.image || null;

//   return (
//     <>
//       <Header3ustaquio />
//       <main className="creator-screen">
//         <div className="container creator-shell">
//           <header className="creator-header">
//             <span className="creator-kicker">
//               Passo – Pagamento & Lançamento
//             </span>
//             <h1 className="creator-title">
//               Revise seu <span>token</span> e gere o PIX
//             </h1>
//             <p className="creator-subtitle">
//               Antes de entrar na Arena, você paga a taxa de criação. Nada aqui
//               é promessa de retorno. É o preço para ligar a máquina da
//               narrativa.
//             </p>
//           </header>

//           <section className="creator-main">
//             {/* Coluna esquerda – resumo do token */}
//             <div className="creator-form-side">
//               <div className="creator-card">
//                 <div className="section-label">Resumo do token</div>
//                 <h2 className="section-title">
//                   Confere se está tudo na linha vermelha certa
//                 </h2>
//                 <p className="section-subtitle">
//                   Este é o rascunho do seu token de narrativa. Ele só vai para
//                   a Arena depois da cobrança via PIX e das próximas
//                   confirmações.
//                 </p>

//                 <div className="creator-summary">
//                   <p>
//                     <strong>Tipo:</strong> {typeLabel}
//                   </p>
//                   <p>
//                     <strong>Nome público:</strong> {publicName || "—"}
//                   </p>
//                   <p>
//                     <strong>Nome do token:</strong> {tokenName || "—"}
//                   </p>
//                   <p>
//                     <strong>Ticker:</strong> {ticker || "—"}
//                   </p>
//                   <p>
//                     <strong>Headline:</strong>{" "}
//                     {headline || "Sem frase definida ainda."}
//                   </p>
//                   <p>
//                     <strong>História:</strong>{" "}
//                     {story || "Sem narrativa longa definida ainda."}
//                   </p>
//                   <p>
//                     <strong>Supply total:</strong>{" "}
//                     {Number.isFinite(totalSupply)
//                       ? totalSupply.toLocaleString("pt-BR")
//                       : "—"}
//                   </p>
//                   <p>
//                     <strong>Pool de lançamento:</strong>{" "}
//                     {Number.isFinite(poolPercent)
//                       ? `${poolPercent}%`
//                       : "—"}
//                   </p>
//                   <p>
//                     <strong>Valor de face inicial:</strong>{" "}
//                     {Number.isFinite(faceValue)
//                       ? `R$ ${faceValue.toFixed(2)}`
//                       : "—"}
//                   </p>
//                 </div>

//                 <div className="warning-strip" style={{ marginTop: 16 }}>
//                   <strong>Lembra:</strong> este token não é investimento
//                   seguro, não é produto financeiro regulado e pode valer zero.
//                   Se isso incomoda, é melhor não lançar.
//                 </div>
//               </div>
//             </div>

//             {/* Coluna direita – dados do pagador + PIX */}
//             <aside className="creator-preview-side">
//               <div className="creator-card">
//                 {step === "REVIEW" && (
//                   <>
//                     <div className="section-label">Dados para o PIX</div>
//                     <h2 className="section-title">
//                       Quem está pagando a taxa?
//                     </h2>
//                     <p className="section-subtitle">
//                       Esses dados vão para o provedor de pagamento (Celcoin)
//                       para emitir o PIX. Nada disso transforma o token em
//                       “investimento regulado”.
//                     </p>

//                     <div className="creator-field-group">
//                       <label className="field-label">Nome completo</label>
//                       <input
//                         className="field-input"
//                         value={nome}
//                         onChange={(e) => setNome(e.target.value)}
//                         placeholder="Seu nome completo"
//                       />
//                     </div>

//                     <div className="creator-field-group">
//                       <label className="field-label">E-mail</label>
//                       <input
//                         className="field-input"
//                         type="email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         placeholder="seuemail@exemplo.com"
//                       />
//                     </div>

//                     <div className="creator-field-group">
//                       <label className="field-label">CPF</label>
//                       <input
//                         className="field-input"
//                         value={cpf}
//                         onChange={(e) => setCpf(mascararCpf(e.target.value))}
//                         placeholder="000.000.000-00"
//                       />
//                       <p className="field-help">
//                         Usado apenas para emissão da cobrança via PIX.
//                       </p>
//                     </div>

//                     {pixError && (
//                       <p
//                         className="cta-note"
//                         style={{
//                           color: "var(--accent-primary)",
//                           marginTop: 8,
//                         }}
//                       >
//                         {pixError}
//                       </p>
//                     )}

//                     <div
//                       className="creator-footer"
//                       style={{ marginTop: 16 }}
//                     >
//                       <div className="creator-footer-left">
//                         <p className="creator-footer-hint">
//                           Taxa de criação do token:{" "}
//                           <strong>R$ {LAUNCH_FEE.toFixed(2)}</strong>
//                         </p>
//                       </div>
//                       <div className="creator-footer-right">
//                         <button
//                           type="button"
//                           className="btn-primary creator-nav-btn"
//                           disabled={!canGeneratePix}
//                           onClick={handleGeneratePix}
//                         >
//                           {generating
//                             ? "Gerando PIX..."
//                             : "Gerar QR Code PIX"}
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}

//                 {step === "PIX" && pixData && (
//                   <>
//                     <div className="section-label">Pagamento via PIX</div>
//                     <h2 className="section-title">
//                       Escaneia, paga e volta pra Arena
//                     </h2>
//                     <p className="section-subtitle">
//                       Use o QR Code ou o código copia-e-cola no seu app de
//                       banco. Depois do pagamento, clique em “Já paguei, seguir
//                       para a Arena”.
//                     </p>

//                     <div className="pix-box">
//                       {qrCodeImageUrl ? (
//                         <div className="pix-qr-wrapper">
//                           <img
//                             src={qrCodeImageUrl}
//                             alt="QR Code PIX"
//                             className="pix-qr-image"
//                           />
//                         </div>
//                       ) : (
//                         <p className="cta-note">
//                           QR Code não retornado pelo gateway. Use o código
//                           copia-e-cola abaixo.
//                         </p>
//                       )}

//                       <button
//                         type="button"
//                         className="btn-outline"
//                         style={{ marginTop: 12 }}
//                         onClick={handleCopyCode}
//                       >
//                         Copiar código PIX
//                       </button>
//                     </div>

//                     {launchError && (
//                       <p
//                         className="cta-note"
//                         style={{
//                           color: "var(--accent-primary)",
//                           marginTop: 8,
//                         }}
//                       >
//                         {launchError}
//                       </p>
//                     )}

//                     <div
//                       className="creator-footer"
//                       style={{ marginTop: 16 }}
//                     >
//                       <div className="creator-footer-left">
//                         <p className="creator-footer-hint">
//                           Depois do pagamento, clique abaixo. No MVP, a
//                           confirmação é manual.
//                         </p>
//                       </div>
//                       <div className="creator-footer-right">
//                         <button
//                           type="button"
//                           className="btn-primary creator-nav-btn"
//                           onClick={handleFinishLaunch}
//                           disabled={launching}
//                         >
//                           {launching
//                             ? "Lançando token..."
//                             : "Já paguei, seguir para a Arena"}
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>

//               <div
//                 className="creator-preview-card"
//                 style={{ marginTop: 16 }}
//               >
//                 <div className="creator-preview-header">
//                   <span className="creator-preview-pill">{typeLabel}</span>
//                   <span className="creator-preview-status">
//                     Pré-lançamento
//                   </span>
//                 </div>

//                 <div className="creator-preview-main">
//                   <div className="creator-preview-title-row">
//                     <h3 className="creator-preview-title">
//                       {tokenName || "Seu token aqui"}
//                     </h3>
//                     <span className="creator-preview-ticker">
//                       {ticker || "TICKER"}
//                     </span>
//                   </div>

//                   <p className="creator-preview-creator">
//                     por{" "}
//                     <strong>{publicName || "Criador anônimo"}</strong>
//                   </p>

//                   <p className="creator-preview-headline">
//                     {headline ||
//                       "Escreva uma frase curta explicando que isso é jogo de narrativa de alto risco, não promessa de retorno."}
//                   </p>

//                   <div className="creator-preview-riskband">
//                     <span className="creator-preview-riskdot" />
//                     <span>
//                       Não é produto financeiro regulado. Preço pode ir a zero.
//                       Entre por conta e risco.
//                     </span>
//                   </div>
//                 </div>

//                 <div className="creator-preview-footer">
//                   <span className="creator-preview-link-label">
//                     Link da Arena (simulado)
//                   </span>
//                   <span className="creator-preview-link">{tokenUrl}</span>
//                 </div>
//               </div>
//             </aside>
//           </section>
//         </div>
//         <Footer3ustaquio />
//       </main>
//     </>
//   );
// }
// app/criador/token/checkout/page.tsx (ou onde estiver esse arquivo)
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header3ustaquio from "@/app/componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "@/app/componentes/ui/layout/Footer3ustaquio";
import { useAuth, useUser, useSession } from "@clerk/nextjs";
import { createPixCharge } from "../../../lib/pixPayment";
import { launchTokenAfterPix } from "@/app/lib/launchToken";

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

const LAUNCH_FEE = 19.9;

// 🔢 Helper pra parsear números vindos da URL
function parseNumberParam(raw: string | null): number {
  if (!raw) return NaN;
  const normalized = raw
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export default function CriadorTokenCheckoutPage() {
  const router = useRouter();
  const search = useSearchParams();

  // ===== Clerk =====
  const {
    isLoaded: authLoaded,
    isSignedIn,
    getToken,
    userId,
    sessionId,
  } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: sessionLoaded, session } = useSession();

  // ===== Params vindos da tela anterior =====
  const tokenType = (search.get("type") as TokenType) || "";
  const publicName = search.get("publicName") || "";
  const tokenName = search.get("tokenName") || "";
  const ticker = search.get("ticker") || "";
  const headline = search.get("headline") || "";
  const story = search.get("story") || "";

  const totalSupplyParam =
    search.get("totalSupply") ?? search.get("initialSupply");
  const poolPercentParam = search.get("poolPercent");
  const faceValueParam = search.get("faceValue");

  const totalSupply = parseNumberParam(totalSupplyParam);
  const poolPercent = parseNumberParam(poolPercentParam);
  const faceValue = parseNumberParam(faceValueParam);

  const supplyConfigValid =
    Number.isFinite(totalSupply) &&
    totalSupply > 0 &&
    Number.isFinite(poolPercent) &&
    poolPercent > 0 &&
    poolPercent <= 100 &&
    Number.isFinite(faceValue) &&
    faceValue > 0;

  // ===== Gate de Auth =====
  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) router.replace("/login");
  }, [authLoaded, isSignedIn, router]);

  // ===== Dados do pagador =====
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState(publicName);
  const [email, setEmail] = useState("");

  // Autofill com Clerk (nome/email)
  useEffect(() => {
    if (!userLoaded || !user) return;

    const uEmail = user.primaryEmailAddress?.emailAddress ?? "";
    const uName =
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      publicName ??
      "";

    setEmail((prev) => prev || uEmail);
    setNome((prev) => prev || uName);
  }, [userLoaded, user, publicName]);

  // ===== Estado PIX =====
  const [generating, setGenerating] = useState(false);
  const [pixData, setPixData] = useState<any | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);

  // ===== Estado lançamento =====
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // ===== Fluxo =====
  const [step, setStep] = useState<"REVIEW" | "PIX">("REVIEW");

  const typeLabel = useMemo(() => {
    return tokenType === "PESSOA"
      ? "Token de Pessoa"
      : tokenType === "PROJETO"
      ? "Token de Projeto"
      : tokenType === "COMUNIDADE"
      ? "Token de Comunidade"
      : "Token de Narrativa";
  }, [tokenType]);

  const tokenUrl = useMemo(() => {
    return `https://app.3ustaquio.com/criador/token/${(ticker || "TOKEN")
      .toLowerCase()
      .replace(/\s+/g, "")}`;
  }, [ticker]);

  const mascararCpf = (v: string) => {
    let value = v.replace(/\D/g, "").slice(0, 11);
    if (value.length >= 3) value = value.replace(/(\d{3})(\d)/, "$1.$2");
    if (value.length >= 7)
      value = value.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (value.length >= 11)
      value = value.replace(
        /(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
        "$1.$2.$3-$4"
      );
    return value;
  };

  const cpfValido = (cpfValue: string) => {
    const clean = cpfValue.replace(/\D/g, "");
    return clean.length === 11;
  };

  const canGeneratePix =
    supplyConfigValid &&
    !!nome.trim() &&
    !!email.trim() &&
    cpfValido(cpf) &&
    !generating &&
    step === "REVIEW" &&
    !!sessionId;

  const handleGeneratePix = useCallback(async () => {
    if (!canGeneratePix) return;

    try {
      setGenerating(true);
      setPixError(null);

      const response = await createPixCharge({
        value: LAUNCH_FEE,
        cpf,
        name: nome.trim(),
        email: email.trim(),
        description: `Taxa de criação do token ${tokenName || ticker}`,
        metadata: {
          tokenType,
          publicName,
          tokenName,
          ticker,
          clerkUserId: userId,
          clerkSessionId: sessionId,
          clerkSessionStatus: session?.status,
        },
      });

      setPixData(response);
      setStep("PIX");
    } catch (err: any) {
      console.error("Erro ao gerar PIX:", err);
      setPixError(
        err?.message ||
          "Não foi possível gerar o PIX. Tente novamente em alguns instantes."
      );
    } finally {
      setGenerating(false);
    }
  }, [
    canGeneratePix,
    cpf,
    nome,
    email,
    tokenName,
    ticker,
    tokenType,
    publicName,
    userId,
    sessionId,
    session?.status,
  ]);

  const handleCopyCode = useCallback(() => {
    if (!pixData) return;

    const firstTx = pixData?.Charge?.Transactions?.[0];
    const copyCode: string = firstTx?.Pix?.qrCode || "";
    if (!copyCode) return;

    navigator.clipboard
      .writeText(copyCode)
      .catch((err) => console.error("Erro ao copiar PIX:", err));
  }, [pixData]);

  const handleFinishLaunch = async () => {
    if (!pixData) {
      setLaunchError("Gere e pague o PIX antes de lançar o token.");
      return;
    }

    if (!supplyConfigValid) {
      setLaunchError(
        "Configuração de supply/pool/face não encontrada. Volte e revise os dados do token."
      );
      return;
    }

    try {
      setLaunching(true);
      setLaunchError(null);

      // ✅ Pega token do Clerk com fallback caso template não exista
      let clerkToken: string | undefined;
      try {
        clerkToken = (await getToken({ template: "supabase" })) ?? undefined;
      } catch (e: any) {
        const code = e?.errors?.[0]?.code;
        if (code === "resource_not_found") {
          // template "supabase" não existe -> usa token default
          clerkToken = (await getToken()) ?? undefined;
        } else {
          throw e;
        }
      }

      if (!clerkToken) {
        throw new Error(
          "Não foi possível obter seu token de sessão. Faça login de novo."
        );
      }

      const { slug } = await launchTokenAfterPix({
        tokenType,
        publicName,
        tokenName,
        ticker,
        headline,
        story,
        totalSupply,
        poolPercent,
        faceValue,
        pixData,
        clerkToken,
        clerkSessionId: sessionId,
        clerkUserId: userId,
      });

      router.push(`/criador/token/${slug}?novo=1`);
    } catch (err: any) {
      console.error("[CHECKOUT] Erro ao lançar token depois do PIX:", err);
      setLaunchError(
        err?.message ||
          "Erro ao lançar o token depois do pagamento. Tente novamente."
      );
    } finally {
      setLaunching(false);
    }
  };

  const qrCodeImageUrl: string | null =
    pixData?.Charge?.Transactions?.[0]?.Pix?.image ?? null;

  // ===== Fullscreen loader enquanto Clerk carrega =====
  if (!authLoaded || !userLoaded || !sessionLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="animate-pulse text-neutral-500">
          Verificando credenciais...
        </div>
      </div>
    );
  }

  // Se não está logado, effect já mandou pra /login
  if (!isSignedIn) return null;

  return (
    <>
      <Header3ustaquio />

      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">
              Passo – Pagamento &amp; Lançamento
            </span>
            <h1 className="creator-title">
              Revise seu <span>token</span> e gere o PIX
            </h1>
            <p className="creator-subtitle">
              Antes de entrar na Arena, você paga a taxa de criação. Nada aqui é
              promessa de retorno. É o preço para ligar a máquina da narrativa.
            </p>
          </header>

          <section className="creator-main">
            {/* Coluna esquerda – resumo do token */}
            <div className="creator-form-side">
              <div className="creator-card">
                <div className="section-label">Resumo do token</div>
                <h2 className="section-title">
                  Confere se está tudo na linha vermelha certa
                </h2>
                <p className="section-subtitle">
                  Este é o rascunho do seu token de narrativa. Ele só vai para a
                  Arena depois da cobrança via PIX e das próximas confirmações.
                </p>

                <div className="creator-summary">
                  <p>
                    <strong>Tipo:</strong> {typeLabel}
                  </p>
                  <p>
                    <strong>Nome público:</strong> {publicName || "—"}
                  </p>
                  <p>
                    <strong>Nome do token:</strong> {tokenName || "—"}
                  </p>
                  <p>
                    <strong>Ticker:</strong> {ticker || "—"}
                  </p>
                  <p>
                    <strong>Headline:</strong>{" "}
                    {headline || "Sem frase definida ainda."}
                  </p>
                  <p>
                    <strong>História:</strong>{" "}
                    {story || "Sem narrativa longa definida ainda."}
                  </p>
                  <p>
                    <strong>Supply total:</strong>{" "}
                    {Number.isFinite(totalSupply)
                      ? totalSupply.toLocaleString("pt-BR")
                      : "—"}
                  </p>
                  <p>
                    <strong>Pool de lançamento:</strong>{" "}
                    {Number.isFinite(poolPercent) ? `${poolPercent}%` : "—"}
                  </p>
                  <p>
                    <strong>Valor de face inicial:</strong>{" "}
                    {Number.isFinite(faceValue)
                      ? `R$ ${faceValue.toFixed(2)}`
                      : "—"}
                  </p>
                </div>

                {!supplyConfigValid && (
                  <div className="warning-strip" style={{ marginTop: 12 }}>
                    Configuração econômica inválida/ausente. Volte e preencha
                    Supply, % Pool e Valor de face.
                  </div>
                )}

                <div className="warning-strip" style={{ marginTop: 16 }}>
                  <strong>Lembra:</strong> este token não é investimento seguro,
                  não é produto financeiro regulado e pode valer zero. Se isso
                  incomoda, é melhor não lançar.
                </div>
              </div>
            </div>

            {/* Coluna direita – dados do pagador + PIX */}
            <aside className="creator-preview-side">
              <div className="creator-card">
                {step === "REVIEW" && (
                  <>
                    <div className="section-label">Dados para o PIX</div>
                    <h2 className="section-title">Quem está pagando a taxa?</h2>
                    <p className="section-subtitle">
                      Esses dados vão para o provedor de pagamento (Celcoin)
                      para emitir o PIX. Nada disso transforma o token em
                      “investimento regulado”.
                    </p>

                    <div className="creator-field-group">
                      <label className="field-label">Nome completo</label>
                      <input
                        className="field-input"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="creator-field-group">
                      <label className="field-label">E-mail</label>
                      <input
                        className="field-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                      />
                    </div>

                    <div className="creator-field-group">
                      <label className="field-label">CPF</label>
                      <input
                        className="field-input"
                        value={cpf}
                        onChange={(e) => setCpf(mascararCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                      <p className="field-help">
                        Usado apenas para emissão da cobrança via PIX.
                      </p>
                    </div>

                    {pixError && (
                      <p
                        className="cta-note"
                        style={{
                          color: "var(--accent-primary)",
                          marginTop: 8,
                        }}
                      >
                        {pixError}
                      </p>
                    )}

                    <div className="creator-footer" style={{ marginTop: 16 }}>
                      <div className="creator-footer-left">
                        <p className="creator-footer-hint">
                          Taxa de criação do token:{" "}
                          <strong>R$ {LAUNCH_FEE.toFixed(2)}</strong>
                        </p>
                      </div>
                      <div className="creator-footer-right">
                        <button
                          type="button"
                          className="btn-primary creator-nav-btn"
                          disabled={!canGeneratePix}
                          onClick={handleGeneratePix}
                          title={
                            canGeneratePix
                              ? "Gerar PIX"
                              : "Preencha nome, email, CPF válido e garanta a config econômica"
                          }
                        >
                          {generating ? "Gerando PIX..." : "Gerar QR Code PIX"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {step === "PIX" && pixData && (
                  <>
                    <div className="section-label">Pagamento via PIX</div>
                    <h2 className="section-title">
                      Escaneia, paga e volta pra Arena
                    </h2>
                    <p className="section-subtitle">
                      Use o QR Code ou o código copia-e-cola no seu app de banco.
                      Depois do pagamento, clique em “Já paguei, seguir para a
                      Arena”.
                    </p>

                    <div className="pix-box">
                      {qrCodeImageUrl ? (
                        <div className="pix-qr-wrapper">
                          <img
                            src={qrCodeImageUrl}
                            alt="QR Code PIX"
                            className="pix-qr-image"
                          />
                        </div>
                      ) : (
                        <p className="cta-note">
                          QR Code não retornado pelo gateway. Use o código
                          copia-e-cola abaixo.
                        </p>
                      )}

                      <button
                        type="button"
                        className="btn-outline"
                        style={{ marginTop: 12 }}
                        onClick={handleCopyCode}
                      >
                        Copiar código PIX
                      </button>
                    </div>

                    {launchError && (
                      <p
                        className="cta-note"
                        style={{
                          color: "var(--accent-primary)",
                          marginTop: 8,
                        }}
                      >
                        {launchError}
                      </p>
                    )}

                    <div className="creator-footer" style={{ marginTop: 16 }}>
                      <div className="creator-footer-left">
                        <p className="creator-footer-hint">
                          Depois do pagamento, clique abaixo. No MVP, a
                          confirmação é manual.
                        </p>
                      </div>
                      <div className="creator-footer-right">
                        <button
                          type="button"
                          className="btn-primary creator-nav-btn"
                          onClick={handleFinishLaunch}
                          disabled={launching}
                        >
                          {launching
                            ? "Lançando token..."
                            : "Já paguei, seguir para a Arena"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="creator-preview-card" style={{ marginTop: 16 }}>
                <div className="creator-preview-header">
                  <span className="creator-preview-pill">{typeLabel}</span>
                  <span className="creator-preview-status">Pré-lançamento</span>
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

                  <p className="creator-preview-headline">
                    {headline ||
                      "Escreva uma frase curta explicando que isso é jogo de narrativa de alto risco, não promessa de retorno."}
                  </p>

                  <div className="creator-preview-riskband">
                    <span className="creator-preview-riskdot" />
                    <span>
                      Não é produto financeiro regulado. Preço pode ir a zero.
                      Entre por conta e risco.
                    </span>
                  </div>
                </div>

                <div className="creator-preview-footer">
                  <span className="creator-preview-link-label">
                    Link da Arena (simulado)
                  </span>
                  <span className="creator-preview-link">{tokenUrl}</span>
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
