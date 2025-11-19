// app/arena/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header3ustaquio from "../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../componentes/ui/layout/Footer3ustaquio";

type MarketZone = "FRIO" | "HYPE" | "BOLHA";
type TokenType = "PESSOA" | "LOCAL" | "PROJETO" | "COMUNIDADE";

type ArenaToken = {
  id: string;
  name: string;
  ticker: string;
  type: TokenType;
  zone: MarketZone;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  liquidityScore: number;
  storyHook: string;
  riskNote: string;
};

type SortKey = "hype" | "top_gainers" | "top_losers" | "volume";

const MOCK_TOKENS: ArenaToken[] = [
  {
    id: "1",
    name: "Bar do Zé",
    ticker: "ZECOIN",
    type: "LOCAL",
    zone: "HYPE",
    price: 1.24,
    change24h: 38.7,
    change7d: 142.3,
    volume24h: 184_000,
    liquidityScore: 82,
    storyHook: "O bar que virou ponto oficial do bairro. Cada copo é narrativa.",
    riskNote: "Hype pesado de fim de semana. Pode evaporar na segunda-feira."
  },
  {
    id: "2",
    name: "Padaria Central",
    ticker: "FARINHA",
    type: "LOCAL",
    zone: "FRIO",
    price: 0.87,
    change24h: -2.4,
    change7d: 3.1,
    volume24h: 21_500,
    liquidityScore: 61,
    storyHook: "Token da padaria que abre antes do sol e fecha depois do último café.",
    riskNote: "Narrativa lenta, menos hype, mais comunidade. Continua sendo alto risco."
  },
  {
    id: "3",
    name: "Loja Parafuso Total",
    ticker: "PARAFUSO",
    type: "PROJETO",
    zone: "BOLHA",
    price: 3.92,
    change24h: 75.2,
    change7d: 310.4,
    volume24h: 402_300,
    liquidityScore: 68,
    storyHook: "Todo mundo precisa de peça. O token virou meme entre mecânicos.",
    riskNote: "Variação insana nos últimos dias. Isso cheira a bolha declarada."
  },
  {
    id: "4",
    name: "Squad Dev Noturno",
    ticker: "CODERS",
    type: "COMUNIDADE",
    zone: "HYPE",
    price: 2.11,
    change24h: 19.8,
    change7d: 96.5,
    volume24h: 155_900,
    liquidityScore: 74,
    storyHook: "Tribo de devs que viraram moeda própria. Push code, push preço.",
    riskNote: "Hype alimentado por Twitter/X e lives. Humor muda, preço também."
  },
  {
    id: "5",
    name: "Seu Antônio",
    ticker: "ANTONIO",
    type: "PESSOA",
    zone: "FRIO",
    price: 0.44,
    change24h: -8.9,
    change7d: -21.6,
    volume24h: 9_800,
    liquidityScore: 35,
    storyHook: "O vizinho que virou lenda de bairro. Agora tem token só dele.",
    riskNote: "Comunidade pequena e ilíquida. Pode ser laboratório… ou só flop."
  }
];

export default function ArenaPage() {
  const router = useRouter();

  const [sortKey, setSortKey] = useState<SortKey>("hype");
  const [typeFilter, setTypeFilter] = useState<TokenType | "ALL">("ALL");

  const filteredAndSorted = useMemo(() => {
    let list = [...MOCK_TOKENS];

    if (typeFilter !== "ALL") {
      list = list.filter((t) => t.type === typeFilter);
    }

    switch (sortKey) {
      case "hype":
        // HYPE e BOLHA primeiro, depois FRIO, dentro de cada grupo ordena por volume
        const zoneWeight: Record<MarketZone, number> = {
          HYPE: 3,
          BOLHA: 2,
          FRIO: 1
        };
        list.sort((a, b) => {
          const zw = zoneWeight[b.zone] - zoneWeight[a.zone];
          if (zw !== 0) return zw;
          return b.volume24h - a.volume24h;
        });
        break;
      case "top_gainers":
        list.sort((a, b) => b.change24h - a.change24h);
        break;
      case "top_losers":
        list.sort((a, b) => a.change24h - b.change24h);
        break;
      case "volume":
        list.sort((a, b) => b.volume24h - a.volume24h);
        break;
    }

    return list;
  }, [sortKey, typeFilter]);

  const handleOpenToken = (token: ArenaToken) => {
    // 👉 no futuro: ir para /token/[ticker] ou /tokens/[id]
    router.push(`/token/${token.ticker.toLowerCase()}`);
  };

  const handlePrimaryAction = (token: ArenaToken) => {
    // 👉 no futuro: rota de compra /trade/[ticker] ou algo assim
    router.push(`/token/${token.ticker.toLowerCase()}`);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });

  const formatCompactNumber = (value: number) =>
    value >= 1000
      ? `${(value / 1000).toFixed(1).replace(".0", "")}k`
      : value.toString();

  return (
    <>
      <Header3ustaquio />
      <main className="arena-screen">
        <div className="container arena-shell">
          {/* HERO / Introdução da Arena */}
          <section className="arena-header">
            <p className="arena-kicker">Jornada do Trader · Arena de Narrativas</p>
            <h1 className="arena-title">
              Bem-vindo à{" "}
              <span>arena onde histórias viram gráfico em tempo real.</span>
            </h1>
            <p className="arena-subtitle">
              Aqui não tem promessa de investimento seguro. Você está olhando para
              um mercado de narrativas – bares, padarias, pessoas, comunidades – que
              podem subir forte, despencar sem dó ou virar pó.
            </p>

            <div className="arena-badges-row">
              <div className="arena-badge">
                <strong>O jogo é simples:</strong> escolher em qual história você
                quer apostar sabendo que o risco é 100% seu.
              </div>
              <div className="arena-badge">
                <strong>Não é consultoria, não é recomendação:</strong> é uma
                vitrine brutalmente honesta de hype, bolha e liquidez.
              </div>
            </div>

            <p className="arena-subtitle arena-subtitle--small">
              Use a Arena para sentir o pulso do mercado antes de entrar: veja o{" "}
              <strong>hype</strong>, identifique a{" "}
              <strong>zona da bolha</strong>, descubra o que está{" "}
              <strong>mofando no mercado frio</strong> – e decida se você aguenta o
              tranco.
            </p>
          </section>

          {/* Toolbar: ordenação, filtro, legenda de risco */}
          <section className="arena-toolbar">
            <div className="arena-toolbar-left">
              <div className="arena-sort-toggle" aria-label="Ordenar ranking">
                <button
                  type="button"
                  className={
                    "arena-sort-option" +
                    (sortKey === "hype" ? " arena-sort-option--active" : "")
                  }
                  onClick={() => setSortKey("hype")}
                >
                  Hype & Bolha
                </button>
                <button
                  type="button"
                  className={
                    "arena-sort-option" +
                    (sortKey === "top_gainers" ? " arena-sort-option--active" : "")
                  }
                  onClick={() => setSortKey("top_gainers")}
                >
                  Maiores altas 24h
                </button>
                <button
                  type="button"
                  className={
                    "arena-sort-option" +
                    (sortKey === "top_losers" ? " arena-sort-option--active" : "")
                  }
                  onClick={() => setSortKey("top_losers")}
                >
                  Maiores quedas 24h
                </button>
                <button
                  type="button"
                  className={
                    "arena-sort-option" +
                    (sortKey === "volume" ? " arena-sort-option--active" : "")
                  }
                  onClick={() => setSortKey("volume")}
                >
                  Volume 24h
                </button>
              </div>

              <div className="arena-filter-pills" aria-label="Filtrar por tipo">
                <button
                  type="button"
                  className={
                    "arena-filter-pill" +
                    (typeFilter === "ALL" ? " arena-filter-pill--active" : "")
                  }
                  onClick={() => setTypeFilter("ALL")}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={
                    "arena-filter-pill" +
                    (typeFilter === "PESSOA" ? " arena-filter-pill--active" : "")
                  }
                  onClick={() => setTypeFilter("PESSOA")}
                >
                  Pessoas
                </button>
                <button
                  type="button"
                  className={
                    "arena-filter-pill" +
                    (typeFilter === "LOCAL" ? " arena-filter-pill--active" : "")
                  }
                  onClick={() => setTypeFilter("LOCAL")}
                >
                  Locais
                </button>
                <button
                  type="button"
                  className={
                    "arena-filter-pill" +
                    (typeFilter === "PROJETO" ? " arena-filter-pill--active" : "")
                  }
                  onClick={() => setTypeFilter("PROJETO")}
                >
                  Projetos
                </button>
                <button
                  type="button"
                  className={
                    "arena-filter-pill" +
                    (typeFilter === "COMUNIDADE"
                      ? " arena-filter-pill--active"
                      : "")
                  }
                  onClick={() => setTypeFilter("COMUNIDADE")}
                >
                  Comunidades
                </button>
              </div>
            </div>

            <div className="arena-toolbar-right">
              <div className="arena-risk-legend">
                <span className="arena-risk-item">
                  <span className="arena-risk-dot arena-risk-dot--hype" />
                  <span className="arena-risk-label">Hype</span>
                </span>
                <span className="arena-risk-item">
                  <span className="arena-risk-dot arena-risk-dot--bolha" />
                  <span className="arena-risk-label">Zona da bolha</span>
                </span>
                <span className="arena-risk-item">
                  <span className="arena-risk-dot arena-risk-dot--frio" />
                  <span className="arena-risk-label">Mercado frio</span>
                </span>
              </div>
              <p className="arena-toolbar-note">
                Hype não é sinal verde. É só um alerta de que a mesa está aquecida –
                e pode virar na mesma velocidade.
              </p>
            </div>
          </section>

          {/* Lista / ranking de tokens */}
          <section className="arena-list-section">
            <div className="arena-list-header">
              <h2 className="arena-list-title">Ranking da Arena</h2>
              <p className="arena-list-caption">
                Veja quais narrativas estão sendo precificadas agora. Nada aqui é
                promessa de retorno – é jogo puro.
              </p>
            </div>

            {filteredAndSorted.length === 0 ? (
              <div className="arena-empty">
                <p>Nenhum token encontrado com esses filtros.</p>
                <p>Altere o tipo ou a ordenação para ver outros movimentos.</p>
              </div>
            ) : (
              <div className="creator-token-list arena-token-list">
                {filteredAndSorted.map((token) => {
                  const isPositive = token.change24h >= 0;
                  const zoneClass =
                    token.zone === "HYPE"
                      ? "zone-hype"
                      : token.zone === "BOLHA"
                      ? "zone-bolha"
                      : "zone-frio";

                  return (
                    <article
                      key={token.id}
                      className="creator-token-card arena-token-card"
                      onClick={() => handleOpenToken(token)}
                    >
                      <header className="creator-token-card-header">
                        <div>
                          <h2>{token.name}</h2>
                          <div className="creator-token-ticker">
                            {token.ticker} ·{" "}
                            {token.type === "LOCAL"
                              ? "Local"
                              : token.type === "PESSOA"
                              ? "Pessoa"
                              : token.type === "PROJETO"
                              ? "Projeto"
                              : "Comunidade"}
                          </div>
                        </div>
                        <div className={`creator-zone-badge ${zoneClass}`}>
                          {token.zone === "HYPE"
                            ? "Hype ativo"
                            : token.zone === "BOLHA"
                            ? "Zona da bolha"
                            : "Mercado frio"}
                        </div>
                      </header>

                      <p className="arena-token-story">{token.storyHook}</p>

                      <div className="creator-token-metrics big">
                        <div>
                          <span className="metric-label">Preço atual</span>
                          <span className="metric-value">
                            {formatCurrency(token.price)}
                          </span>
                        </div>
                        <div>
                          <span className="metric-label">Variação 24h</span>
                          <span
                            className={
                              "metric-value " +
                              (isPositive ? "arena-value-pos" : "arena-value-neg")
                            }
                          >
                            {isPositive ? "+" : ""}
                            {token.change24h.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="metric-label">Variação 7d</span>
                          <span className="metric-value">
                            {token.change7d >= 0 ? "+" : ""}
                            {token.change7d.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="metric-label">Volume 24h</span>
                          <span className="metric-value">
                            {formatCompactNumber(token.volume24h)}{" "}
                            <span className="arena-metric-unit">em volume</span>
                          </span>
                        </div>
                        <div>
                          <span className="metric-label">Liquidez</span>
                          <span className="metric-value">
                            {token.liquidityScore}/100
                          </span>
                        </div>
                      </div>

                      <footer className="creator-token-card-footer arena-token-footer">
                        <p className="arena-risk-note">{token.riskNote}</p>

                        <div className="arena-actions-row">
                          <button
                            type="button"
                            className="btn-primary arena-primary-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrimaryAction(token);
                            }}
                          >
                            Entrar nesse hype com consciência
                          </button>
                          <button
                            type="button"
                            className="btn-outline arena-secondary-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenToken(token);
                            }}
                          >
                            Ver detalhes da narrativa
                          </button>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="arena-warning-strip">
              <strong>Aviso brutalmente honesto:</strong> o que você está vendo
              aqui não é plano de aposentadoria, não é fundo regulado, não é
              produto bancário. É uma arena de especulação consciente. Você pode
              ganhar, pode perder, pode zerar. A escolha – e o risco – são
              completamente seus.
            </div>
          </section>
        </div>

        <Footer3ustaquio />
      </main>
    </>
  );
}
