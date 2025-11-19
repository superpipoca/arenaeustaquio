"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";

export default function TraderJourneyPage() {
  const router = useRouter();

  const handleGoToArena = () => {
    router.push("/arena"); // ajuste para a rota real da Arena
  };

  const handleGoToLogin = () => {
    router.push("/criador/login"); // ajuste se tiver um login específico do trader
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <>
      <Header3ustaquio />

      <main className="creator-screen">
        <div className="container creator-shell">
          {/* HERO – Hype de entrada */}
          <section className="creator-hero">
            <div className="creator-hero-left">
              <span className="creator-kicker">Jornada do Trader – Arena 3ustaquio</span>
              <h1 className="creator-title">
                Entre curioso. Saia como quem <span>comandou o próprio hype</span>.
              </h1>

              <p className="creator-subtitle">
                O 3ustaquio é a arena onde <strong>narrativas viram preço</strong>.
                Você entra para ver o que está pegando fogo; sai sabendo que foi você
                quem escolheu onde se queimar – ou onde surfar a alta. Sem promessa
                de retorno. Sem mentira. Só risco explícito e jogo aberto.
              </p>

              <ul className="creator-list">
                <li>
                  Ideal para quem já flertou com cripto, bolsa, apostas – e cansou de
                  marketing que finge segurança.
                </li>
                <li>
                  Aqui você não recebe “dica quente”. Você recebe <strong>tela, dado e
                  narrativa</strong>. O resto é decisão sua.
                </li>
                <li>
                  Se você precisa que alguém prometa proteção, essa arena não é para
                  você. Se você quer <strong>assumir o risco e o mérito</strong>, é aqui.
                </li>
              </ul>

              <div className="hero-ctas-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGoToArena}
                >
                  Ver o ranking agora
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleGoToLogin}
                >
                  Criar acesso / fazer login
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleGoToDashboard}
                >
                  Ir direto para meu dashboard
                </button>
              </div>

              <p className="cta-note" style={{ marginTop: 10 }}>
                Nada aqui é investimento seguro ou produto regulado. Você pode perder
                <strong> 100% do valor</strong> em qualquer token. Se isso não for claro,
                não continue.
              </p>
            </div>

            <div className="creator-hero-right">
              <div className="creator-card">
                <h3>Do primeiro login ao saque</h3>
                <p>
                  A Jornada do Trader leva você por um ciclo completo:
                </p>
                <ul className="list-check">
                  <li>Entrar e entender o jogo.</li>
                  <li>Ver o ranking e sentir o pulso do hype.</li>
                  <li>Comprar uma narrativa assumindo o risco.</li>
                  <li>Acompanhar o sobe-e-desce sem filtro.</li>
                  <li>Vender ou sacar quando fizer sentido para você.</li>
                </ul>

                <div className="warning-strip" style={{ marginTop: 12 }}>
                  <strong>Sem conto de fada:</strong> se o mercado virar, o preço
                  pode despencar ou virar pó. Nossa função é deixar isso claro desde
                  o começo – e ainda assim te dar uma arena empolgante para jogar.
                </div>
              </div>
            </div>
          </section>

          {/* Linha do tempo emocional */}
          <section>
            <div className="section-header">
              <div className="section-label">Mapa emocional da jornada</div>
              <h2 className="section-title">Do “só olhando” para o “eu assumo esse risco”</h2>
              <p className="section-subtitle">
                Não é só um fluxo técnico. É um funil emocional: curiosidade →
                fascínio → tensão → decisão → consequência. A interface conduz
                sem manipular – sempre lembrando que o risco é seu.
              </p>
            </div>

            <div className="grid-3">
              <div className="card">
                <h3>1. Curiosidade acesa</h3>
                <p>
                  O trader entra pela curiosidade: “Que diabos é essa arena de
                  narrativas?”. Tela escura, dados vivos, ranking pulsando.
                </p>
                <ul className="list-check">
                  <li>Copy direta: sem jargão de banco.</li>
                  <li>Benefício claro: “ver o hype em tempo real”.</li>
                  <li>Risco já citado no primeiro bloco de texto.</li>
                </ul>
              </div>

              <div className="card">
                <h3>2. Fascínio com o tabuleiro</h3>
                <p>
                  Ao ver o ranking, ele percebe que cada token tem uma história:
                  bar, pessoa, projeto, bairro, comunidade. É mercado, mas é
                  <strong> mercado de histórias</strong>.
                </p>
                <ul className="list-check">
                  <li>Variação 24h/7d em destaque.</li>
                  <li>Badges de “hype”, “frio”, “bolha”.</li>
                  <li>Filtros que respondem à pergunta: “onde está o caos hoje?”.</li>
                </ul>
              </div>

              <div className="card">
                <h3>3. Decisão assumida</h3>
                <p>
                  Na tela de compra, o trader encara a frase que ninguém coloca:
                  “Você pode perder tudo”. E, se seguir, é porque escolheu.
                </p>
                <ul className="list-check">
                  <li>Checkbox de aceitação explícita.</li>
                  <li>Botão: “Assumo o risco e quero comprar”.</li>
                  <li>
                    Nada de “investir com tranquilidade” – isso não existe aqui.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Etapa 1 – Entrar */}
          <section>
            <div className="section-header">
              <div className="section-label">Etapa 1</div>
              <h2 className="section-title">Entrar na Arena</h2>
              <p className="section-subtitle">
                O objetivo não é só “criar conta”. É recalibrar a expectativa:
                não estamos vendendo o sonho de ficar rico fácil, estamos abrindo
                o mapa de um jogo de alto risco e alta narrativa.
              </p>
            </div>

            <div className="creator-main">
              <div className="creator-form-side">
                <div className="creator-card">
                  <h3>UX de entrada</h3>
                  <ul className="list-check">
                    <li>Botão “Ir para a Arena” em destaque na home.</li>
                    <li>Login simples: e-mail + senha (e futuro login com carteira).</li>
                    <li>
                      Usuário identificado como “trader” cai direto no ranking,
                      sem passeio institucional desnecessário.
                    </li>
                  </ul>

                  <p className="creator-footer-hint">
                    O copy aqui trata o trader como adulto: ele sabe que está
                    entrando num ambiente de especulação, não numa poupança
                    vitaminada.
                  </p>
                </div>
              </div>

              <div className="creator-preview-side">
                <div className="creator-summary-block">
                  <h3>Banner de contexto sugerido</h3>
                  <p>
                    “Você está entrando em uma arena de especulação consciente.
                    Tokens aqui podem subir, despencar ou virar pó.
                    <br />
                    Nada aqui é investimento seguro.”
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Etapa 2 – Ranking / Arena */}
          <section>
            <div className="section-header">
              <div className="section-label">Etapa 2</div>
              <h2 className="section-title">Ver o ranking: onde o hype respira</h2>
              <p className="section-subtitle">
                A Arena é o momento “Uau”. Ele vê barras subindo, caindo, badges
                amarelas de hype e vermelhas de bolha. Não é lista morta, é
                <strong> tabuleiro vivo</strong> de narrativas brigando por atenção.
              </p>
            </div>

            <div className="creator-main">
              <div className="creator-form-side">
                <div className="creator-card">
                  <h3>Interface da Arena</h3>
                  <ul className="list-check">
                    <li>Nome + ticker + tipo (Pessoa, Local, Projeto, Comunidade).</li>
                    <li>Variação % em 24h e 7d em destaque visual.</li>
                    <li>Volume, liquidez e zona de mercado (frio, hype, bolha).</li>
                    <li>Ordenar por variação, volume ou hype.</li>
                  </ul>

                  <p className="creator-footer-hint">
                    O trader sente que tem <strong>radar</strong>, não “dica”.
                    Ele navega, filtra e escolhe qual narrativa merece sua aposta.
                  </p>
                </div>
              </div>

              <div className="creator-preview-side">
                <div className="creator-summary-block">
                  <h3>Copy na Arena</h3>
                  <p>
                    “Aqui você não vê ‘ativos seguros’.
                    <br />
                    Você vê histórias sendo precificadas em tempo real.”
                  </p>

                  <div className="warning-strip" style={{ marginTop: 10 }}>
                    <strong>Hype é combustível, não garantia.</strong> Zona de
                    bolha não é “proibido”. É placa de “risco extremo” piscando
                    na sua cara.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Etapa 3 – Comprar com projeções narrativas */}
          <section>
            <div className="section-header">
              <div className="section-label">Etapa 3</div>
              <h2 className="section-title">Comprar a narrativa (e o risco)</h2>
              <p className="section-subtitle">
                Na tela de compra, o trader já está emocionalmente engajado:
                ele viu o hype, entendeu a história e agora quer testar sua
                leitura de mercado. A interface abraça isso — sem fingir que é
                seguro.
              </p>
            </div>

            <div className="creator-main">
              <div className="creator-form-side">
                <div className="creator-card">
                  <h3>O que aparece antes do botão</h3>
                  <ul className="list-check">
                    <li>Narrativa em linguagem humana, não só ficha técnica.</li>
                    <li>Histórico de preço e volatilidade recente.</li>
                    <li>Zona de mercado: frio, hype ou bolha.</li>
                    <li>Resumo simples de liquidez e volume.</li>
                  </ul>

                  <h3>Painel de compra</h3>
                  <ul className="list-check">
                    <li>Campo de valor ou quantidade.</li>
                    <li>Resumo do custo, taxa e impacto estimado.</li>
                    <li>
                      Mensagem dura de risco acima do botão (não escondida em
                      rodapé).
                    </li>
                    <li>
                      Checkbox obrigatório:
                      <br />
                      “Entendo que este token não é investimento seguro, nem
                      promessa de retorno.”
                    </li>
                  </ul>
                </div>
              </div>

              <div className="creator-preview-side">
                <div className="creator-summary-block">
                  <h3>Projeção narrativa (simulação, não promessa)</h3>
                  <p>
                    “Se você colocar R$ 100 numa narrativa em hype e o preço
                    subir 40%, ótimo. Se despencar 60%, você também precisa
                    aguentar ver R$ 100 virarem R$ 40.
                    <br />
                    Esse é o jogo. Sem garantia. Sem tapete emocional.”
                  </p>

                  <div className="summary-line" />

                  <p>
                    Botão: <strong>“Assumo o risco e quero comprar”</strong>.
                    <br />
                    Nunca “Investir agora”. Nunca “Multiplicar patrimônio”.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Etapa 4 – Acompanhar com sensação de tabuleiro vivo */}
          <section>
            <div className="section-header">
              <div className="section-label">Etapa 4</div>
              <h2 className="section-title">Acompanhar a posição como quem acompanha um jogo</h2>
              <p className="section-subtitle">
                O trader não quer só ver número estático. Quer sentir se está no
                olho do furacão ou em zona morta. O dashboard transforma “carteira”
                numa <strong>visão de tabuleiro</strong> do que ele escolheu arriscar.
              </p>
            </div>

            <div className="creator-main">
              <div className="creator-form-side">
                <div className="creator-card">
                  <h3>Minhas posições</h3>
                  <ul className="list-check">
                    <li>Quantidade de cada token.</li>
                    <li>Preço médio de entrada × preço atual.</li>
                    <li>Resultado da posição (P/L) opcional.</li>
                    <li>Zona atual: frio, hype, bolha.</li>
                  </ul>

                  <h3>Atalhos de ação</h3>
                  <ul className="list-check">
                    <li>“Ver na Arena” para recontextualizar a narrativa.</li>
                    <li>“Vender / reduzir posição” em um clique.</li>
                  </ul>
                </div>
              </div>

              <div className="creator-preview-side">
                <div className="creator-summary-block">
                  <h3>Copy de contexto</h3>
                  <p>
                    “Isso não é plano de aposentadoria.
                    <br />
                    É o retrato do quanto você escolheu arriscar em narrativas.
                    <br />
                    Se esse cenário te incomoda, reduza posição ou saia do jogo.”
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Etapa 5 – Vender / Sacar com transparência de liquidez */}
          <section>
            <div className="section-header">
              <div className="section-label">Etapa 5</div>
              <h2 className="section-title">Vender, sacar e encerrar ciclos</h2>
              <p className="section-subtitle">
                Fechar posição é tão importante quanto abrir. Aqui a transparência
                volta com força: liquidez, taxa, prazo – tudo aparece antes de você
                confirmar qualquer coisa.
              </p>
            </div>

            <div className="creator-main">
              <div className="creator-form-side">
                <div className="creator-card">
                  <h3>Vender token</h3>
                  <ul className="list-check">
                    <li>Botão “Vender / encerrar posição” claro.</li>
                    <li>
                      Quantidade disponível, preço estimado de execução, taxas
                      visíveis.
                    </li>
                    <li>
                      Aviso direto:
                      <br />
                      “Execução depende de liquidez. Em tokens ilíquidos, você
                      pode não conseguir vender tudo na hora.”
                    </li>
                  </ul>

                  <h3>Sacar (quando houver off-ramp)</h3>
                  <ul className="list-check">
                    <li>Saldo disponível para saque exibido em destaque.</li>
                    <li>Opções de saque: stable, fiat via parceiros etc.</li>
                    <li>
                      Prazos, limites e restrições regulatórias em linguagem
                      simples, sem letra miúda.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="creator-preview-side">
                <div className="creator-summary-block">
                  <h3>Texto de responsabilidade</h3>
                  <p>
                    “O 3ustaquio não garante qualquer valor futuro.
                    <br />
                    Este saque reflete apenas o estado atual do seu jogo na
                    plataforma.”
                  </p>
                  <p style={{ marginTop: 8 }}>
                    O trader sai sabendo que o <strong>mérito e o prejuízo</strong> são
                    dele – e que a plataforma foi brutalmente honesta do começo
                    ao fim.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Instrumentação / Growth */}
          <section>
            <div className="section-header">
              <div className="section-label">Growth & dados</div>
              <h2 className="section-title">Eventos para medir o hype com ética</h2>
              <p className="section-subtitle">
                A Jornada do Trader não é só bonita na cópia — ela é medível.
                Instrumentar os eventos certos te mostra se o funil está
                levando o curioso a virar jogador consciente, não vítima.
              </p>
            </div>

            <div className="creator-main">
              <div className="creator-form-side">
                <div className="creator-card">
                  <h3>Eventos sugeridos</h3>
                  <ul className="list-check">
                    <li><span>trader_login</span> – entrou na plataforma.</li>
                    <li><span>arena_viewed</span> – viu o ranking.</li>
                    <li><span>ranking_sorted</span> – mudou ordem / filtro.</li>
                    <li><span>token_detail_viewed</span> – abriu página de token.</li>
                    <li><span>buy_clicked</span> e <span>buy_confirmed</span> – intenção × decisão.</li>
                    <li><span>positions_viewed</span> – consultou “Minhas posições”.</li>
                    <li><span>sell_clicked</span> e <span>sell_confirmed</span> – saiu ou reduziu.</li>
                    <li><span>withdraw_viewed</span> e <span>withdraw_requested</span> – pensou em tirar valor da arena.</li>
                  </ul>
                </div>
              </div>

              <div className="creator-preview-side">
                <div className="creator-summary-block">
                  <h3>KPIs que importam</h3>
                  <ul className="list-check">
                    <li>% de logados que chegam a ver o ranking.</li>
                    <li>% que abrem ao menos 1 página de token.</li>
                    <li>% que compram uma vez (aderência ao jogo).</li>
                    <li>% que voltam para acompanhar posições.</li>
                    <li>Tempo médio até primeira venda / saque.</li>
                  </ul>
                  <p className="creator-footer-hint">
                    A meta não é viciar o usuário – é mostrar se ele está
                    jogando o jogo com consciência. Hype sem ética é golpe.
                    Hype com disclaimers é 3ustaquio.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <Footer3ustaquio />
      </main>
    </>
  );
}
