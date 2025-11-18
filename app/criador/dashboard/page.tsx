// app/criador/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../../componentes/ui/layout/Footer3ustaquio";
import { supabase } from "../../lib/supabaseClient";
import { getOrCreateCreatorProfile } from "../../lib/creatorProfile";

type CreatorCoin = {
  id: string;
  slug: string;
  symbol: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "BLOCKED";
  created_at: string;
};

export default function CriadorDashboardPage() {
  const router = useRouter();

  const [coins, setCoins] = useState<CreatorCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErro(null);

      try {
        // garante user + creator, ou lança NOT_AUTH
        const { creatorId } = await getOrCreateCreatorProfile();

        const { data, error } = await supabase
          .from<CreatorCoin>("coins")
          .select("id, slug, symbol, name, status, created_at")
          .eq("creator_id", creatorId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!cancelled) {
          setCoins(data || []);
        }
      } catch (err: any) {
        console.error("Erro ao carregar dashboard do criador:", err);

        if (cancelled) return;

        if (err?.message === "NOT_AUTH") {
          setErro("Você precisa estar logado para ver o painel do criador.");
          router.push("/criador/login");
        } else {
          setErro(
            "Não foi possível carregar seus tokens. Verifique o login e tente novamente."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      <Header3ustaquio />
      <main className="creator-screen">
        <div className="container creator-shell">
          <header className="creator-header">
            <span className="creator-kicker">Painel do criador</span>
            <h1 className="creator-title">
              Seus <span>tokens</span> na Arena
            </h1>
            <p className="creator-subtitle">
              Aqui você acompanha a narrativa em tempo real — não uma planilha de promessa.
            </p>

            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => router.push("/criador/token/novo")}
              >
                Criar novo token de narrativa
              </button>
            </div>
          </header>

          {erro && (
            <p className="cta-note" style={{ color: "var(--accent-primary)" }}>
              {erro}
            </p>
          )}

          {loading && <p className="cta-note">Carregando seus tokens...</p>}

          {!loading && !erro && coins.length === 0 && (
            <p className="cta-note">
              Você ainda não lançou nenhum token. Comece criando um na Jornada do Criador.
            </p>
          )}

          {!loading && !erro && coins.length > 0 && (
            <section className="creator-token-list">
              {coins.map((t) => (
                <article
                  key={t.id}
                  className="creator-token-card"
                  onClick={() => router.push(`/criador/token/${t.slug}`)}
                >
                  <header className="creator-token-card-header">
                    <div>
                      <h2>{t.name}</h2>
                      <p className="creator-token-ticker">{t.symbol}</p>
                    </div>
                    <span
                      className={`creator-zone-badge ${
                        t.status === "ACTIVE"
                          ? "zone-hype"
                          : t.status === "PAUSED"
                          ? "zone-frio"
                          : t.status === "BLOCKED"
                          ? "zone-bolha"
                          : "zone-frio"
                      }`}
                    >
                      {t.status === "ACTIVE" && "Ativo na Arena"}
                      {t.status === "DRAFT" && "Rascunho"}
                      {t.status === "PAUSED" && "Pausado"}
                      {t.status === "BLOCKED" && "Bloqueado"}
                    </span>
                  </header>

                  <div className="creator-token-metrics">
                    <div>
                      <span className="metric-label">Criado em</span>
                      <span className="metric-value">
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <footer className="creator-token-card-footer">
                    <span>Ver detalhes</span>
                  </footer>
                </article>
              ))}
            </section>
          )}
        </div>
        <Footer3ustaquio />
      </main>
    </>
  );
}
