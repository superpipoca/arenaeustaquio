// app/criador/token/novo/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../../componentes/ui/layout/Footer3ustaquio";

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

export default function CriarTokenPage() {
  const router = useRouter();

  const [tokenType, setTokenType] = useState<TokenType>("");
  const [publicName, setPublicName] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [ticker, setTicker] = useState("");
  const [headline, setHeadline] = useState("");
  const [story, setStory] = useState("");
  const [riskNotInvestment, setRiskNotInvestment] = useState(false);
  const [riskCanZero, setRiskCanZero] = useState(false);
  const [riskCreatorRole, setRiskCreatorRole] = useState(false);

  // ✅ deixa explicitamente boolean
  const canContinue: boolean =
    tokenType !== "" &&
    publicName.trim().length >= 2 &&
    tokenName.trim().length >= 2 &&
    ticker.trim().length >= 2 &&
    headline.trim().length >= 20 &&
    story.trim().length >= 40 &&
    riskNotInvestment &&
    riskCanZero &&
    riskCreatorRole;

  const handleContinue = () => {
    // só por garantia e debug
    if (!canContinue) {
      console.warn("Tentou continuar sem atender os requisitos", {
        tokenType,
        publicNameLen: publicName.trim().length,
        tokenNameLen: tokenName.trim().length,
        tickerLen: ticker.trim().length,
        headlineLen: headline.trim().length,
        storyLen: story.trim().length,
        riskNotInvestment,
        riskCanZero,
        riskCreatorRole,
      });
      return;
    }

    const params = new URLSearchParams({
      type: tokenType,
      publicName,
      tokenName,
      ticker,
      headline,
      story,
    });

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
              Não é plano de aposentadoria, não é “investimento seguro”.
              É um token especulativo da sua história. Você cria, a comunidade decide se entra no jogo.
            </p>
          </header>

          <section className="creator-main">
            {/* Coluna esquerda – formulário */}
            <div className="creator-form-side">
              <div className="creator-card">
                <div className="section-label">Passo – Criar moeda</div>
                <h2 className="section-title">
                  Quem é você e qual é o símbolo desse jogo?
                </h2>
                <p className="section-subtitle">
                  Escolha o tipo de token, dê nome e conte a história. O resto é Arena.
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
                      placeholder="Ex: Brenel, Bar do Zé, Crew da Pista"
                    />
                    <p className="field-help">
                      É o nome que a galera já reconhece. Nada de personagem aleatório.
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
                    Frase que aparece no topo da página do token. Direta, sem vender milagre.
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
                        onChange={(e) => setRiskNotInvestment(e.target.checked)}
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
                        onChange={(e) => setRiskCreatorRole(e.target.checked)}
                      />
                      <span>
                        Eu entendo que sou{" "}
                        <strong>criador de narrativa</strong>, não gerente de
                        investimento.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="creator-footer" style={{ marginTop: "16px" }}>
                  <div className="creator-footer-left">
                    <p className="creator-footer-hint">
                      Nada será lançado sem você revisar e pagar a taxa. Esta
                      etapa é só para desenhar o token.
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
