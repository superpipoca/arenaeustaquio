// app/components/Footer3ustaquio.tsx
import React from "react";

export default function Footer3ustaquio() {
  return (
    <footer className="footer">
      <div className="container footer-inner-outer">
        <div className="footer-main">
          {/* Bloco de marca */}
          <div className="footer-brand">
            <div className="footer-logo">3USTAQUIO</div>
            <p className="footer-tagline">
              Transparência brutal. Nenhuma promessa de retorno.
            </p>
            <p className="footer-legal">
              3ustaquio não é banco, corretora nem consultoria financeira.
              É uma plataforma de emissão e negociação de tokens de narrativa
              com foco em especulação consciente.
            </p>
          </div>

          {/* Navegação de rodapé */}
          <div className="footer-nav">
            <div className="footer-column">
              <h4 className="footer-heading">Plataforma</h4>
              <ul className="footer-nav-list">
                <li className="footer-nav-item">
                  <a href="#jogo" className="footer-nav-link">
                    Como funciona o jogo
                  </a>
                </li>
                <li className="footer-nav-item">
                  <a href="#tokens" className="footer-nav-link">
                    Tipos de tokens
                  </a>
                </li>
                <li className="footer-nav-item">
                  <a href="#sala" className="footer-nav-link">
                    Sala de Máquina
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Risco & ética</h4>
              <ul className="footer-nav-list">
                <li className="footer-nav-item">
                  <button type="button" className="footer-nav-link footer-nav-link-button">
                    Whitepaper honesto (em breve)
                  </button>
                </li>
                <li className="footer-nav-item">
                  <button type="button" className="footer-nav-link footer-nav-link-button">
                    Diretrizes de risco
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer hardcore */}
        <div className="footer-disclaimer">
          <p>
            Os tokens negociados no 3ustaquio{" "}
            <strong>não são produtos de investimento regulados</strong>. Nenhuma informação
            na plataforma ou nesta página constitui recomendação de investimento.
            Você pode perder <strong>100% do valor colocado</strong> em qualquer token.
            Ao usar a plataforma, você declara entender os riscos e agir por conta própria.
          </p>
        </div>

        <div className="footer-bottom-row">
          <span className="footer-meta">© {new Date().getFullYear()} 3ustaquio – O hacker ético da nova economia.</span>
          <span className="footer-meta">
            Ferramenta, não milagre financeiro.
          </span>
        </div>
      </div>
    </footer>
  );
}
