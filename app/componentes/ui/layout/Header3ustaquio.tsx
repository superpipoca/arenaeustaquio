// app/components/Header3ustaquio.tsx
"use client";

import React from "react";

export default function Header3ustaquio() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Logo / Marca */}
        <div className="header-left">
          <div className="logo-box">
            <span>3USTAQUIO</span>
            <span className="logo-pill">Hacker ético</span>
          </div>
        </div>

        {/* Navegação principal */}
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


        <button type="button" className="header-cta">
          Entrar na Arena
        </button>

      </div>
    </header>
  );
}
