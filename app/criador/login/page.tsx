// "use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
// import { useSignIn, useSignUp, useAuth, useUser, useClerk } from "@clerk/nextjs";

// type Step = "email" | "code";
// type PendingFlow = "signin" | "signup" | null;

// const LS_FLOW = "pending_flow";
// const LS_EMAIL = "pending_email";

// const withTimeout = async <T,>(p: Promise<T>, ms = 15000): Promise<T> => {
//   let t: any;
//   const timeout = new Promise<T>((_, rej) => {
//     t = setTimeout(() => rej(new Error("timeout")), ms);
//   });
//   try {
//     return await Promise.race([p, timeout]);
//   } finally {
//     clearTimeout(t);
//   }
// };

// export default function CriadorLoginPage() {
//   const router = useRouter();

//   const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
//   const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } =
//     useSignUp();

//   const { isLoaded: authLoaded, userId } = useAuth();
//   const { isLoaded: userLoaded, user } = useUser();
//   const { signOut } = useClerk();

//   const alreadySignedIn = authLoaded && !!userId;

//   const [step, setStep] = useState<Step>("email");
//   const [pendingFlow, setPendingFlow] = useState<PendingFlow>(null);

//   const [email, setEmail] = useState("");
//   const [code, setCode] = useState("");

//   const [needsNameForSignup, setNeedsNameForSignup] = useState(false);
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [erro, setErro] = useState<string | null>(null);
//   const [info, setInfo] = useState<string | null>(null);

//   const sendingRef = useRef(false);

//   const canUsePasskeys = useMemo(() => {
//     return (
//       typeof window !== "undefined" &&
//       window.isSecureContext &&
//       "PublicKeyCredential" in window
//     );
//   }, []);

//   const [passkeyAttempted, setPasskeyAttempted] = useState(false);

//   const waitForCaptchaMount = () =>
//     new Promise<void>((resolve) => {
//       if (typeof window === "undefined") return resolve();
//       // dá 2 frames pro Clerk injetar token quando precisar
//       requestAnimationFrame(() => requestAnimationFrame(resolve));
//     });

//   const getFlowLS = (): PendingFlow =>
//     (localStorage.getItem(LS_FLOW) as PendingFlow) || null;

//   const getEmailLS = (): string => localStorage.getItem(LS_EMAIL) || "";

//   const clearLS = () => {
//     localStorage.removeItem(LS_FLOW);
//     localStorage.removeItem(LS_EMAIL);
//   };

//   const safeSetActive = async (sessionId: string, setActiveFn: any) => {
//     try {
//       await withTimeout(setActiveFn({ session: sessionId }), 8000);
//     } catch (err) {
//       // Cookie geralmente já setou. Seguimos.
//       console.warn("[auth] setActive falhou, seguindo redirect", err);
//     }
//   };

//   // Restaura refresh no code-step
//   useEffect(() => {
//     const savedFlow = getFlowLS();
//     const savedEmail = getEmailLS();
//     if (savedEmail && !email) setEmail(savedEmail);
//     if (savedFlow) {
//       setPendingFlow(savedFlow);
//       setStep("code");
//       setNeedsNameForSignup(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Passkey discoverable
//   useEffect(() => {
//     if (alreadySignedIn) return;
//     if (!signInLoaded || !signIn || passkeyAttempted) return;
//     if (!canUsePasskeys) return;

//     (async () => {
//       try {
//         setPasskeyAttempted(true);

//         const attempt = await withTimeout(
//           signIn.authenticateWithPasskey({ flow: "discoverable" }),
//           8000
//         );

//         if (attempt?.status === "complete") {
//           localStorage.setItem("last_auth_strategy", "passkey");
//           await safeSetActive(attempt.createdSessionId, setActive);
//           router.replace("/criador/onboarding");
//         }
//       } catch {
//         // ignora -> email otp
//       }
//     })();
//   }, [
//     alreadySignedIn,
//     signInLoaded,
//     signIn,
//     canUsePasskeys,
//     passkeyAttempted,
//     setActive,
//     router,
//   ]);

//   // -------- SIGNIN OTP --------
//   const startSigninOtp = async (identifier: string) => {
//     const { supportedFirstFactors } = await withTimeout(
//       signIn!.create({ identifier }),
//       12000
//     );

//     const emailFactor = supportedFirstFactors?.find(
//       (f: any) => f.strategy === "email_code"
//     );
//     if (!emailFactor?.emailAddressId) {
//       throw new Error("email_code não disponível");
//     }

//     await withTimeout(
//       signIn!.prepareFirstFactor({
//         strategy: "email_code",
//         emailAddressId: emailFactor.emailAddressId,
//       }),
//       12000
//     );

//     setPendingFlow("signin");
//     localStorage.setItem(LS_FLOW, "signin");
//     localStorage.setItem(LS_EMAIL, identifier);

//     setInfo("Encontramos sua conta. Te enviamos um código.");
//     setStep("code");
//   };

//   // -------- SIGNUP OTP --------
//   const startSignupOtp = async (identifier: string, fn: string, ln: string) => {
//     await waitForCaptchaMount();

//     await withTimeout(
//       signUp!.create({
//         emailAddress: identifier,
//         firstName: fn,
//         lastName: ln,
//       }),
//       12000
//     );

//     await withTimeout(
//       signUp!.prepareEmailAddressVerification({ strategy: "email_code" }),
//       12000
//     );

//     setPendingFlow("signup");
//     localStorage.setItem(LS_FLOW, "signup");
//     localStorage.setItem(LS_EMAIL, identifier);

//     setInfo("Conta criada. Te enviamos um código para confirmar seu e-mail.");
//     setStep("code");
//   };

//   // Detecta conta existente vs primeiro acesso
//   const detectFlowOrAskName = async (identifier: string) => {
//     try {
//       await startSigninOtp(identifier);
//       return;
//     } catch (e: any) {
//       const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();

//       if (clerkCode === "session_exists") {
//         router.replace("/criador/onboarding");
//         return;
//       }

//       const notFound =
//         clerkCode.includes("form_identifier_not_found") ||
//         clerkCode.includes("identifier_not_found");

//       if (!notFound) throw e;
//     }

//     // Primeiro acesso
//     setPendingFlow("signup"); // só estado local
//     localStorage.setItem(LS_EMAIL, identifier);
//     setNeedsNameForSignup(true);
//     setInfo("Primeiro acesso detectado. Preciso do seu nome e sobrenome.");
//   };

//   // Reenvia (recria attempt se sumiu)
//   const resendCode = async () => {
//     if (loading) return;
//     const id = email.trim();
//     if (!id) return;

//     setErro(null);
//     setInfo(null);
//     setLoading(true);

//     try {
//       const flow = pendingFlow || getFlowLS();

//       if (flow === "signin") {
//         await startSigninOtp(id);
//       } else if (flow === "signup") {
//         const fn = firstName.trim();
//         const ln = lastName.trim();
//         if (fn.length < 2 || ln.length < 2) {
//           setErro("Digite nome e sobrenome para recriar o envio.");
//           return;
//         }
//         await startSignupOtp(id, fn, ln);
//       } else {
//         // flow perdido -> detecta de novo
//         await detectFlowOrAskName(id);
//       }

//       setCode("");
//       setInfo("Código reenviado. Use o mais recente.");
//     } catch (e: any) {
//       const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();
//       if (clerkCode === "captcha_missing_token") {
//         setErro("Confirme a verificação anti-bot acima e tente de novo.");
//       } else {
//         setErro("Não consegui reenviar agora. Tente novamente.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // CONTINUAR (email step)
//   const onContinue = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (loading) return;

//     setErro(null);
//     setInfo(null);

//     const id = email.trim();
//     if (!id) {
//       setErro("Digite um e-mail válido.");
//       return;
//     }

//     if (alreadySignedIn) {
//       router.replace("/criador/onboarding");
//       return;
//     }

//     if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
//     if (sendingRef.current) return;

//     // Já em modo signup -> cria conta com nomes
//     if (needsNameForSignup) {
//       const fn = firstName.trim();
//       const ln = lastName.trim();
//       if (fn.length < 2 || ln.length < 2) {
//         setErro("Digite nome e sobrenome para criar sua conta.");
//         return;
//       }

//       sendingRef.current = true;
//       setLoading(true);
//       try {
//         await startSignupOtp(id, fn, ln);
//         setNeedsNameForSignup(false);
//         setCode("");
//       } catch (e: any) {
//         const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();
//         if (clerkCode === "captcha_missing_token") {
//           setErro("Confirme a verificação anti-bot acima e tente de novo.");
//         } else {
//           setErro("Não consegui criar sua conta agora. Tente novamente.");
//         }
//       } finally {
//         setLoading(false);
//         sendingRef.current = false;
//       }
//       return;
//     }

//     // Fluxo normal: detectar signin vs signup
//     sendingRef.current = true;
//     setLoading(true);
//     try {
//       await detectFlowOrAskName(id);
//       setCode("");
//     } catch {
//       setErro("Não consegui enviar o código agora. Tente novamente.");
//     } finally {
//       setLoading(false);
//       sendingRef.current = false;
//     }
//   };

//   // VERIFY OTP
//   const onVerifyCode = async (e: React.FormEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (loading) return;
//     setErro(null);
//     setInfo(null);

//     const clean = code.replace(/\D/g, "").slice(0, 6);
//     if (clean.length !== 6) {
//       setErro("Digite o código de 6 dígitos.");
//       return;
//     }

//     if (alreadySignedIn) {
//       router.replace("/criador/onboarding");
//       return;
//     }

//     if (!signInLoaded || !signUpLoaded) return;

//     setLoading(true);
//     try {
//       const flow = pendingFlow || getFlowLS();

//       // ---------- SIGNIN ----------
//       if (flow === "signin") {
//         // se o attempt sumiu (refresh/hot reload), recria e avisa
//         if (!signIn || signIn.status !== "needs_first_factor") {
//           await startSigninOtp(email.trim());
//           setErro("Seu attempt expirou. Te mandei outro código.");
//           return;
//         }

//         const attempt = await withTimeout(
//           signIn.attemptFirstFactor({
//             strategy: "email_code",
//             code: clean,
//           }),
//           15000
//         );

//         if (attempt.status === "complete") {
//           localStorage.setItem("last_auth_strategy", "email_code");
//           clearLS();

//           await safeSetActive(attempt.createdSessionId, setActive);
//           setInfo("Sucesso! Redirecionando...");
//           router.replace("/criador/onboarding");
//           return;
//         }

//         setErro("Não consegui concluir. Reenvie o código.");
//         return;
//       }

//       // ---------- SIGNUP ----------
//       if (flow === "signup") {
//         if (!signUp) {
//           setErro("Sessão perdida. Digite o e-mail novamente.");
//           setStep("email");
//           setPendingFlow(null);
//           setNeedsNameForSignup(false);
//           return;
//         }

//         const suAttempt = await withTimeout(
//           signUp.attemptEmailAddressVerification({ code: clean }),
//           15000
//         );

//         if (suAttempt.status === "complete") {
//           localStorage.setItem("last_auth_strategy", "email_code");
//           clearLS();

//           const activate = setActiveSignUp ?? setActive;
//           await safeSetActive(suAttempt.createdSessionId, activate);

//           setInfo("Cadastro pronto! Entrando...");
//           router.replace("/criador/onboarding");
//           return;
//         }

//         setErro("Não consegui concluir. Reenvie o código.");
//         return;
//       }

//       // flow indefinido
//       setErro("Sessão perdida. Reinicie o login.");
//       setStep("email");
//       setPendingFlow(null);
//       setNeedsNameForSignup(false);
//       setCode("");
//       clearLS();
//     } catch (e: any) {
//       console.error("[auth] error:", e);

//       const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();
//       if (clerkCode === "session_exists") {
//         clearLS();
//         setInfo("Sessão recuperada! Redirecionando...");
//         router.replace("/criador/onboarding");
//         return;
//       }

//       if (String(e?.message).includes("timeout")) {
//         setErro("Demorou demais para validar. Reenvie o código.");
//         return;
//       }

//       if (clerkCode === "captcha_missing_token") {
//         setErro("Confirme a verificação anti-bot acima e tente novamente.");
//         return;
//       }

//       setErro("Código inválido ou expirado. Tente reenviar.");
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
//               Sem senha. Se tiver Passkey, você entra com digital/FaceID.
//               Se não, mandamos código por e-mail.
//             </p>

//             {userLoaded && alreadySignedIn && (
//               <div className="mb-4 p-3 rounded-xl border border-[#333] bg-[#0f0f0f]">
//                 <p className="text-sm text-neutral-200">
//                   Você já está logado como{" "}
//                   <b>{user?.primaryEmailAddress?.emailAddress}</b>.
//                 </p>
//                 <button
//                   type="button"
//                   className="btn-primary auth-submit"
//                   style={{ marginTop: 8, width: "100%" }}
//                   onClick={() => router.replace("/criador/onboarding")}
//                 >
//                   Continuar
//                 </button>
//                 <button
//                   type="button"
//                   className="auth-toggle-btn"
//                   style={{ marginTop: 8, width: "100%" }}
//                   onClick={async () => {
//                     await signOut();
//                     setStep("email");
//                     setPendingFlow(null);
//                     setNeedsNameForSignup(false);
//                     setFirstName("");
//                     setLastName("");
//                     setCode("");
//                     setErro(null);
//                     setInfo(null);
//                     clearLS();
//                   }}
//                 >
//                   Trocar de conta
//                 </button>
//               </div>
//             )}

//             {!alreadySignedIn && step === "email" && (
//               <form onSubmit={onContinue} className="auth-form">
//                 <div className="creator-field-group">
//                   <label className="field-label">E-mail</label>
//                   <input
//                     className="field-input"
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="seunome@exemplo.com"
//                     autoComplete="email"
//                     required
//                   />
//                 </div>

//                 {needsNameForSignup && (
//                   <>
//                     <div className="creator-field-group">
//                       <label className="field-label">Nome</label>
//                       <input
//                         className="field-input"
//                         value={firstName}
//                         onChange={(e) => setFirstName(e.target.value)}
//                         placeholder="Seu nome"
//                         autoComplete="given-name"
//                         required
//                       />
//                     </div>
//                     <div className="creator-field-group">
//                       <label className="field-label">Sobrenome</label>
//                       <input
//                         className="field-input"
//                         value={lastName}
//                         onChange={(e) => setLastName(e.target.value)}
//                         placeholder="Seu sobrenome"
//                         autoComplete="family-name"
//                         required
//                       />
//                     </div>
//                   </>
//                 )}

//                 {/* Captcha placeholder SEMPRE visível */}
//                 <div
//                   id="clerk-captcha"
//                   data-cl-theme="dark"
//                   data-cl-size="flexible"
//                   style={{ minHeight: 88, width: "100%", marginTop: 8 }}
//                 />

//                 {erro && (
//                   <p
//                     className="cta-note"
//                     style={{ color: "var(--accent-primary)", marginTop: 8 }}
//                   >
//                     {erro}
//                   </p>
//                 )}
//                 {info && !erro && (
//                   <p
//                     className="cta-note"
//                     style={{ color: "var(--accent-soft)", marginTop: 8 }}
//                   >
//                     {info}
//                   </p>
//                 )}

//                 <button
//                   type="submit"
//                   className="btn-primary auth-submit"
//                   disabled={loading}
//                   style={{ opacity: loading ? 0.7 : 1 }}
//                 >
//                   {loading ? "Enviando..." : "Continuar"}
//                 </button>
//               </form>
//             )}

//             {!alreadySignedIn && step === "code" && (
//               <form onSubmit={onVerifyCode} className="auth-form">
//                 <p className="field-help" style={{ marginBottom: 8 }}>
//                   {(pendingFlow || getFlowLS()) === "signup"
//                     ? "Primeiro acesso. Confirme seu e-mail:"
//                     : "Confirme seu acesso:"}{" "}
//                   <b>{email}</b>
//                 </p>

//                 <div className="creator-field-group">
//                   <label className="field-label">Código (6 dígitos)</label>
//                   <input
//                     className="field-input"
//                     inputMode="numeric"
//                     pattern="[0-9]*"
//                     maxLength={6}
//                     value={code}
//                     onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
//                     placeholder="000000"
//                     autoComplete="one-time-code"
//                     required
//                   />
//                 </div>

//                 {erro && (
//                   <p
//                     className="cta-note"
//                     style={{ color: "var(--accent-primary)", marginTop: 8 }}
//                   >
//                     {erro}
//                   </p>
//                 )}
//                 {info && !erro && (
//                   <p
//                     className="cta-note"
//                     style={{ color: "var(--accent-soft)", marginTop: 8 }}
//                   >
//                     {info}
//                   </p>
//                 )}

//                 <button
//                   type="submit"
//                   className="btn-primary auth-submit"
//                   disabled={loading}
//                   style={{ opacity: loading ? 0.7 : 1 }}
//                 >
//                   {loading ? "Validando..." : "Entrar na Arena"}
//                 </button>

//                 <button
//                   type="button"
//                   className="auth-toggle-btn"
//                   style={{ marginTop: 8, width: "100%" }}
//                   disabled={loading}
//                   onClick={resendCode}
//                 >
//                   Reenviar código
//                 </button>

//                 <button
//                   type="button"
//                   className="auth-toggle-btn"
//                   style={{ marginTop: 8, width: "100%" }}
//                   disabled={loading}
//                   onClick={() => {
//                     setStep("email");
//                     setPendingFlow(null);
//                     setNeedsNameForSignup(false);
//                     setFirstName("");
//                     setLastName("");
//                     setCode("");
//                     setErro(null);
//                     setInfo(null);
//                     clearLS();
//                   }}
//                 >
//                   Trocar e-mail
//                 </button>
//               </form>
//             )}

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
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import { useSignIn, useSignUp, useAuth, useUser, useClerk } from "@clerk/nextjs";

type Step = "email" | "code";
type PendingFlow = "signin" | "signup" | null;

const LS_FLOW = "pending_flow";
const LS_EMAIL = "pending_email";

const withTimeout = async <T,>(p: Promise<T>, ms = 15000) => {
  let t: any;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error("timeout")), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CriadorLoginPage() {
  const router = useRouter();

  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } =
    useSignUp();

  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { signOut } = useClerk();

  const alreadySignedIn = authLoaded && !!userId;

  const [step, setStep] = useState<Step>("email");
  const [pendingFlow, setPendingFlow] = useState<PendingFlow>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [needsNameForSignup, setNeedsNameForSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendingRef = useRef(false);

  const canUsePasskeys = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      window.isSecureContext &&
      "PublicKeyCredential" in window
    );
  }, []);
  const [passkeyAttempted, setPasskeyAttempted] = useState(false);

  const waitForCaptchaMount = () =>
    new Promise<void>((resolve) => {
      if (typeof window === "undefined") return resolve();
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  useEffect(() => {
    const savedFlow = (localStorage.getItem(LS_FLOW) as PendingFlow) || null;
    const savedEmail = localStorage.getItem(LS_EMAIL) || "";
    if (savedEmail && !email) setEmail(savedEmail);
    if (savedFlow) {
      setPendingFlow(savedFlow);
      setStep("code");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ ativa sessão com fallback duro caso o setActive dê pau
  const safeSetActive = async (sessionId: string, setActiveFn: any) => {
    try {
      await withTimeout(setActiveFn({ session: sessionId }), 8000);
      return true;
    } catch (err) {
      console.warn(
        "[LOGIN] setActive falhou. Forçando navegação dura pra sync.",
        err
      );
      // Se o cookie foi setado mas o Next não enxergou, o hard nav resolve.
      window.location.href = "/criador/onboarding";
      return false;
    }
  };

  // Passkey discoverable
  useEffect(() => {
    if (alreadySignedIn) return;
    if (!signInLoaded || !signIn || passkeyAttempted) return;
    if (!canUsePasskeys) return;

    (async () => {
      try {
        setPasskeyAttempted(true);
        const attempt = await withTimeout(
          signIn.authenticateWithPasskey({ flow: "discoverable" }),
          8000
        );

        if (attempt?.status === "complete") {
          localStorage.setItem("last_auth_strategy", "passkey");
          const ok = await safeSetActive(attempt.createdSessionId, setActive);
          if (!ok) return;

          fetch("/api/ensure-user-wallet", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});

          router.replace("/criador/onboarding");
          router.refresh();
        }
      } catch {
        // ignore
      }
    })();
  }, [
    alreadySignedIn,
    signInLoaded,
    signIn,
    canUsePasskeys,
    passkeyAttempted,
    setActive,
    router,
  ]);

  const startSigninOtp = async (identifier: string) => {
    const { supportedFirstFactors } = await withTimeout(
      signIn!.create({ identifier }),
      12000
    );

    const emailFactor = supportedFirstFactors?.find(
      (f: any) => f.strategy === "email_code"
    );
    if (!emailFactor?.emailAddressId)
      throw new Error("email_code não disponível");

    await withTimeout(
      signIn!.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      }),
      12000
    );

    setPendingFlow("signin");
    localStorage.setItem(LS_FLOW, "signin");
    localStorage.setItem(LS_EMAIL, identifier);
    setInfo("Encontramos sua conta. Te enviamos um código.");
    setStep("code");
  };

  const startSignupOtp = async (identifier: string, fn: string, ln: string) => {
    await waitForCaptchaMount();

    await withTimeout(
      signUp!.create({
        emailAddress: identifier,
        firstName: fn,
        lastName: ln,
      }),
      12000
    );

    await withTimeout(
      signUp!.prepareEmailAddressVerification({ strategy: "email_code" }),
      12000
    );

    setPendingFlow("signup");
    localStorage.setItem(LS_FLOW, "signup");
    localStorage.setItem(LS_EMAIL, identifier);
    setInfo("Conta criada. Te enviamos um código para confirmar seu e-mail.");
    setStep("code");
  };

  const detectFlowOrAskName = async (identifier: string) => {
    try {
      await startSigninOtp(identifier);
      return;
    } catch (e: any) {
      const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();

      if (clerkCode === "session_exists") {
        router.replace("/criador/onboarding");
        return;
      }

      const notFound =
        clerkCode.includes("form_identifier_not_found") ||
        clerkCode.includes("identifier_not_found");

      if (!notFound) throw e;
    }

    setPendingFlow("signup");
    localStorage.setItem(LS_EMAIL, identifier);
    setNeedsNameForSignup(true);
    setInfo("Primeiro acesso detectado. Preciso do seu nome e sobrenome.");
  };

  const resendCode = async () => {
    if (loading) return;
    const id = email.trim();
    if (!id) return;

    setErro(null);
    setInfo(null);
    setLoading(true);
    try {
      const flow =
        pendingFlow || (localStorage.getItem(LS_FLOW) as PendingFlow);

      if (flow === "signin") {
        await startSigninOtp(id);
      } else if (flow === "signup") {
        await startSignupOtp(id, firstName.trim(), lastName.trim());
      }

      setCode("");
      setInfo("Código reenviado. Use o mais recente.");
    } catch (e) {
      console.error(e);
      setErro("Não consegui reenviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErro(null);
    setInfo(null);

    const id = email.trim();
    if (!id) return setErro("Digite um e-mail válido.");

    if (alreadySignedIn) {
      router.replace("/criador/onboarding");
      return;
    }

    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
    if (sendingRef.current) return;

    if (needsNameForSignup) {
      const fn = firstName.trim();
      const ln = lastName.trim();
      if (fn.length < 2 || ln.length < 2) {
        setErro("Digite nome e sobrenome para criar sua conta.");
        return;
      }

      sendingRef.current = true;
      setLoading(true);
      try {
        await startSignupOtp(id, fn, ln);
        setNeedsNameForSignup(false);
        setCode("");
      } catch (e: any) {
        const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();
        if (clerkCode === "captcha_missing_token") {
          setErro("Confirme a verificação anti-bot acima e tente de novo.");
          return;
        }
        console.error(e);
        setErro("Não consegui criar sua conta agora. Tente novamente.");
      } finally {
        setLoading(false);
        sendingRef.current = false;
      }
      return;
    }

    sendingRef.current = true;
    setLoading(true);
    try {
      await detectFlowOrAskName(id);
      setCode("");
    } catch (e) {
      console.error(e);
      setErro("Não consegui enviar o código agora. Tente novamente.");
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setErro(null);
    setInfo(null);

    const clean = code.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) return setErro("Digite o código de 6 dígitos.");

    if (alreadySignedIn) {
      router.replace("/criador/onboarding");
      return;
    }

    if (!signInLoaded || !signUpLoaded) return;

    setLoading(true);
    try {
      const flow =
        pendingFlow || (localStorage.getItem(LS_FLOW) as PendingFlow);

      // SIGN-IN
      if (flow === "signin") {
        if (!signIn || signIn.status !== "needs_first_factor") {
          setErro("Sessão perdida. Reenvie o código.");
          return;
        }

        const attempt = await withTimeout(
          signIn.attemptFirstFactor({ strategy: "email_code", code: clean }),
          15000
        );

        if (attempt.status === "complete") {
          localStorage.setItem("last_auth_strategy", "email_code");
          localStorage.removeItem(LS_FLOW);
          localStorage.removeItem(LS_EMAIL);

          const ok = await safeSetActive(attempt.createdSessionId, setActive);
          if (!ok) return;

          fetch("/api/ensure-user-wallet", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});

          setInfo("Sucesso! Redirecionando...");
          await sleep(250);
          router.replace("/criador/onboarding");
          router.refresh();
          return;
        }

        setErro("Não consegui concluir. Reenvie o código.");
        return;
      }

      // SIGN-UP
      if (flow === "signup") {
        if (!signUp) {
          setErro("Sessão perdida. Digite o e-mail novamente.");
          setStep("email");
          return;
        }

        const suAttempt = await withTimeout(
          signUp.attemptEmailAddressVerification({ code: clean }),
          15000
        );

        if (suAttempt.status === "complete") {
          localStorage.setItem("last_auth_strategy", "email_code");
          localStorage.removeItem(LS_FLOW);
          localStorage.removeItem(LS_EMAIL);

          const activate = setActiveSignUp ?? setActive;
          const ok = await safeSetActive(suAttempt.createdSessionId, activate);
          if (!ok) return;

          fetch("/api/ensure-user-wallet", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});

          setInfo("Cadastro pronto! Entrando...");
          await sleep(250);
          router.replace("/criador/onboarding");
          router.refresh();
          return;
        }

        setErro("Não consegui concluir. Reenvie o código.");
        return;
      }

      setErro("Sessão perdida. Reinicie o login.");
      setStep("email");
    } catch (e: any) {
      console.error("Auth Error:", e);
      const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();
      if (clerkCode === "session_exists") {
        localStorage.removeItem(LS_FLOW);
        localStorage.removeItem(LS_EMAIL);
        setInfo("Sessão recuperada! Redirecionando...");
        router.replace("/criador/onboarding");
        router.refresh();
        return;
      }
      setErro("Código inválido ou expirado. Tente reenviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell auth-shell">
          <section className="auth-card">
            <h1 className="creator-title">Entrar como criador</h1>
            <p className="creator-subtitle">
              Sem senha. Se tiver Passkey, entra com digital/FaceID. Se não, mandamos
              código por e-mail.
            </p>

            {userLoaded && alreadySignedIn && (
              <div className="mb-4 p-3 rounded-xl border border-[#333] bg-[#0f0f0f]">
                <p className="text-sm text-neutral-200">
                  Você já está logado como{" "}
                  <b>{user?.primaryEmailAddress?.emailAddress}</b>.
                </p>

                <button
                  type="button"
                  className="btn-primary auth-submit"
                  style={{ marginTop: 8, width: "100%" }}
                  onClick={() => {
                    router.replace("/criador/onboarding");
                    router.refresh();
                  }}
                >
                  Continuar
                </button>

                <button
                  type="button"
                  className="auth-toggle-btn"
                  style={{ marginTop: 8, width: "100%" }}
                  onClick={async () => {
                    await signOut();
                    setStep("email");
                    setPendingFlow(null);
                    setNeedsNameForSignup(false);
                    setFirstName("");
                    setLastName("");
                    setCode("");
                    setErro(null);
                    setInfo(null);
                    localStorage.removeItem(LS_FLOW);
                    localStorage.removeItem(LS_EMAIL);
                  }}
                >
                  Trocar de conta
                </button>
              </div>
            )}

            {!alreadySignedIn && step === "email" && (
              <form onSubmit={onContinue} className="auth-form">
                <div className="creator-field-group">
                  <label className="field-label">E-mail</label>
                  <input
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seunome@exemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {needsNameForSignup && (
                  <>
                    <div className="creator-field-group">
                      <label className="field-label">Nome</label>
                      <input
                        className="field-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Seu nome"
                        autoComplete="given-name"
                        required
                      />
                    </div>
                    <div className="creator-field-group">
                      <label className="field-label">Sobrenome</label>
                      <input
                        className="field-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Seu sobrenome"
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  </>
                )}

                <div
                  id="clerk-captcha"
                  data-cl-theme="dark"
                  data-cl-size="flexible"
                  style={{ minHeight: 80, width: "100%", marginTop: 8 }}
                />

                {erro && (
                  <p
                    className="cta-note"
                    style={{
                      color: "var(--accent-primary)",
                      marginTop: 8,
                    }}
                  >
                    {erro}
                  </p>
                )}
                {info && !erro && (
                  <p className="cta-note" style={{ marginTop: 8 }}>
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary auth-submit"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Enviando..." : "Continuar"}
                </button>
              </form>
            )}

            {!alreadySignedIn && step === "code" && (
              <form onSubmit={onVerifyCode} className="auth-form">
                <p className="field-help" style={{ marginBottom: 8 }}>
                  {pendingFlow === "signup"
                    ? "Primeiro acesso. Confirme seu e-mail:"
                    : "Confirme seu acesso:"}{" "}
                  <b>{email}</b>
                </p>

                <div className="creator-field-group">
                  <label className="field-label">Código (6 dígitos)</label>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                {erro && (
                  <p
                    className="cta-note"
                    style={{
                      color: "var(--accent-primary)",
                      marginTop: 8,
                    }}
                  >
                    {erro}
                  </p>
                )}
                {info && !erro && (
                  <p className="cta-note" style={{ marginTop: 8 }}>
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary auth-submit"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Validando..." : "Entrar na Arena"}
                </button>

                <button
                  type="button"
                  className="auth-toggle-btn"
                  style={{ marginTop: 8, width: "100%" }}
                  disabled={loading}
                  onClick={resendCode}
                >
                  Reenviar código
                </button>

                <button
                  type="button"
                  className="auth-toggle-btn"
                  style={{ marginTop: 8, width: "100%" }}
                  disabled={loading}
                  onClick={() => {
                    setStep("email");
                    setPendingFlow(null);
                    setNeedsNameForSignup(false);
                    setFirstName("");
                    setLastName("");
                    setCode("");
                    setErro(null);
                    setInfo(null);
                    localStorage.removeItem(LS_FLOW);
                    localStorage.removeItem(LS_EMAIL);
                  }}
                >
                  Trocar e-mail
                </button>
              </form>
            )}

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
