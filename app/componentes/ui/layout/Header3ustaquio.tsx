// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/app/lib/supabaseClient";

// export default function Header3ustaquio() {
//   const router = useRouter();

//   const [userEmail, setUserEmail] = useState<string | null>(null);
//   const [loadingUser, setLoadingUser] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);

//   const [menuOpen, setMenuOpen] = useState(false);
//   const menuRef = useRef<HTMLDivElement | null>(null);

//   // Carrega usuário logado
//   useEffect(() => {
//     let cancelled = false;

//     async function loadUser() {
//       try {
//         const { data, error } = await supabase.auth.getUser();
//         if (cancelled) return;

//         if (!error && data?.user) {
//           setUserEmail(data.user.email ?? null);
//         } else {
//           setUserEmail(null);
//         }
//       } catch (err) {
//         console.error("[HEADER] Erro ao carregar usuário:", err);
//         if (!cancelled) setUserEmail(null);
//       } finally {
//         if (!cancelled) setLoadingUser(false);
//       }
//     }

//     loadUser();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // Detecta layout responsivo (mobile)
//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const handleResize = () => {
//       const mobileNow = window.innerWidth < 768;
//       setIsMobile(mobileNow);

//       // se virou desktop, fecha dropdown mobile
//       if (!mobileNow) setMenuOpen(false);
//     };

//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Fecha menu ao clicar fora
//   useEffect(() => {
//     if (!menuOpen) return;

//     const onClickOutside = (e: MouseEvent) => {
//       if (!menuRef.current) return;
//       if (!menuRef.current.contains(e.target as Node)) {
//         setMenuOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", onClickOutside);
//     return () => document.removeEventListener("mousedown", onClickOutside);
//   }, [menuOpen]);

//   const handleGoToLogin = () => router.push("/criador/login");
//   const handleGoToArena = () => router.push("/arena");
//   const handleGoToDashboard = () => router.push("/criador/dashboard");

//   const handleSignOut = async () => {
//     try {
//       await supabase.auth.signOut();
//     } catch (err) {
//       console.error("[HEADER] Erro ao sair:", err);
//     } finally {
//       setUserEmail(null);
//       setMenuOpen(false);
//       router.push("/");
//       router.refresh();
//     }
//   };

//   const displayName = userEmail ? userEmail.split("@")[0] : "Criador";

//   return (
//     <header className="site-header">
//       <div className="container header-inner">
//         {/* Marca */}
//         <div className="header-left">
//           <div
//             className="logo-box"
//             onClick={() => router.push("/")}
//             style={{ cursor: "pointer" }}
//           >
//             <span className="logo-text">3USTAQUIO</span>
//             <span className="logo-pill">Hacker ético</span>
//           </div>
//         </div>

//         {/* Navegação desktop quando não logado */}
//         {!userEmail && !isMobile && (
//           <nav className="header-nav" aria-label="Navegação principal">
//             <ul className="header-nav-list">
//               <li className="header-nav-item">
//                 <a href="#plataforma" className="header-nav-link">
//                   Plataforma
//                 </a>
//               </li>
//               <li className="header-nav-item">
//                 <a href="#jogo" className="header-nav-link">
//                   Como funciona o jogo
//                 </a>
//               </li>
//               <li className="header-nav-item">
//                 <a href="#tokens" className="header-nav-link">
//                   Tipos de tokens
//                 </a>
//               </li>
//               <li className="header-nav-item">
//                 <a href="#risco" className="header-nav-link">
//                   Risco & ética
//                 </a>
//               </li>
//             </ul>
//           </nav>
//         )}

//         {/* Direita */}
//         <div className="header-right">
//           {loadingUser ? null : userEmail ? (
//             isMobile ? (
//               // ===== LOGADO MOBILE: COMPACTO (sem overflow) =====
//               <div className="header-mobile" ref={menuRef}>
//                 <button
//                   type="button"
//                   className="header-cta header-cta--sm"
//                   onClick={handleGoToArena}
//                 >
//                   Arena
//                 </button>

//                 <button
//                   type="button"
//                   className="header-icon-btn"
//                   aria-label="Abrir menu"
//                   aria-expanded={menuOpen}
//                   onClick={() => setMenuOpen((v) => !v)}
//                 >
//                   ☰
//                 </button>

//                 {menuOpen && (
//                   <div className="header-mobile-dropdown" role="menu">
//                     <div className="header-mobile-user">
//                       <span className="muted">Logado como</span>
//                       <strong>@{displayName}</strong>
//                     </div>

//                     <button
//                       type="button"
//                       role="menuitem"
//                       className="header-mobile-item"
//                       onClick={() => {
//                         setMenuOpen(false);
//                         handleGoToDashboard();
//                       }}
//                     >
//                       Dashboard
//                     </button>

//                     <button
//                       type="button"
//                       role="menuitem"
//                       className="header-mobile-item"
//                       onClick={() => setMenuOpen(false)}
//                     >
//                       Notificações
//                     </button>

//                     <button
//                       type="button"
//                       role="menuitem"
//                       className="header-mobile-item danger"
//                       onClick={handleSignOut}
//                     >
//                       Sair
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               // ===== LOGADO DESKTOP =====
//               <>
//                 <div className="header-user-info">
//                   <span className="header-user-greeting">Olá,</span>
//                   <span className="header-user-name">{displayName}</span>
//                 </div>

//                 <button
//                   type="button"
//                   className="header-notification-btn"
//                   aria-label="Notificações"
//                 >
//                   🔔
//                 </button>

//                 <button
//                   type="button"
//                   className="header-cta-secondary"
//                   onClick={handleGoToArena}
//                 >
//                   Arena
//                 </button>

//                 <button
//                   type="button"
//                   className="header-cta"
//                   onClick={handleGoToDashboard}
//                 >
//                   Dashboard
//                 </button>

//                 <button
//                   type="button"
//                   className="header-cta-secondary"
//                   onClick={handleSignOut}
//                 >
//                   Sair
//                 </button>
//               </>
//             )
//           ) : (
//             // ===== NÃO LOGADO =====
//             <button
//               type="button"
//               className="header-cta"
//               onClick={isMobile ? handleGoToArena : handleGoToLogin}
//             >
//               {isMobile ? "Ir para a Arena" : "Entrar na Arena"}
//             </button>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs"; // ✅ Mudamos para o Clerk

export default function Header3ustaquio() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser(); // ✅ Hook oficial do Clerk
  const { signOut } = useClerk();

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Detecta layout responsivo (mobile)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const mobileNow = window.innerWidth < 768;
      setIsMobile(mobileNow);

      // se virou desktop, fecha dropdown mobile
      if (!mobileNow) setMenuOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fecha menu ao clicar fora
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

  const handleGoToLogin = () => router.push("/criador/login");
  const handleGoToArena = () => router.push("/arena");
  const handleGoToDashboard = () => router.push("/criador/dashboard");

  const handleSignOut = async () => {
    try {
      // ✅ Logout pelo Clerk
      await signOut(() => router.push("/"));
    } catch (err) {
      console.error("[HEADER] Erro ao sair:", err);
    } finally {
      setMenuOpen(false);
    }
  };

  // ✅ Lógica de Display Name via Clerk
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const displayName = userEmail ? userEmail.split("@")[0] : "Criador";

  // Evita flash de conteúdo deslogado enquanto carrega
  const isLoading = !isLoaded;

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Marca */}
        <div className="header-left">
          <div
            className="logo-box"
            onClick={() => router.push("/")}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-text">3USTAQUIO</span>
            <span className="logo-pill">Hacker ético</span>
          </div>
        </div>

        {/* Navegação desktop quando não logado */}
        {!isSignedIn && !isMobile && (
          <nav className="header-nav" aria-label="Navegação principal">
            <ul className="header-nav-list">
              <li className="header-nav-item">
                <a href="#plataforma" className="header-nav-link">
                  Plataforma
                </a>
              </li>
              <li className="header-nav-item">
                <a href="#jogo" className="header-nav-link">
                  Como funciona
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

        {/* Direita */}
        <div className="header-right">
          {isLoading ? (
             // Placeholder discreto enquanto carrega auth
             <div className="w-20 h-8 bg-white/5 rounded animate-pulse" />
          ) : isSignedIn ? (
            isMobile ? (
              // ===== LOGADO MOBILE: COMPACTO =====
              <div className="header-mobile" ref={menuRef}>
                <button
                  type="button"
                  className="header-cta header-cta--sm"
                  onClick={handleGoToArena}
                >
                  Arena
                </button>

                <button
                  type="button"
                  className="header-icon-btn"
                  aria-label="Abrir menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {/* Ícone User do user ou Hamburger */}
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
                    >
                      Dashboard
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="header-mobile-item danger"
                      onClick={handleSignOut}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ===== LOGADO DESKTOP =====
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
                  className="header-cta-secondary"
                  onClick={handleGoToArena}
                >
                  Arena
                </button>

                <button
                  type="button"
                  className="header-cta"
                  onClick={handleGoToDashboard}
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
            )
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