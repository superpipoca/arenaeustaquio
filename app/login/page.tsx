"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../componentes/ui/layout/Footer3ustaquio";
import {
    useSignIn,
    useSignUp,
    useAuth,
    useUser,
    useClerk,
    useSession,
} from "@clerk/nextjs";

type Step = "email" | "code";
type Flow = "signin" | "signup" | null;

const LS_FLOW = "pending_flow";
const LS_EMAIL = "pending_email";

// timeout pra evitar promessas "presas"
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

export default function LoginSemSenhaPage() {
    const router = useRouter();

    const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
    const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } =
        useSignUp();

    const { isLoaded: authLoaded, userId } = useAuth();
    const { isLoaded: userLoaded, user } = useUser();
    const { signOut } = useClerk();
    const { session } = useSession(); // ✅ pega sessão atual (multi-session safe)

    const alreadySignedIn = authLoaded && !!userId;

    const [step, setStep] = useState<Step>("email");
    const [flow, setFlow] = useState<Flow>(null);

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");

    const [needsNameForSignup, setNeedsNameForSignup] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const sendingRef = useRef(false);

    // suporte a passkey
    const canUsePasskeys = useMemo(() => {
        return (
            typeof window !== "undefined" &&
            window.isSecureContext &&
            "PublicKeyCredential" in window
        );
    }, []);
    const [passkeyAttempted, setPasskeyAttempted] = useState(false);

    // espera o mount do captcha quando bot protection está ativo
    const waitForCaptchaMount = () =>
        new Promise<void>((resolve) => {
            if (typeof window === "undefined") return resolve();
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

    // carrega fluxo salvo (caso usuário recarregue a página no meio)
    useEffect(() => {
        const savedFlow = (localStorage.getItem(LS_FLOW) as Flow) || null;
        const savedEmail = localStorage.getItem(LS_EMAIL) || "";
        if (savedEmail && !email) setEmail(savedEmail);
        if (savedFlow) {
            setFlow(savedFlow);
            setStep("code");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ativa sessão com fallback duro
    const safeSetActive = async (
        sessionId: string,
        setActiveFn: (args: any) => Promise<any>
    ) => {
        try {
            await withTimeout(setActiveFn({ session: sessionId }), 8000);
            return true;
        } catch (err) {
            console.warn("[AUTH] setActive falhou, hard nav pra sincronizar.", err);
            window.location.href = "/onboarding";
            return false;
        }
    };

    // ✅ LOGOUT HARD, mata sessão Clerk e sai de rota protegida
    const loggingOutRef = useRef(false);
    const hardSignOut = async () => {
        if (loggingOutRef.current) return;
        loggingOutRef.current = true;

        setLoading(true);
        setErro(null);
        setInfo(null);
        console.log("[LOGOUT DEBUG] 1. Iniciando SignOut. Loading=true.");

        try {
            // limpa rastros locais
            localStorage.removeItem(LS_FLOW);
            localStorage.removeItem(LS_EMAIL);
            console.log("[LOGOUT DEBUG] 2. LocalStorage limpo.");

            // mata a sessão correta (se multi-session)
            if (session?.id) {
                await signOut({ sessionId: session.id });
            } else {
                await signOut();
            }

            // hard redirect pra evitar cache/hidratação do App Router
            window.location.replace("/criador/login?signout=1");
            return;
        } catch (e) {
            console.error("[LOGOUT] erro:", e);
            window.location.replace("/criador/login?signout=1");
        } finally {
            setLoading(false);
            loggingOutRef.current = false;
            // reset local (caso não recarregue por algum motivo)
            setStep("email");
            setFlow(null);
            setNeedsNameForSignup(false);
            setFirstName("");
            setLastName("");
            setCode("");
        }
    };

    // ===== PASSKEY DISCOVERABLE AUTO-TRY =====
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
                    }).catch(() => { });

                    router.replace("/onboarding");
                    router.refresh();
                }
            } catch {
                // silencioso
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

    // ===== FLOWS OTP =====

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

        setFlow("signin");
        localStorage.setItem(LS_FLOW, "signin");
        localStorage.setItem(LS_EMAIL, identifier);
        setInfo("Conta encontrada. Código enviado pro seu e-mail.");
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

        setFlow("signup");
        localStorage.setItem(LS_FLOW, "signup");
        localStorage.setItem(LS_EMAIL, identifier);
        setInfo("Conta criada. Código enviado pra confirmar o e-mail.");
        setStep("code");
    };

    const detectFlowOrAskName = async (identifier: string) => {
        try {
            await startSigninOtp(identifier);
            return;
        } catch (e: any) {
            const clerkCode = (e?.errors?.[0]?.code || "").toLowerCase();

            if (clerkCode === "session_exists") {
                router.replace("/onboarding");
                return;
            }

            const notFound =
                clerkCode.includes("form_identifier_not_found") ||
                clerkCode.includes("identifier_not_found");

            if (!notFound) throw e;
        }

        setFlow("signup");
        localStorage.setItem(LS_EMAIL, identifier);
        setNeedsNameForSignup(true);
        setInfo("Primeiro acesso. Preciso do seu nome e sobrenome.");
    };

    const resendCode = async () => {
        if (loading) return;
        const id = email.trim();
        if (!id) return;

        setErro(null);
        setInfo(null);
        setLoading(true);
        try {
            const currentFlow = flow || (localStorage.getItem(LS_FLOW) as Flow);

            if (currentFlow === "signin") await startSigninOtp(id);
            if (currentFlow === "signup")
                await startSignupOtp(id, firstName.trim(), lastName.trim());

            setCode("");
            setInfo("Código reenviado. Use o mais recente.");
        } catch (e) {
            console.error(e);
            setErro("Não consegui reenviar agora. Tente de novo.");
        } finally {
            setLoading(false);
        }
    };

    // ===== SUBMITS =====

    const onContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setErro(null);
        setInfo(null);

        const id = email.trim();
        if (!id) return setErro("Digite um e-mail válido.");

        if (alreadySignedIn) {
            router.replace("/onboarding");
            return;
        }

        if (!signInLoaded || !signUpLoaded || !signIn || !signUp) {
            setErro("Clerk ainda não carregou. Tente novamente.");
            return;
        }
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
                    setErro("Complete o anti-bot acima e tente de novo.");
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

        if (!signInLoaded || !signUpLoaded) return;

        setLoading(true);
        try {
            const currentFlow = flow || (localStorage.getItem(LS_FLOW) as Flow);

            if (currentFlow === "signin") {
                if (!signIn || signIn.status !== "needs_first_factor") {
                    setErro("Sessão perdida. Reenvie o código.");
                    return;
                }

                const attempt = await withTimeout(
                    signIn.attemptFirstFactor({
                        strategy: "email_code",
                        code: clean,
                    }),
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
                    }).catch(() => { });

                    setInfo("Sucesso! Entrando...");
                    await sleep(250);
                    router.replace("/onboarding");
                    router.refresh();
                    return;
                }

                setErro("Não consegui concluir. Reenvie o código.");
                return;
            }

            if (currentFlow === "signup") {
                if (!signUp) {
                    setErro("Sessão perdida. Digite o e-mail de novo.");
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
                    }).catch(() => { });

                    setInfo("Cadastro pronto! Entrando...");
                    await sleep(250);
                    router.replace("/onboarding");
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
                router.replace("/onboarding");
                router.refresh();
                return;
            }
            setErro("Código inválido ou expirado. Reenvie.");
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
                        <h1 className="creator-title">Entrar / Criar conta</h1>
                        <p className="creator-subtitle">
                            Sem senha. Se tiver Passkey, entra com digital/FaceID. Se não,
                            mandamos código por e-mail.
                        </p>

                        {/* Já logado */}
                        {userLoaded && alreadySignedIn && (
                            <div className="auth-box">
                                <p className="text-sm">
                                    Você já está logado como{" "}
                                    <b>{user?.primaryEmailAddress?.emailAddress}</b>.
                                </p>

                                <button
                                    type="button"
                                    className="btn-primary auth-submit"
                                    onClick={() => {
                                        router.replace("/onboarding");
                                        router.refresh();
                                    }}
                                >
                                    Continuar
                                </button>

                                <button
                                    type="button"
                                    className="auth-toggle-btn"
                                    disabled={loading}
                                    onClick={hardSignOut}
                                >
                                    Finalizar sessão
                                </button>

                                <button
                                    type="button"
                                    className="auth-toggle-btn"
                                    disabled={loading}
                                    onClick={hardSignOut}
                                >
                                    Trocar de conta
                                </button>
                            </div>
                        )}

                        {/* STEP EMAIL */}
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

                                {erro && <p className="cta-note cta-note--error">{erro}</p>}
                                {info && !erro && <p className="cta-note">{info}</p>}

                                <button
                                    type="submit"
                                    className="btn-primary auth-submit"
                                    disabled={loading}
                                >
                                    {loading ? "Enviando..." : "Continuar"}
                                </button>

                                {canUsePasskeys && (
                                    <button
                                        type="button"
                                        className="auth-toggle-btn"
                                        disabled={!signInLoaded || loading}
                                        onClick={async () => {
                                            if (!signIn) return;
                                            setErro(null);
                                            setInfo(null);
                                            setLoading(true);
                                            try {
                                                const attempt = await withTimeout(
                                                    signIn.authenticateWithPasskey({
                                                        flow: "discoverable",
                                                    }),
                                                    8000
                                                );
                                                if (attempt?.status === "complete") {
                                                    const ok = await safeSetActive(
                                                        attempt.createdSessionId,
                                                        setActive
                                                    );
                                                    if (!ok) return;
                                                    router.replace("/onboarding");
                                                    router.refresh();
                                                } else {
                                                    setErro(
                                                        "Nenhuma passkey encontrada nesse dispositivo."
                                                    );
                                                }
                                            } catch {
                                                setErro("Falha ao autenticar com passkey.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                    >
                                        Entrar com Passkey
                                    </button>
                                )}
                            </form>
                        )}

                        {/* STEP CODE */}
                        {!alreadySignedIn && step === "code" && (
                            <form onSubmit={onVerifyCode} className="auth-form">
                                <p className="field-help">
                                    {flow === "signup"
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

                                {erro && <p className="cta-note cta-note--error">{erro}</p>}
                                {info && !erro && <p className="cta-note">{info}</p>}

                                <button
                                    type="submit"
                                    className="btn-primary auth-submit"
                                    disabled={loading}
                                >
                                    {loading ? "Validando..." : "Entrar na Arena"}
                                </button>

                                <button
                                    type="button"
                                    className="auth-toggle-btn"
                                    disabled={loading}
                                    onClick={resendCode}
                                >
                                    Reenviar código
                                </button>

                                <button
                                    type="button"
                                    className="auth-toggle-btn"
                                    disabled={loading}
                                    onClick={() => {
                                        setStep("email");
                                        setFlow(null);
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
