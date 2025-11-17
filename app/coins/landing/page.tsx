// // app/page.tsx

// "use client";

// import React, { useEffect, useState } from "react";
// import styles from "./page.module.css";

// type NavItem = {
//   label: string;
//   href: string;
// };

// const navItems: NavItem[] = [
//   { label: "A Moeda", href: "#moeda" },
//   { label: "A Streamer", href: "#criadora" },
//   { label: "Tokenomics", href: "#tokenomics" },
//   { label: "Whitepaper Honesto", href: "#whitepaper" },
//   { label: "Risco Real", href: "#risco" },
// ];

// const typingPhrases = [
//   "moeda de hype.",
//   "moeda nova em teste.",
//   "moeda da streamer.",
//   "moeda de caos controlado.",
// ];

// function HeroTyping() {
//   const [text, setText] = useState("");
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [phraseIndex, setPhraseIndex] = useState(0);

//   useEffect(() => {
//     const current = typingPhrases[phraseIndex];
//     const isComplete = !isDeleting && text === current;
//     const isEmpty = isDeleting && text === "";

//     let timeout = 90;

//     if (isComplete) {
//       timeout = 1000; // pausa com a frase completa
//     } else if (isEmpty) {
//       timeout = 400; // pausa entre frases
//     }

//     const handle = setTimeout(() => {
//       if (isComplete) {
//         setIsDeleting(true);
//         return;
//       }

//       if (isEmpty) {
//         setIsDeleting(false);
//         setPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
//         return;
//       }

//       const nextLength = text.length + (isDeleting ? -1 : 1);
//       setText(current.slice(0, nextLength));
//     }, timeout);

//     return () => clearTimeout(handle);
//   }, [text, isDeleting, phraseIndex]);

//   return (
//     <span className={styles.heroHighlight}>
//       {text}
//       <span className={styles.heroCursor}>|</span>
//     </span>
//   );
// }

// function Header() {
//   return (
//     <header className={styles.header}>
//       <div className={styles.inner}>
//         <div className={styles.headerInner}>
//           <a href="#hero" className={styles.logo}>
//             <span className={styles.logoMark}>TOXX</span>
//             <span className={styles.logoTagline}>Moeda da streamer de TikTok</span>
//           </a>

//           <nav className={styles.nav} aria-label="Navegação principal">
//             <ul className={styles.navList}>
//               {navItems.map((item) => (
//                 <li key={item.href} className={styles.navItem}>
//                   <a href={item.href} className={styles.navLink}>
//                     {item.label}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </nav>

//           <div className={styles.headerCta}>
//             <a href="#comprar" className={`${styles.button} ${styles.ctaPrimary}`}>
//               Entrar no jogo
//             </a>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }

// function Footer() {
//   return (
//     <footer className={styles.footer}>
//       <div className={styles.inner}>
//         <div className={styles.footerInner}>
//           <div className={styles.footerBrand}>
//             <div className={styles.footerLogo}>TOXX</div>
//             <p className={styles.footerTagline}>
//               Token de narrativa de alto risco da streamer TOXX, emitido na arena 3ustaquio.
//             </p>
//             <p className={styles.footerLegal}>
//               TOXX é um token de narrativa altamente especulativo, listado na plataforma 3ustaquio. Não é produto de
//               investimento regulado, não é recomendação financeira e não garante qualquer tipo de retorno.
//             </p>
//           </div>

//           <div className={styles.footerNav}>
//             <div>
//               <h4 className={styles.footerHeading}>Explorar</h4>
//               <ul className={styles.footerNavList}>
//                 <li className={styles.footerNavItem}>
//                   <a href="#moeda" className={styles.footerNavLink}>
//                     Sobre a moeda TOXX
//                   </a>
//                 </li>
//                 <li className={styles.footerNavItem}>
//                   <a href="#tokenomics" className={styles.footerNavLink}>
//                     Tokenomics & mecânicas
//                   </a>
//                 </li>
//                 <li className={styles.footerNavItem}>
//                   <a href="#whitepaper" className={styles.footerNavLink}>
//                     Whitepaper honesto
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             <div>
//               <h4 className={styles.footerHeading}>Powered by</h4>
//               <ul className={styles.footerNavList}>
//                 <li className={styles.footerNavItem}>
//                   <button type="button" className={styles.footerNavLink}>
//                     3ustaquio – Bolsa de narrativas
//                   </button>
//                 </li>
//                 <li className={styles.footerNavItem}>
//                   <button type="button" className={styles.footerNavLink}>
//                     Manual do Hacker Ético
//                   </button>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>

//         <div className={styles.footerDisclaimer}>
//           <p>
//             O token TOXX <strong>não é produto de investimento regulado</strong>. Comprar, manter ou vender TOXX é uma
//             decisão de alto risco, que pode resultar em perda total do valor colocado. Nada nesta página é promessa de
//             retorno, renda futura ou aconselhamento financeiro.
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }

// export default function HomePage() {
//   return (
//     <div className={styles.page}>
//       <Header />

//       <main className={styles.main}>
//         {/* HERO */}
//         <section id="hero" className={styles.hero}>
//           <div className={styles.inner}>
//             <div className={styles.heroGrid}>
//               <div className={styles.heroCopy}>
//                 <p className={styles.eyebrow}>Token de narrativa // Powered by 3ustaquio</p>

//                 <h1 className={styles.heroTitle}>
//                   A streamer virou
//                   <br />
//                   <HeroTyping />
//                 </h1>

//                 <p className={styles.heroSubtitle}>
//                   TOXX é o token especulativo da streamer de TikTok que vive de lives caóticas, cortes virais e chat
//                   acelerado. Agora, o hype dela virou código – e o mercado decide quanto essa história vale.
//                 </p>

//                 <div className={styles.heroActions} id="comprar">
//                   <a href="#moeda" className={`${styles.button} ${styles.ctaPrimary}`}>
//                     Entender a moeda TOXX
//                   </a>
//                   <a href="#tokenomics" className={`${styles.button} ${styles.ctaGhost}`}>
//                     Ver tokenomics e riscos
//                   </a>
//                 </div>

//                 <div className={styles.riskNotice}>
//                   <span className={styles.riskLabel}>Aviso sério:</span>
//                   <p className={styles.riskText}>
//                     TOXX é jogo de <strong>alto risco</strong> em cima de narrativa. O preço pode subir, despencar ou
//                     simplesmente morrer. Se isso te incomoda, essa moeda não é para você.
//                   </p>
//                 </div>
//               </div>

//               <aside className={styles.heroTerminal} aria-label="Painel de hype da TOXX">
//                 <div className={styles.terminalHeader}>
//                   <span className={styles.terminalTitle}>Painel de Hype // TOXX</span>
//                   <span className={styles.badgeDanger}>ALTO RISCO</span>
//                 </div>
//                 <div className={styles.terminalBody}>
//                   <p className={styles.terminalLine}>&gt; origem: lives diárias no TikTok</p>
//                   <p className={styles.terminalLine}>&gt; combustível: cortes virais + chat frenético</p>
//                   <p className={styles.terminalLine}>&gt; status: narrativa aberta à especulação</p>
//                   <div className={styles.terminalDivider} />
//                   <p className={styles.terminalHint}>
//                     [ENTER] para assumir o risco e participar do hype. Nenhuma promessa de retorno.
//                   </p>
//                   <div className={styles.terminalTags}>
//                     <span className={styles.tag}>#streamerDeTikTok</span>
//                     <span className={styles.tag}>#hypeConsciente</span>
//                     <span className={styles.tag}>#tokenDeNarrativa</span>
//                   </div>
//                 </div>
//               </aside>
//             </div>
//           </div>
//         </section>

//         {/* A MOEDA */}
//         <section id="moeda" className={styles.section}>
//           <div className={styles.inner}>
//             <div className={styles.sectionHeader}>
//               <p className={styles.sectionKicker}>A moeda TOXX</p>
//               <h2 className={styles.sectionTitle}>Não é fã-clube. É mercado de hype.</h2>
//               <p className={styles.sectionDescription}>
//                 TOXX não é ponto, não é cashback, não é programa de fidelidade. É um token especulativo baseado na
//                 narrativa de uma streamer que vive de atenção, caos controlado e comunidade. Se o hype cresce, o mercado
//                 reage. Se esfria, o preço acompanha.
//               </p>
//             </div>

//             <div className={styles.cardsGrid}>
//               <article className={styles.card}>
//                 <div className={styles.cardHeaderRow}>
//                   <span className={styles.cardBadge}>1. Stream</span>
//                 </div>
//                 <h3 className={styles.cardTitle}>Lives, clipes e caos calculado</h3>
//                 <p className={styles.cardBody}>
//                   O conteúdo da TOXX – lives, cortes, reacts e tretas – é o pano de fundo da narrativa. O token não
//                   depende de uma única ação, mas da percepção coletiva sobre a relevância dela no jogo.
//                 </p>
//                 <ul className={styles.cardList}>
//                   <li>Lives frequentes e presença constante em trends.</li>
//                   <li>Momentos de pico viram combustível de hype.</li>
//                   <li>Nenhum evento específico garante valorização.</li>
//                 </ul>
//               </article>

//               <article className={styles.card}>
//                 <div className={styles.cardHeaderRow}>
//                   <span className={styles.cardBadge}>2. Comunidade</span>
//                 </div>
//                 <h3 className={styles.cardTitle}>Chat, memes e decisões coletivas</h3>
//                 <p className={styles.cardBody}>
//                   A comunidade pode propor usos simbólicos para o token – desafios, votações, metas de live – desde que
//                   fique claro: isso não transforma TOXX em promessa de recompensa financeira.
//                 </p>
//                 <ul className={styles.cardList}>
//                   <li>Enquetes e rituais de chat vinculados à moeda.</li>
//                   <li>Eventos da comunidade que reforçam a narrativa.</li>
//                   <li>Nenhum benefício obrigatório ou garantido.</li>
//                 </ul>
//               </article>

//               <article className={styles.card}>
//                 <div className={styles.cardHeaderRow}>
//                   <span className={styles.cardBadge}>3. Mercado</span>
//                 </div>
//                 <h3 className={styles.cardTitle}>Especulação à vista, sem maquiagem</h3>
//                 <p className={styles.cardBody}>
//                   TOXX é negociado como token de narrativa na arena 3ustaquio. Preço, liquidez e volume são públicos.
//                   Nada de promessa de “subir para sempre”. É jogo adulto, com risco explícito.
//                 </p>
//                 <ul className={styles.cardList}>
//                   <li>Cotações em tempo real na plataforma.</li>
//                   <li>Histórico transparente de movimentos relevantes.</li>
//                   <li>Badges de risco: zona fria, hype, bolha.</li>
//                 </ul>
//               </article>
//             </div>
//           </div>
//         </section>

//         {/* A STREAMER */}
//         <section id="criadora" className={styles.sectionAlt}>
//           <div className={styles.inner}>
//             <div className={styles.sectionHeader}>
//               <p className={styles.sectionKicker}>Quem é a TOXX?</p>
//               <h2 className={styles.sectionTitle}>Uma personagem construída ao vivo, todos os dias.</h2>
//               <p className={styles.sectionDescription}>
//                 TOXX é uma streamer fictícia, símbolo de uma geração que transforma rotina em conteúdo e atenção em
//                 moeda. Essa landing exemplifica como um criador poderia ter sua própria moeda de narrativa – com riscos
//                 claros e sem promessas impossíveis.
//               </p>
//             </div>

//             <div className={styles.machineGrid}>
//               <div className={styles.machinePanel}>
//                 <pre className={styles.machineCode}>
//                   {`// persona // TOXX
// streamer.tiktok = {
//   vibes: ['caos controlado', 'chat acelerado', 'memes internos'],
//   rotina: ['lives noturnas', 'clipes diários', 'colabs ocasionais'],
//   regra_geral: 'sem filtro sobre o jogo, sem promessa de riqueza',
// };

// // moeda // TOXX
// moeda.narrativa = 'se o hype dela faz barulho, o mercado decide o preço';`}
//                 </pre>
//               </div>

//               <div className={styles.machineList}>
//                 <h3 className={styles.machineTitle}>O que importa para o token TOXX:</h3>
//                 <ul className={styles.machineItems}>
//                   <li>Consistência de presença: lives, clipes, engajamento real.</li>
//                   <li>Narrativa clara: quem é a TOXX, por que as pessoas assistem?</li>
//                   <li>Alinhamento ético: nada de golpe, nada de enganar iniciante.</li>
//                   <li>Transparência: disclaimers claros em toda comunicação envolvendo o token.</li>
//                 </ul>

//                 <div className={styles.warningBox}>
//                   <h4 className={styles.warningTitle}>Importante:</h4>
//                   <p className={styles.warningText}>
//                     Ter um token não significa ter acesso garantido à streamer, benefícios exclusivos vitalícios ou
//                     qualquer tipo de participação societária. É narrativa especulativa, não contrato de serviço.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* TOKENOMICS */}
//         <section id="tokenomics" className={styles.section}>
//           <div className={styles.inner}>
//             <div className={styles.sectionHeader}>
//               <p className={styles.sectionKicker}>Tokenomics</p>
//               <h2 className={styles.sectionTitle}>Como o jogo da TOXX foi desenhado.</h2>
//               <p className={styles.sectionDescription}>
//                 Os números abaixo são ilustrativos e mostram um modelo possível de distribuição. O ponto central não é a
//                 "perfeição financeira", e sim a clareza brutal: TOXX é jogo de risco baseado em narrativa.
//               </p>
//             </div>

//             <div className={styles.cardsGrid}>
//               <article className={styles.cardAlt}>
//                 <span className={styles.cardKicker}>Supply</span>
//                 <h3 className={styles.cardTitle}>1.000.000 TOXX</h3>
//                 <p className={styles.cardBody}>
//                   Supply fixo, sem emissão infinita. Mudanças futuras exigem comunicação transparente e aceite explícito
//                   da comunidade.
//                 </p>
//                 <ul className={styles.cardList}>
//                   <li>40% liquidez inicial na arena 3ustaquio.</li>
//                   <li>30% reserva da criadora (com vesting claro).</li>
//                   <li>30% pool para campanhas, colabs e experimentos.</li>
//                 </ul>
//               </article>

//               <article className={styles.cardAlt}>
//                 <span className={styles.cardKicker}>Mecânica</span>
//                 <h3 className={styles.cardTitle}>Narrativa, não dividendo.</h3>
//                 <p className={styles.cardBody}>
//                   TOXX não paga rendimento automático, não distribui lucros e não garante recompensas. Qualquer uso
//                   simbólico (votos, desafios, metas de live) deve ser comunicado como experiência, não como retorno
//                   financeiro.
//                 </p>
//                 <ul className={styles.cardList}>
//                   <li>Sem staking milagroso ou renda passiva garantida.</li>
//                   <li>Foco em experiências, desafios e decisões de comunidade.</li>
//                   <li>Risco total assumido por quem entra no jogo.</li>
//                 </ul>
//               </article>

//               <article className={styles.cardAlt}>
//                 <span className={styles.cardKicker}>Infraestrutura</span>
//                 <h3 className={styles.cardTitle}>Rodando na arena 3ustaquio.</h3>
//                 <p className={styles.cardBody}>
//                   TOXX existe como exemplo de token de narrativa dentro da infraestrutura hacker 3ustaquio – com
//                   transparência de contratos, métricas e histórico de movimentos.
//                 </p>
//                 <ul className={styles.cardList}>
//                   <li>Contrato auditável e parâmetros públicos.</li>
//                   <li>Métricas de liquidez, volume e concentração visíveis.</li>
//                   <li>Alertas de zona fria, hype e bolha para o usuário.</li>
//                 </ul>
//               </article>
//             </div>
//           </div>
//         </section>

//         {/* WHITEPAPER HONESTO */}
//         <section id="whitepaper" className={styles.sectionAlt}>
//           <div className={styles.inner}>
//             <div className={styles.sectionHeader}>
//               <p className={styles.sectionKicker}>Whitepaper honesto // TOXX</p>
//               <h2 className={styles.sectionTitle}>
//                 Por que a TOXX existe — e por que talvez você devesse ficar de fora.
//               </h2>
//               <p className={styles.sectionDescription}>
//                 Essa seção é a tradução em linguagem direta do manual de marca do 3ustaquio para a moeda TOXX.
//                 Quem criou, qual é a tese de narrativa, motivos legítimos para entrar no jogo — e, principalmente,
//                 motivos legítimos para não comprar.
//               </p>
//             </div>

//             <div className={styles.whitepaperGrid}>
//               <div className={styles.whitepaperColumn}>
//                 <h3 className={styles.whitepaperTitle}>Quem inventou a TOXX</h3>
//                 <ul className={styles.whitepaperList}>
//                   <li>
//                     A personagem TOXX nasce como símbolo de streamer de TikTok que vive de atenção, caos controlado
//                     e comunidade — nada de “guru de investimento”.
//                   </li>
//                   <li>
//                     A moeda foi desenhada em conjunto com a infraestrutura hacker 3ustaquio, como experimento de
//                     <strong> moeda de gente </strong> – uma narrativa em forma de token.
//                   </li>
//                   <li>
//                     TOXX não representa participação societária na criadora, nem quota de faturamento, direitos
//                     autorais ou qualquer promessa de fluxo de caixa futuro.
//                   </li>
//                 </ul>

//                 <h3 className={styles.whitepaperTitle}>O que a TOXX está testando no mercado</h3>
//                 <ul className={styles.whitepaperList}>
//                   <li>
//                     Se uma narrativa de streamer caótica consegue sustentar um token puramente especulativo,
//                     com risco explícito desde o primeiro clique.
//                   </li>
//                   <li>
//                     Como a comunidade reage quando o hype sobe e desce, sabendo desde o início que o preço pode ir a zero.
//                   </li>
//                   <li>
//                     Se é possível jogar o jogo da especulação sem teatro de “produto sério” e sem prometer milagre financeiro.
//                   </li>
//                 </ul>
//               </div>

//               <div className={styles.whitepaperColumn}>
//                 <h3 className={styles.whitepaperTitle}>Motivos legítimos para comprar TOXX</h3>
//                 <ul className={styles.whitepaperList}>
//                   <li>
//                     Você entende que TOXX é um token de narrativa, de <strong>alto risco</strong>, e quer
//                     experimentar esse tipo de jogo de forma consciente.
//                   </li>
//                   <li>
//                     Você acompanha o conteúdo da TOXX e quer participar da história de forma simbólica,
//                     não como “investidor profissional”.
//                   </li>
//                   <li>
//                     Você está usando apenas dinheiro que pode perder 100%, sem afetar contas, reserva de
//                     emergência ou objetivos importantes da sua vida real.
//                   </li>
//                 </ul>

//                 <h3 className={styles.whitepaperTitle}>Motivos legítimos para NÃO comprar TOXX</h3>
//                 <ul className={styles.whitepaperList}>
//                   <li>Você procura algo “seguro”, “garantido” ou “melhor que renda fixa”.</li>
//                   <li>Você precisa desse dinheiro para aluguel, comida, saúde ou qualquer necessidade básica.</li>
//                   <li>Você está entrando só porque alguém disse que “vai explodir” ou porque viu uma alta recente.</li>
//                   <li>Oscilações fortes de preço te deixam ansioso ou te fazem tomar decisões impulsivas.</li>
//                 </ul>

//                 <div className={styles.calloutBox}>
//                   <p className={styles.calloutText}>
//                     Regra prática da casa: se parece promessa de retorno garantido, não é TOXX e não é 3ustaquio.
//                     Aqui o jogo é de especulação consciente, com transparência brutal sobre o risco.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* RISCO REAL */}
//         <section id="risco" className={styles.sectionAlt}>
//           <div className={styles.inner}>
//             <div className={styles.sectionHeader}>
//               <p className={styles.sectionKicker}>Risco real</p>
//               <h2 className={styles.sectionTitle}>A verdade é a melhor subversão.</h2>
//               <p className={styles.sectionDescription}>
//                 Não vamos te tratar como criança. TOXX é um token de narrativa com risco extremo, ligado a atenção, moda
//                 e comportamento de público em uma plataforma volátil como o TikTok. Se isso te parece instável, é porque
//                 é mesmo.
//               </p>
//             </div>

//             <div className={styles.manifestoGrid}>
//               <div className={styles.manifestoColumn}>
//                 <h3 className={styles.manifestoTitle}>O que você precisa saber antes de entrar:</h3>
//                 <ul className={styles.manifestoList}>
//                   <li>O preço de TOXX pode ir a zero e nunca mais se recuperar.</li>
//                   <li>O aumento de preço, se acontecer, pode ser puramente especulativo.</li>
//                   <li>
//                     A streamer pode mudar de plano, sumir, pivotar o conteúdo – isso impacta a narrativa e o mercado.
//                   </li>
//                   <li>
//                     Nada aqui garante acesso vitalício, presença em eventos ou qualquer vantagem obrigatória.
//                   </li>
//                   <li>Você entra porque quer jogar esse jogo – não porque alguém prometeu retorno.</li>
//                 </ul>
//               </div>

//               <div className={styles.manifestoColumn}>
//                 <h3 className={styles.manifestoTitle}>O que TOXX não é e nunca será:</h3>
//                 <ul className={styles.manifestoList}>
//                   <li>“Investimento seguro”, “aporte garantido” ou aposentadoria antecipada.</li>
//                   <li>Contrato de renda fixa, produto financeiro regulado ou título de crédito.</li>
//                   <li>Atalho mágico para ficar rico acompanhando uma streamer.</li>
//                   <li>
//                     Licença para enganar iniciantes. Qualquer comunicação deve reforçar que é jogo especulativo.
//                   </li>
//                 </ul>

//                 <div className={styles.calloutBox}>
//                   <p className={styles.calloutText}>
//                     Se você entende que TOXX é um experimento de narrativa em forma de token – e aceita o risco total –
//                     você está pronto para entrar na arena. Caso contrário, o movimento mais sábio é não comprar.
//                   </p>
//                   <a href="#hero" className={`${styles.button} ${styles.ctaGhost}`}>
//                     Voltar ao topo e repensar
//                   </a>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       </main>

//       <Footer />
//     </div>
//   );
// }
import React from "react";

export default function Page() {
  return (
    <>
      <header>
        <div className="container header-inner">
          <div className="logo-box">
            <span>3USTAQUIO</span>
            <span className="logo-pill">Hacker ético</span>
          </div>
          <div className="header-note">
            Tela pensada para conversar com donos de negócios locais.
            <br />
            Ferramenta, não promessa de investimento.
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          {/* HERO PITCH */}
          <section className="hero">
            <div>
              <div className="hero-kicker">Pitch de negociação</div>
              <h1 className="hero-title">
                Seu <span>bar/padaria</span> já tem fila.
                <br />
                Agora pode ter uma moeda.
              </h1>
              <p className="hero-subtitle">
                A ideia é direta: transformar o hype que você já tem no bairro em um token de
                narrativa. Sem papo de “investimento garantido”, sem juridiquês de banco. É jogo
                assumido, com risco explícito.
              </p>

              <ul className="hero-bullets">
                <li>Você não precisa virar especialista em cripto nem mexer em contrato.</li>
                <li>Nós cuidamos da parte técnica, você cuida da história do seu lugar.</li>
                <li>Se a comunidade abraçar, o token ganha vida. Se não, tudo bem: foi experimento.</li>
              </ul>

              <div className="hero-ctas-row">
                <button type="button" className="btn-primary">
                  Quero ver um exemplo de bar
                </button>
                <button type="button" className="btn-outline">
                  Quero entender os riscos antes
                </button>
              </div>
            </div>

            <aside className="hero-right-card">
              <div className="hero-right-header">
                <div className="hero-right-title">Exemplo rápido</div>
                <div className="hero-right-badge">Caso simulado</div>
              </div>
              <div className="hero-right-body">
                <p>
                  <strong>Bar Zé</strong> criou o token SHOTZ.
                </p>
                <p>
                  Clientes começaram a brincar de “apostar” se o bar ia lotar mais nos fins de
                  semana.
                </p>
                <p>
                  O token virou assunto, trouxe gente nova e deu gás pra ativações especiais (sem
                  promessa de lucro garantido pra ninguém).
                </p>

                <div className="mini-metric-row">
                  <div className="mini-metric">
                    <div className="mini-metric-label">Variação 30 dias</div>
                    <div className="mini-metric-value pos">+58% (pico)</div>
                  </div>
                  <div className="mini-metric">
                    <div className="mini-metric-label">Queda máxima</div>
                    <div className="mini-metric-value neg">-41% (pós-hype)</div>
                  </div>
                </div>

                <p className="hero-right-note">
                  Isso é ilustração. Na vida real, o token pode subir, cair ou simplesmente não
                  andar. Nosso compromisso é deixar isso claro desde o começo.
                </p>
              </div>
            </aside>
          </section>

          {/* PRA QUEM É / DOR DO DONO */}
          <section>
            <div className="section-header">
              <div className="section-label">Pra quem faz sentido</div>
              <h2 className="section-title">
                Se o seu lugar já tem história, o resto é código
              </h2>
              <p className="section-subtitle">
                O 3ustaquio não transforma qualquer esquina em “ativo incrível”. Ele só dá
                ferramenta pra quem já tem narrativa forte explorar isso como jogo de mercado.
              </p>
            </div>

            <div className="grid-3">
              <div className="card">
                <h3>Seu tipo de negócio</h3>
                <p>
                  Bares, padarias, barbearias, casas de show, lojas de bairro que já têm cliente
                  fiel e história pra contar.
                </p>
                <ul className="list-check">
                  <li>Gente que volta sempre.</li>
                  <li>Histórias que viram piada de balcão.</li>
                  <li>Apelo local forte.</li>
                </ul>
              </div>

              <div className="card">
                <h3>Suas dores hoje</h3>
                <p>Concorrência copiando o que você faz, mídia cara e pouco previsível.</p>
                <ul className="list-check">
                  <li>Sua marca é forte, mas pouco medida.</li>
                  <li>Promoção vira briga de preço.</li>
                  <li>Hype do bairro não vira dado.</li>
                </ul>
              </div>

              <div className="card">
                <h3>O que o token muda</h3>
                <p>
                  Você ganha um “termômetro” de narrativa: se a galera acredita em você a ponto de
                  colocar dinheiro no jogo.
                </p>
                <ul className="list-check">
                  <li>Mais assunto em volta da marca.</li>
                  <li>Possibilidade de ativações com holders.</li>
                  <li>Estudo real de hype, sem maquiagem.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ROTEIRO DE CONVERSA (PITCH FALADO) */}
          <section>
            <div className="section-header">
              <div className="section-label">Script de conversa</div>
              <h2 className="section-title">Como explicar em 3 minutos</h2>
              <p className="section-subtitle">
                Um roteiro pra você ou alguém do time apresentar o 3ustaquio pro dono do negócio,
                sem papo enrolado.
              </p>
            </div>

            <div className="two-cols">
              <div className="speech-block">
                <div className="speech-label">Parte 1 — Ligando com a realidade dele</div>

                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “Hoje o seu lugar já é meio
                  tokenizado sem você perceber. A fila na porta, as stories da galera, o comentário
                  no grupo do bairro… tudo isso é gente apostando na sua história.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “O que a gente faz com o 3ustaquio é
                  só assumir esse jogo de vez: transformar essa narrativa em um token. Não é
                  investimento garantido, não é promessa de lucro. É mercado de histórias.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Dono:</span> “Tá, mas o que eu ganho com isso na
                  prática?”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “Mais conversa em volta da sua
                  marca, possibilidade de ativações com quem tem o token e dados reais de hype. Se
                  o bairro te ama de verdade, isso aparece. Se não, também aparece. A diferença é
                  que aqui ninguém finge que é investimento seguro.”
                </div>
              </div>

              <div className="speech-block">
                <div className="speech-label">Parte 2 — Risco e responsabilidade</div>

                <div className="speech-line">
                  <span className="speech-speaker">Dono:</span> “Mas isso não vai dar problema pra
                  mim?”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “O 3ustaquio é uma plataforma de
                  especulação consciente. A gente deixa escrito em todo lugar que o preço pode ir a
                  zero e que ninguém aqui está vendendo investimento seguro. Nosso papel é ser
                  ferramenta, não banco.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “Se você topar, a gente cria um
                  token da sua casa, com whitepaper honesto explicando o que é, o que não é e por
                  que algumas pessoas talvez não devam comprar.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você (fechando):</span> “Se faz sentido pra você
                  virar esse experimento — com tudo às claras — a gente segue. Se a ideia de ver
                  gente especulando em cima da sua marca te incomoda, é melhor não fazer. E tá tudo
                  bem.”
                </div>
              </div>
            </div>

            <div className="warning-strip">
              <strong>Importante:</strong> em todo pitch, a linha é essa: você está convidando o
              dono do negócio para um experimento de narrativa e especulação, não oferecendo
              investimento garantido, plano de aposentadoria ou “renda extra sem risco”.
            </div>
          </section>

          {/* RESUMO FINAL + CTA */}
          <section>
            <div className="section-header">
              <div className="section-label">Resumo em uma frase</div>
              <h2 className="section-title">
                Se a sua casa já é uma história, a gente só dá o código
              </h2>
            </div>
            <p className="section-subtitle">
              O 3ustaquio pega o que você já faz no mundo físico e transforma em um jogo digital de
              narrativa e risco assumido. Você não promete retorno, não entra em conto de fada
              financeiro e ainda ganha um laboratório vivo da sua marca.
            </p>

            <div className="cta-center">
              <button type="button" className="btn-primary">
                Quero desenhar o token do meu negócio
              </button>
              <div className="cta-note">
                Antes de qualquer contrato, você recebe um whitepaper honesto explicando tudo que
                pode dar certo — e tudo que pode dar errado.
              </div>
            </div>
          </section>
        </div>

        <footer>
          <div className="container footer-inner">
            <div>3ustaquio – Transparência subversiva. Ferramenta, não milagre financeiro.</div>
            <div className="footer-right">
              Esta tela é um material de apresentação. Nada aqui constitui oferta pública de valores
              mobiliários ou recomendação de investimento. Qualquer token criado a partir desta
              conversa será acompanhado de avisos de risco claros para o público.
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
