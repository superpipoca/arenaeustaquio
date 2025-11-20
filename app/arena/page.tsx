// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import Header3ustaquio from "../componentes/ui/layout/Header3ustaquio";
// import Footer3ustaquio from "../componentes/ui/layout/Footer3ustaquio";
// import { MarketTicker } from "./components/MarketTicker";
// import { InlineTokenTradePanel } from "./components/InlineTokenTradePanel";

// import { supabase } from "../lib/supabaseClient";

// type MarketZone = "FRIO" | "HYPE" | "BOLHA";
// type TokenType = "PESSOA" | "LOCAL" | "PROJETO" | "COMUNIDADE";

// type ArenaToken = {
//   id: string;
//   name: string;
//   ticker: string;
//   type: TokenType;
//   zone: MarketZone;
//   price: number;
//   change24h: number;
//   change7d: number;
//   volume24h: number;
//   liquidityScore: number;
//   storyHook: string;
//   riskNote: string;
// };

// type SortKey = "hype" | "top_gainers" | "top_losers" | "volume";

// /**
//  * Linha vinda de public.coins com join em coin_market_state
//  */
// type CoinRow = {
//   id: string;
//   name: string;
//   symbol: string;
//   tags: string[] | null;
//   narrative_short: string | null;
//   risk_disclaimer: string | null;
//   status: string;
//   coin_market_state: null | {
//     risk_zone: string | null;
//     price_current: string | number | null;
//     volume_24h_base: string | number | null;
//     hype_score: string | number | null;
//   };
// };

// /**
//  * Fallback local (caso o banco não traga nada ou esteja vazio)
//  */
// const FALLBACK_TOKENS: ArenaToken[] = [
//   {
//     id: "1",
//     name: "Bar do Zé",
//     ticker: "ZECOIN",
//     type: "LOCAL",
//     zone: "HYPE",
//     price: 1.24,
//     change24h: 38.7,
//     change7d: 142.3,
//     volume24h: 184_000,
//     liquidityScore: 82,
//     storyHook: "O bar que virou ponto oficial do bairro. Cada copo é narrativa.",
//     riskNote: "Hype pesado de fim de semana. Pode evaporar na segunda-feira."
//   },
//   {
//     id: "2",
//     name: "Padaria Central",
//     ticker: "FARINHA",
//     type: "LOCAL",
//     zone: "FRIO",
//     price: 0.87,
//     change24h: -2.4,
//     change7d: 3.1,
//     volume24h: 21_500,
//     liquidityScore: 61,
//     storyHook:
//       "Token da padaria que abre antes do sol e fecha depois do último café.",
//     riskNote:
//       "Narrativa lenta, menos hype, mais comunidade. Continua sendo alto risco."
//   },
//   {
//     id: "3",
//     name: "Loja Parafuso Total",
//     ticker: "PARAFUSO",
//     type: "PROJETO",
//     zone: "BOLHA",
//     price: 3.92,
//     change24h: 75.2,
//     change7d: 310.4,
//     volume24h: 402_300,
//     liquidityScore: 68,
//     storyHook:
//       "Todo mundo precisa de peça. O token virou meme entre mecânicos.",
//     riskNote:
//       "Variação insina nos últimos dias. Isso cheira a bolha declarada."
//   },
//   {
//     id: "4",
//     name: "Squad Dev Noturno",
//     ticker: "CODERS",
//     type: "COMUNIDADE",
//     zone: "HYPE",
//     price: 2.11,
//     change24h: 19.8,
//     change7d: 96.5,
//     volume24h: 155_900,
//     liquidityScore: 74,
//     storyHook:
//       "Tribo de devs que viraram moeda própria. Push code, push preço.",
//     riskNote:
//       "Hype alimentado por Twitter/X e lives. Humor muda, preço também."
//   },
//   {
//     id: "5",
//     name: "Seu Antônio",
//     ticker: "ANTONIO",
//     type: "PESSOA",
//     zone: "FRIO",
//     price: 0.44,
//     change24h: -8.9,
//     change7d: -21.6,
//     volume24h: 9_800,
//     liquidityScore: 35,
//     storyHook: "O vizinho que virou lenda de bairro. Agora tem token só dele.",
//     riskNote:
//       "Comunidade pequena e ilíquida. Pode ser laboratório… ou só flop mesmo."
//   }
// ];

// const normalizeNumber = (n: string | number | null | undefined): number =>
//   n == null ? 0 : typeof n === "number" ? n : Number(n);

// /**
//  * Inferimos o tipo de token a partir das tags da coin
//  */
// const inferTokenType = (tags: string[] | null): TokenType => {
//   const list = (tags ?? []).map((t) => t.toLowerCase());

//   if (list.some((t) => t.includes("pessoa"))) return "PESSOA";
//   if (
//     list.some(
//       (t) =>
//         t.includes("local") ||
//         t.includes("bar") ||
//         t.includes("padaria") ||
//         t.includes("loja")
//     )
//   )
//     return "LOCAL";
//   if (list.some((t) => t.includes("comunidade"))) return "COMUNIDADE";

//   return "PROJETO";
// };

// /**
//  * Mapeia a linha de coins (+ coin_market_state) para o modelo usado pela Arena.
//  * Obs.: qualquer risk_zone que não seja HYPE/BOLHA cai em FRIO (inclui NEUTRO / null).
//  */
// const mapCoinToArenaToken = (row: CoinRow): ArenaToken => {
//   const cms = row.coin_market_state;
//   const zoneRaw = (cms?.risk_zone ?? "").toUpperCase();
//   const zone: MarketZone =
//     zoneRaw === "HYPE" || zoneRaw === "BOLHA" ? (zoneRaw as MarketZone) : "FRIO";

//   return {
//     id: row.id,
//     name: row.name,
//     ticker: row.symbol,
//     type: inferTokenType(row.tags),
//     zone,
//     price: normalizeNumber(cms?.price_current) || 0,
//     // Por enquanto, se você ainda não calcula variação diária / semanal,
//     // deixamos em 0 e você pode plugar depois em uma view.
//     change24h: 0,
//     change7d: 0,
//     volume24h: normalizeNumber(cms?.volume_24h_base),
//     // Usamos hype_score como "liquidez/perfil de atenção" só para ranking inicial.
//     liquidityScore: normalizeNumber(cms?.hype_score),
//     storyHook:
//       row.narrative_short ??
//       "Narrativa ainda não configurada. Este token é puramente especulativo.",
//     riskNote:
//       row.risk_disclaimer ??
//       "Token de risco extremo. Leia a narrativa completa antes de arriscar qualquer valor."
//   };
// };

// export default function ArenaPage() {
//   const [sortKey, setSortKey] = useState<SortKey>("hype");
//   const [typeFilter, setTypeFilter] = useState<TokenType | "ALL">("ALL");

//   const [tokens, setTokens] = useState<ArenaToken[]>([]);
//   const [hasTriedLoad, setHasTriedLoad] = useState(false);

//   const [expandedTokenId, setExpandedTokenId] = useState<string | null>(null);


//   // Carrega tokens direto de public.coins (+ coin_market_state)
//   useEffect(() => {
//     let cancelled = false;

//     async function loadArenaTokens() {
//       try {
//         const { data, error } = await supabase
//           .from("coins")
//           .select(
//             `
//             id,
//             name,
//             symbol,
//             tags,
//             narrative_short,
//             risk_disclaimer,
//             status,
//             coin_market_state (
//               risk_zone,
//               price_current,
//               volume_24h_base,
//               hype_score
//             )
//           `
//           )
//           // Mostra pelo menos ACTIVE e DRAFT (pra você ver o NATY enquanto testa)
//           .in("status", ["ACTIVE", "DRAFT"]);

//         if (error) {
//           console.error("[ARENA] Erro ao carregar coins:", error);
//           return;
//         }

//         if (!data || cancelled) return;

//         const mapped = (data as CoinRow[]).map(mapCoinToArenaToken);
//         setTokens(mapped);
//       } catch (err) {
//         console.error("[ARENA] Erro inesperado ao carregar tokens:", err);
//       } finally {
//         if (!cancelled) setHasTriedLoad(true);
//       }
//     }

//     loadArenaTokens();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // Base de dados usada pela Arena (DB > fallback > vazio)
//   const baseTokens: ArenaToken[] =
//     tokens.length > 0 ? tokens : hasTriedLoad ? FALLBACK_TOKENS : [];

//   const filteredAndSorted = useMemo(() => {
//     let list = [...baseTokens];

//     if (typeFilter !== "ALL") {
//       list = list.filter((t) => t.type === typeFilter);
//     }

//     switch (sortKey) {
//       case "hype": {
//         const zoneWeight: Record<MarketZone, number> = {
//           HYPE: 3,
//           BOLHA: 2,
//           FRIO: 1
//         };
//         list.sort((a, b) => {
//           const zw = zoneWeight[b.zone] - zoneWeight[a.zone];
//           if (zw !== 0) return zw;
//           // em caso de empate, usamos “liquidez/hype_score”
//           return b.liquidityScore - a.liquidityScore;
//         });
//         break;
//       }
//       case "top_gainers":
//         list.sort((a, b) => b.change24h - a.change24h);
//         break;
//       case "top_losers":
//         list.sort((a, b) => a.change24h - b.change24h);
//         break;
//       case "volume":
//         list.sort((a, b) => b.volume24h - a.volume24h);
//         break;
//     }

//     return list;
//   }, [baseTokens, sortKey, typeFilter]);

//   // Radar geral da Arena
//   const highlightToken =
//     baseTokens.length > 0
//       ? [...baseTokens].sort((a, b) => b.change24h - a.change24h)[0]
//       : null;

//   const hypeCount = baseTokens.filter((t) => t.zone === "HYPE").length;
//   const bolhaCount = baseTokens.filter((t) => t.zone === "BOLHA").length;
//   const frioCount = baseTokens.filter((t) => t.zone === "FRIO").length;

//   const handleOpenToken = (token: ArenaToken) => {
//     setExpandedTokenId((prev) => (prev === token.id ? null : token.id));
//   };

//   const handlePrimaryAction = (token: ArenaToken) => {
//     setExpandedTokenId(token.id);
//   };


//   const formatCurrency = (value: number) =>
//     value.toLocaleString("pt-BR", {
//       style: "currency",
//       currency: "BRL",
//       minimumFractionDigits: 2
//     });

//   const formatCompactNumber = (value: number) =>
//     value >= 1000
//       ? `${(value / 1000).toFixed(1).replace(".0", "")}k`
//       : value.toString();

//   const hasAnyToken = filteredAndSorted.length > 0;

//   return (
//     <>
//       <Header3ustaquio />
//       <main>
//         <div className="arena-screen">
//           <div className="arena-shell container">
//             {/* HERO / Introdução da Arena */}
//             <section className="arena-header">
//               <p className="arena-kicker">Jornada do Trader · Arena de Narrativas</p>

//               <div className="two-cols arena-hero-grid">
//                 {/* Lado esquerdo: narrativa e jornada */}
//                 <div className="arena-hero-left">
//                   <h1 className="arena-title">
//                     Bem-vindo à{" "}
//                     <span>arena onde hype, bolha e frio aparecem sem filtro.</span>
//                   </h1>

//                   <p className="arena-subtitle">
//                     Aqui você não vê “ativo seguro”. Você vê{" "}
//                     <strong>histórias sendo precificadas em tempo real</strong> —
//                     bares, padarias, pessoas, comunidades — que podem explodir de
//                     hype, desmontar em horas ou simplesmente sumir.
//                   </p>

//                   <ul className="hero-bullets">
//                     <li>
//                       <strong>1. Escolha uma narrativa</strong> · bar, pessoa,
//                       projeto ou comunidade.
//                     </li>
//                     <li>
//                       <strong>2. Leia o clima do mercado</strong> · hype, bolha ou
//                       pura geladeira.
//                     </li>
//                     <li>
//                       <strong>3. Decida se entra no jogo</strong> sabendo que o risco
//                       é 100% seu.
//                     </li>
//                   </ul>

//                   <p className="arena-subtitle arena-subtitle--small">
//                     A Arena foi feita para quem{" "}
//                     <strong>já aceita volatilidade</strong> e só quer uma coisa:
//                     saber exatamente em que tipo de loucura está se metendo antes de
//                     apertar o botão.
//                   </p>
//                 </div>

//                 {/* Lado direito: highlight comercial com simulação */}
//                 {highlightToken && (
//                   <aside className="hero-right-card arena-highlight-card">
//                     <div className="hero-right-header">
//                       <div>
//                         <h2 className="hero-right-title">Radar do Hype agora</h2>
//                         <p className="hero-right-note">
//                           Um recorte da Arena neste momento. Os números mudam.
//                           A honestidade sobre o risco, não.
//                         </p>
//                       </div>
//                       <span className="hero-right-badge">Snapshot especulativo</span>
//                     </div>

//                     <div className="hero-right-body">
//                       <p>
//                         Enquanto você lê isso,{" "}
//                         <strong>{highlightToken.name}</strong> (
//                         {highlightToken.ticker}) está{" "}
//                         <strong>
//                           {highlightToken.change24h >= 0 ? "+" : ""}
//                           {highlightToken.change24h.toFixed(1)}%
//                         </strong>{" "}
//                         nas últimas 24h.
//                       </p>
//                       <p>
//                         Se alguém tivesse colocado{" "}
//                         <strong>{formatCurrency(100)}</strong> nesse token há 7 dias,
//                         hoje estaria olhando para{" "}
//                         <strong>
//                           {formatCurrency(
//                             100 * (1 + highlightToken.change7d / 100)
//                           )}
//                         </strong>
//                         .
//                       </p>
//                     </div>

//                     <div className="mini-metric-row">
//                       <div className="mini-metric">
//                         <div className="mini-metric-label">Tokens em hype</div>
//                         <div className="mini-metric-value pos">{hypeCount}</div>
//                       </div>
//                       <div className="mini-metric">
//                         <div className="mini-metric-label">Em zona de bolha</div>
//                         <div className="mini-metric-value neg">{bolhaCount}</div>
//                       </div>
//                       <div className="mini-metric">
//                         <div className="mini-metric-label">No mercado frio</div>
//                         <div className="mini-metric-value">{frioCount}</div>
//                       </div>
//                     </div>

//                     <p className="hero-right-note">
//                       Estes números são um{" "}
//                       <strong>recorte histórico/simulado</strong>. Não são
//                       previsão, nem recomendação, nem promessa de repetição.
//                     </p>
//                   </aside>
//                 )}
//               </div>
//             </section>

//             {/* 🔥 TICKER DE COTAÇÕES DA ARENA (usando a lista já ordenada) */}
//             <MarketTicker
//               tokens={filteredAndSorted.map((t) => ({
//                 id: t.id,
//                 name: t.name,
//                 ticker: t.ticker,
//                 price: t.price,
//                 change24h: t.change24h,
//                 type: t.type,
//                 zone: t.zone
//               }))}
//             />

//             {/* Toolbar: ordenação, filtro, legenda de risco */}
//             <section className="arena-toolbar">
//               <div className="arena-toolbar-left">
//                 <div className="arena-sort-toggle" aria-label="Ordenar ranking">
//                   <button
//                     type="button"
//                     className={
//                       "arena-sort-option" +
//                       (sortKey === "hype" ? " arena-sort-option--active" : "")
//                     }
//                     onClick={() => setSortKey("hype")}
//                   >
//                     Hype & Bolha
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-sort-option" +
//                       (sortKey === "top_gainers"
//                         ? " arena-sort-option--active"
//                         : "")
//                     }
//                     onClick={() => setSortKey("top_gainers")}
//                   >
//                     Maiores altas 24h
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-sort-option" +
//                       (sortKey === "top_losers"
//                         ? " arena-sort-option--active"
//                         : "")
//                     }
//                     onClick={() => setSortKey("top_losers")}
//                   >
//                     Maiores quedas 24h
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-sort-option" +
//                       (sortKey === "volume" ? " arena-sort-option--active" : "")
//                     }
//                     onClick={() => setSortKey("volume")}
//                   >
//                     Volume 24h
//                   </button>
//                 </div>

//                 <div className="arena-filter-pills" aria-label="Filtrar por tipo">
//                   <button
//                     type="button"
//                     className={
//                       "arena-filter-pill" +
//                       (typeFilter === "ALL" ? " arena-filter-pill--active" : "")
//                     }
//                     onClick={() => setTypeFilter("ALL")}
//                   >
//                     Todos
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-filter-pill" +
//                       (typeFilter === "PESSOA"
//                         ? " arena-filter-pill--active"
//                         : "")
//                     }
//                     onClick={() => setTypeFilter("PESSOA")}
//                   >
//                     Pessoas
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-filter-pill" +
//                       (typeFilter === "LOCAL"
//                         ? " arena-filter-pill--active"
//                         : "")
//                     }
//                     onClick={() => setTypeFilter("LOCAL")}
//                   >
//                     Locais
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-filter-pill" +
//                       (typeFilter === "PROJETO"
//                         ? " arena-filter-pill--active"
//                         : "")
//                     }
//                     onClick={() => setTypeFilter("PROJETO")}
//                   >
//                     Projetos
//                   </button>
//                   <button
//                     type="button"
//                     className={
//                       "arena-filter-pill" +
//                       (typeFilter === "COMUNIDADE"
//                         ? " arena-filter-pill--active"
//                         : "")
//                     }
//                     onClick={() => setTypeFilter("COMUNIDADE")}
//                   >
//                     Comunidades
//                   </button>
//                 </div>
//               </div>

//               <div className="arena-toolbar-right">
//                 <div className="arena-risk-legend">
//                   <span className="arena-risk-item">
//                     <span className="arena-risk-dot arena-risk-dot--hype" />
//                     <span className="arena-risk-label">Hype</span>
//                   </span>
//                   <span className="arena-risk-item">
//                     <span className="arena-risk-dot arena-risk-dot--bolha" />
//                     <span className="arena-risk-label">Zona da bolha</span>
//                   </span>
//                   <span className="arena-risk-item">
//                     <span className="arena-risk-dot arena-risk-dot--frio" />
//                     <span className="arena-risk-label">Mercado frio</span>
//                   </span>
//                 </div>
//                 <p className="arena-toolbar-note">
//                   Hype não é sinal verde. É alerta de que a mesa está aquecida — e
//                   pode virar na mesma velocidade.
//                 </p>
//               </div>
//             </section>

//             {/* Lista / ranking de tokens */}
//             <section className="arena-list-section">
//               <div className="arena-list-header">
//                 <h2 className="arena-list-title">Ranking da Arena</h2>
//                 <p className="arena-list-caption">
//                   Aqui você vê onde o jogo está pegando fogo, onde a bolha está
//                   inflando e onde a narrativa morreu. Escolha uma história, encare os
//                   números e só então decida se entra.
//                 </p>
//               </div>

//               {!hasTriedLoad && !hasAnyToken ? (
//                 <div className="arena-empty">
//                   <p>Carregando a Arena de narrativas...</p>
//                 </div>
//               ) : !hasAnyToken ? (
//                 <div className="arena-empty">
//                   <p>Nenhum token encontrado com esses filtros.</p>
//                   <p>Altere o tipo ou a ordenação para caçar outros movimentos.</p>
//                 </div>
//               ) : (
//                 <div className="creator-token-list arena-token-list">
//                   {filteredAndSorted.map((token) => {
//                     const isExpanded = expandedTokenId === token.id;

//                     const isPositive = token.change24h >= 0;
//                     const zoneClass =
//                       token.zone === "HYPE"
//                         ? "zone-hype"
//                         : token.zone === "BOLHA"
//                           ? "zone-bolha"
//                           : "zone-frio";

//                     const simBase = 100;
//                     const simValue = simBase * (1 + token.change7d / 100);
//                     const showSim = Math.abs(token.change7d) >= 15;

//                     return (
//                       <React.Fragment key={token.id}>

//                         <article
//                           key={token.id}
//                           className="creator-token-card arena-token-card"
//                           onClick={() => handleOpenToken(token)}
//                         >
//                           <header className="creator-token-card-header">
//                             <div>
//                               <h2>{token.name}</h2>
//                               <div className="creator-token-ticker">
//                                 {token.ticker} ·{" "}
//                                 {token.type === "LOCAL"
//                                   ? "Local"
//                                   : token.type === "PESSOA"
//                                     ? "Pessoa"
//                                     : token.type === "PROJETO"
//                                       ? "Projeto"
//                                       : "Comunidade"}
//                               </div>
//                             </div>
//                             <div className={`creator-zone-badge ${zoneClass}`}>
//                               {token.zone === "HYPE"
//                                 ? "Hype ativo"
//                                 : token.zone === "BOLHA"
//                                   ? "Zona da bolha"
//                                   : "Mercado frio"}
//                             </div>
//                           </header>

//                           <p className="arena-token-story">{token.storyHook}</p>

//                           <div className="creator-token-metrics big">
//                             <div>
//                               <span className="metric-label">Preço atual</span>
//                               <span className="metric-value">
//                                 {formatCurrency(token.price)}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="metric-label">Variação 24h</span>
//                               <span
//                                 className={
//                                   "metric-value " +
//                                   (isPositive ? "arena-value-pos" : "arena-value-neg")
//                                 }
//                               >
//                                 {isPositive ? "+" : ""}
//                                 {token.change24h.toFixed(1)}%
//                               </span>
//                             </div>
//                             <div>
//                               <span className="metric-label">Variação 7d</span>
//                               <span className="metric-value">
//                                 {token.change7d >= 0 ? "+" : ""}
//                                 {token.change7d.toFixed(1)}%
//                               </span>
//                             </div>
//                             <div>
//                               <span className="metric-label">Volume 24h</span>
//                               <span className="metric-value">
//                                 {formatCompactNumber(token.volume24h)}{" "}
//                                 <span className="arena-metric-unit">em volume</span>
//                               </span>
//                             </div>
//                             <div>
//                               <span className="metric-label">Liquidez</span>
//                               <span className="metric-value">
//                                 {token.liquidityScore}/100
//                               </span>
//                             </div>
//                           </div>

//                           <footer className="creator-token-card-footer arena-token-footer">
//                             {showSim && (
//                               <p className="arena-risk-note">
//                                 Se alguém tivesse colocado{" "}
//                                 <strong>{formatCurrency(simBase)}</strong> nesse token
//                                 há 7 dias, hoje estaria vendo{" "}
//                                 <strong>{formatCurrency(simValue)}</strong>{" "}
//                                 {token.change7d > 0
//                                   ? "(antes de taxas, sem garantia de repetir)."
//                                   : "(resultado negativo, risco escancarado)."}
//                               </p>
//                             )}

//                             <p className="arena-risk-note">{token.riskNote}</p>

//                             <div className="arena-actions-row">
//                               <button
//                                 type="button"
//                                 className="btn-primary arena-primary-action"
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handlePrimaryAction(token);
//                                 }}
//                               >
//                                 Quero entrar nesse jogo assumindo o risco
//                               </button>
//                               <button
//                                 type="button"
//                                 className="btn-outline arena-secondary-action"
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleOpenToken(token);
//                                 }}
//                               >
//                                 Ver detalhes completos do token
//                               </button>
//                             </div>
//                           </footer>
//                         </article>
//                         {isExpanded && (
//                           <InlineTokenTradePanel
//                             token={token}
//                             onClose={() => setExpandedTokenId(null)}
//                           />
//                         )}
//                       </React.Fragment>
//                     );
//                   })}
//                 </div>
//               )}

//               <div className="arena-warning-strip">
//                 <strong>Aviso brutalmente honesto:</strong> o que você está vendo
//                 aqui não é plano de aposentadoria, não é fundo regulado, não é
//                 produto bancário. É uma arena de especulação consciente. Você pode
//                 ganhar, pode perder, pode zerar. A escolha – e o risco – são
//                 completamente seus.
//               </div>
//             </section>
//           </div>
//         </div>


//       </main>
//       <Footer3ustaquio />
//     </>
//   );
// }
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header3ustaquio from "../componentes/ui/layout/Header3ustaquio";
import Footer3ustaquio from "../componentes/ui/layout/Footer3ustaquio";
import { MarketTicker } from "./components/MarketTicker";
import { InlineTokenTradePanel } from "./components/InlineTokenTradePanel";
import { supabase } from "../lib/supabaseClient";

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

/**
 * Linha vinda de public.coins com join em coin_market_state
 */
type CoinRow = {
  id: string;
  name: string;
  symbol: string;
  tags: string[] | null;
  narrative_short: string | null;
  risk_disclaimer: string | null;
  status: string;
  coin_market_state: null | {
    risk_zone: string | null;
    price_current: string | number | null;
    volume_24h_base: string | number | null;
    hype_score: string | number | null;
  };
};

/**
 * Fallback local (caso o banco não traga nada ou esteja vazio)
 */
const FALLBACK_TOKENS: ArenaToken[] = [
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
    storyHook:
      "Token da padaria que abre antes do sol e fecha depois do último café.",
    riskNote:
      "Narrativa lenta, menos hype, mais comunidade. Continua sendo alto risco."
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
    storyHook:
      "Todo mundo precisa de peça. O token virou meme entre mecânicos.",
    riskNote:
      "Variação insana nos últimos dias. Isso cheira a bolha declarada."
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
    storyHook:
      "Tribo de devs que viraram moeda própria. Push code, push preço.",
    riskNote:
      "Hype alimentado por Twitter/X e lives. Humor muda, preço também."
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
    riskNote:
      "Comunidade pequena e ilíquida. Pode ser laboratório… ou só flop mesmo."
  }
];

const normalizeNumber = (n: string | number | null | undefined): number =>
  n == null ? 0 : typeof n === "number" ? n : Number(n);

/**
 * Inferimos o tipo de token a partir das tags da coin
 */
const inferTokenType = (tags: string[] | null): TokenType => {
  const list = (tags ?? []).map((t) => t.toLowerCase());

  if (list.some((t) => t.includes("pessoa"))) return "PESSOA";
  if (
    list.some(
      (t) =>
        t.includes("local") ||
        t.includes("bar") ||
        t.includes("padaria") ||
        t.includes("loja")
    )
  )
    return "LOCAL";
  if (list.some((t) => t.includes("comunidade"))) return "COMUNIDADE";

  return "PROJETO";
};

const mapCoinToArenaToken = (row: CoinRow): ArenaToken => {
  const cms = row.coin_market_state;
  const zoneRaw = (cms?.risk_zone ?? "").toUpperCase();
  const zone: MarketZone =
    zoneRaw === "HYPE" || zoneRaw === "BOLHA" ? (zoneRaw as MarketZone) : "FRIO";

  return {
    id: row.id,
    name: row.name,
    ticker: row.symbol,
    type: inferTokenType(row.tags),
    zone,
    price: normalizeNumber(cms?.price_current) || 0,
    change24h: 0,
    change7d: 0,
    volume24h: normalizeNumber(cms?.volume_24h_base),
    liquidityScore: normalizeNumber(cms?.hype_score),
    storyHook:
      row.narrative_short ??
      "Narrativa ainda não configurada. Este token é puramente especulativo.",
    riskNote:
      row.risk_disclaimer ??
      "Token de risco extremo. Leia a narrativa completa antes de arriscar qualquer valor."
  };
};

export default function ArenaPage() {
  const [sortKey, setSortKey] = useState<SortKey>("hype");
  const [typeFilter, setTypeFilter] = useState<TokenType | "ALL">("ALL");

  const [tokens, setTokens] = useState<ArenaToken[]>([]);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  const [expandedTokenId, setExpandedTokenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArenaTokens() {
      try {
        const { data, error } = await supabase
          .from("coins")
          .select(
            `
            id,
            name,
            symbol,
            tags,
            narrative_short,
            risk_disclaimer,
            status,
            coin_market_state (
              risk_zone,
              price_current,
              volume_24h_base,
              hype_score
            )
          `
          )
          .in("status", ["ACTIVE", "DRAFT"]);

        if (error) {
          console.error("[ARENA] Erro ao carregar coins:", error);
          return;
        }

        if (!data || cancelled) return;

        const mapped = (data as CoinRow[]).map(mapCoinToArenaToken);
        setTokens(mapped);
      } catch (err) {
        console.error("[ARENA] Erro inesperado ao carregar tokens:", err);
      } finally {
        if (!cancelled) setHasTriedLoad(true);
      }
    }

    loadArenaTokens();

    return () => {
      cancelled = true;
    };
  }, []);

  const baseTokens: ArenaToken[] =
    tokens.length > 0 ? tokens : hasTriedLoad ? FALLBACK_TOKENS : [];

  const filteredAndSorted = useMemo(() => {
    let list = [...baseTokens];

    if (typeFilter !== "ALL") {
      list = list.filter((t) => t.type === typeFilter);
    }

    switch (sortKey) {
      case "hype": {
        const zoneWeight: Record<MarketZone, number> = {
          HYPE: 3,
          BOLHA: 2,
          FRIO: 1
        };
        list.sort((a, b) => {
          const zw = zoneWeight[b.zone] - zoneWeight[a.zone];
          if (zw !== 0) return zw;
          return b.liquidityScore - a.liquidityScore;
        });
        break;
      }
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
  }, [baseTokens, sortKey, typeFilter]);

  const highlightToken =
    baseTokens.length > 0
      ? [...baseTokens].sort((a, b) => b.change24h - a.change24h)[0]
      : null;

  const hypeCount = baseTokens.filter((t) => t.zone === "HYPE").length;
  const bolhaCount = baseTokens.filter((t) => t.zone === "BOLHA").length;
  const frioCount = baseTokens.filter((t) => t.zone === "FRIO").length;

  const handleOpenToken = (token: ArenaToken) => {
    setExpandedTokenId((prev) => (prev === token.id ? null : token.id));
  };

  const handlePrimaryAction = (token: ArenaToken) => {
    setExpandedTokenId(token.id);
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

  const hasAnyToken = filteredAndSorted.length > 0;

  return (
    <>
      <Header3ustaquio />

      <main className="arena-screen">
        <div className="container arena-shell">
          {/* HERO / Introdução da Arena */}
          <section className="arena-header">
            <p className="arena-kicker">Jornada do Trader · Arena de Narrativas</p>

            <div className="two-cols arena-hero-grid">
              <div className="arena-hero-left">
                <h1 className="arena-title">
                  Bem-vindo à{" "}
                  <span>arena onde hype, bolha e frio aparecem sem filtro.</span>
                </h1>

                <p className="arena-subtitle">
                  Aqui você não vê “ativo seguro”. Você vê{" "}
                  <strong>histórias sendo precificadas em tempo real</strong> —
                  bares, padarias, pessoas, comunidades — que podem explodir de
                  hype, desmontar em horas ou simplesmente sumir.
                </p>

                <ul className="hero-bullets">
                  <li>
                    <strong>1. Escolha uma narrativa</strong> · bar, pessoa,
                    projeto ou comunidade.
                  </li>
                  <li>
                    <strong>2. Leia o clima do mercado</strong> · hype, bolha ou
                    pura geladeira.
                  </li>
                  <li>
                    <strong>3. Decida se entra no jogo</strong> sabendo que o risco
                    é 100% seu.
                  </li>
                </ul>

                <p className="arena-subtitle arena-subtitle--small">
                  A Arena foi feita para quem{" "}
                  <strong>já aceita volatilidade</strong> e só quer uma coisa:
                  saber exatamente em que tipo de loucura está se metendo antes de
                  apertar o botão.
                </p>
              </div>

              {highlightToken && (
                <aside className="hero-right-card arena-highlight-card">
                  <div className="hero-right-header">
                    <div>
                      <h2 className="hero-right-title">Radar do Hype agora</h2>
                      <p className="hero-right-note">
                        Um recorte da Arena neste momento. Os números mudam.
                        A honestidade sobre o risco, não.
                      </p>
                    </div>
                    <span className="hero-right-badge">Snapshot especulativo</span>
                  </div>

                  <div className="hero-right-body">
                    <p>
                      Enquanto você lê isso,{" "}
                      <strong>{highlightToken.name}</strong> (
                      {highlightToken.ticker}) está{" "}
                      <strong>
                        {highlightToken.change24h >= 0 ? "+" : ""}
                        {highlightToken.change24h.toFixed(1)}%
                      </strong>{" "}
                      nas últimas 24h.
                    </p>
                    <p>
                      Se alguém tivesse colocado{" "}
                      <strong>{formatCurrency(100)}</strong> nesse token há 7 dias,
                      hoje estaria olhando para{" "}
                      <strong>
                        {formatCurrency(
                          100 * (1 + highlightToken.change7d / 100)
                        )}
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="mini-metric-row">
                    <div className="mini-metric">
                      <div className="mini-metric-label">Tokens em hype</div>
                      <div className="mini-metric-value pos">{hypeCount}</div>
                    </div>
                    <div className="mini-metric">
                      <div className="mini-metric-label">Em zona de bolha</div>
                      <div className="mini-metric-value neg">{bolhaCount}</div>
                    </div>
                    <div className="mini-metric">
                      <div className="mini-metric-label">No mercado frio</div>
                      <div className="mini-metric-value">{frioCount}</div>
                    </div>
                  </div>

                  <p className="hero-right-note">
                    Estes números são um{" "}
                    <strong>recorte histórico/simulado</strong>. Não são
                    previsão, nem recomendação, nem promessa de repetição.
                  </p>
                </aside>
              )}
            </div>
          </section>

          <MarketTicker
            tokens={filteredAndSorted.map((t) => ({
              id: t.id,
              name: t.name,
              ticker: t.ticker,
              price: t.price,
              change24h: t.change24h,
              type: t.type,
              zone: t.zone
            }))}
          />

          {/* Toolbar */}
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
                    (sortKey === "top_gainers"
                      ? " arena-sort-option--active"
                      : "")
                  }
                  onClick={() => setSortKey("top_gainers")}
                >
                  Maiores altas 24h
                </button>
                <button
                  type="button"
                  className={
                    "arena-sort-option" +
                    (sortKey === "top_losers"
                      ? " arena-sort-option--active"
                      : "")
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
                {(["ALL", "PESSOA", "LOCAL", "PROJETO", "COMUNIDADE"] as const).map(
                  (k) => (
                    <button
                      key={k}
                      type="button"
                      className={
                        "arena-filter-pill" +
                        (typeFilter === k ? " arena-filter-pill--active" : "")
                      }
                      onClick={() => setTypeFilter(k)}
                    >
                      {k === "ALL"
                        ? "Todos"
                        : k === "PESSOA"
                          ? "Pessoas"
                          : k === "LOCAL"
                            ? "Locais"
                            : k === "PROJETO"
                              ? "Projetos"
                              : "Comunidades"}
                    </button>
                  )
                )}
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
                Hype não é sinal verde. É alerta de que a mesa está aquecida — e
                pode virar na mesma velocidade.
              </p>
            </div>
          </section>

          {/* Lista */}
          <section className="arena-list-section">
            <div className="arena-list-header">
              <h2 className="arena-list-title">Ranking da Arena</h2>
              <p className="arena-list-caption">
                Aqui você vê onde o jogo está pegando fogo, onde a bolha está
                inflando e onde a narrativa morreu. Escolha uma história, encare os
                números e só então decida se entra.
              </p>
            </div>

            {!hasTriedLoad && !hasAnyToken ? (
              <div className="arena-empty">
                <p>Carregando a Arena de narrativas...</p>
              </div>
            ) : !hasAnyToken ? (
              <div className="arena-empty">
                <p>Nenhum token encontrado com esses filtros.</p>
                <p>Altere o tipo ou a ordenação para caçar outros movimentos.</p>
              </div>
            ) : (
              <div className="creator-token-list arena-token-list">
                {filteredAndSorted.map((token) => {
                  const isExpanded = expandedTokenId === token.id;
                  const isPositive = token.change24h >= 0;

                  const zoneClass =
                    token.zone === "HYPE"
                      ? "zone-hype"
                      : token.zone === "BOLHA"
                        ? "zone-bolha"
                        : "zone-frio";

                  const simBase = 100;
                  const simValue = simBase * (1 + token.change7d / 100);
                  const showSim = Math.abs(token.change7d) >= 15;

                  return (
                    <React.Fragment key={token.id}>
                      <article
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
                          {showSim && (
                            <p className="arena-risk-note">
                              Se alguém tivesse colocado{" "}
                              <strong>{formatCurrency(simBase)}</strong> nesse token
                              há 7 dias, hoje estaria vendo{" "}
                              <strong>{formatCurrency(simValue)}</strong>{" "}
                              {token.change7d > 0
                                ? "(antes de taxas, sem garantia de repetir)."
                                : "(resultado negativo, risco escancarado)."}
                            </p>
                          )}

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
                              Quero entrar nesse jogo assumindo o risco
                            </button>

                            <button
                              type="button"
                              className="btn-outline arena-secondary-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenToken(token);
                              }}
                            >
                              Ver detalhes completos do token
                            </button>
                          </div>
                        </footer>
                      </article>

                      {isExpanded && (
                        <InlineTokenTradePanel
                          token={token}
                          onClose={() => setExpandedTokenId(null)}
                        />
                      )}
                    </React.Fragment>
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
      </main>

      <Footer3ustaquio />
    </>
  );
}
