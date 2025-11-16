"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "../../page.module.css";

type RiskZone = "FRIO" | "HYPE" | "BOLHA" | "NEUTRO";

interface ArenaData {
  coin: {
    id: string;
    slug: string;
    symbol: string;
    name: string;
    narrativeShort: string | null;
    narrativeLong: string | null;
    riskDisclaimer: string | null;
    status: string;
  };
  market: {
    priceCurrent: number | null;
    volume24hBase: number | null;
    volume24hCoin: number | null;
    trades24h: number | null;
    riskZone: RiskZone;
    hypeScore: number | null;
    volatilityScore: number | null;
  } | null;
  holdersCount: number;
  posts: {
    id: string;
    kind: string;
    content: string;
    created_at: string;
    is_pinned: boolean;
  }[];
}

// --- helpers de UX / texto ---

function getRiskLabel(zone: RiskZone | null | undefined) {
  switch (zone) {
    case "HYPE":
      return "Hype – volume forte, emoção alta, narrativa em chamas.";
    case "BOLHA":
      return "Zona de bolha – subida exagerada, quase nunca dura.";
    case "FRIO":
      return "Mercado frio – pouco volume, pouca variação, pouca atenção.";
    case "NEUTRO":
    default:
      return "Zona neutra – nem hype, nem abandono. A história ainda está se escrevendo.";
  }
}

function getRiskBadgeColor(zone: RiskZone | null | undefined) {
  switch (zone) {
    case "HYPE":
      return "rgba(255,221,0,0.18)";
    case "BOLHA":
      return "rgba(255,0,85,0.24)";
    case "FRIO":
      return "rgba(0,255,255,0.14)";
    case "NEUTRO":
    default:
      return "rgba(255,255,255,0.08)";
  }
}

// efeito de texto digitando na tela
const HERO_PHRASES = [
  "Moeda de hype consciente.",
  "Não é investimento seguro.",
  "Se você não aguenta perder, não compre.",
];

export default function ArenaTokenPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<ArenaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // typewriter
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroText, setHeroText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // carrega dados da API
  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/creator/tokens/${slug}/metrics`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Erro ao carregar dados da moeda.");
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "Falha ao carregar dados da moeda.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  // efeito de digitação do texto "moeda de hype"
  useEffect(() => {
    const currentPhrase = HERO_PHRASES[heroIndex] ?? "";
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && heroText === currentPhrase) {
      // frase completa → segura um pouco e começa a apagar
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && heroText === "") {
      // frase apagada → vai pra próxima
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setHeroIndex((prev) => (prev + 1) % HERO_PHRASES.length);
      }, 400);
    } else {
      timeout = setTimeout(
        () => {
          if (!isDeleting) {
            setHeroText(currentPhrase.slice(0, heroText.length + 1));
          } else {
            setHeroText(currentPhrase.slice(0, heroText.length - 1));
          }
        },
        isDeleting ? 40 : 80
      );
    }

    return () => clearTimeout(timeout);
  }, [heroText, isDeleting, heroIndex]);

  const riskZone: RiskZone = data?.market?.riskZone ?? "NEUTRO";

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.inner}>
          {/* HEADER / HERO */}
          <header className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Arena · Moeda de narrativa</p>
            <h1 className={styles.sectionTitle}>
              {data
                ? `${data.coin.name} (${data.coin.symbol})`
                : "Carregando moeda..."}
            </h1>

            <p className={styles.sectionDescription}>
              <span>{heroText || "\u00A0"}</span>
            </p>

            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.8rem",
                maxWidth: "640px",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              3ustaquio é uma plataforma de emissão e negociação de{" "}
              <strong>tokens de narrativa</strong>. Não é banco, não é
              corretora, não é consultoria financeira. Tudo aqui é{" "}
              <strong>especulação consciente</strong>. Você pode perder 100% do
              valor colocado em qualquer moeda.
            </p>
          </header>

          {/* ESTADOS GERAIS */}
          {loading && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.9rem",
                opacity: 0.8,
              }}
            >
              Carregando dados da Arena dessa moeda...
            </p>
          )}

          {error && (
            <div className={styles.warningBox} style={{ marginTop: "1.5rem" }}>
              <p className={styles.warningText}>{error}</p>
            </div>
          )}

          {!loading && !error && !data && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.9rem",
                opacity: 0.8,
              }}
            >
              Moeda não encontrada na Arena.
            </p>
          )}

          {/* CONTEÚDO QUANDO TEM DADOS */}
          {!loading && !error && data && (
            <>
              {/* BLOCO PRINCIPAL: O QUE É ESSA MOEDA + RISCO */}
              <div
                className={styles.cardsGrid}
                style={{ marginTop: "2rem", alignItems: "stretch" }}
              >
                {/* O que é essa moeda */}
                <article className={styles.card}>
                  <span className={styles.cardKicker}>O que é essa moeda?</span>
                  <h2 className={styles.cardTitle}>
                    Narrativa em cima de {data.coin.name}
                  </h2>
                  <p className={styles.cardBody}>
                    {data.coin.narrativeShort ||
                      "O criador ainda não escreveu uma narrativa curta para essa moeda."}
                  </p>

                  {data.coin.narrativeLong && (
                    <p
                      style={{
                        marginTop: "0.8rem",
                        fontSize: "0.86rem",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {data.coin.narrativeLong}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "1rem",
                      display: "inline-flex",
                      padding: "0.5rem 0.8rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: getRiskBadgeColor(riskZone),
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                    }}
                  >
                    Zona de risco: {riskZone}
                  </div>

                  <p
                    style={{
                      marginTop: "0.45rem",
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {getRiskLabel(riskZone)}
                  </p>
                </article>

                {/* Aviso de risco + CTA */}
                <aside className={styles.cardAlt}>
                  <h3 className={styles.cardTitle}>Aviso de risco brutal</h3>
                  <p className={styles.cardBody}>
                    Entrar nessa moeda é entrar num{" "}
                    <strong>jogo de alto risco</strong>. O preço pode subir,
                    despencar ou virar pó. Se isso te incomoda,{" "}
                    <strong>não compre</strong>.
                  </p>

                  <ul className={styles.cardList}>
                    <li>Não é investimento seguro.</li>
                    <li>Não é produto financeiro regulado.</li>
                    <li>Não existe promessa de retorno.</li>
                    <li>Você é 100% responsável pela sua decisão.</li>
                  </ul>

                  <div
                    className={styles.warningBox}
                    style={{ marginTop: "0.9rem" }}
                  >
                    <h4 className={styles.warningTitle}>
                      Regra da Arena 3ustaquio
                    </h4>
                    <p className={styles.warningText}>
                      Se alguém estiver te vendendo essa moeda como
                      “investimento garantido”, essa pessoa está{" "}
                      <strong>quebrando as regras do jogo</strong>. Aqui a
                      narrativa é livre, mas a mentira não.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <button
                      type="button"
                      className={`${styles.button} ${styles.ctaPrimary}`}
                      disabled
                      title="Negociação direta na Arena entra na próxima fase do produto."
                    >
                      Entrar no jogo (em breve)
                    </button>
                    <a
                      href="/"
                      className={`${styles.button} ${styles.ctaGhost}`}
                    >
                      Ver outras moedas na Arena
                    </a>
                  </div>
                </aside>
              </div>

              {/* NÚMEROS DA ARENA */}
              <section style={{ marginTop: "2.4rem" }}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionKicker}>Números da Arena</p>
                  <h2
                    className={styles.sectionTitle}
                    style={{ fontSize: "1.4rem" }}
                  >
                    Como essa narrativa está se comportando no mercado.
                  </h2>
                  <p className={styles.sectionDescription}>
                    Não é recomendação, não é análise de investimento. São
                    números crus para você interpretar como adulto.
                  </p>
                </div>

                <div className={styles.cardsGrid} style={{ marginTop: "1rem" }}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Visão rápida</h3>
                    <ul className={styles.cardList}>
                      <li>
                        <strong>Preço atual:</strong>{" "}
                        {data.market?.priceCurrent != null
                          ? `R$ ${Number(
                              data.market.priceCurrent
                            ).toFixed(4)}`
                          : "Sem dados ainda (ninguém jogou com essa moeda)."}
                      </li>
                      <li>
                        <strong>Volume base (24h):</strong>{" "}
                        {data.market?.volume24hBase != null
                          ? `~${Number(
                              data.market.volume24hBase
                            ).toFixed(2)}`
                          : "Sem volume registrado nas últimas 24h."}
                      </li>
                      <li>
                        <strong>Volume em coin (24h):</strong>{" "}
                        {data.market?.volume24hCoin != null
                          ? `~${Number(
                              data.market.volume24hCoin
                            ).toFixed(2)} ${data.coin.symbol}`
                          : "Sem volume em coin nas últimas 24h."}
                      </li>
                      <li>
                        <strong>Trades (24h):</strong>{" "}
                        {data.market?.trades24h ?? 0}
                      </li>
                      <li>
                        <strong>Holders:</strong> {data.holdersCount}
                      </li>
                    </ul>
                  </div>

                  <div className={styles.cardAlt}>
                    <h3 className={styles.cardTitle}>Leitura de hype</h3>
                    <ul className={styles.cardList}>
                      <li>
                        <strong>Hype score:</strong>{" "}
                        {data.market?.hypeScore != null
                          ? data.market.hypeScore.toFixed(3)
                          : "—"}
                      </li>
                      <li>
                        <strong>Volatilidade (vol7):</strong>{" "}
                        {data.market?.volatilityScore != null
                          ? data.market.volatilityScore.toFixed(3)
                          : "—"}
                      </li>
                    </ul>
                    <p className={styles.cardBody}>
                      Hype alto + volatilidade alta ={" "}
                      <strong>roleta narrativa</strong>. Não confunda isso com
                      “ativo sólido”. Aqui o jogo é assumir o risco na cara.
                    </p>
                  </div>

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Whitepaper honesto</h3>
                    <p className={styles.cardBody}>
                      {data.coin.riskDisclaimer ||
                        "O criador ainda não escreveu um disclaimer personalizado. Por padrão: esse token é especulativo, pode valer zero e não é produto financeiro regulado."}
                    </p>
                    <p
                      style={{
                        marginTop: "0.7rem",
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      A ideia de whitepaper aqui não é te fazer dormir com
                      jargão. É deixar claro:<br />
                      <strong>Por que essa moeda existe, por que alguém
                        compraria e por que talvez seja melhor não comprar.</strong>
                    </p>
                  </div>
                </div>
              </section>

              {/* FEED DA MOEDA */}
              <section style={{ marginTop: "2.6rem" }}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionKicker}>Feed da moeda</p>
                  <h2
                    className={styles.sectionTitle}
                    style={{ fontSize: "1.3rem" }}
                  >
                    O que a própria moeda anda falando de si.
                  </h2>
                  <p className={styles.sectionDescription}>
                    Mensagens do criador, avisos de risco e recados do sistema.
                    Use isso como contexto, não como oráculo.
                  </p>
                </div>

                {data.posts.length === 0 && (
                  <p
                    style={{
                      marginTop: "0.9rem",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Ainda não há posts visíveis para essa moeda na Arena.
                  </p>
                )}

                {data.posts.length > 0 && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "grid",
                      gap: "0.9rem",
                    }}
                  >
                    {data.posts.map((post) => (
                      <article
                        key={post.id}
                        className={styles.card}
                        style={{ padding: "0.9rem 0.95rem" }}
                      >
                        <header
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.35rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.72rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.14em",
                              opacity: 0.75,
                            }}
                          >
                            {post.kind === "WARNING"
                              ? "Aviso de risco"
                              : post.kind === "SYSTEM"
                              ? "Mensagem do sistema"
                              : "Post da comunidade"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              opacity: 0.6,
                            }}
                          >
                            {new Date(post.created_at).toLocaleString("pt-BR")}
                          </span>
                        </header>
                        <p
                          style={{
                            fontSize: "0.86rem",
                            color: "rgba(255,255,255,0.92)",
                          }}
                        >
                          {post.content}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
