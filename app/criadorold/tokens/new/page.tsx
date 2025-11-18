"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css"; // ajusta o caminho conforme a sua estrutura
import { supabase } from "../../../lib/supabaseClient";

// === TIPAGEM ===
type Step = 1 | 2 | 3 | 4;
type TokenKind = "PESSOA" | "PROJETO" | "COMUNIDADE";
type CoinTypeCode = "MEME" | "LASTREADA" | "COMUNIDADE";

// === DADOS E REGRAS DA PLATAFORMA (ANTI-BS) ===
const DEFAULT_RISK_DISCLAIMER = `
Este token é um experimento especulativo de narrativa.
Não é investimento seguro, não é produto de investimento regulado, não tem garantia de retorno.
Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.
`.trim();

const FORBIDDEN_WORDS: string[] = [
  "investimento seguro",
  "investimento garantido",
  "garantia de retorno",
  "retorno garantido",
  "lucro garantido",
  "renda fixa",
  "multiplicar com certeza",
  "sem risco",
  "risco zero",
  "oportunidade única",
  "ficar rico",
  "enriquecimento rápido",
  "retorno certo",
  "rentabilidade",
  "dividendos",
];

const TAX_VALUE = 49.9; // Taxa de infra-hacker

// === METADADOS DO WIZARD ===
const stepMeta = {
  1: {
    eyebrow: "Passo 1 de 3",
    title: "Escolha o Palco da Narrativa",
    subtitle:
      "Defina se o jogo gira em torno de uma pessoa, de um projeto ou de uma tribo.",
    checklist: [
      "Decidir quem é o protagonista da moeda",
      "Entender qual vibe combina com o token",
      "Preparar o terreno para a história",
    ],
  },
  2: {
    eyebrow: "Passo 2 de 3",
    title: "Crie a Identidade do Jogo",
    subtitle:
      "Nome, ticker e a história que sua tribo vai comprar (ou não). Seja direto.",
    checklist: [
      "Nome memorável (personagem + tribo)",
      "Ticker curto e fácil de falar (Ex: $HYPE)",
      "Narrativa curta que explica o jogo em 5s",
    ],
  },
  3: {
    eyebrow: "Passo 3 de 3",
    title: "Regras, Risco e Lançamento",
    subtitle:
      "Defina o tamanho do jogo, seja brutalmente honesto sobre o risco e aperte o botão.",
    checklist: [
      "Tamanho do jogo (supply inicial)",
      "Definir se haverá limite máximo (cap)",
      "Aviso de risco explícito e aceite final",
    ],
  },
} as const;

type StepMeta = (typeof stepMeta)[keyof typeof stepMeta];

const wizardSteps: { id: Step; label: string }[] = [
  { id: 1, label: "Tipo" },
  { id: 2, label: "Identidade" },
  { id: 3, label: "Risco & Lançamento" },
];

// === O COMPONENTE PRINCIPAL ===
export default function CreateTokenPage() {
  const router = useRouter();

  // === ESTADO DO FORMULÁRIO E DO WIZARD ===
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passo 1: Tipo
  const [tokenKind, setTokenKind] = useState<TokenKind | null>(null);
  const [coinTypeCode, setCoinTypeCode] = useState<CoinTypeCode>("MEME");

  // Passo 2: Identidade
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [slug, setSlug] = useState("");
  const [narrativeShort, setNarrativeShort] = useState("");
  const [narrativeLong, setNarrativeLong] = useState("");

  // Passo 3: Regras & Risco
  const [riskDisclaimer, setRiskDisclaimer] = useState(DEFAULT_RISK_DISCLAIMER);
  const [supplyInitial, setSupplyInitial] = useState("1000000");
  const [supplyMax, setSupplyMax] = useState("1000000");
  const [acceptRisk, setAcceptRisk] = useState(false);

  // Passo 4: Sucesso
  const [createdToken, setCreatedToken] = useState<{
    slug: string;
    name: string;
    symbol: string;
  } | null>(null);

  // === LÓGICA DE NAVEGAÇÃO E HELPERS ===
  function handleSelectTokenKind(kind: TokenKind) {
    setTokenKind(kind);
    setError(null);
    // Regra: Comunidade tem tipo diferente
    setCoinTypeCode(kind === "COMUNIDADE" ? "COMUNIDADE" : "MEME");
  }

  function handleNameChange(value: string) {
    setName(value);

    // Auto-gera o slug se estiver vazio
    if (!slug.trim()) {
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
    setSymbol(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8)
    );
  }

  function goNextFromStep1() {
    if (!tokenKind) {
      setError("Escolha um tipo de narrativa para começar o jogo.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function goNextFromStep2() {
    if (
      !name.trim() ||
      !symbol.trim() ||
      !slug.trim() ||
      !narrativeShort.trim()
    ) {
      setError(
        "Preencha nome, ticker, slug e a narrativa curta. É o mínimo para o jogo começar."
      );
      return;
    }
    setError(null);
    setStep(3);
  }

  // === LÓGICA DE VALIDAÇÃO (ANTI-BS) ===

  // Validação de palavras proibidas
  const forbiddenHits = useMemo(() => {
    const text = `${name} ${narrativeShort} ${narrativeLong} ${riskDisclaimer}`.toLowerCase();
    const hits = new Set<string>();

    FORBIDDEN_WORDS.forEach((term) => {
      if (text.includes(term.toLowerCase())) {
        hits.add(term);
      }
    });

    return Array.from(hits);
  }, [name, narrativeShort, narrativeLong, riskDisclaimer]);

  const hasForbidden = forbiddenHits.length > 0;

  // Preview de risco (UX)
  const riskBandMemo = useMemo(() => {
    const supplyNumber = Number(supplyInitial) || 0;

    if (supplyNumber >= 5_000_000) {
      return {
        band: "Modo Kamikaze",
        desc: "Escala de bolha memética. Se você está aqui, entenda: é jogo de narrativa extrema, não plano de aposentadoria.",
        badgeColor: "rgba(255, 0, 85, 0.9)",
      };
    }

    if (supplyNumber >= 1_000_000) {
      return {
        band: "Hype Volátil",
        desc: "Supply generoso. Se a narrativa pegar, o gráfico vira montanha-russa. Se flopar, vira pó rápido.",
        badgeColor: "rgba(255, 221, 0, 0.9)",
      };
    }

    return {
      band: "Jogo Leve",
      desc: "Token ainda em modo laboratório. Pequena escala, bom para testar narrativa com calma.",
      badgeColor: "rgba(0, 255, 255, 0.85)",
    };
  }, [supplyInitial]);

  // === SUBMISSÃO ===
  async function handleSubmit() {
  // 1. Validar Risco
  if (!acceptRisk) {
    setError(
      "Você precisa aceitar o aviso de risco para lançar. Não tem 'desver' depois."
    );
    return;
  }

  // 2. Validar Linguagem (Anti-BS)
  if (hasForbidden) {
    setError(
      "Seu texto usa termos proibidos (promessa de retorno / risco zero). Remova-os para continuar."
    );
    return;
  }

  // 3. Validar Supply
  if (
    !supplyInitial ||
    Number.isNaN(Number(supplyInitial)) ||
    Number(supplyInitial) <= 0
  ) {
    setError("Defina um supply inicial válido (maior que zero).");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // ==========================================
    // 1) Auth: pega usuário logado (auth.users)
    // ==========================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Você precisa estar logado para lançar um token.");
    }

    // ==========================================
    // 2) users: encontra o registro interno
    // ==========================================
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !dbUser) {
      throw new Error(
        "Não encontrei seu perfil interno de usuário. Fale com o suporte 3ustaquio."
      );
    }

    // ==========================================
    // 3) creators: garante que é CREATOR
    // ==========================================
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (creatorError || !creator) {
      throw new Error(
        "Você ainda não é um creator cadastrado. Conclua o onboarding de creator antes de lançar um token."
      );
    }

    // ==========================================
    // 4) coin_types: acha o tipo (MEME / LASTREADA / COMUNIDADE)
    // ==========================================
    const { data: coinType, error: coinTypeError } = await supabase
      .from("coin_types")
      .select("id, code")
      .eq("code", coinTypeCode)
      .single();

    if (coinTypeError || !coinType) {
      throw new Error(
        "Tipo de token inválido. Recarregue a página ou fale com o suporte."
      );
    }

    // ==========================================
    // 5) monta o payload da moeda
    // ==========================================
    const payload = {
      slug: slug.trim(),
      symbol: symbol.trim(),
      name: name.trim(),
      creator_id: creator.id,
      coin_type_id: coinType.id, // FK para coin_types

      status: "ACTIVE" as const, // ou 'DRAFT' se quiser fluxo de aprovação

      narrative_short: narrativeShort.trim(),
      narrative_long: narrativeLong.trim() || null,
      risk_disclaimer: riskDisclaimer.trim(),

      supply_initial: supplyInitial ? Number(supplyInitial) : null,
      supply_max: supplyMax ? Number(supplyMax) : null,
      supply_circulating: 0,

      is_featured: false,
      tags: tokenKind ? [tokenKind.toLowerCase()] : null, // ex.: ["pessoa", "projeto", "comunidade"]

      // pool_wallet_id fica null por enquanto (será configurado no setup de AMM)
    };

    // Só mais uma defesa de UX: slug único
    if (!payload.slug) {
      throw new Error("Defina um slug válido para a URL da moeda.");
    }

    // ==========================================
    // 6) Insere em public.coins e retorna os campos chave
    // ==========================================
    const { data: coin, error: coinError } = await supabase
      .from("coins")
      .insert(payload)
      .select("id, slug, name, symbol")
      .single();

    if (coinError || !coin) {
      console.error(coinError);
      throw new Error("Erro ao salvar o token nas tabelas. Tente novamente.");
    }

    // Atualiza estado local de sucesso
    setCreatedToken({
      slug: coin.slug,
      name: coin.name,
      symbol: coin.symbol,
    });
    setStep(4);
  } catch (err: any) {
    console.error(err);
    setError(
      err?.message ||
        "Não foi possível lançar o token agora. Tente novamente em alguns minutos."
    );
  } finally {
    setLoading(false);
  }
}


  // === LÓGICA DE COMPARTILHAMENTO (PÓS-LANÇAMENTO) ===
  const shareText = useMemo(() => {
    if (!createdToken) return "";
    return (
      `Lancei o token $${createdToken.symbol} na Arena 3ustaquio. ` +
      `É um jogo de narrativa e hype consciente, não promessa de retorno. ` +
      `A vibe é "Hacker Ético": transparência total e risco explícito. ` +
      `Se você não gosta de risco ou acha que vai ficar rico rápido, NÃO ENTRE. ` +
      `Se flopar, vira pó. ` +
      `Acompanhe o experimento: https://3ustaquio.com/arena/${createdToken.slug}`
    ).trim();
  }, [createdToken]);

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Texto copiado. Cole nas suas redes. (Lembre-se: sem promessas!)");
    } catch {
      alert("Não foi possível copiar. Faça na mão.");
    }
  }

  // ===============================================
  // === BLOCOS DE RENDERIZAÇÃO (SUB-COMPONENTES) ===
  // ===============================================

  function renderWizardTracker() {
    return (
      <nav className={styles.wizardTracker}>
        {wizardSteps.map((s) => (
          <div
            key={s.id}
            className={`${styles.wizardStep} ${
              step === s.id
                ? styles.wizardStepCurrent
                : step > s.id
                ? styles.wizardStepDone
                : ""
            }`}
          >
            <span>{s.label}</span>
          </div>
        ))}
      </nav>
    );
  }

  function renderStepHeader(meta: StepMeta) {
    return (
      <>
        <header className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>{meta.eyebrow}</p>
          <h2 className={styles.sectionTitle}>{meta.title}</h2>
          <p className={styles.sectionDescription}>{meta.subtitle}</p>
        </header>

        <div className={styles.pillRow}>
          <div className={styles.pill}>
            <span className={styles.pillLabel}>Neste passo você vai...</span>
          </div>
        </div>

        <ul className={styles.cardList} style={{ marginTop: "0.75rem" }}>
          {meta.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    );
  }

  function renderPreviewCard() {
    return (
      <div className={styles.previewCard}>
        <h3 className={styles.machineTitle}>Preview da Arena</h3>
        <p
          style={{
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.6)",
            marginTop: "-0.5rem",
            marginBottom: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "1rem",
          }}
        >
          É assim que seu token aparece para o mundo. Sem maquiagem.
        </p>

        <div className={styles.previewTokenDisplay}>
          <div className={styles.previewTokenIcon}>
            {symbol.slice(0, 1) || "?"}
          </div>
          <div className={styles.previewTokenInfo}>
            <h4 className={styles.previewTokenName}>
              {name || "Nome da Moeda"}
            </h4>
            <span className={styles.previewTokenTicker}>
              ${symbol || "TICKER"}
            </span>
          </div>
        </div>

        <div className={styles.previewTokenKind}>
          {tokenKind ? (
            <>
              {tokenKind === "PESSOA" && "👤"}
              {tokenKind === "PROJETO" && "🏗️"}
              {tokenKind === "COMUNIDADE" && "🫂"} Token de{" "}
              {tokenKind.toLowerCase()}
            </>
          ) : (
            "Tipo de narrativa"
          )}
        </div>

        <p className={styles.previewTokenNarrative}>
          {narrativeShort ||
            "A narrativa curta (a história que explica o jogo) aparece aqui..."}
        </p>

        <div className={styles.riskZone}>
          <h5 className={styles.riskZoneTitle}>Zona de Risco</h5>
          <div
            className={styles.riskBadge}
            style={{ backgroundColor: riskBandMemo.badgeColor }}
          >
            {riskBandMemo.band}
          </div>
          <p className={styles.riskZoneDesc}>{riskBandMemo.desc}</p>
        </div>

        <footer className={styles.previewFooter}>
          <span className={styles.previewRiskKicker}>⚠️ Risco Extremo</span>
          <span className={styles.previewRiskMain}>
            Sem Garantia de Retorno
          </span>
        </footer>
      </div>
    );
  }

  // Passo 1
  function renderStep1() {
    const meta = stepMeta[1];
    return (
      <>
        {renderStepHeader(meta)}

        <div className={styles.cardsGrid} style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => handleSelectTokenKind("PESSOA")}
            className={`${styles.card} ${styles.cardButton} ${
              tokenKind === "PESSOA" ? styles.cardButtonActive : ""
            }`}
          >
            <span className={styles.cardKicker}>👤 Token Pessoa</span>
            <h3 className={styles.cardTitle}>Criador, Artista, Figura</h3>
            <p className={styles.cardBody}>
              Sua cara, seu nome, sua história. A comunidade especula em cima da
              narrativa, não de uma promessa de "ficar rico".
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTokenKind("PROJETO")}
            className={`${styles.card} ${styles.cardButton} ${
              tokenKind === "PROJETO" ? styles.cardButtonActive : ""
            }`}
          >
            <span className={styles.cardKicker}>🏗️ Token Projeto</span>
            <h3 className={styles.cardTitle}>Squads, Missões, Experimentos</h3>
            <p className={styles.cardBody}>
              Uma missão, uma fase, um experimento. A narrativa é o foco. Quando
              acaba, vira história (ou pó).
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTokenKind("COMUNIDADE")}
            className={`${styles.card} ${styles.cardButton} ${
              tokenKind === "COMUNIDADE" ? styles.cardButtonActive : ""
            }`}
          >
            <span className={styles.cardKicker}>🫂 Token Comunidade</span>
            <h3 className={styles.cardTitle}>Guilda, Fandom, Tribo</h3>
            <p className={styles.cardBody}>
              A moeda vira bandeira de tribo, símbolo especulativo de
              pertencimento — não promessa de renda.
            </p>
          </button>
        </div>

        <div className={styles.wizardActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.ctaPrimary}`}
            onClick={goNextFromStep1}
            disabled={!tokenKind}
          >
            Continuar para Identidade
          </button>
        </div>
      </>
    );
  }

  // Passo 2
  function renderStep2() {
  const meta = stepMeta[2];

  return (
    <>
      {renderStepHeader(meta)}

      {/* Grid mais largo só para este passo */}
      <div className={styles.cardsGridWizard}>
        {/* === CARD 1: IDENTIDADE === */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div>
              <span className={styles.cardKicker}>Identidade da Moeda</span>
              <h3 className={styles.cardTitle}>
                Como sua moeda aparece na Arena
              </h3>
            </div>
            <span className={styles.cardBadge}>Identidade</span>
          </div>

          <p className={styles.cardBody}>
            Pense em algo que você consiga sustentar no tempo: nome fácil de
            falar, ticker que gruda na cabeça e URL limpa. É assim que a galera
            vai procurar sua moeda.
          </p>

          <div className={styles.formGridIdentity}>
            <label className={styles.label}>
              Nome da moeda
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Moeda do Hype Consciente"
              />
              <span className={styles.inputHelp}>
                Use algo que a sua tribo reconheça e repita com orgulho.
              </span>
            </label>

            <label className={styles.label}>
              Ticker (símbolo curto, 3–8 letras)
              <input
                type="text"
                className={styles.input}
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                placeholder="Ex: HYPE"
              />
              <span className={styles.inputHelp}>
                Vai aparecer como <strong>${symbol || "HYPE"}</strong> na Arena.
              </span>
            </label>

            <label className={`${styles.label} ${styles.labelFull}`}>
              Slug (URL da moeda na Arena)
              <input
                type="text"
                className={styles.input}
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                  )
                }
                placeholder="Ex: hype-consciente"
              />
              <span className={styles.inputHelp}>
                URL final:&nbsp;
                <code>3ustaquio.com/arena/{slug || "seu-slug"}</code>
              </span>
            </label>
          </div>
        </div>

        {/* === CARD 2: NARRATIVA (ANTI-BS) === */}
        <div className={styles.cardAlt}>
          <div className={styles.cardHeaderRow}>
            <div>
              <span className={styles.cardKicker}>Narrativa (Anti-BS)</span>
              <h3 className={styles.cardTitle}>
                O script que a sua tribo vai ler
              </h3>
            </div>
            <span className={styles.cardBadge}>Story</span>
          </div>

          <p className={styles.cardBody}>
            Aqui você explica o <strong>jogo</strong>, não inventa promessa de
            retorno. Curto = gancho. Longo = contexto para quem quer entender
            melhor o experimento.
          </p>

          <div className={styles.formGridNarrative}>
            <label className={styles.label}>
              Narrativa curta (o “tweet” do seu token)
              <textarea
                value={narrativeShort}
                onChange={(e) => setNarrativeShort(e.target.value)}
                placeholder="Ex: Um experimento sobre hype. Se a história for boa, o mercado decide. Se não, vira pó."
                rows={4}
                className={styles.textarea}
              />
              <span className={styles.inputHelp}>
                Use 1–2 frases. É o pitch que caberia num post rápido.
              </span>
            </label>

            <label className={styles.label}>
              Narrativa longa (opcional, mini whitepaper honesto)
              <textarea
                value={narrativeLong}
                onChange={(e) => setNarrativeLong(e.target.value)}
                placeholder="Conte a história completa: de onde veio a ideia, o que representa, o que NÃO é. Sem promessa, só verdade."
                rows={6}
                className={styles.textarea}
              />
              <span className={styles.inputHelp}>
                Use para detalhar o contexto, objetivos, limites e o que sua
                moeda <strong>não</strong> se propõe a ser.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.wizardActions}>
        <button
          type="button"
          className={`${styles.button} ${styles.ctaGhost}`}
          onClick={() => setStep(1)}
        >
          Voltar (Tipo)
        </button>

        <button
          type="button"
          className={`${styles.button} ${styles.ctaPrimary}`}
          onClick={goNextFromStep2}
        >
          Revisar Regras &amp; Risco
        </button>
      </div>
    </>
  );
}


  // Passo 3
  function renderStep3() {
  const meta = stepMeta[3];

  return (
    <>
      {renderStepHeader(meta)}

      {/* Grid principal do passo 3: Tokenomics + Risco */}
      <div className={styles.cardsGridRisk}>
        {/* === CARD 1: REGRAS DO JOGO (TOKENOMICS) === */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div>
              <span className={styles.cardKicker}>Regras do jogo</span>
              <h3 className={styles.cardTitle}>
                Tokenomics sem planilha mágica
              </h3>
            </div>
            <span className={styles.cardBadge}>Tamanho do jogo</span>
          </div>

          <p className={styles.cardBody}>
            Aqui você define o tamanho do experimento. Nada de fórmula secreta
            de enriquecimento: é só escala de narrativa. Quanto maior o supply,
            mais volátil tende a ser a brincadeira.
          </p>

          <div className={styles.formGridTokenomics}>
            <label className={styles.label}>
              Supply inicial (tokens na pool de largada)
              <input
                type="number"
                min={1}
                value={supplyInitial}
                onChange={(e) => setSupplyInitial(e.target.value)}
                className={styles.input}
              />
              <span className={styles.inputHelp}>
                É o tamanho do jogo no dia zero. Quanto maior, mais fichas já
                começam na mesa.
              </span>
            </label>

            <label className={styles.label}>
              Supply máximo (teto opcional)
              <input
                type="number"
                min={Number(supplyInitial) || 1}
                value={supplyMax}
                onChange={(e) => setSupplyMax(e.target.value)}
                className={styles.input}
              />
              <span className={styles.inputHelp}>
                Se não pretende emitir depois, deixe igual ao supply inicial.
                Se quiser ter espaço para novas fases, defina um teto.
              </span>
            </label>
          </div>

          <div className={styles.inputHelp} style={{ marginTop: "0.9rem" }}>
            Dica 3ustaquio: comece menor, teste a narrativa, veja se a tribo
            compra a ideia. Amplia depois, se fizer sentido.
          </div>
        </div>

        {/* === CARD 2: WHITEPAPER HONESTO (RISCO) === */}
        <div className={styles.cardAlt}>
          <div className={styles.cardHeaderRow}>
            <div>
              <span className={styles.cardKicker}>Whitepaper honesto</span>
              <h3 className={styles.cardTitle}>
                Risco explicado sem perfumaria
              </h3>
            </div>
            <span className={styles.cardBadge}>Risco</span>
          </div>

          <p className={styles.cardBody}>
            Este é o texto que vai segurar você no futuro. Ele precisa deixar
            claro que é um <strong>jogo especulativo</strong>, sem promessa de
            retorno, sem papo de “dinheiro fácil”.
          </p>

          <label className={styles.label} style={{ marginTop: "1.1rem" }}>
            Aviso de risco (aparece na página da moeda)
            <textarea
              value={riskDisclaimer}
              onChange={(e) => setRiskDisclaimer(e.target.value)}
              rows={7}
              className={styles.textarea}
              style={{
                borderColor: hasForbidden
                  ? "rgba(255, 0, 85, 0.9)"
                  : "rgba(255,255,255,0.16)",
              }}
            />
            <span className={styles.inputHelp}>
              Regra 3ustaquio: se soar como promessa de retorno, está errado.
              Fale de risco, incerteza, experimento. Nada de “garantia”.
            </span>
          </label>
        </div>
      </div>

      {/* CARD 3: TAXA + CHECKLIST FINAL + ACEITE DE RISCO */}
      <div className={`${styles.card} ${styles.cardWide}`}>
        <h3 className={styles.cardTitle}>Taxa, ética &amp; checklist final</h3>

        <p className={styles.cardBody} style={{ marginBottom: "0.9rem" }}>
          A taxa de lançamento (
          <strong>R$ {TAX_VALUE.toFixed(2)}</strong>) paga a infra-hacker
          (contrato, pool, Arena). Ela <strong>não</strong> compra o direito de
          prometer riqueza. Você continua 100% responsável pelo que fala.
        </p>

        {hasForbidden ? (
          <div className={styles.warningBox}>
            <h4 className={styles.warningTitle}>
              ⚠️ ALERTA: Linguagem Proibida Detectada
            </h4>
            <p className={styles.warningText}>
              Os textos da sua moeda usam termos que quebram a regra anti-BS
              (promessa de retorno / risco zero). Remova-os para poder lançar:
            </p>
            <ul className={styles.forbiddenList}>
              {forbiddenHits.map((term) => (
                <li key={term}>
                  <code>{term}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={styles.successBox}>
            <h4 className={styles.successTitle}>
              ✅ Linguagem alinhada com o Hacker Ético
            </h4>
            <p className={styles.successText}>
              Não detectamos promessas de “lucro garantido” ou “risco zero”.
              Mantenha essa postura nas redes: narrativa, jogo e transparência
              sempre em primeiro lugar.
            </p>
          </div>
        )}

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={acceptRisk}
            onChange={(e) => setAcceptRisk(e.target.checked)}
          />
          <span>
            <strong>Declaração de Risco (Obrigatório):</strong> Eu entendo que
            estou criando um <strong>jogo especulativo de narrativa</strong>, não
            um “investimento seguro”. Eu entendo que o preço pode subir, cair
            ou <strong>virar pó</strong>, e que ninguém tem garantia de retorno.
          </span>
        </label>
      </div>

      <div className={styles.wizardActions}>
        <button
          type="button"
          className={`${styles.button} ${styles.ctaGhost}`}
          disabled={loading}
          onClick={() => setStep(2)}
        >
          Voltar (Identidade)
        </button>

        <button
          type="button"
          className={`${styles.button} ${styles.ctaPrimary} ${
            hasForbidden ? styles.ctaDisabled : ""
          }`}
          disabled={loading || hasForbidden || !acceptRisk}
          onClick={handleSubmit}
          title={
            hasForbidden
              ? "Ajuste a linguagem para remover promessas."
              : !acceptRisk
              ? "Você precisa aceitar a declaração de risco."
              : "Lançar o experimento na Arena"
          }
        >
          {loading
            ? "Lançando na Arena..."
            : "Lançar token (Entendendo o Risco)"}
        </button>
      </div>
    </>
  );
}

  // Passo 4 – Sucesso
  function renderSuccessStep() {
    if (!createdToken) return null;

    return (
      <div className={styles.successPanel}>
        <header className={styles.sectionHeader}>
          <p className={styles.sectionKicker} style={{ color: "#00FFC2" }}>
            Experimento no ar
          </p>
          <h2 className={styles.sectionTitle}>
            Token ${createdToken.symbol} lançado na Arena!
          </h2>
          <p className={styles.sectionDescription}>
            Ok, o experimento começou. Agora, sua responsabilidade é com a
            narrativa, não com o preço.
          </p>
        </header>

        <div className={styles.warningBox} style={{ marginTop: "1.5rem" }}>
          <h4 className={styles.warningTitle}>Aviso de Criador (Hacker Ético)</h4>
          <p className={styles.warningText}>
            Sua responsabilidade SÓ COMEÇOU.
            <br />
            <strong>NÃO prometa lucro.</strong>{" "}
            <strong>NÃO fale em "investimento".</strong>
            <br />
            Fale da narrativa, do jogo, da comunidade, do risco. Se você mentir
            para sua tribo, ela vai saber. Jogue limpo.
          </p>
        </div>

        <div className={styles.card} style={{ marginTop: "1.5rem" }}>
          <h3 className={styles.cardTitle}>
            Divulgue o experimento (com ética)
          </h3>
          <p className={styles.cardBody}>
            Copiamos um texto-base "anti-BS" para você usar nas redes. Sinta-se
            livre para adaptar, desde que mantenha a transparência sobre o
            risco.
          </p>

          <textarea
            readOnly
            value={shareText}
            rows={10}
            className={styles.textarea}
            style={{ marginTop: "0.75rem", opacity: 0.8 }}
          />

          <div
            className={styles.wizardActions}
            style={{ padding: 0, marginTop: "1rem" }}
          >
            <button
              type="button"
              className={`${styles.button} ${styles.ctaGhost}`}
              onClick={copyShareText}
            >
              Copiar texto para redes
            </button>

            <button
              type="button"
              className={`${styles.button} ${styles.ctaPrimary}`}
              onClick={() => router.push(`/arena/${createdToken.slug}`)}
            >
              Ver token na Arena
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================
  // === RENDERIZAÇÃO PRINCIPAL (LAYOUT)
  // ===================================
  return (
    <div className={styles.wizardLayout}>
      {/* Coluna Esquerda: Conteúdo do Passo */}
      <div className={styles.wizardContent}>
        {step < 4 && renderWizardTracker()}

        {error && (
          <div className={styles.errorBox}>
            <h4 className={styles.errorTitle}>Opa, atenção hacker:</h4>
            <p>{error}</p>
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderSuccessStep()}
      </div>

      {/* Coluna Direita: Preview (só aparece nos passos 1-3) */}
      {step < 4 && (
        <aside className={styles.wizardPreview}>{renderPreviewCard()}</aside>
      )}
    </div>
  );
}
