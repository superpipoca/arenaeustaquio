"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "../../../../page.module.css";

type RiskZone = "FRIO" | "HYPE" | "BOLHA" | "NEUTRO";

interface DashboardData {
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

function getRiskLabel(zone: RiskZone | null | undefined) {
  switch (zone) {
    case "HYPE":
      return "Hype – volume forte e emoção alta.";
    case "BOLHA":
      return "Zona de bolha – subida exagerada, quase nunca dura.";
    case "FRIO":
      return "Mercado frio – pouco volume, pouca variação.";
    case "NEUTRO":
    default:
      return "Zona neutra – sem leitura forte de hype ou frio.";
  }
}

function getRiskBadgeColor(zone: RiskZone | null | undefined) {
  switch (zone) {
    case "HYPE":
      return "rgba(255,221,0,0.16)";
    case "BOLHA":
      return "rgba(255,0,85,0.2)";
    case "FRIO":
      return "rgba(0,255,255,0.12)";
    case "NEUTRO":
    default:
      return "rgba(255,255,255,0.08)";
  }
}

export default function CreatorTokenDashboardPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/creator/tokens/${slug}/metrics`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Erro ao carregar métricas.");
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "Falha ao carregar painel.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  const riskZone = data?.market?.riskZone ?? "NEUTRO";

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Painel do Criador</p>
            <h1 className={styles.sectionTitle}>
              A leitura da sua moeda em tempo real.
            </h1>
            <p className={styles.sectionDescription}>
              Veja holders, hype, volume e zona de risco da sua moeda. Sem teatro
              de “investimento seguro” — só o jogo nu e cru.
            </p>
          </div>

          {loading && (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Carregando métricas da moeda...
            </p>
          )}

          {error && (
            <div className={styles.warningBox}>
              <p className={styles.warningText}>{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className={styles.cardsGrid} style={{ marginTop: "1.5rem" }}>
                <div className={styles.card}>
                  <span className={styles.cardKicker}>Moeda</span>
                  <h2 className={styles.cardTitle}>
                    {data.coin.name} ({data.coin.symbol})
                  </h2>
                  <p className={styles.cardBody}>
                    {data.coin.narrativeShort || "Sem narrativa curta cadastrada."}
                  </p>
                  <div
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.6rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: getRiskBadgeColor(riskZone as RiskZone),
                    }}
                  >
                    <span>Zona de risco: {riskZone}</span>
                  </div>
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    {getRiskLabel(riskZone as RiskZone)}
                  </p>
                </div>

                <div className={styles.cardAlt}>
                  <h3 className={styles.cardTitle}>Números principais (24h)</h3>
                  <ul className={styles.cardList}>
                    <li>
                      <strong>Preço atual:</strong>{" "}
                      {data.market?.priceCurrent != null
                        ? `R$ ${Number(data.market.priceCurrent).toFixed(4)}`
                        : "Sem dados ainda"}
                    </li>
                    <li>
                      <strong>Volume base (24h):</strong>{" "}
                      {data.market?.volume24hBase != null
                        ? `~${Number(data.market.volume24hBase).toFixed(2)}`
                        : "Sem dados"}
                    </li>
                    <li>
                      <strong>Volume em coin (24h):</strong>{" "}
                      {data.market?.volume24hCoin != null
                        ? `~${Number(data.market.volume24hCoin).toFixed(2)} ${data.coin.symbol}`
                        : "Sem dados"}
                    </li>
                    <li>
                      <strong>Trades (24h):</strong>{" "}
                      {data.market?.trades24h ?? 0}
                    </li>
                    <li>
                      <strong>Holders:</strong> {data.holdersCount}
                    </li>
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
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Whitepaper honesto (risco)</h3>
                  <p className={styles.cardBody}>
                    {data.coin.riskDisclaimer ||
                      "Nenhum disclaimer de risco personalizado. Recomendado adicionar um avisando explicitamente que o token é especulativo e pode ir a zero."}
                  </p>
                  <div className={styles.warningBox} style={{ marginTop: "0.9rem" }}>
                    <h4 className={styles.warningTitle}>
                      Lembre sua comunidade disso sempre
                    </h4>
                    <p className={styles.warningText}>
                      O 3ustaquio é ferramenta, não oráculo e nem consultoria.
                      Você é criador de narrativa, não gerente de investimento.
                      A decisão — e o risco — são de cada pessoa que entra na moeda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feed rápido de posts do criador / sistema */}
              <div style={{ marginTop: "2.2rem" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem" }}>
                  Últimas mensagens da Arena dessa moeda
                </h3>
                {data.posts.length === 0 && (
                  <p
                    style={{
                      marginTop: "0.6rem",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    Ainda não há posts no feed dessa moeda. Você pode usar o feed para
                    educar sobre risco, falar da narrativa e expor o jogo sem prometer retorno.
                  </p>
                )}

                {data.posts.length > 0 && (
                  <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.8rem" }}>
                    {data.posts.map((post) => (
                      <div
                        key={post.id}
                        className={styles.card}
                        style={{ padding: "0.9rem 0.9rem" }}
                      >
                        <div
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
                        </div>
                        <p
                          style={{
                            fontSize: "0.86rem",
                            color: "rgba(255,255,255,0.9)",
                          }}
                        >
                          {post.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
