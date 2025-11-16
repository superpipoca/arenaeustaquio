// app/componentes/ui/layout/header.tsx
import React from "react";
import styles from "./header.module.css";
import Logo3ustaquio from "../brand/Logo3ustaquio"

// Definição de Tipo para os itens de navegação
type NavItem = {
    label: string;
    href: string;
};

// Lista dos itens de navegação
const navItems: NavItem[] = [
    { label: "O Jogo", href: "#jogo" },
    { label: "Tokens", href: "#tokens" },
    { label: "Sala de Máquina", href: "#sala" },
    { label: "Manifesto", href: "#manifesto" },
];

/**
 * Componente de Cabeçalho (Header) principal.
 */
export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.headerInner}>
                    {/* Logo e Tagline */}
                    <a href="#hero" className={styles.logo}>
                        <Logo3ustaquio size="sm" />
                        <span className={styles.logoTagline}>
                            O hacker ético da nova economia
                        </span>
                    </a>


                    {/* Navegação Principal */}
                    <nav className={styles.nav} aria-label="Navegação principal">
                        <ul className={styles.navList}>
                            {navItems.map((item) => (
                                <li key={item.href} className={styles.navItem}>
                                    <a href={item.href} className={styles.navLink}>
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Botão CTA (Call to Action) */}
                    <div className={styles.headerCta}>
                        <a
                            href="#criar-token"
                            className={`${styles.button} ${styles.ctaPrimary}`}
                        >
                            Entrar na arena
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
