import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = authData.user;
  const body = await req.json();

  const {
    tokenKind,
    coinTypeCode = "MEME",
    name,
    symbol,
    slug,
    narrativeShort,
    narrativeLong,
    riskDisclaimer,
    supplyInitial,
    supplyMax,
  } = body || {};

  if (!name || !symbol || !slug || !narrativeShort || !supplyInitial) {
    return NextResponse.json(
      { error: "Campos obrigatórios ausentes para criação do token." },
      { status: 400 }
    );
  }

  const supplyInitialNum = Number(supplyInitial);
  const supplyMaxNum = supplyMax ? Number(supplyMax) : null;

  if (!Number.isFinite(supplyInitialNum) || supplyInitialNum <= 0) {
    return NextResponse.json(
      { error: "Supply inicial inválido." },
      { status: 400 }
    );
  }

  // 1) Encontrar usuário de app (public.users)
  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("auth_user_id", user.id)
    .single();

  if (appUserError || !appUser) {
    return NextResponse.json(
      { error: "Usuário de aplicação não encontrado em public.users." },
      { status: 400 }
    );
  }

  // 2) Encontrar ou criar creator para esse user
  const { data: creatorsList, error: creatorsError } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", appUser.id)
    .limit(1);

  if (creatorsError) {
    return NextResponse.json(
      { error: "Erro ao buscar criador." },
      { status: 400 }
    );
  }

  let creatorId: string | null =
    creatorsList && creatorsList.length > 0 ? creatorsList[0].id : null;

  if (!creatorId) {
    const handle =
      (user.user_metadata && (user.user_metadata.username as string)) ||
      `creator_${appUser.id.toString().slice(0, 8)}`;

    const { data: newCreator, error: creatorInsertError } = await supabase
      .from("creators")
      .insert({
        user_id: appUser.id,
        handle,
        is_verified: false,
      })
      .select("id")
      .single();

    if (creatorInsertError || !newCreator) {
      return NextResponse.json(
        { error: "Não foi possível criar o perfil de criador." },
        { status: 400 }
      );
    }

    creatorId = newCreator.id;
  }

  // 3) Buscar coin_type_id a partir do code
  const { data: coinType, error: coinTypeError } = await supabase
    .from("coin_types")
    .select("id")
    .eq("code", coinTypeCode)
    .single();

  if (coinTypeError || !coinType) {
    return NextResponse.json(
      { error: "Tipo de coin inválido ou não encontrado." },
      { status: 400 }
    );
  }

  // 4) Criar wallet da pool (wallet_type = 'POOL')
  const baseReserve = 1000; // valor base inicial da pool em "base token" interno

  const { data: poolWallet, error: walletError } = await supabase
    .from("wallets")
    .insert({
      user_id: null,
      wallet_type: "POOL",
      label: `Pool ${symbol}`,
      provider: "INTERNAL",
      balance_base: baseReserve,
      is_active: true,
    })
    .select("id")
    .single();

  if (walletError || !poolWallet) {
    return NextResponse.json(
      { error: "Erro ao criar wallet da pool." },
      { status: 400 }
    );
  }

  // 5) Criar coin
  const { data: coin, error: coinError } = await supabase
    .from("coins")
    .insert({
      slug,
      symbol,
      name,
      creator_id: creatorId,
      coin_type_id: coinType.id,
      status: "ACTIVE",
      narrative_short: narrativeShort,
      narrative_long: narrativeLong || null,
      risk_disclaimer: riskDisclaimer,
      supply_max: supplyMaxNum,
      supply_initial: supplyInitialNum,
      supply_circulating: supplyInitialNum,
      pool_wallet_id: poolWallet.id,
      tags: tokenKind ? [tokenKind] : null,
    })
    .select("id, slug, symbol, name")
    .single();

  if (coinError || !coin) {
    return NextResponse.json(
      { error: "Erro ao criar coin." },
      { status: 400 }
    );
  }

  // 6) Registrar saldo de coin na pool (wallet_balances)
  const { error: wbError } = await supabase.from("wallet_balances").insert({
    wallet_id: poolWallet.id,
    coin_id: coin.id,
    balance_available: supplyInitialNum,
    balance_locked: 0,
  });

  if (wbError) {
    return NextResponse.json(
      { error: "Erro ao inicializar saldo da pool." },
      { status: 400 }
    );
  }

  // 7) Inicializar estado de mercado (AMM) com a função init_coin_market_state
  const { error: ammError } = await supabase.rpc("init_coin_market_state", {
    p_coin_id: coin.id,
    p_base_reserve: baseReserve,
    p_coin_reserve: supplyInitialNum,
  });

  if (ammError) {
    return NextResponse.json(
      { error: "Erro ao inicializar estado de mercado da moeda." },
      { status: 400 }
    );
  }

  // 8) Criar posts iniciais no feed da moeda (posts)
  const creatorName = appUser.display_name || user.email || "Criador";

  const { error: postsError } = await supabase.from("posts").insert([
    {
      coin_id: coin.id,
      author_user_id: appUser.id,
      kind: "SYSTEM",
      content: `Token criado por ${creatorName}. Este é um experimento de narrativa especulativa. Não é investimento seguro.`,
      is_pinned: true,
      is_system: true,
    },
    {
      coin_id: coin.id,
      author_user_id: appUser.id,
      kind: "WARNING",
      content:
        "Aviso sério: você pode perder 100% do valor colocado neste token. Entre apenas se entender e aceitar esse risco.",
      is_pinned: false,
      is_system: true,
    },
  ]);

  if (postsError) {
    return NextResponse.json(
      { error: "Erro ao registrar mensagens iniciais da moeda." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      coinId: coin.id,
      slug: coin.slug,
      symbol: coin.symbol,
      name: coin.name,
    },
    { status: 201 }
  );
}
