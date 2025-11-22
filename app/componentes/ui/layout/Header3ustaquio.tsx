"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";

const LS_FLOW = "pending_flow";
const LS_EMAIL = "pending_email";

const withTimeout = async <T,>(p: Promise<T>, ms = 12000) => {
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

export default function Header3ustaquio() {
  const router = useRouter();

  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { signOut } = useClerk();

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const [forcedSignedOut, setForcedSignedOut] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const mobileNow = window.innerWidth < 768;
      setIsMobile(mobileNow);
      if (!mobileNow) setMenuOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  // ✅ agora login padrão vai pra /login
  const handleGoToLogin = () => router.push("/login");
  const handleGoToArena = () => router.push("/arena");
  const handleGoToDashboard = () => router.push("/criador/dashboard");

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    setForcedSignedOut(true);
    setMenuOpen(false);

    try {
      await withTimeout(signOut({ redirectUrl: "/" } as any), 12000);
    } catch (err) {
      console.warn("[HEADER] signOut redirect falhou, tentando signOut simples", err);
      try {
        await withTimeout(signOut(), 8000);
      } catch (err2) {
        console.error("[HEADER] signOut falhou mesmo assim:", err2);
      }
    } finally {
      try {
        localStorage.removeItem(LS_FLOW);
        localStorage.removeItem(LS_EMAIL);
        localStorage.removeItem("last_auth_strategy");
        sessionStorage?.clear?.();
      } catch {}

      window.location.replace("/");
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const displayName = useMemo(() => {
    if (!userEmail) return "Criador";
    return userEmail.split("@")[0];
  }, [userEmail]);

  const isLoading = !authLoaded || !userLoaded;
  const signedInStable = authLoaded && isSignedIn && !forcedSignedOut;

  return (
    <header className="site-header">
      {signingOut && (
        <div className="signout-overlay" aria-live="assertive">
          <div className="signout-card">
            <div className="signout-title">Saindo...</div>
            <div className="signout-sub">Encerrando sessão com segurança.</div>
          </div>
        </div>
      )}

      <div className="container header-inner">
        <div className="header-left">
          <div
            className="logo-box"
            onClick={() => !signingOut && router.push("/")}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-text">3USTAQUIO</span>
            <span className="logo-pill">Hacker ético</span>
          </div>
        </div>

        {!signedInStable && !isMobile && (
          <nav className="header-nav" aria-label="Navegação principal">
            <ul className="header-nav-list">
              <li className="header-nav-item">
                <a href="#plataforma" className="header-nav-link">Plataforma</a>
              </li>
              <li className="header-nav-item">
                <a href="#jogo" className="header-nav-link">Como funciona</a>
              </li>
              <li className="header-nav-item">
                <a href="#risco" className="header-nav-link">Risco & ética</a>
              </li>
            </ul>
          </nav>
        )}

        <div className="header-right">
          {isLoading ? (
            <div className="w-20 h-8 bg-white/5 rounded animate-pulse" />
          ) : signedInStable ? (
            isMobile ? (
              <div className="header-mobile" ref={menuRef}>
                <button
                  type="button"
                  className="header-cta header-cta--sm"
                  onClick={handleGoToArena}
                  disabled={signingOut}
                >
                  Arena
                </button>

                <button
                  type="button"
                  className="header-icon-btn"
                  aria-label="Abrir menu"
                  aria-expanded={menuOpen}
                  onClick={() => !signingOut && setMenuOpen((v) => !v)}
                  disabled={signingOut}
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Perfil"
                      className="w-8 h-8 rounded-full border border-neutral-700 object-cover"
                    />
                  ) : (
                    "☰"
                  )}
                </button>

                {menuOpen && (
                  <div className="header-mobile-dropdown" role="menu">
                    <div className="header-mobile-user">
                      <span className="muted">Logado como</span>
                      <strong>@{displayName}</strong>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      className="header-mobile-item"
                      onClick={() => {
                        setMenuOpen(false);
                        handleGoToDashboard();
                      }}
                      disabled={signingOut}
                    >
                      Dashboard
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="header-mobile-item danger"
                      disabled={signingOut}
                      onClick={handleSignOut}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="header-user-info">
                  <span className="header-user-greeting">Olá,</span>
                  <span className="header-user-name">{displayName}</span>
                </div>

                <button
                  type="button"
                  className="header-notification-btn"
                  aria-label="Notificações"
                  disabled={signingOut}
                >
                  🔔
                </button>

                <button
                  type="button"
                  className="header-cta-secondary"
                  onClick={handleGoToArena}
                  disabled={signingOut}
                >
                  Arena
                </button>

                <button
                  type="button"
                  className="header-cta"
                  onClick={handleGoToDashboard}
                  disabled={signingOut}
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  className="header-cta-secondary"
                  disabled={signingOut}
                  onClick={handleSignOut}
                >
                  Sair
                </button>
              </>
            )
          ) : (
            <button
              type="button"
              className="header-cta"
              onClick={isMobile ? handleGoToArena : handleGoToLogin}
              disabled={signingOut}
            >
              {isMobile ? "Ir para a Arena" : "Entrar na Arena"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
