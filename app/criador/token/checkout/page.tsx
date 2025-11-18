// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Header3ustaquio from "@/app/componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "@/app/componentes/ui/layout/Footer3ustaquio";
// import { supabase } from "../../../lib/supabaseClient";
// import { createPixCharge } from "../../../lib/pixPayment";

// type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

// const LAUNCH_FEE = 19.9; // 💰 taxa de criação do token (ajusta o valor aqui)

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

//   // Dados do pagador
//   const [cpf, setCpf] = useState("");
//   const [nome, setNome] = useState(publicName);
//   const [email, setEmail] = useState("");

//   // Estado de PIX
//   const [generating, setGenerating] = useState(false);
//   const [pixData, setPixData] = useState<any | null>(null);
//   const [pixError, setPixError] = useState<string | null>(null);

//   // Estado de fluxo
//   const [step, setStep] = useState<"REVIEW" | "PIX">("REVIEW");

//   // 🔎 Deriva as infos de PIX do retorno da Celcoin/GalaxPay
//   // Estrutura: { type: true, Charge: { ..., Transactions: [ { Pix: { ... } } ] } }
//   const pixInfo = pixData?.Charge?.Transactions?.[0]?.Pix ?? null;
//   const qrImageUrl: string | null = pixInfo?.image ?? null;
//   const pixCopyCode: string = pixInfo?.qrCode ?? "";
//   const pixPageUrl: string = pixInfo?.page ?? "";

//   // Tenta puxar e-mail do usuário logado pra facilitar
//   useEffect(() => {
//     let cancelled = false;

//     async function loadUserEmail() {
//       const { data, error } = await supabase.auth.getUser();
//       if (error || !data?.user || cancelled) return;

//       const userEmail =
//         data.user.email ||
//         (Array.isArray(data.user.identities) &&
//           (data.user.identities[0] as any)?.email) ||
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

//   const tokenUrl = `https://app.3ustaquio.com/token/${(ticker || "TOKEN")
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
//     // se quiser, depois coloca validação de dígito verificador
//   }

//   const canGeneratePix =
//     !!nome.trim() && !!email.trim() && cpfValido(cpf) && !generating;

//   const handleGeneratePix = async () => {
//     if (!canGeneratePix) return;

//     try {
//       setGenerating(true);
//       setPixError(null);

//       const response = await createPixCharge({
//         value: LAUNCH_FEE,
//         cpf,
//         name: nome.trim(),
//         email: email.trim(),
//         description: `Taxa de criação do token ${tokenName || ticker}`,
//       });

//       console.log("🔁 Resposta PIX:", response);
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
//     if (!pixCopyCode) return;

//     navigator.clipboard
//       .writeText(pixCopyCode)
//       .then(() => {
//         // opcional: feedback visual
//         console.log("Código PIX copiado com sucesso");
//       })
//       .catch((err) => console.error("Erro ao copiar PIX:", err));
//   };

//   const handleCopyLink = () => {
//     if (!pixPageUrl) return;

//     navigator.clipboard
//       .writeText(pixPageUrl)
//       .then(() => {
//         console.log("Link da página PIX copiado com sucesso");
//       })
//       .catch((err) => console.error("Erro ao copiar link PIX:", err));
//   };

//   const handleFinishLaunch = () => {
//     // aqui, por enquanto, só leva pro dashboard.
//     // depois você pluga a lógica de:
//     //  - conferir pagamento
//     //  - criar coin no banco
//     //  - redirecionar pra página do token
//     router.push("/criador/dashboard");
//   };

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
//               Antes de entrar na Arena, você paga a taxa de criação.
//               Nada aqui é promessa de retorno. É o preço para ligar a máquina da
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
//                   a Arena depois da cobrança via PIX e das próximas confirmações.
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
//                       Esses dados vão para o provedor de pagamento (Celcoin) para
//                       emitir o PIX. Nada disso transforma o token em “investimento
//                       regulado”.
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

//                     <div className="creator-footer" style={{ marginTop: 16 }}>
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
//                           {generating ? "Gerando PIX..." : "Gerar QR Code PIX"}
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
//                       Use o QR Code ou o código copia-e-cola no seu app de banco.
//                       Depois do pagamento, clique em “Já paguei, seguir para a
//                       Arena”.
//                     </p>

//                     <div className="pix-box">
//                       {qrImageUrl ? (
//                         <div className="pix-qr-wrapper">
//                           <img
//                             src={qrImageUrl}
//                             alt="QR Code PIX"
//                             className="pix-qr-image"
//                           />
//                         </div>
//                       ) : (
//                         <p className="cta-note">
//                           Não recebemos a imagem do QR Code. Use o código
//                           copia-e-cola abaixo ou o link da página.
//                         </p>
//                       )}

//                       {pixCopyCode && (
//                         <div style={{ marginTop: 16 }}>
//                           <label className="field-label">
//                             Código PIX (copia e cola)
//                           </label>
//                           <textarea
//                             className="field-textarea"
//                             rows={3}
//                             value={pixCopyCode}
//                             readOnly
//                           />
//                           <button
//                             type="button"
//                             className="btn-outline"
//                             style={{ marginTop: 8 }}
//                             onClick={handleCopyCode}
//                           >
//                             Copiar código PIX
//                           </button>
//                         </div>
//                       )}

//                       {pixPageUrl && (
//                         <div style={{ marginTop: 16 }}>
//                           <label className="field-label">
//                             Página da cobrança PIX
//                           </label>
//                           <p className="field-help">
//                             Se preferir, abra a página externa da cobrança:
//                           </p>
//                           <a
//                             href={pixPageUrl}
//                             target="_blank"
//                             rel="noreferrer"
//                             className="creator-preview-link"
//                           >
//                             Abrir página do PIX
//                           </a>
//                           <button
//                             type="button"
//                             className="btn-outline"
//                             style={{ marginTop: 8 }}
//                             onClick={handleCopyLink}
//                           >
//                             Copiar link da página
//                           </button>
//                         </div>
//                       )}
//                     </div>

//                     <div className="creator-footer" style={{ marginTop: 16 }}>
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
//                         >
//                           Já paguei, seguir para a Arena
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {/* Card de preview do token, igual ao da tela anterior (opcional) */}
//               <div className="creator-preview-card" style={{ marginTop: 16 }}>
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
//                     por <strong>{publicName || "Criador anônimo"}</strong>
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
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header3ustaquio from "@/app/componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "@/app/componentes/ui/layout/Footer3ustaquio";
import { supabase } from "../../../lib/supabaseClient";
import { createPixCharge } from "../../../lib/pixPayment";
// import { launchTokenAfterPix } from "../../../lib/launchTokenAfterPix";
import { launchTokenAfterPix } from "@/app/lib/launchToken";

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

const LAUNCH_FEE = 19.9;

export default function CriadorTokenCheckoutPage() {
  const router = useRouter();
  const search = useSearchParams();

  // Dados vindos da tela anterior
  const tokenType = (search.get("type") as TokenType) || "";
  const publicName = search.get("publicName") || "";
  const tokenName = search.get("tokenName") || "";
  const ticker = search.get("ticker") || "";
  const headline = search.get("headline") || "";
  const story = search.get("story") || "";

  // 👇 AGORA LEMOS supply/pool/face DA QUERY
  const totalSupplyParam = search.get("totalSupply");   // 👈 NOME TEM QUE SER "totalSupply"
  const poolPercentParam = search.get("poolPercent");
  const faceValueParam = search.get("faceValue");

  const totalSupply = totalSupplyParam ? Number(totalSupplyParam) : NaN;
  const poolPercent = poolPercentParam ? Number(poolPercentParam) : NaN;
  const faceValue = faceValueParam ? Number(faceValueParam) : NaN;

  const supplyConfigValid =
    Number.isFinite(totalSupply) &&
    totalSupply > 0 &&
    Number.isFinite(poolPercent) &&
    poolPercent > 0 &&
    poolPercent <= 100 &&
    Number.isFinite(faceValue) &&
    faceValue > 0;

  console.log("[CHECKOUT] supply/pool/face params brutos", {
    totalSupplyParam,
    poolPercentParam,
    faceValueParam,
  });

  console.log("[CHECKOUT] supply/pool/face parseados", {
    totalSupply,
    poolPercent,
    faceValue,
    supplyConfigValid,
  });


  console.log("[CHECKOUT] Params lidos da URL:", {
    tokenType,
    publicName,
    tokenName,
    ticker,
    totalSupply,
    poolPercent,
    faceValue,
  });

  // Dados do pagador
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState(publicName);
  const [email, setEmail] = useState("");

  // Estado de PIX
  const [generating, setGenerating] = useState(false);
  const [pixData, setPixData] = useState<any | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);

  // Estado do lançamento
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Estado de fluxo
  const [step, setStep] = useState<"REVIEW" | "PIX">("REVIEW");

  // Tenta puxar e-mail do usuário logado pra facilitar
  useEffect(() => {
    let cancelled = false;

    async function loadUserEmail() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user || cancelled) return;

      const userEmail =
        data.user.email ||
        (Array.isArray(data.user.identities) &&
          data.user.identities[0]?.email) ||
        "";

      if (!cancelled && userEmail) {
        setEmail(userEmail);
      }
    }

    loadUserEmail();

    return () => {
      cancelled = true;
    };
  }, []);

  const typeLabel =
    tokenType === "PESSOA"
      ? "Token de Pessoa"
      : tokenType === "PROJETO"
        ? "Token de Projeto"
        : tokenType === "COMUNIDADE"
          ? "Token de Comunidade"
          : "Token de Narrativa";

  const tokenUrl = `https://app.3ustaquio.com/token/${(ticker || "TOKEN")
    .toLowerCase()
    .replace(/\s+/g, "")}`;

  function mascararCpf(v: string) {
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
  }

  function cpfValido(cpf: string) {
    const clean = cpf.replace(/\D/g, "");
    return clean.length === 11;
  }

  const canGeneratePix =
    !!nome.trim() && !!email.trim() && cpfValido(cpf) && !generating;

  const handleGeneratePix = async () => {
    if (!canGeneratePix) return;

    try {
      setGenerating(true);
      setPixError(null);

      console.log("[CHECKOUT] Gerando PIX com payload:", {
        value: LAUNCH_FEE,
        cpf,
        name: nome.trim(),
        email: email.trim(),
        tokenName,
        ticker,
      });

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
        },
      });

      console.log("[CHECKOUT] Resposta PIX:", response);
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
  };

  const handleCopyCode = () => {
    if (!pixData) return;

    const firstTx = pixData?.Charge?.Transactions?.[0];
    const copyCode = firstTx?.Pix?.qrCode || "";

    if (!copyCode) return;

    navigator.clipboard
      .writeText(copyCode)
      .catch((err) => console.error("Erro ao copiar PIX:", err));
  };

  // const handleFinishLaunch = async () => {
  //   if (!pixData) {
  //     setLaunchError(
  //       "Os dados do PIX não foram encontrados. Gere o QR Code novamente."
  //     );
  //     return;
  //   }

  //   if (!totalSupply || !poolPercent || !faceValue) {
  //     console.error(
  //       "[CHECKOUT] Configuração de supply/pool/face inválida no checkout",
  //       { totalSupply, poolPercent, faceValue }
  //     );
  //     setLaunchError(
  //       "Configuração de supply/pool/face não encontrada. Volte e revise os dados do token."
  //     );
  //     return;
  //   }

  //   try {
  //     setLaunching(true);
  //     setLaunchError(null);

  //     console.log("[CHECKOUT] Chamando launchTokenAfterPix com:", {
  //       tokenType,
  //       publicName,
  //       tokenName,
  //       ticker,
  //       headline,
  //       story,
  //       totalSupply,
  //       poolPercent,
  //       faceValue,
  //     });

  //     const result = await launchTokenAfterPix({
  //       tokenType,
  //       publicName,
  //       tokenName,
  //       ticker,
  //       headline,
  //       story,
  //       totalSupply,
  //       poolPercent,
  //       faceValue,
  //       pixData,
  //     });

  //     console.log("[CHECKOUT] Token criado com sucesso:", result);

  //     if (result?.slug) {
  //       router.push(`/token/${result.slug}`);
  //     } else {
  //       router.push("/criador/dashboard");
  //     }
  //   } catch (err: any) {
  //     console.error("[CHECKOUT] Erro ao lançar token:", err);
  //     setLaunchError(
  //       err?.message ||
  //       "Não foi possível finalizar o lançamento. Tente novamente em alguns instantes."
  //     );
  //   } finally {
  //     setLaunching(false);
  //   }
  // };

  const handleFinishLaunch = async () => {
    if (!pixData) {
      setLaunchError("Gere e pague o PIX antes de lançar o token.");
      return;
    }

    if (!supplyConfigValid) {
      console.warn("[CHECKOUT] Configuração de supply/pool/face inválida no checkout", {
        totalSupply,
        poolPercent,
        faceValue,
      });
      setLaunchError(
        "Configuração de supply/pool/face não encontrada. Volte e revise os dados do token."
      );
      return;
    }

    try {
      setLaunching(true);
      setLaunchError(null);

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
      });

      router.push(`/token/${slug}?novo=1`);
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


  // tenta achar imagem do QR Code via URL
  const qrCodeImageUrl =
    pixData?.Charge?.Transactions?.[0]?.Pix?.image || null;

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">
              Passo – Pagamento & Lançamento
            </span>
            <h1 className="creator-title">
              Revise seu <span>token</span> e gere o PIX
            </h1>
            <p className="creator-subtitle">
              Antes de entrar na Arena, você paga a taxa de criação.
              Nada aqui é promessa de retorno. É o preço para ligar a máquina
              da narrativa.
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
                  Este é o rascunho do seu token de narrativa. Ele só vai para
                  a Arena depois da cobrança via PIX e das próximas
                  confirmações.
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
                    {totalSupply
                      ? totalSupply.toLocaleString("pt-BR")
                      : "—"}
                  </p>
                  <p>
                    <strong>Pool de lançamento:</strong>{" "}
                    {poolPercent ? `${poolPercent}%` : "—"}
                  </p>
                  <p>
                    <strong>Valor de face inicial:</strong>{" "}
                    {faceValue ? `R$ ${faceValue.toFixed(2)}` : "—"}
                  </p>
                </div>

                <div className="warning-strip" style={{ marginTop: 16 }}>
                  <strong>Lembra:</strong> este token não é investimento
                  seguro, não é produto financeiro regulado e pode valer
                  zero. Se isso incomoda, é melhor não lançar.
                </div>
              </div>
            </div>

            {/* Coluna direita – dados do pagador + PIX */}
            <aside className="creator-preview-side">
              <div className="creator-card">
                {step === "REVIEW" && (
                  <>
                    <div className="section-label">Dados para o PIX</div>
                    <h2 className="section-title">
                      Quem está pagando a taxa?
                    </h2>
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

                    <div
                      className="creator-footer"
                      style={{ marginTop: 16 }}
                    >
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
                        >
                          {generating
                            ? "Gerando PIX..."
                            : "Gerar QR Code PIX"}
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
                      Use o QR Code ou o código copia-e-cola no seu app de
                      banco. Depois do pagamento, clique em “Já paguei,
                      seguir para a Arena”.
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

                    <div
                      className="creator-footer"
                      style={{ marginTop: 16 }}
                    >
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

              <div
                className="creator-preview-card"
                style={{ marginTop: 16 }}
              >
                <div className="creator-preview-header">
                  <span className="creator-preview-pill">{typeLabel}</span>
                  <span className="creator-preview-status">
                    Pré-lançamento
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
                    por{" "}
                    <strong>{publicName || "Criador anônimo"}</strong>
                  </p>

                  <p className="creator-preview-headline">
                    {headline ||
                      "Escreva uma frase curta explicando que isso é jogo de narrativa de alto risco, não promessa de retorno."}
                  </p>

                  <div className="creator-preview-riskband">
                    <span className="creator-preview-riskdot" />
                    <span>
                      Não é produto financeiro regulado. Preço pode ir a
                      zero. Entre por conta e risco.
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
