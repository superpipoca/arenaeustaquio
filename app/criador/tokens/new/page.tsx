"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css";

type Step = 1 | 2 | 3 | 4;
type TokenKind = "PESSOA" | "PROJETO" | "COMUNIDADE";
type CoinTypeCode = "MEME" | "LASTREADA" | "COMUNIDADE";

const DEFAULT_RISK_DISCLAIMER = `
Este token é um experimento especulativo de narrativa.
Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno.
Você pode perder 100% do valor colocado aqui. Entre apenas se entender e aceitar esse risco.
`.trim();

export default function CreateTokenPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tokenKind, setTokenKind] = useState<TokenKind | null>(null);
  const [coinTypeCode, setCoinTypeCode] = useState<CoinTypeCode>("MEME");

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [slug, setSlug] = useState("");
  const [narrativeShort, setNarrativeShort] = useState("");
  const [narrativeLong, setNarrativeLong] = useState("");
  const [riskDisclaimer, setRiskDisclaimer] = useState(DEFAULT_RISK_DISCLAIMER);
  const [supplyInitial, setSupplyInitial] = useState("1000000");
  const [supplyMax, setSupplyMax] = useState("1000000");

  const [acceptRisk, setAcceptRisk] = useState(false);

  const [createdToken, setCreatedToken] = useState<{
    slug: string;
    name: string;
    symbol: string;
  } | null>(null);

  const TAX_VALUE = 49.9; // exemplo em BRL

  function handleSelectTokenKind(kind: TokenKind) {
    setTokenKind(kind);
    setError(null);

    // mapeia de forma simples o tipo visual para o tipo de coin
    if (kind === "COMUNIDADE") {
      setCoinTypeCode("COMUNIDADE");
    } else {
      setCoinTypeCode("MEME");
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slug) {
      const generated = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  }

  function handleSymbolChange(value: string) {
    setSymbol(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
  }

  function goNextFromStep1() {
    if (!tokenKind) {
      setError("Escolha um tipo de token para continuar.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function goNextFromStep2() {
    if (!name.trim() || !symbol.trim() || !slug.trim() || !narrativeShort.trim()) {
      setError("Preencha nome, ticker, slug e a narrativa curta para continuar.");
      return;
    }

    if (!supplyInitial || Number.isNaN(Number(supplyInitial)) || Number(supplyInitial) <= 0) {
      setError("Defina um supply inicial válido (maior que zero).");
      return;
    }

    setError(null);
    setStep(3);
  }

  async function handleSubmit() {
    if (!acceptRisk) {
      setError("Você precisa aceitar o aviso de risco para lançar o token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/creator/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenKind,
          coinTypeCode,
          name: name.trim(),
          symbol: symbol.trim(),
          slug: slug.trim(),
          narrativeShort: narrativeShort.trim(),
          narrativeLong: narrativeLong.trim(),
          riskDisclaimer: riskDisclaimer.trim(),
          supplyInitial,
          supplyMax,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar token.");
      }

      setCreatedToken({
        slug: data.slug,
        name: data.name,
        symbol: data.symbol,
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Não foi possível lançar o token agora.");
    } finally {
      setLoading(false);
    }
  }

  const shareText = createdToken
    ? `Lancei o token ${createdToken.symbol} no 3ustaquio.
É jogo de narrativa e hype consciente, não promessa de retorno.
Se você não gosta de risco, não entre.
https://3ustaquio.com/arena/${createdToken.slug}`
    : "";

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Texto copiado. Cole nas suas redes.");
    } catch {
      alert("Não foi possível copiar automaticamente. Copie manualmente.");
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Jornada do Criador</p>
            <h1 className={styles.sectionTitle}>Lançar um token de narrativa na Arena.</h1>
            <p className={styles.sectionDescription}>
              Do login curioso ao token rodando ao vivo. Sem promessa de milagre financeiro,
              com risco explícito e controle total do criador.
            </p>
          </div>

          {/* Steps indicator */}
          <div className={styles.pillRow}>
            <div className={styles.pill}>
              <span className={styles.pillLabel}>Fluxo</span>
              <span className={styles.pillValue}>
                {step === 1 && "1/3 · Definir tipo de token"}
                {step === 2 && "2/3 · Configurar narrativa e regras"}
                {step === 3 && "3/3 · Taxa, risco e lançamento"}
                {step === 4 && "Token lançado · Divulgar & ver painel"}
              </span>
            </div>
          </div>

          {error && (
            <div className={styles.warningBox} style={{ marginTop: "1rem" }}>
              <p className={styles.warningText}>{error}</p>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className={styles.cardsGrid} style={{ marginTop: "2rem" }}>
              <button
                type="button"
                onClick={() => handleSelectTokenKind("PESSOA")}
                className={styles.card}
                style={{
                  textAlign: "left",
                  borderColor: tokenKind === "PESSOA" ? "rgba(0,255,255,0.6)" : undefined,
                }}
              >
                <span className={styles.cardKicker}>Token Pessoa</span>
                <h3 className={styles.cardTitle}>Criador, streamer, figura pública</h3>
                <p className={styles.cardBody}>
                  Transforme sua reputação em código. A comunidade joga com sua narrativa,
                  não com promessa de retorno.
                </p>
                <ul className={styles.cardList}>
                  <li>Ideal para creators, streamers, especialistas.</li>
                  <li>Perfeito para laboratórios de hype consciente.</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTokenKind("PROJETO")}
                className={styles.card}
                style={{
                  textAlign: "left",
                  borderColor: tokenKind === "PROJETO" ? "rgba(0,255,255,0.6)" : undefined,
                }}
              >
                <span className={styles.cardKicker}>Token Projeto</span>
                <h3 className={styles.cardTitle}>Squads, missões, temporadas</h3>
                <p className={styles.cardBody}>
                  Cada temporada, uma moeda. Experimente narrativas, fases e objetivos sem
                  prometer nada além do jogo.
                </p>
                <ul className={styles.cardList}>
                  <li>Squads, DAOs, missões temáticas.</li>
                  <li>Bom para ciclos curtos e experimentais.</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTokenKind("COMUNIDADE")}
                className={styles.card}
                style={{
                  textAlign: "left",
                  borderColor: tokenKind === "COMUNIDADE" ? "rgba(0,255,255,0.6)" : undefined,
                }}
              >
                <span className={styles.cardKicker}>Token Comunidade</span>
                <h3 className={styles.cardTitle}>Guilda, fandom, crew</h3>
                <p className={styles.cardBody}>
                  Quando a força é o grupo, não só o rosto. Um símbolo especulativo da
                  comunidade, não um plano financeiro.
                </p>
                <ul className={styles.cardList}>
                  <li>Ideal para fandoms, crews, guildas.</li>
                  <li>Moeda como bandeira, não como garantia.</li>
                </ul>
              </button>
            </div>
          )}

          {step === 1 && (
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className={`${styles.button} ${styles.ctaPrimary}`}
                onClick={goNextFromStep1}
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ marginTop: "2rem", display: "grid", gap: "1.5rem" }}>
              <div className={styles.cardsGrid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Identidade da moeda</h3>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <label style={{ fontSize: "0.82rem" }}>
                      Nome da moeda
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ex: TOXX – Token da Streamer TOXX"
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                        }}
                      />
                    </label>

                    <label style={{ fontSize: "0.82rem" }}>
                      Ticker (símbolo curto)
                      <input
                        type="text"
                        value={symbol}
                        onChange={(e) => handleSymbolChange(e.target.value)}
                        placeholder="Ex: TOXX"
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                        }}
                      />
                    </label>

                    <label style={{ fontSize: "0.82rem" }}>
                      Slug (URL)
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase())}
                        placeholder="Ex: toxx"
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                        }}
                      />
                      <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.75rem", opacity: 0.7 }}>
                        Vai gerar uma página em: 3ustaquio.com/arena/{slug || "seu-slug"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.cardAlt}>
                  <h3 className={styles.cardTitle}>Narrativa</h3>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <label style={{ fontSize: "0.82rem" }}>
                      Narrativa curta (aparece na Arena)
                      <textarea
                        value={narrativeShort}
                        onChange={(e) => setNarrativeShort(e.target.value)}
                        placeholder="Ex: Moeda de hype consciente da comunidade da TOXX. Se a história for boa, o mercado decide. Se não, vira pó."
                        rows={3}
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                          resize: "vertical",
                        }}
                      />
                    </label>

                    <label style={{ fontSize: "0.82rem" }}>
                      Narrativa longa (opcional, tipo mini whitepaper honesto)
                      <textarea
                        value={narrativeLong}
                        onChange={(e) => setNarrativeLong(e.target.value)}
                        placeholder="Conte a história completa da moeda, sem prometer retorno: de onde veio a ideia, o que representa, o que NÃO é."
                        rows={5}
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                          resize: "vertical",
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.cardsGrid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Regras básicas</h3>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <label style={{ fontSize: "0.82rem" }}>
                      Supply inicial (quantidade de tokens na pool)
                      <input
                        type="number"
                        min={1}
                        value={supplyInitial}
                        onChange={(e) => setSupplyInitial(e.target.value)}
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                        }}
                      />
                    </label>

                    <label style={{ fontSize: "0.82rem" }}>
                      Supply máximo (opcional)
                      <input
                        type="number"
                        min={Number(supplyInitial) || 1}
                        value={supplyMax}
                        onChange={(e) => setSupplyMax(e.target.value)}
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(5,6,8,0.9)",
                          color: "#fff",
                          fontSize: "0.86rem",
                        }}
                      />
                      <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.75rem", opacity: 0.7 }}>
                        Você pode deixar igual ao supply inicial se não quiser emissão futura.
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.cardAlt}>
                  <h3 className={styles.cardTitle}>Whitepaper honesto (risco)</h3>
                  <label style={{ fontSize: "0.82rem" }}>
                    Aviso de risco (será exibido na página da moeda)
                    <textarea
                      value={riskDisclaimer}
                      onChange={(e) => setRiskDisclaimer(e.target.value)}
                      rows={6}
                      style={{
                        marginTop: "0.25rem",
                        width: "100%",
                        padding: "0.6rem 0.7rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(5,6,8,0.9)",
                        color: "#fff",
                        fontSize: "0.86rem",
                        resize: "vertical",
                      }}
                    />
                  </label>
                  <p
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    Regra 3ustaquio: se parecer promessa de retorno garantido, não entra. Seja brutalmente honesto
                    sobre por que alguém NÃO deveria comprar seu token.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.ctaGhost}`}
                  onClick={() => setStep(1)}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.ctaPrimary}`}
                  onClick={goNextFromStep2}
                >
                  Continuar para resumo
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 - CHECKOUT */}
          {step === 3 && (
            <div style={{ marginTop: "2rem", display: "grid", gap: "1.5rem" }}>
              <div className={styles.cardsGrid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Resumo do token</h3>
                  <ul className={styles.cardList}>
                    <li>
                      <strong>Nome:</strong> {name || "—"}
                    </li>
                    <li>
                      <strong>Ticker:</strong> {symbol || "—"}
                    </li>
                    <li>
                      <strong>Slug:</strong> {slug || "—"}
                    </li>
                    <li>
                      <strong>Tipo visual:</strong> {tokenKind || "—"}
                    </li>
                    <li>
                      <strong>Tipo de coin:</strong> {coinTypeCode}
                    </li>
                    <li>
                      <strong>Supply inicial:</strong> {supplyInitial || "—"}
                    </li>
                    <li>
                      <strong>Supply máximo:</strong> {supplyMax || "—"}
                    </li>
                  </ul>
                  <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", opacity: 0.8 }}>
                    Narrativa curta: {narrativeShort || "—"}
                  </p>
                </div>

                <div className={styles.cardAlt}>
                  <h3 className={styles.cardTitle}>Taxa e compromisso</h3>
                  <p className={styles.cardBody}>
                    A taxa de lançamento serve para manter a infraestrutura hacker rodando, não para “vender
                    investimento”. O jogo é seu, a ferramenta é nossa.
                  </p>
                  <ul className={styles.cardList}>
                    <li>Taxa 3ustaquio (única por lançamento): <strong>R$ {TAX_VALUE.toFixed(2)}</strong></li>
                    <li>Configuração de pool inicial e criação de mercado.</li>
                    <li>Exposição na Arena com zona de risco e transparência de dados.</li>
                  </ul>

                  <div className={styles.warningBox} style={{ marginTop: "0.9rem" }}>
                    <h4 className={styles.warningTitle}>Aviso sério ao criador</h4>
                    <p className={styles.warningText}>
                      Ao lançar essa moeda, você não está prometendo retorno para ninguém.
                      Você está abrindo um jogo especulativo em cima da sua narrativa.
                      O 3ustaquio é ferramenta, não é banco, nem corretora, nem consultoria.
                    </p>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "flex-start",
                      marginTop: "0.9rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acceptRisk}
                      onChange={(e) => setAcceptRisk(e.target.checked)}
                      style={{ marginTop: "0.2rem" }}
                    />
                    <span>
                      Eu entendo que estou criando um token especulativo, que não é investimento seguro, e que
                      ninguém tem garantia de retorno. O preço pode subir, cair ou virar pó.
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.ctaGhost}`}
                  disabled={loading}
                  onClick={() => setStep(2)}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.ctaPrimary}`}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Lançando token..." : "Entendo o risco e quero lançar meu token"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 - SUCESSO / DIVULGAR */}
          {step === 4 && createdToken && (
            <div style={{ marginTop: "2rem", display: "grid", gap: "1.5rem" }}>
              <div className={styles.cardAlt}>
                <h3 className={styles.cardTitle}>Token lançado na Arena 🎉</h3>
                <p className={styles.cardBody}>
                  Seu token <strong>{createdToken.symbol}</strong> já está rodando na Arena.
                  Agora começa a parte divertida: explicar a narrativa para sua comunidade e reforçar o risco.
                </p>

                <ul className={styles.cardList}>
                  <li>
                    Página pública da moeda:{" "}
                    <code style={{ fontSize: "0.8rem" }}>
                      3ustaquio.com/arena/{createdToken.slug}
                    </code>
                  </li>
                  <li>Painel do criador: métricas em tempo real, zonas de hype, frio e bolha.</li>
                </ul>
              </div>

              <div className={styles.cardsGrid}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Texto pronto para redes</h3>
                  <textarea
                    readOnly
                    value={shareText}
                    rows={5}
                    style={{
                      marginTop: "0.5rem",
                      width: "100%",
                      padding: "0.6rem 0.7rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(5,6,8,0.9)",
                      color: "#fff",
                      fontSize: "0.86rem",
                      resize: "vertical",
                    }}
                  />
                  <button
                    type="button"
                    className={`${styles.button} ${styles.ctaGhost}`}
                    style={{ marginTop: "0.75rem" }}
                    onClick={copyShareText}
                  >
                    Copiar texto
                  </button>
                  <p style={{ marginTop: "0.4rem", fontSize: "0.75rem", opacity: 0.7 }}>
                    Regra de ouro: não edite isso para virar promessa de retorno. Se fizer isso, já não é 3ustaquio.
                  </p>
                </div>

                <div className={styles.cardAlt}>
                  <h3 className={styles.cardTitle}>Próximos passos</h3>
                  <ul className={styles.cardList}>
                    <li>Explique sempre que é jogo especulativo, não investimento garantido.</li>
                    <li>Combine lives, vídeos e posts mostrando os números e o risco.</li>
                    <li>Use o painel do criador para enxergar hype, frio e bolha.</li>
                  </ul>

                  <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.ctaPrimary}`}
                      onClick={() =>
                        router.push(`/creator/tokens/${createdToken.slug}/dashboard`)
                      }
                    >
                      Abrir painel do meu token
                    </button>
                    <a
                      href={`/arena/${createdToken.slug}`}
                      className={`${styles.button} ${styles.ctaGhost}`}
                    >
                      Ver página pública na Arena
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
