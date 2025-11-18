// import React from "react";
// import Header3ustaquio from "./componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "./componentes/ui/layout/Footer3ustaquio";

// export default function Page() {
//   return (
//     <>
//       <Header3ustaquio />


//       <main>
//         <div className="container">
//           {/* HERO – SOBRE A PLATAFORMA */}
//           <section className="hero">
//             <div>
//               <div className="hero-kicker">
//                 Plataforma de narrativa & especulação consciente
//               </div>
//               <h1 className="hero-title">
//                 3ustaquio: <span>o hacker ético</span> da nova economia
//               </h1>
//               <p className="hero-subtitle">
//                 Uma plataforma para criar, listar e negociar tokens de narrativa com
//                 transparência brutal sobre risco. Nada de “investimento seguro”, nada de
//                 promessa de retorno. Aqui o jogo é assumido – e os riscos também.
//               </p>

//               <ul className="hero-bullets">
//                 <li>
//                   Qualquer pessoa pode transformar sua narrativa em token: pessoa, projeto ou
//                   comunidade.
//                 </li>
//                 <li>
//                   A interface mostra zonas de risco (FRIO, HYPE, BOLHA) em vez de empurrar
//                   discurso de segurança.
//                 </li>
//                 <li>
//                   3ustaquio ganha nas taxas. Você ganha liberdade para experimentar – sabendo
//                   que pode perder 100% do que colocar.
//                 </li>
//               </ul>

//               <div className="hero-ctas-row">
//                 <button type="button" className="btn-primary">
//                   Quero criar meu primeiro token
//                 </button>
//                 <button type="button" className="btn-outline">
//                   Quero entender os riscos antes
//                 </button>
//               </div>
//             </div>

//             <aside className="hero-right-card">
//               <div className="hero-right-header">
//                 <div className="hero-right-title">Como o 3ustaquio funciona</div>
//                 <div className="hero-right-badge">Visão rápida</div>
//               </div>
//               <div className="hero-right-body">
//                 <p>
//                   <strong>1. Você escolhe</strong> se o token é de pessoa, negócio, projeto ou
//                   comunidade.
//                 </p>
//                 <p>
//                   <strong>2. Define a narrativa</strong>, regras de oferta, liquidez inicial e
//                   o porquê do token existir.
//                 </p>
//                 <p>
//                   <strong>3. Lança na Arena</strong>, onde traders e comunidade especulam em
//                   cima da história – sem qualquer promessa de retorno.
//                 </p>

//                 <div className="mini-metric-row">
//                   <div className="mini-metric">
//                     <div className="mini-metric-label">Tipos de token</div>
//                     <div className="mini-metric-value pos">
//                       PESSOA · PROJETO · COMUNIDADE
//                     </div>
//                   </div>
//                   <div className="mini-metric">
//                     <div className="mini-metric-label">Controle de risco</div>
//                     <div className="mini-metric-value neg">
//                       FRIO · HYPE · BOLHA
//                     </div>
//                   </div>
//                 </div>

//                 <p className="hero-right-note">
//                   Tudo é construído para lembrar o tempo todo: preço pode subir, despencar ou
//                   virar pó. A plataforma mostra o risco, não esconde.
//                 </p>
//               </div>
//             </aside>
//           </section>

//           {/* O QUE É O 3USTAQUIO */}
//           <section>
//             <div className="section-header">
//               <div className="section-label">O que é</div>
//               <h2 className="section-title">Infraestrutura hacker para moedas de narrativa</h2>
//               <p className="section-subtitle">
//                 3ustaquio não é banco, não é corretora, não faz consultoria de investimentos.
//                 É infraestrutura hacker para criação e negociação de tokens de narrativa, com
//                 ética e transparência subversiva.
//               </p>
//             </div>

//             <div className="grid-3">
//               <div className="card">
//                 <h3>Infraestrutura hacker</h3>
//                 <p>
//                   Motor de criação e negociação de tokens pensado para ser simples na superfície
//                   e poderoso na sala de máquinas.
//                 </p>
//                 <ul className="list-check">
//                   <li>Criação guiada por passos, sem juridiquês.</li>
//                   <li>Configuração de narrativa, oferta e liquidez.</li>
//                   <li>Interface avançada para quem quer ver tudo em detalhe.</li>
//                 </ul>
//               </div>

//               <div className="card">
//                 <h3>Especulação honesta</h3>
//                 <p>
//                   Em vez de prometer “multiplicar patrimônio”, o 3ustaquio assume o jogo:
//                   especulação, hype, bolha – tudo escancarado.
//                 </p>
//                 <ul className="list-check">
//                   <li>Badges de risco visíveis em cada token.</li>
//                   <li>Whitepapers honestos, com motivos para NÃO comprar.</li>
//                   <li>Alertas de volatilidade em tempo real.</li>
//                 </ul>
//               </div>

//               <div className="card">
//                 <h3>Plataforma, não corretora</h3>
//                 <p>
//                   O 3ustaquio é ferramenta. Ele não recomenda, não garante e não cuida do seu
//                   dinheiro. A decisão é sempre sua.
//                 </p>
//                 <ul className="list-check">
//                   <li>Nenhuma promessa de retorno.</li>
//                   <li>Linguagem direta, sem fantasia financeira.</li>
//                   <li>Responsabilidade clara para quem cria e para quem compra.</li>
//                 </ul>
//               </div>
//             </div>
//           </section>

//           {/* PRA QUEM É A PLATAFORMA */}
//           <section>
//             <div className="section-header">
//               <div className="section-label">Pra quem faz sentido</div>
//               <h2 className="section-title">Quem deveria brincar nesse jogo</h2>
//               <p className="section-subtitle">
//                 3ustaquio é para quem entende que narrativa tem valor, que risco não é maquiagem
//                 e que especulação faz parte do jogo – não é bug do sistema.
//               </p>
//             </div>

//             <div className="grid-3">
//               <div className="card">
//                 <h3>Creators & figuras públicas</h3>
//                 <p>
//                   Gente que já tem audiência, nome forte ou comunidade ativa – e quer transformar
//                   essa história em token, assumindo o risco da arena.
//                 </p>
//                 <ul className="list-check">
//                   <li>Streamers, influenciadores, artistas.</li>
//                   <li>Perfis que querem mais que merch.</li>
//                   <li>Comunidades que já se movem em bloco.</li>
//                 </ul>
//               </div>

//               <div className="card">
//                 <h3>Negócios & cenas locais</h3>
//                 <p>
//                   Bares, casas, eventos, projetos e coletivos que já têm fila, hype ou culto
//                   próprio – e querem testar um token sem fantasia de “fidelidade garantida”.
//                 </p>
//                 <ul className="list-check">
//                   <li>Marcas que geram assunto por si só.</li>
//                   <li>Lugares que viram ponto de encontro.</li>
//                   <li>Donos que não têm medo da verdade.</li>
//                 </ul>
//               </div>

//               <div className="card">
//                 <h3>Traders & degenerados conscientes</h3>
//                 <p>
//                   Gente que já especula em cripto, meme coin ou bolsa – e quer um lugar onde o
//                   risco é dito na cara, não jogado pro rodapé.
//                 </p>
//                 <ul className="list-check">
//                   <li>Gosta de volatilidade, não de mentira.</li>
//                   <li>Lê disclaimer antes de clicar.</li>
//                   <li>Entende que pode perder tudo.</li>
//                 </ul>
//               </div>
//             </div>
//           </section>

//           {/* COMO EXPLICAR A PLATAFORMA */}
//           <section>
//             <div className="section-header">
//               <div className="section-label">Script rápido</div>
//               <h2 className="section-title">Como explicar o 3ustaquio em 30 segundos</h2>
//               <p className="section-subtitle">
//                 Um roteiro direto para você apresentar a plataforma para alguém – seja um creator,
//                 um dono de negócio ou um trader curioso.
//               </p>
//             </div>

//             <div className="two-cols">
//               <div className="speech-block">
//                 <div className="speech-label">Parte 1 — O que é</div>

//                 <div className="speech-line">
//                   <span className="speech-speaker">Você:</span> “O 3ustaquio é uma plataforma
//                   onde qualquer pessoa pode criar um token de narrativa – da própria imagem, de
//                   um projeto ou de uma comunidade.”
//                 </div>
//                 <div className="speech-line">
//                   <span className="speech-speaker">Você:</span> “Não é investimento seguro, não é
//                   produto de banco. É um lugar assumidamente especulativo, onde o valor nasce da
//                   história e do hype em volta dela.”
//                 </div>
//                 <div className="speech-line">
//                   <span className="speech-speaker">Pessoa:</span> “Então é tipo uma bolsa de
//                   histórias?”
//                 </div>
//                 <div className="speech-line">
//                   <span className="speech-speaker">Você:</span> “Exatamente. Uma bolsa de
//                   narrativas com risco escancarado, em vez de promessa enfeitada.”
//                 </div>
//               </div>

//               <div className="speech-block">
//                 <div className="speech-label">Parte 2 — O que não é</div>

//                 <div className="speech-line">
//                   <span className="speech-speaker">Pessoa:</span> “Mas vocês garantem alguma
//                   coisa?”
//                 </div>
//                 <div className="speech-line">
//                   <span className="speech-speaker">Você:</span> “Não. A gente garante justamente o
//                   contrário: que você vai ser lembrado o tempo todo de que pode perder 100% do que
//                   colocar. Nosso papel é mostrar o risco, não esconder.”
//                 </div>
//                 <div className="speech-line">
//                   <span className="speech-speaker">Você:</span> “O 3ustaquio é ferramenta de
//                   código e transparência. Você decide se quer entrar no jogo – e assume o risco
//                   se entrar.”
//                 </div>
//               </div>
//             </div>

//             <div className="warning-strip">
//               <strong>Linha vermelha clara:</strong> 3ustaquio nunca pode ser apresentado como
//               “investimento garantido”, “produto seguro” ou “renda extra sem risco”. Se a
//               explicação caminhar para isso, você está fora da marca.
//             </div>
//           </section>

//           {/* RESUMO + CTA FINAL */}
//           <section>
//             <div className="section-header">
//               <div className="section-label">Resumo em uma frase</div>
//               <h2 className="section-title">
//                 A gente não promete retorno. A gente te dá o código.
//               </h2>
//               <p className="section-subtitle">
//                 3ustaquio é o hacker ético da nova economia: transforma narrativas em tokens de
//                 alto risco, com disclaimers claros e especulação assumida. Se você quer brincar
//                 com esse tipo de fogo – com consciência – a porta está aberta.
//               </p>
//             </div>

//             <div className="cta-center">
//               <button type="button" className="btn-primary">
//                 Quero entrar na Arena do 3ustaquio
//               </button>
//               <div className="cta-note">
//                 Antes de qualquer movimento de dinheiro, você verá avisos de risco explícitos e
//                 terá chance de voltar atrás. A decisão final é sempre sua.
//               </div>
//             </div>
//           </section>
//         </div>

//         <Footer3ustaquio />

//       </main>
//     </>
//   );
// }
// app/page.tsx
"use client";

import React from "react";
import Header3ustaquio from "./componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "./componentes/ui/layout/Footer3ustaquio";

export default function HomePage() {
  return (
    <div className="page-root">
      <Header3ustaquio />

      <main>
        <div className="container">
          {/* HERO – SOBRE A PLATAFORMA */}
          <section className="hero" id="plataforma">
            <div>
              <div className="hero-kicker">
                Plataforma de narrativa & especulação consciente
              </div>
              <h1 className="hero-title">
                3ustaquio: <span>o hacker ético</span> da nova economia
              </h1>
              <p className="hero-subtitle">
                Uma plataforma para criar, listar e negociar tokens de narrativa com
                transparência brutal sobre risco. Nada de “investimento seguro”, nada de
                promessa de retorno. Aqui o jogo é assumido – e os riscos também.
              </p>

              <ul className="hero-bullets">
                <li>
                  Qualquer pessoa pode transformar sua narrativa em token: pessoa, projeto ou
                  comunidade.
                </li>
                <li>
                  A interface mostra zonas de risco (FRIO, HYPE, BOLHA) em vez de empurrar
                  discurso de segurança.
                </li>
                <li>
                  3ustaquio ganha nas taxas. Você ganha liberdade para experimentar – sabendo
                  que pode perder 100% do que colocar.
                </li>
              </ul>

              <div className="hero-ctas-row">
                <button type="button" className="btn-primary">
                  Quero criar meu primeiro token
                </button>
                <button type="button" className="btn-outline">
                  Quero entender os riscos antes
                </button>
              </div>
            </div>

            <aside className="hero-right-card">
              <div className="hero-right-header">
                <div className="hero-right-title">Como o 3ustaquio funciona</div>
                <div className="hero-right-badge">Visão rápida</div>
              </div>
              <div className="hero-right-body">
                <p>
                  <strong>1. Você escolhe</strong> se o token é de pessoa, negócio, projeto ou
                  comunidade.
                </p>
                <p>
                  <strong>2. Define a narrativa</strong>, regras de oferta, liquidez inicial e
                  o porquê do token existir.
                </p>
                <p>
                  <strong>3. Lança na Arena</strong>, onde traders e comunidade especulam em
                  cima da história – sem qualquer promessa de retorno.
                </p>

                <div className="mini-metric-row">
                  <div className="mini-metric">
                    <div className="mini-metric-label">Tipos de token</div>
                    <div className="mini-metric-value pos">
                      PESSOA · PROJETO · COMUNIDADE
                    </div>
                  </div>
                  <div className="mini-metric">
                    <div className="mini-metric-label">Controle de risco</div>
                    <div className="mini-metric-value neg">
                      FRIO · HYPE · BOLHA
                    </div>
                  </div>
                </div>

                <p className="hero-right-note">
                  Tudo é construído para lembrar o tempo todo: preço pode subir, despencar ou
                  virar pó. A plataforma mostra o risco, não esconde.
                </p>
              </div>
            </aside>
          </section>

          {/* O QUE É O 3USTAQUIO */}
          <section id="jogo">
            <div className="section-header">
              <div className="section-label">O que é</div>
              <h2 className="section-title">Infraestrutura hacker para moedas de narrativa</h2>
              <p className="section-subtitle">
                3ustaquio não é banco, não é corretora, não faz consultoria de investimentos.
                É infraestrutura hacker para criação e negociação de tokens de narrativa, com
                ética e transparência subversiva.
              </p>
            </div>

            <div className="grid-3">
              <div className="card">
                <h3>Infraestrutura hacker</h3>
                <p>
                  Motor de criação e negociação de tokens pensado para ser simples na superfície
                  e poderoso na sala de máquinas.
                </p>
                <ul className="list-check">
                  <li>Criação guiada por passos, sem juridiquês.</li>
                  <li>Configuração de narrativa, oferta e liquidez.</li>
                  <li>Interface avançada para quem quer ver tudo em detalhe.</li>
                </ul>
              </div>

              <div className="card">
                <h3>Especulação honesta</h3>
                <p>
                  Em vez de prometer “multiplicar patrimônio”, o 3ustaquio assume o jogo:
                  especulação, hype, bolha – tudo escancarado.
                </p>
                <ul className="list-check">
                  <li>Badges de risco visíveis em cada token.</li>
                  <li>Whitepapers honestos, com motivos para NÃO comprar.</li>
                  <li>Alertas de volatilidade em tempo real.</li>
                </ul>
              </div>

              <div className="card">
                <h3>Plataforma, não corretora</h3>
                <p>
                  O 3ustaquio é ferramenta. Ele não recomenda, não garante e não cuida do seu
                  dinheiro. A decisão é sempre sua.
                </p>
                <ul className="list-check">
                  <li>Nenhuma promessa de retorno.</li>
                  <li>Linguagem direta, sem fantasia financeira.</li>
                  <li>Responsabilidade clara para quem cria e para quem compra.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* PRA QUEM É A PLATAFORMA */}
          <section id="tokens">
            <div className="section-header">
              <div className="section-label">Pra quem faz sentido</div>
              <h2 className="section-title">Quem deveria brincar nesse jogo</h2>
              <p className="section-subtitle">
                3ustaquio é para quem entende que narrativa tem valor, que risco não é maquiagem
                e que especulação faz parte do jogo – não é bug do sistema.
              </p>
            </div>

            <div className="grid-3">
              <div className="card">
                <h3>Creators & figuras públicas</h3>
                <p>
                  Gente que já tem audiência, nome forte ou comunidade ativa – e quer transformar
                  essa história em token, assumindo o risco da arena.
                </p>
                <ul className="list-check">
                  <li>Streamers, influenciadores, artistas.</li>
                  <li>Perfis que querem mais que merch.</li>
                  <li>Comunidades que já se movem em bloco.</li>
                </ul>
              </div>

              <div className="card">
                <h3>Negócios & cenas locais</h3>
                <p>
                  Bares, casas, eventos, projetos e coletivos que já têm fila, hype ou culto
                  próprio – e querem testar um token sem fantasia de “fidelidade garantida”.
                </p>
                <ul className="list-check">
                  <li>Marcas que geram assunto por si só.</li>
                  <li>Lugares que viram ponto de encontro.</li>
                  <li>Donos que não têm medo da verdade.</li>
                </ul>
              </div>

              <div className="card">
                <h3>Traders & degenerados conscientes</h3>
                <p>
                  Gente que já especula em cripto, meme coin ou bolsa – e quer um lugar onde o
                  risco é dito na cara, não jogado pro rodapé.
                </p>
                <ul className="list-check">
                  <li>Gosta de volatilidade, não de mentira.</li>
                  <li>Lê disclaimer antes de clicar.</li>
                  <li>Entende que pode perder tudo.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* COMO EXPLICAR A PLATAFORMA */}
          <section id="risco">
            <div className="section-header">
              <div className="section-label">Script rápido</div>
              <h2 className="section-title">Como explicar o 3ustaquio em 30 segundos</h2>
              <p className="section-subtitle">
                Um roteiro direto para você apresentar a plataforma para alguém – seja um creator,
                um dono de negócio ou um trader curioso.
              </p>
            </div>

            <div className="two-cols">
              <div className="speech-block">
                <div className="speech-label">Parte 1 — O que é</div>

                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “O 3ustaquio é uma plataforma
                  onde qualquer pessoa pode criar um token de narrativa – da própria imagem, de
                  um projeto ou de uma comunidade.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “Não é investimento seguro, não é
                  produto de banco. É um lugar assumidamente especulativo, onde o valor nasce da
                  história e do hype em volta dela.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Pessoa:</span> “Então é tipo uma bolsa de
                  histórias?”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “Exatamente. Uma bolsa de
                  narrativas com risco escancarado, em vez de promessa enfeitada.”
                </div>
              </div>

              <div className="speech-block">
                <div className="speech-label">Parte 2 — O que não é</div>

                <div className="speech-line">
                  <span className="speech-speaker">Pessoa:</span> “Mas vocês garantem alguma
                  coisa?”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “Não. A gente garante justamente o
                  contrário: que você vai ser lembrado o tempo todo de que pode perder 100% do que
                  colocar. Nosso papel é mostrar o risco, não esconder.”
                </div>
                <div className="speech-line">
                  <span className="speech-speaker">Você:</span> “O 3ustaquio é ferramenta de
                  código e transparência. Você decide se quer entrar no jogo – e assume o risco
                  se entrar.”
                </div>
              </div>
            </div>

            <div className="warning-strip">
              <strong>Linha vermelha clara:</strong> 3ustaquio nunca pode ser apresentado como
              “investimento garantido”, “produto seguro” ou “renda extra sem risco”. Se a
              explicação caminhar para isso, você está fora da marca.
            </div>
          </section>

          {/* RESUMO + CTA FINAL */}
          <section>
            <div className="section-header">
              <div className="section-label">Resumo em uma frase</div>
              <h2 className="section-title">
                A gente não promete retorno. A gente te dá o código.
              </h2>
              <p className="section-subtitle">
                3ustaquio é o hacker ético da nova economia: transforma narrativas em tokens de
                alto risco, com disclaimers claros e especulação assumida. Se você quer brincar
                com esse tipo de fogo – com consciência – a porta está aberta.
              </p>
            </div>

            <div className="cta-center">
              <button type="button" className="btn-primary">
                Quero entrar na Arena do 3ustaquio
              </button>
              <div className="cta-note">
                Antes de qualquer movimento de dinheiro, você verá avisos de risco explícitos e
                terá chance de voltar atrás. A decisão final é sempre sua.
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer3ustaquio />
    </div>
  );
}
