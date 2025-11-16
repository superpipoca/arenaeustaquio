// app/componentes/ui/layout/header.tsx
import React from "react";
import styles from "./header.module.css";
import Logo3ustaquio from "../brand/Logo3ustaquio"

/**
 * Componente de Cabeçalho (Header) principal.
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}><Logo3ustaquio/></div>
            <p className={styles.footerTagline}>Transparência brutal. Nenhuma promessa de retorno.</p>
            <p className={styles.footerLegal}>
              3ustaquio não é banco, corretora nem consultoria financeira. É uma plataforma de emissão e negociação
              de tokens de narrativa com foco em especulação consciente.
            </p>
          </div>

          <div className={styles.footerNav}>
            <div>
              <h4 className={styles.footerHeading}>Plataforma</h4>
              <ul className={styles.footerNavList}>
                <li className={styles.footerNavItem}>
                  <a href="#jogo" className={styles.footerNavLink}>
                    Como funciona o jogo
                  </a>
                </li>
                <li className={styles.footerNavItem}>
                  <a href="#tokens" className={styles.footerNavLink}>
                    Tipos de tokens
                  </a>
                </li>
                <li className={styles.footerNavItem}>
                  <a href="#sala" className={styles.footerNavLink}>
                    Sala de Máquina
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className={styles.footerHeading}>Risco & ética</h4>
              <ul className={styles.footerNavList}>
                <li className={styles.footerNavItem}>
                  <button type="button" className={styles.footerNavLink}>
                    Whitepaper honesto (em breve)
                  </button>
                </li>
                <li className={styles.footerNavItem}>
                  <button type="button" className={styles.footerNavLink}>
                    Diretrizes de risco
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.footerDisclaimer}>
          <p>
            Os tokens negociados no 3ustaquio <strong>não são produtos de investimento regulados</strong>. Nenhuma
            informação aqui constitui recomendação de investimento. Você pode perder 100% do valor colocado em qualquer
            token. Ao usar a plataforma, você declara entender os riscos e agir por conta própria.
          </p>
        </div>
      </div>
    </footer>
  );
}
