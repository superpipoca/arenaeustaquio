import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const slug = params.slug;

  // 1) Coin
  const { data: coin, error: coinError } = await supabase
    .from("coins")
    .select(
      "id, slug, symbol, name, narrative_short, narrative_long, risk_disclaimer, status"
    )
    .eq("slug", slug)
    .single();

  if (coinError || !coin) {
    return NextResponse.json(
      { error: "Moeda não encontrada." },
      { status: 404 }
    );
  }

  // 2) Market state (coin_market_state)
  const { data: market, error: marketError } = await supabase
    .from("coin_market_state")
    .select(
      "price_current, volume_24h_base, volume_24h_coin, trades_24h, risk_zone, hype_score, volatility_score"
    )
    .eq("coin_id", coin.id)
    .single();

  // 3) Holders (wallet_balances)
  const { data: holders, error: holdersError } = await supabase
    .from("wallet_balances")
    .select("wallet_id, balance_available")
    .eq("coin_id", coin.id)
    .gt("balance_available", 0);

  const holdersCount =
    !holdersError && holders ? new Set(holders.map((h) => h.wallet_id)).size : 0;

  // 4) Posts recentes
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, kind, content, created_at, is_pinned")
    .eq("coin_id", coin.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json(
    {
      coin: {
        id: coin.id,
        slug: coin.slug,
        symbol: coin.symbol,
        name: coin.name,
        narrativeShort: coin.narrative_short,
        narrativeLong: coin.narrative_long,
        riskDisclaimer: coin.risk_disclaimer,
        status: coin.status,
      },
      market: market
        ? {
            priceCurrent: market.price_current,
            volume24hBase: market.volume_24h_base,
            volume24hCoin: market.volume_24h_coin,
            trades24h: market.trades_24h,
            riskZone: market.risk_zone,
            hypeScore: market.hype_score,
            volatilityScore: market.volatility_score,
          }
        : null,
      holdersCount,
      posts: postsError || !posts ? [] : posts,
    },
    { status: 200 }
  );
}
