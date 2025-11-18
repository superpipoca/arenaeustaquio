// app/criador/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
// import { supabaseClient } from "../../lib/supabaseClient";
import { SupabaseClient } from "@supabase/supabase-js";

export default function CriadorLoginPage() {
  const router = useRouter();
  const supabase = SupabaseClient as any;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setErro(error.message || "Não foi possível entrar.");
        return;
      }

      // depois do login, mandamos pro onboarding (onde criamos user+creator)
      router.push("/criador/onboarding");
    } catch (err: any) {
      console.error(err);
      setErro("Erro inesperado ao tentar logar.");
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
              Você está entrando em uma plataforma de especulação consciente.
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
              </div>

              {erro && (
                <p className="cta-note" style={{ color: "var(--accent-primary)" }}>
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
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
