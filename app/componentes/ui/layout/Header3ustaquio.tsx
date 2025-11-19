// app/componentes/ui/layout/Header3ustaquio.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function Header3ustaquio() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Carrega usuário logado
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!error && data?.user) {
          setUserEmail(data.user.email ?? null);
        } else {
          setUserEmail(null);
        }
      } catch (err) {
        console.error("[HEADER] Erro ao carregar usuário:", err);
        if (!cancelled) setUserEmail(null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Detecta layout responsivo (mobile)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGoToLogin = () => {
    router.push("/criador/login");
  };

  const handleGoToArena = () => {
    router.push("/criador/dashboard");
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[HEADER] Erro ao sair:", err);
    } finally {
      setUserEmail(null);
      router.push("/");
      router.refresh();
    }
  };

  const displayName = userEmail ? userEmail.split("@")[0] : "Criador";

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Logo / Marca */}
        <div className="header-left">
          <div
            className="logo-box"
            onClick={() => router.push("/")}
            style={{ cursor: "pointer" }}
          >
            <span>3USTAQUIO</span>
            <span className="logo-pill">Hacker ético</span>
          </div>
        </div>

        {/* Navegação principal – só quando não logado e não for mobile */}
        {!userEmail && !isMobile && (
          <nav className="header-nav" aria-label="Navegação principal">
            <ul className="header-nav-list">
              <li className="header-nav-item">
                <a href="#plataforma" className="header-nav-link">
                  Plataforma
                </a>
              </li>
              <li className="header-nav-item">
                <a href="#jogo" className="header-nav-link">
                  Como funciona o jogo
                </a>
              </li>
              <li className="header-nav-item">
                <a href="#tokens" className="header-nav-link">
                  Tipos de tokens
                </a>
              </li>
              <li className="header-nav-item">
                <a href="#risco" className="header-nav-link">
                  Risco & ética
                </a>
              </li>
            </ul>
          </nav>
        )}

        {/* Lado direito */}
        <div className="header-right">
          {loadingUser ? (
            <></>
          ) : userEmail ? (
            // ===== USUÁRIO LOGADO =====
            <>
              <div className="header-user-info">
                <span className="header-user-greeting">Olá,</span>
                <span className="header-user-name">{displayName}</span>
              </div>

              <button
                type="button"
                className="header-notification-btn"
                aria-label="Notificações"
              >
                🔔
              </button>

              <button
                type="button"
                className="header-cta"
                onClick={handleGoToArena}
              >
                Dashboard
              </button>

              <button
                type="button"
                className="header-cta-secondary"
                onClick={handleSignOut}
              >
                Sair
              </button>
            </>
          ) : (
            // ===== NÃO LOGADO =====
            <button
              type="button"
              className="header-cta"
              onClick={isMobile ? handleGoToArena : handleGoToLogin}
            >
              {isMobile ? "Ir para a Arena" : "Entrar na Arena"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
