// app/criador/token/novo/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

// 💰 Taxa do criador usada na simulação (5%)
const FEE_CREATOR_RATE = 0.05;
// Volume padrão para simulação se o criador não preencher nada
const DEFAULT_SIM_VOLUME = 10000; // R$ 10.000/dia (exemplo ilustrativo)

export default function CriarTokenPage() {
  const router = useRouter();

  const [tokenType, setTokenType] = useState<TokenType>("");
  const [publicName, setPublicName] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [ticker, setTicker] = useState("");
  const [headline, setHeadline] = useState("");
  const [story, setStory] = useState("");

  // 🔢 Economia do token
  const [initialSupply, setInitialSupply] = useState(""); // quantidade total emitida
  const [poolPercent, setPoolPercent] = useState(""); // % do supply que vai pra pool
  const [faceValue, setFaceValue] = useState(""); // valor de face inicial

  // 📊 Simulação de volume de trade
  const [simVolumeDay, setSimVolumeDay] = useState("");

  // ✅ Riscos obrigatórios
  const [riskNotInvestment, setRiskNotInvestment] = useState(false);
  const [riskCanZero, setRiskCanZero] = useState(false);
  const [riskCreatorRole, setRiskCreatorRole] = useState(false);

  // Normaliza string numérica (aceita vírgula e ponto, remove lixo)
  const normalizeNumber = (raw: string) =>
    raw.replace(/[^\d.,]/g, "").replace(",", ".");

  const parsedInitialSupply = Number(normalizeNumber(initialSupply));
  const parsedPoolPercent = Number(normalizeNumber(poolPercent));
  const parsedFaceValue = Number(normalizeNumber(faceValue));
  const parsedSimVolumeDay = Number(normalizeNumber(simVolumeDay));

  const hasEconomics =
    !Number.isNaN(parsedInitialSupply) &&
    parsedInitialSupply > 0 &&
    !Number.isNaN(parsedPoolPercent) &&
    parsedPoolPercent > 0 &&
    parsedPoolPercent <= 100 &&
    !Number.isNaN(parsedFaceValue) &&
    parsedFaceValue > 0;

  // Tokens na pool e bag do criador
  const tokensInPool =
    hasEconomics && parsedInitialSupply && parsedPoolPercent
      ? (parsedInitialSupply * parsedPoolPercent) / 100
      : null;

  const creatorBagTokens =
    hasEconomics && tokensInPool !== null
      ? parsedInitialSupply - tokensInPool
      : null;

  const estBaseLiquidity =
    tokensInPool && !Number.isNaN(parsedFaceValue)
      ? tokensInPool * parsedFaceValue
      : null;

  // 💸 Simulação de taxa do criador (5% sobre o volume diário)
  const hasCustomVolume =
    !Number.isNaN(parsedSimVolumeDay) && parsedSimVolumeDay > 0;
  const baseVolumeForSim = hasCustomVolume
    ? parsedSimVolumeDay
    : DEFAULT_SIM_VOLUME;

  const simFeesDay = baseVolumeForSim * FEE_CREATOR_RATE;
  const simFeesMonth = simFeesDay * 30;

  // 💰 Hipótese: toda a oferta é vendida a valor de face
  const totalSellAtFace =
    hasEconomics && !Number.isNaN(parsedInitialSupply) && parsedInitialSupply > 0
      ? parsedInitialSupply * parsedFaceValue
      : null;

  const canContinue: boolean =
    tokenType !== "" &&
    publicName.trim().length >= 2 &&
    tokenName.trim().length >= 2 &&
    ticker.trim().length >= 2 &&
    headline.trim().length >= 20 &&
    story.trim().length >= 40 &&
    hasEconomics &&
    riskNotInvestment &&
    riskCanZero &&
    riskCreatorRole;

  const handleContinue = () => {
  if (!canContinue) {
    console.warn("Tentou continuar sem atender os requisitos", {
      tokenType,
      publicNameLen: publicName.trim().length,
      tokenNameLen: tokenName.trim().length,
      tickerLen: ticker.trim().length,
      headlineLen: headline.trim().length,
      storyLen: story.trim().length,
      parsedInitialSupply,
      parsedPoolPercent,
      parsedFaceValue,
      riskNotInvestment,
      riskCanZero,
      riskCreatorRole,
    });
    return;
  }

  const params = new URLSearchParams();
  params.set("type", tokenType);
  params.set("publicName", publicName);
  params.set("tokenName", tokenName);
  params.set("ticker", ticker);
  params.set("headline", headline);
  params.set("story", story);

  // 🔥 Importante: usar totalSupply aqui
  params.set("totalSupply", parsedInitialSupply.toString());
  params.set("poolPercent", parsedPoolPercent.toString());
  params.set("faceValue", parsedFaceValue.toString());

  const href = `/criador/token/checkout?${params.toString()}`;
  console.log("Navegando para checkout:", href);
  router.push(href);
};


  const typeLabel =
    tokenType === "PESSOA"
      ? "Token de Pessoa"
      : tokenType === "PROJETO"
        ? "Token de Projeto"
        : tokenType === "COMUNIDADE"
          ? "Token de Comunidade"
          : "Token de Narrativa";

  const tokenUrl = `https://app.3ustaquio.com/token/${(ticker || "TOKEN")
    .toLowerCase()
    .replace(/\s+/g, "")}`;

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Jornada do Criador</span>
            <h1 className="creator-title">
              Crie seu <span>token de narrativa</span>
            </h1>
            <p className="creator-subtitle">
              Não é plano de aposentadoria, não é “investimento seguro”. É um
              token especulativo da sua história. Você cria, a comunidade decide
              se entra no jogo.
            </p>
          </header>

          <section className="creator-main">
            {/* Coluna esquerda – formulário */}
            <div className="creator-form-side">
              <div className="creator-card">
                <div className="section-label">Passo – Criar moeda</div>
                <h2 className="section-title">
                  Quem é você, como esse token nasce e onde você ganha no jogo?
                </h2>
                <p className="section-subtitle">
                  Aqui você define a narrativa e o modelo de lançamento. O
                  resto é Arena: liquidez, hype e risco assumido.
                </p>

                {/* Tipo de token */}
                <div className="creator-field-group">
                  <label className="field-label">Tipo de token</label>
                  <div className="creator-token-types">
                    <button
                      type="button"
                      className={
                        "creator-token-type" +
                        (tokenType === "PESSOA"
                          ? " creator-token-type--active"
                          : "")
                      }
                      onClick={() => setTokenType("PESSOA")}
                    >
                      <strong>Pessoa</strong>
                      <span>Você como ativo de narrativa.</span>
                    </button>
                    <button
                      type="button"
                      className={
                        "creator-token-type" +
                        (tokenType === "PROJETO"
                          ? " creator-token-type--active"
                          : "")
                      }
                      onClick={() => setTokenType("PROJETO")}
                    >
                      <strong>Projeto</strong>
                      <span>Uma missão ou iniciativa específica.</span>
                    </button>
                    <button
                      type="button"
                      className={
                        "creator-token-type" +
                        (tokenType === "COMUNIDADE"
                          ? " creator-token-type--active"
                          : "")
                      }
                      onClick={() => setTokenType("COMUNIDADE")}
                    >
                      <strong>Comunidade</strong>
                      <span>Grupo, crew, guilda, fandom.</span>
                    </button>
                  </div>
                </div>

                {/* Nome público + nome token */}
                <div className="creator-two-cols">
                  <div className="creator-field-group">
                    <label className="field-label">Nome público</label>
                    <input
                      className="field-input"
                      value={publicName}
                      onChange={(e) => setPublicName(e.target.value)}
                      placeholder="Ex: Joaquim, Bar do Zé, Crew da Pista"
                    />
                    <p className="field-help">
                      É o nome que a galera já reconhece. Nada de personagem
                      aleatório.
                    </p>
                  </div>

                  <div className="creator-field-group">
                    <label className="field-label">Nome do token</label>
                    <input
                      className="field-input"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="Ex: ZETOKEN, HYPEBRENEL"
                    />
                  </div>
                </div>

                {/* Ticker */}
                <div className="creator-field-group">
                  <label className="field-label">Ticker (símbolo curto)</label>
                  <input
                    className="field-input"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="3–6 letras, ex: ZETK, BRNL, CREW"
                  />
                  <p className="field-help">
                    Precisa ser falável e memético. Esquece “BRASILCOIN”.
                  </p>
                </div>

                {/* Headline */}
                <div className="creator-field-group">
                  <label className="field-label">Frase curta para a Arena</label>
                  <textarea
                    className="field-textarea"
                    rows={2}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Token da nossa comunidade para brincar de mercado com a nossa história. Alto risco, zero promessa de retorno."
                  />
                  <p className="field-help">
                    Frase que aparece no topo da página do token. Direta, sem
                    vender milagre.
                  </p>
                </div>

                {/* História */}
                <div className="creator-field-group">
                  <label className="field-label">História / narrativa</label>
                  <textarea
                    className="field-textarea"
                    rows={6}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Explique quem é você/comunidade, por que esse token existe, o que as pessoas estão sinalizando ao comprar e por que isso é um experimento — não um plano de aposentadoria."
                  />
                </div>

                {/* ⚙️ Configuração econômica do lançamento */}
                <div className="creator-field-group">
                  <label className="field-label">
                    Modelo de lançamento (travado depois de lançar)
                  </label>
                  <p className="field-help">
                    Esses números definem como seu token entra na Arena.{" "}
                    <strong>
                      Depois de lançado, supply inicial, % da pool e valor de
                      face não poderão ser alterados.
                    </strong>
                  </p>
                </div>

                <div className="creator-two-cols">
                  <div className="creator-field-group">
                    <label className="field-label">
                      Quantidade total de tokens (supply inicial)
                    </label>
                    <input
                      className="field-input"
                      value={initialSupply}
                      onChange={(e) =>
                        setInitialSupply(
                          e.target.value.replace(/[^\d.,]/g, "")
                        )
                      }
                      placeholder="Ex: 1.000.000"
                      inputMode="decimal"
                    />
                    <p className="field-help">
                      Total de unidades que nascem no dia 0. Não é
                      recomendação, é sua visão de jogo.
                    </p>
                  </div>

                  <div className="creator-field-group">
                    <label className="field-label">
                      Valor de face no lançamento (por token)
                    </label>
                    <input
                      className="field-input"
                      value={faceValue}
                      onChange={(e) =>
                        setFaceValue(e.target.value.replace(/[^\d.,]/g, ""))
                      }
                      placeholder="Ex: 0,10 (em base interna)"
                      inputMode="decimal"
                    />
                    <p className="field-help">
                      Preço inicial de referência na moeda base interna (ex.:
                      BRL interno). Depois disso, o mercado faz o resto.
                    </p>
                  </div>
                </div>

                <div className="creator-field-group">
                  <label className="field-label">
                    % do supply que vai para o pool de lançamento
                  </label>
                  <input
                    className="field-input"
                    value={poolPercent}
                    onChange={(e) =>
                      setPoolPercent(e.target.value.replace(/[^\d.,]/g, ""))
                    }
                    placeholder="Ex: 20"
                    inputMode="decimal"
                  />
                  <p className="field-help">
                    Parte da moeda que entra direto na pool de liquidez
                    inicial (AMM). O resto é sua bag fora da pool, sob sua
                    responsabilidade. Configuração travada no lançamento.
                  </p>
                </div>

                {/* 💹 Explicação comercial dos incentivos */}
                <div className="creator-field-group">
                  <label className="field-label">
                    Onde você pode capturar valor neste jogo (simulação)
                  </label>
                  <p className="field-help">
                    Na prática, você tem <strong>dois motores de grana</strong>{" "}
                    se o mercado abraçar a ideia:
                  </p>
                  <ul className="list-check">
                    <li>
                      <strong>1. Venda das moedas:</strong> a comunidade
                      comprando unidades do seu token (pool + sua bag ao longo
                      do tempo) coloca dinheiro na mesa hoje.
                    </li>
                    <li>
                      <strong>2. Taxa permanente de 5%:</strong> toda compra e
                      venda do seu token na Arena paga uma taxa de 5% para o
                      criador — enquanto houver gente transacionando.
                    </li>
                  </ul>
                  <p className="field-help">
                    O que vem abaixo é só matemática para você sentir a ordem de
                    grandeza se der certo. Não é garantia, não é projeção de
                    ganho.
                  </p>
                </div>

                {/* 💹 Simulação de volume de trade */}
                <div className="creator-two-cols">
                  <div className="creator-field-group">
                    <label className="field-label">
                      Volume diário de trade (simulação)
                    </label>
                    <input
                      className="field-input"
                      value={simVolumeDay}
                      onChange={(e) =>
                        setSimVolumeDay(
                          e.target.value.replace(/[^\d.,]/g, "")
                        )
                      }
                      placeholder="Ex: 5.000 (em base interna)"
                      inputMode="decimal"
                    />
                    <p className="field-help">
                      Compras + vendas somadas em 24h.{" "}
                      {hasCustomVolume ? (
                        <>Usando o valor que você digitou.</>
                      ) : (
                        <>
                          Se você não preencher, simulamos com{" "}
                          <strong>
                            R${" "}
                            {DEFAULT_SIM_VOLUME.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /dia
                          </strong>
                          .
                        </>
                      )}
                    </p>
                  </div>

                  <div className="creator-field-group">
                    <div className="creator-sim-box">
                      <p className="field-label">
                        Taxa do criador em <strong>5% por operação</strong>{" "}
                        (simulação)
                      </p>
                      <p className="field-help">
                        Se o seu token girasse{" "}
                        <strong>
                          R{"$ "}
                          {baseVolumeForSim.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          /dia
                        </strong>{" "}
                        em compras e vendas:
                      </p>
                      <ul className="list-check">
                        <li>
                          Você capturaria cerca de{" "}
                          <strong>
                            R{"$ "}
                            {simFeesDay.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /dia
                          </strong>{" "}
                          em taxa do criador (5%).
                        </li>
                        <li>
                          Mantido por 30 dias, isso daria{" "}
                          <strong>
                            R{"$ "}
                            {simFeesMonth.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /mês
                          </strong>{" "}
                          — apenas como exemplo matemático.
                        </li>
                      </ul>
                      {totalSellAtFace && totalSellAtFace > 0 && (
                        <>
                          <p className="field-label" style={{ marginTop: 8 }}>
                            E se <strong>todas as unidades do token</strong>{" "}
                            fossem vendidas a valor de face?
                          </p>
                          <p className="field-help">
                            Com o supply que você definiu, vender{" "}
                            <strong>100% das moedas</strong> a esse valor de
                            face significaria, em termos brutos:
                          </p>
                          <p className="field-help">
                            <strong>
                              R{"$ "}
                              {totalSellAtFace.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </strong>{" "}
                            em vendas iniciais de token{" "}
                            <span className="metric-note">
                              (não é garantia de demanda, é só a conta).
                            </span>
                          </p>
                          <p className="field-help">
                            Isso se somaria às taxas de 5% em cada compra e
                            venda enquanto a comunidade continuar jogando esse
                            jogo na Arena.
                          </p>
                        </>
                      )}
                      <p className="field-help">
                        O mercado é caótico: pode ter mais volume, menos volume
                        ou nenhum. Aqui é só para enxergar a mecânica.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Riscos */}
                <div className="creator-risk-box">
                  <p>
                    <strong>Sem romance:</strong> este token é um experimento
                    especulativo de narrativa. Não é título de dívida, não é
                    cota de fundo, não é produto financeiro regulado. Pode não
                    ter utilidade prática e pode não valer nada amanhã.
                  </p>

                  <div className="creator-risk-checks">
                    <label className="creator-risk-check">
                      <input
                        type="checkbox"
                        checked={riskNotInvestment}
                        onChange={(e) =>
                          setRiskNotInvestment(e.target.checked)
                        }
                      />
                      <span>
                        Eu entendo e declaro que este token{" "}
                        <strong>não é investimento seguro</strong> nem produto
                        financeiro regulado.
                      </span>
                    </label>

                    <label className="creator-risk-check">
                      <input
                        type="checkbox"
                        checked={riskCanZero}
                        onChange={(e) => setRiskCanZero(e.target.checked)}
                      />
                      <span>
                        Eu entendo e declaro que o preço deste token pode{" "}
                        <strong>ir a zero</strong> e que isso não é
                        responsabilidade do 3ustaquio.
                      </span>
                    </label>

                    <label className="creator-risk-check">
                      <input
                        type="checkbox"
                        checked={riskCreatorRole}
                        onChange={(e) =>
                          setRiskCreatorRole(e.target.checked)
                        }
                      />
                      <span>
                        Eu entendo que sou{" "}
                        <strong>criador de narrativa</strong>, não gerente de
                        investimento.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="warning-strip" style={{ marginTop: 16 }}>
                  <strong>Linha dura do jogo:</strong> supply inicial, % na
                  pool e valor de face são parâmetros imutáveis deste token
                  depois do lançamento. Se quiser outro modelo econômico, crie
                  outro token.
                </div>

                <div className="creator-footer" style={{ marginTop: "16px" }}>
                  <div className="creator-footer-left">
                    <p className="creator-footer-hint">
                      Nada será lançado sem você revisar e pagar a taxa. Esta
                      etapa é só para desenhar o token e o modelo de
                      lançamento.
                    </p>
                  </div>
                  <div className="creator-footer-right">
                    <button
                      type="button"
                      className="btn-primary creator-nav-btn"
                      disabled={!canContinue}
                      onClick={handleContinue}
                    >
                      Continuar para pagamento & lançamento
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita – preview */}
            <aside className="creator-preview-side">
              <div className="creator-preview-card">
                <div className="creator-preview-header">
                  <span className="creator-preview-pill">{typeLabel}</span>
                  <span className="creator-preview-status">
                    Risco alto · Especulação
                  </span>
                </div>

                <div className="creator-preview-main">
                  <div className="creator-preview-title-row">
                    <h3 className="creator-preview-title">
                      {tokenName || "Seu token aqui"}
                    </h3>
                    <span className="creator-preview-ticker">
                      {ticker || "TICKER"}
                    </span>
                  </div>

                  <p className="creator-preview-creator">
                    por <strong>{publicName || "Criador anônimo"}</strong>
                  </p>

                  <p className="creator-preview-headline">
                    {headline ||
                      "Escreva uma frase curta explicando que isso é jogo de narrativa de alto risco, não promessa de retorno."}
                  </p>

                  <div className="creator-preview-riskband">
                    <span className="creator-preview-riskdot" />
                    <span>
                      Não é produto financeiro regulado. Preço pode ir a zero.
                      Entre por conta e risco.
                    </span>
                  </div>

                  {/* Mini-métricas do modelo de lançamento */}
                  <div className="creator-preview-metrics">
                    <div>
                      <span className="metric-label">Supply inicial</span>
                      <span className="metric-value">
                        {!Number.isNaN(parsedInitialSupply) &&
                          parsedInitialSupply > 0
                          ? parsedInitialSupply.toLocaleString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="metric-label">Pool de lançamento</span>
                      <span className="metric-value">
                        {!Number.isNaN(parsedPoolPercent) &&
                          parsedPoolPercent > 0
                          ? `${parsedPoolPercent}%${tokensInPool
                            ? ` (${tokensInPool.toLocaleString(
                              "pt-BR"
                            )} tokens)`
                            : ""
                          }`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="metric-label">Valor de face</span>
                      <span className="metric-value">
                        {!Number.isNaN(parsedFaceValue) && parsedFaceValue > 0
                          ? `R$ ${parsedFaceValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}`
                          : "—"}
                      </span>
                    </div>
                    {creatorBagTokens !== null && creatorBagTokens > 0 && (
                      <div>
                        <span className="metric-label">
                          Bag do criador (fora da pool)
                        </span>
                        <span className="metric-value">
                          {creatorBagTokens.toLocaleString("pt-BR")} tokens
                        </span>
                      </div>
                    )}
                    {creatorBagTokens &&
                      creatorBagTokens > 0 &&
                      !Number.isNaN(parsedFaceValue) &&
                      parsedFaceValue > 0 && (
                        <div>
                          <span className="metric-label">
                            Se vendesse toda a bag a valor de face
                          </span>
                          <span className="metric-value">
                            R{"$ "}
                            {(creatorBagTokens * parsedFaceValue).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}{" "}
                            <span className="metric-note">
                              (hipotético, o mercado decide o preço)
                            </span>
                          </span>
                        </div>
                      )}
                    {estBaseLiquidity && (
                      <div>
                        <span className="metric-label">
                          Liquidez inicial estimada (base)
                        </span>
                        <span className="metric-value">
                          R{"$ "}
                          {estBaseLiquidity.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {totalSellAtFace && totalSellAtFace > 0 && (
                      <div>
                        <span className="metric-label">
                          Se TODA a oferta fosse vendida a valor de face
                        </span>
                        <span className="metric-value">
                          R{"$ "}
                          {totalSellAtFace.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          <span className="metric-note">
                            (exemplo matemático, não projeção de retorno)
                          </span>
                        </span>
                      </div>
                    )}
                    {simFeesDay && (
                      <div>
                        <span className="metric-label">
                          Taxa do criador (5% sobre o volume simulado)
                        </span>
                        <span className="metric-value">
                          ~ R{"$ "}
                          {simFeesDay.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          / dia
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="creator-preview-footer">
                  <span className="creator-preview-link-label">
                    Link da Arena (simulado)
                  </span>
                  <span className="creator-preview-link">{tokenUrl}</span>
                </div>
              </div>
            </aside>
          </section>
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
