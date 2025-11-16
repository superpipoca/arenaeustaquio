// app/page.tsx

import React from "react";
import styles from "./page.module.css";
import Header from "./componentes/ui/layout/header";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>3USTAQUIO</div>
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

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* HERO */}
        <section id="hero" className={styles.hero}>
          <div className={styles.inner}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Plataforma hacker de tokens de narrativa</p>

                <h1 className={styles.heroTitle}>
                  Se você tem nome,
                  <br />
                  você pode ter uma <span className={styles.heroHighlight}>moeda</span>.
                </h1>

                <p className={styles.heroSubtitle}>
                  3ustaquio é a infraestrutura hacker para transformar pessoas, bares e projetos em tokens de narrativa —
                  com hype, risco e transparência brutal. Nós entregamos a ferramenta. O jogo é seu.
                </p>

                <div className={styles.heroActions} id="criar-token">
                  <a href="#jogo" className={`${styles.button} ${styles.ctaPrimary}`}>
                    Criar meu token agora
                  </a>
                  <a href="#tokens" className={`${styles.button} ${styles.ctaGhost}`}>
                    Ver arena de narrativas
                  </a>
                </div>

                <div className={styles.riskNotice}>
                  <span className={styles.riskLabel}>Aviso sério:</span>
                  <p className={styles.riskText}>
                    Você está entrando num jogo de <strong>alto risco</strong>. O preço do seu token pode subir, cair ou
                    virar pó. Se isso te incomoda, esse jogo não é pra você.
                  </p>
                </div>
              </div>

              <aside className={styles.heroTerminal} aria-label="Painel de risco da plataforma">
                <div className={styles.terminalHeader}>
                  <span className={styles.terminalTitle}>Sala de risco // 3ustaquio</span>
                  <span className={styles.badgeDanger}>ALTO RISCO</span>
                </div>
                <div className={styles.terminalBody}>
                  <p className={styles.terminalLine}>&gt; preço pode ir a zero</p>
                  <p className={styles.terminalLine}>&gt; sem promessas de retorno</p>
                  <p className={styles.terminalLine}>&gt; tokens de narrativa, não produtos financeiros</p>
                  <div className={styles.terminalDivider} />
                  <p className={styles.terminalHint}>[ENTER] para assumir o risco e criar sua moeda.</p>
                  <div className={styles.terminalTags}>
                    <span className={styles.tag}>#hackerEtico</span>
                    <span className={styles.tag}>#transparenciaBrutal</span>
                    <span className={styles.tag}>#mercadoDeHistorias</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA O JOGO */}
        <section id="jogo" className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Como funciona o jogo</p>
              <h2 className={styles.sectionTitle}>Não é banco, não é corretora. É arena.</h2>
              <p className={styles.sectionDescription}>
                O 3ustaquio não é intermediário, é catalisador. Aqui você cria sua própria narrativa em forma de token e
                coloca na arena para o mercado decidir se faz sentido — sem maquiagem e sem promessa de riqueza.
              </p>
            </div>

            <div className={styles.cardsGrid}>
              <article className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <span className={styles.cardBadge}>1. Criar</span>
                </div>
                <h3 className={styles.cardTitle}>Crie sua moeda de narrativa</h3>
                <p className={styles.cardBody}>
                  Dê um nome, conte a história, defina supply e regras. Pode ser você, seu bar, sua comunidade ou um
                  projeto maluco que só faz sentido para a sua bolha.
                </p>
                <ul className={styles.cardList}>
                  <li>Tokens de pessoa, local ou projeto.</li>
                  <li>Narrativas curtas, meméticas e sinceras.</li>
                  <li>Whitepaper honesto — incluindo motivos para NÃO comprar.</li>
                </ul>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <span className={styles.cardBadge}>2. Colocar em jogo</span>
                </div>
                <h3 className={styles.cardTitle}>Jogue na arena</h3>
                <p className={styles.cardBody}>
                  Seu token entra na arena: listagem pública, dados abertos, hype à vista. Todo mundo vê preço,
                  liquidez, volume e narrativa — sem truques escondidos.
                </p>
                <ul className={styles.cardList}>
                  <li>Badges de risco: mercado frio, hype, zona de bolha.</li>
                  <li>Histórico de preço e volatilidade em tempo real.</li>
                  <li>Transparência total dos movimentos on-chain.</li>
                </ul>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <span className={styles.cardBadge}>3. Assumir o risco</span>
                </div>
                <h3 className={styles.cardTitle}>O mercado decide. Você assume.</h3>
                <p className={styles.cardBody}>
                  Aqui não existe “investimento seguro”. Existe jogo. Se a narrativa for boa, o mercado responde. Se
                  flopar, o preço acompanha. Os dois cenários sempre estiveram na mesa.
                </p>
                <ul className={styles.cardList}>
                  <li>Nenhuma promessa de lucro ou proteção.</li>
                  <li>Controle total para criar, queimar e encerrar.</li>
                  <li>Você escolhe entrar ou ficar de fora. Sempre.</li>
                </ul>
              </article>
            </div>

            <div className={styles.pillRow}>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Arquétipo</span>
                <span className={styles.pillValue}>Hacker Ético (Trickster + Rebel + Mentor)</span>
              </div>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Promessa</span>
                <span className={styles.pillValue}>Ferramenta e transparência, nunca retorno garantido.</span>
              </div>
            </div>
          </div>
        </section>

        {/* TIPOS DE TOKENS */}
        <section id="tokens" className={styles.sectionAlt}>
          <div className={styles.inner}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Tokens de narrativa</p>
              <h2 className={styles.sectionTitle}>Moedas de gente, lugares e ideias.</h2>
              <p className={styles.sectionDescription}>
                A economia não é só dos grandes. No 3ustaquio, qualquer pessoa pode registrar uma moeda digital sua —
                lastreada ou não — e deixar o mercado especular em cima da narrativa.
              </p>
            </div>

            <div className={styles.cardsGrid}>
              <article className={styles.cardAlt}>
                <span className={styles.cardKicker}>Token Pessoa</span>
                <h3 className={styles.cardTitle}>Moeda de criadores & figuras públicas</h3>
                <p className={styles.cardBody}>
                  Reputação vira código. Comunidade vira liquidez. Seu nome, seu símbolo, sua narrativa — à prova de
                  hype e crítica, como deve ser.
                </p>
                <ul className={styles.cardList}>
                  <li>Creators, streamers, artistas, especialistas.</li>
                  <li>Comunidade participa do jogo, não só do conteúdo.</li>
                  <li>Transparência nas regras e no contrato.</li>
                </ul>
              </article>

              <article className={styles.cardAlt}>
                <span className={styles.cardKicker}>Token Local</span>
                <h3 className={styles.cardTitle}>Bares, padarias, lojas de bairro</h3>
                <p className={styles.cardBody}>
                  O bar mais hypado da rua, a padaria que nunca fecha, a loja que salva o bairro. Tudo isso pode virar
                  token — não como “pontos”, mas como narrativa aberta ao mercado.
                </p>
                <ul className={styles.cardList}>
                  <li>Badges para vantagens locais (se fizer sentido).</li>
                  <li>Especulação em cima de cultura, não de promessa vazia.</li>
                  <li>A comunidade decide se é meme ou patrimônio.</li>
                </ul>
              </article>

              <article className={styles.cardAlt}>
                <span className={styles.cardKicker}>Token de Projeto</span>
                <h3 className={styles.cardTitle}>Squads, missões e loucuras coletivas</h3>
                <p className={styles.cardBody}>
                  DAOs, squads, coletivos, experimentos. Tokens que representam missões específicas — às vezes sérias,
                  às vezes totalmente caóticas.
                </p>
                <ul className={styles.cardList}>
                  <li>Ideal para laboratórios e testes de narrativa.</li>
                  <li>Whitepaper honesto como requisito mínimo.</li>
                  <li>Sem narrativa inflada, sem teatro corporativo.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* SALA DE MÁQUINA */}
        <section id="sala" className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Sala de Máquina</p>
              <h2 className={styles.sectionTitle}>Para quem gosta de ver o código.</h2>
              <p className={styles.sectionDescription}>
                A interface avançada do 3ustaquio expõe parâmetros, contratos, métricas e fluxos para quem quer ir além
                do hype e enxergar a estrutura do jogo.
              </p>
            </div>

            <div className={styles.machineGrid}>
              <div className={styles.machinePanel}>
                <pre className={styles.machineCode}>
                  {`// exemplo ilustrativo
contract NarrativaToken {
  supply       = definido pelo criador;
  narrativa    = história pública e rastreável;
  risco        = sempre alto, sempre explícito;
  transparencia = log de todas as interações;
}

// a verdade é a melhor subversão.`}
                </pre>
              </div>

              <div className={styles.machineList}>
                <h3 className={styles.machineTitle}>O que você enxerga na Sala de Máquina:</h3>
                <ul className={styles.machineItems}>
                  <li>Métricas de liquidez, volume, concentração e volatilidade.</li>
                  <li>Histórico transparente de criação, queima e movimentos relevantes.</li>
                  <li>Alertas de zonas de bolha, mercado frio e hype insano.</li>
                  <li>Configurações avançadas para quem quer explorar o limite da narrativa, sem romper a lei.</li>
                </ul>

                <div className={styles.warningBox}>
                  <h4 className={styles.warningTitle}>Nada aqui é conselho de investimento.</h4>
                  <p className={styles.warningText}>
                    A Sala de Máquina existe para dar transparência técnica — não para te dizer o que fazer com o seu
                    dinheiro. O 3ustaquio é ferramenta, não oráculo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MANIFESTO */}
        <section id="manifesto" className={styles.sectionAlt}>
          <div className={styles.inner}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Manifesto 3ustaquio</p>
              <h2 className={styles.sectionTitle}>A verdade é a melhor subversão.</h2>
              <p className={styles.sectionDescription}>
                Nós não vamos te tratar como criança. Vamos te tratar como adulto que sabe o que está fazendo. Sem promessa
                de retorno, sem teatrinho de segurança, sem lenga-lenga regulatória para parecer mais sério do que é.
              </p>
            </div>

            <div className={styles.manifestoGrid}>
              <div className={styles.manifestoColumn}>
                <h3 className={styles.manifestoTitle}>O que a gente defende:</h3>
                <ul className={styles.manifestoList}>
                  <li>Transparência brutal sobre risco, bolha e especulação.</li>
                  <li>Autonomia total: a decisão é sempre sua, nunca nossa.</li>
                  <li>Anti-paternalismo: sem “caminho seguro”, sem prometer milagre.</li>
                  <li>Responsabilidade ética: nada de golpe, nada de enganar iniciante.</li>
                  <li>Jogo limpo com o sistema: desafiar a narrativa, não a lei.</li>
                </ul>
              </div>

              <div className={styles.manifestoColumn}>
                <h3 className={styles.manifestoTitle}>O que você nunca vai ver aqui:</h3>
                <ul className={styles.manifestoList}>
                  <li>“Investimento seguro”, “renda garantida” ou promessa de multiplicar capital.</li>
                  <li>Teatro de compliance vazio só para parecer respeitável.</li>
                  <li>Comparação direta com produtos regulados como se fosse tudo igual.</li>
                  <li>Empurrar token porque “tá subindo”. Se for isso, a gente fala: você está apostando.</li>
                </ul>

                <div className={styles.calloutBox}>
                  <p className={styles.calloutText}>
                    Se você quer um lugar para testar narrativas com risco real — e com avisos claros — bem-vindo ao 3ustaquio.
                  </p>
                  <a href="#criar-token" className={`${styles.button} ${styles.ctaPrimary}`}>
                    Começar meu experimento
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}