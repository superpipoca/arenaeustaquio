// app/entrar/passwordless-entry.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";

type Step = "email" | "code";
type LastStrategy = "passkey" | "email_code" | null;

export default function PasswordlessEntry() {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [passkeyAttempted, setPasskeyAttempted] = useState(false);

  const canUsePasskeys = useMemo(() => {
    // WebAuthn básico; evita prompt em browsers sem suporte
    return (
      typeof window !== "undefined" &&
      window.isSecureContext &&
      "PublicKeyCredential" in window
    );
  }, []);

  // 1) Golden Flow A: tentou passkey assim que abriu (discoverable)
  useEffect(() => {
    if (!signInLoaded || !signIn || passkeyAttempted) return;
    if (!canUsePasskeys) return;

    (async () => {
      try {
        setPasskeyAttempted(true);
        const attempt = await signIn.authenticateWithPasskey({
          flow: "discoverable",
        });

        if (attempt?.status === "complete") {
          localStorage.setItem("last_auth_strategy", "passkey");
          await setActive({ session: attempt.createdSessionId });
          router.push("/criador/onboarding");
        }
        // se não completou, só cai fora e deixa o email na tela
      } catch (e) {
        // cancelou, não tem passkey, etc — segue com email
      }
    })();
  }, [signInLoaded, signIn, canUsePasskeys, passkeyAttempted, setActive, router]);

  // 2) Golden Flow B: usuário digitou email e clicou continuar
  const sendOtpForSignInOrSignUp = async (identifier: string) => {
    // Tenta SIGN-IN
    try {
      const { supportedFirstFactors } = await signIn!.create({
        identifier,
      });

      const emailFactor = supportedFirstFactors?.find(
        (f: any) => f.strategy === "email_code"
      );

      if (!emailFactor?.emailAddressId) {
        throw new Error("email_code não disponível para este usuário.");
      }

      await signIn!.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });

      setStep("code");
      return;
    } catch (e: any) {
      // Se não existe conta, cai pro SIGN-UP
      const msg = (e?.errors?.[0]?.code || "").toLowerCase();
      const notFound =
        msg.includes("form_identifier_not_found") ||
        msg.includes("identifier_not_found");

      if (!notFound) throw e;
    }

    // SIGN-UP passwordless
    await signUp!.create({ emailAddress: identifier });
    await signUp!.prepareEmailAddressVerification({
      strategy: "email_code",
    });

    setStep("code");
  };

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!email.trim()) {
      setErr("Digite um e-mail válido.");
      return;
    }
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;

    setLoading(true);
    try {
      // Prioriza passkey de novo *após* o clique, se quiser.
      // Mas como já tentamos no mount, aqui só manda OTP direto.
      await sendOtpForSignInOrSignUp(email.trim());
    } catch (e: any) {
      setErr("Não consegui enviar o código. Tente de novo em alguns segundos.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!code.trim()) {
      setErr("Digite o código de 6 dígitos.");
      return;
    }
    setLoading(true);

    try {
      // Primeiro tenta completar SIGN-IN
      if (signIn?.status === "needs_first_factor") {
        const attempt = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });

        if (attempt.status === "complete") {
          localStorage.setItem("last_auth_strategy", "email_code");
          await setActive({ session: attempt.createdSessionId });
          router.push("/criador/onboarding");
          return;
        }
      }

      // Senão, completa SIGN-UP
      const suAttempt = await signUp!.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (suAttempt.status === "complete") {
        localStorage.setItem("last_auth_strategy", "email_code");
        await setActive({ session: suAttempt.createdSessionId });
        router.push("/criador/onboarding");
      } else {
        setErr("Código inválido ou expirado.");
      }
    } catch (e) {
      setErr("Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-[#333] rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Entrar na Arena</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Sem senha. Sem phishing. Só código ou sua biometria.
        </p>

        {step === "email" && (
          <form onSubmit={onContinue} className="space-y-4">
            <label className="text-sm font-medium">E-mail</label>
            <input
              className="w-full rounded-xl bg-black/60 border border-[#333] px-4 py-3 outline-none focus:border-[#00ffff]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seunome@exemplo.com"
              autoComplete="email"
              required
            />

            {err && (
              <p className="text-sm text-[#ff0055]">{err}</p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#ff0055] hover:bg-[#ff0055]/90 transition px-4 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Continuar"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={onVerifyCode} className="space-y-4">
            <p className="text-sm text-neutral-300">
              Enviamos um código de 6 dígitos para:{" "}
              <span className="font-semibold">{email}</span>
            </p>

            <label className="text-sm font-medium">Código</label>
            <input
              className="w-full tracking-[0.3em] text-center text-xl rounded-xl bg-black/60 border border-[#333] px-4 py-3 outline-none focus:border-[#00ffff]"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
            />

            {err && (
              <p className="text-sm text-[#ff0055]">{err}</p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#ff0055] hover:bg-[#ff0055]/90 transition px-4 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Validando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="w-full text-sm text-neutral-400 hover:text-white"
              onClick={() => {
                setStep("email");
                setCode("");
                setErr(null);
              }}
            >
              Trocar e-mail
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
