// // app/api/launch-token-after-pix/route.ts
// import { NextResponse } from "next/server";
// import { auth, clerkClient } from "@clerk/nextjs/server";
// import { createClient } from "@supabase/supabase-js";
// import crypto from "node:crypto";

// export const runtime = "nodejs";

// type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

// type LaunchTokenInput = {
//   tokenType: TokenType;
//   publicName: string;
//   tokenName: string;
//   ticker: string;
//   headline: string;
//   story: string;
//   totalSupply: number;
//   poolPercent: number;
//   faceValue: number;
//   pixData: any;
// };

// // -------- helpers --------
// const getAdminSupabase = () => {
//   const url =
//     process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
//   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//   if (!url || !serviceKey) {
//     throw new Error(
//       "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados."
//     );
//   }

//   return createClient(url, serviceKey, {
//     auth: { persistSession: false },
//   });
// };

// const normalizeTicker = (t: string) =>
//   t
//     .toUpperCase()
//     .replace(/[^A-Z0-9]/g, "")
//     .slice(0, 6);

// const slugify = (raw: string) =>
//   raw
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");

// const toFinite = (n: any) => (Number.isFinite(Number(n)) ? Number(n) : NaN);

// // -------- route --------
// export async function POST(req: Request) {
//   try {
//     // 1) Auth Clerk (fonte única)
//     const { userId } = auth();
//     if (!userId) {
//       return NextResponse.json(
//         { error: "NOT_AUTH", message: "Você precisa estar logado." },
//         { status: 401 }
//       );
//     }

//     const input = (await req.json()) as LaunchTokenInput;

//     // 2) Validação dura do payload
//     const tokenType = (input.tokenType || "") as TokenType;
//     const publicName = (input.publicName || "").trim();
//     const tokenName = (input.tokenName || "").trim();
//     const ticker = normalizeTicker(input.ticker || "");
//     const headline = (input.headline || "").trim();
//     const story = (input.story || "").trim();

//     const totalSupply = toFinite(input.totalSupply);
//     const poolPercent = toFinite(input.poolPercent);
//     const faceValue = toFinite(input.faceValue);

//     if (!tokenType || !publicName || !tokenName || !ticker) {
//       return NextResponse.json(
//         { error: "BAD_INPUT", message: "Campos obrigatórios faltando." },
//         { status: 400 }
//       );
//     }

//     if (
//       !Number.isFinite(totalSupply) ||
//       totalSupply <= 0 ||
//       !Number.isFinite(poolPercent) ||
//       poolPercent <= 0 ||
//       poolPercent > 100 ||
//       !Number.isFinite(faceValue) ||
//       faceValue <= 0
//     ) {
//       return NextResponse.json(
//         {
//           error: "BAD_ECONOMICS",
//           message: "Configuração de supply/pool/face inválida.",
//         },
//         { status: 400 }
//       );
//     }

//     if (!input.pixData) {
//       return NextResponse.json(
//         { error: "NO_PIX", message: "pixData não enviado." },
//         { status: 400 }
//       );
//     }

//     // 3) Supabase admin
//     const sb = getAdminSupabase();

//     // 4) Puxa dados do usuário Clerk
//     const clerkUser = await clerkClient.users.getUser(userId);
//     const primaryEmail =
//       clerkUser.emailAddresses.find(
//         (e) => e.id === clerkUser.primaryEmailAddressId
//       )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || null;

//     const fullName =
//       [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
//       publicName;

//     const usernameBase =
//       clerkUser.username ||
//       (primaryEmail ? primaryEmail.split("@")[0] : null) ||
//       `user_${userId.slice(0, 8)}`;

//     // 5) Garante public.users (auth_user_id = Clerk userId)
//     let userIdInternal: string;

//     const { data: usersData, error: usersError } = await sb
//       .from("users")
//       .select("id, username, display_name")
//       .eq("auth_user_id", userId)
//       .limit(1);

//     if (usersError) {
//       console.error("[LAUNCH][server] usersError", usersError);
//       return NextResponse.json(
//         {
//           error: "USERS_FAIL",
//           message: "Erro ao carregar seu perfil interno.",
//         },
//         { status: 500 }
//       );
//     }

//     if (usersData && usersData.length) {
//       userIdInternal = usersData[0].id;
//     } else {
//       const { data: newUser, error: newUserError } = await sb
//         .from("users")
//         .insert({
//           auth_user_id: userId, // <- Clerk user id (string)
//           role: "CREATOR",
//           display_name: fullName,
//           username: usernameBase,
//           email: primaryEmail,
//         })
//         .select("id")
//         .single();

//       if (newUserError || !newUser) {
//         console.error("[LAUNCH][server] newUserError", newUserError);
//         return NextResponse.json(
//           {
//             error: "USERS_CREATE_FAIL",
//             message: "Não foi possível criar seu perfil interno.",
//           },
//           { status: 500 }
//         );
//       }
//       userIdInternal = newUser.id;
//     }

//     // 6) Garante public.creators (sem depender do teu helper client)
//     let creatorId: string;

//     const { data: creatorData } = await sb
//       .from("creators")
//       .select("id")
//       .eq("user_id", userIdInternal)
//       .limit(1)
//       .maybeSingle();

//     if (creatorData?.id) {
//       creatorId = creatorData.id;
//     } else {
//       const { data: newCreator, error: newCreatorError } = await sb
//         .from("creators")
//         .insert({
//           user_id: userIdInternal,
//           display_name: fullName,
//           username: usernameBase,
//           is_active: true,
//         })
//         .select("id")
//         .single();

//       if (newCreatorError || !newCreator) {
//         console.error("[LAUNCH][server] newCreatorError", newCreatorError);
//         return NextResponse.json(
//           {
//             error: "CREATOR_CREATE_FAIL",
//             message: "Não foi possível criar seu perfil de criador.",
//           },
//           { status: 500 }
//         );
//       }
//       creatorId = newCreator.id;
//     }

//     // 7) Ticker/slug únicos
//     const baseSlug = slugify(ticker || tokenName) || crypto.randomUUID().slice(0, 8);

//     const { data: existsTicker } = await sb
//       .from("coins")
//       .select("id")
//       .eq("symbol", ticker)
//       .limit(1);

//     if (existsTicker?.length) {
//       return NextResponse.json(
//         {
//           error: "TICKER_EXISTS",
//           message: "Esse ticker já existe. Escolha outro.",
//         },
//         { status: 409 }
//       );
//     }

//     let slug = baseSlug;
//     const { data: existsSlug } = await sb
//       .from("coins")
//       .select("id")
//       .eq("slug", slug)
//       .limit(1);

//     if (existsSlug?.length) {
//       slug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`;
//     }

//     // 8) coin_types
//     const coinTypeCode = tokenType === "COMUNIDADE" ? "COMUNIDADE" : "MEME";

//     const { data: coinType, error: coinTypeError } = await sb
//       .from("coin_types")
//       .select("id, code")
//       .eq("code", coinTypeCode)
//       .single();

//     if (coinTypeError || !coinType) {
//       console.error("[LAUNCH][server] coinTypeError", coinTypeError);
//       return NextResponse.json(
//         {
//           error: "COIN_TYPES_FAIL",
//           message:
//             "coin_types não configurado. Garanta MEME/COMUNIDADE no banco.",
//         },
//         { status: 500 }
//       );
//     }

//     // 9) Modelo econômico
//     const poolCoins = (totalSupply * poolPercent) / 100;
//     const bagCoins = totalSupply - poolCoins;
//     const baseReserve = poolCoins * faceValue;

//     // 10) Wallet da pool
//     const { data: poolWallet, error: poolWalletError } = await sb
//       .from("wallets")
//       .insert({
//         wallet_type: "POOL",
//         label: `Pool ${ticker || tokenName}`,
//         provider: "INTERNAL",
//         balance_base: baseReserve,
//         is_active: true,
//       })
//       .select("id")
//       .single();

//     if (poolWalletError || !poolWallet) {
//       console.error("[LAUNCH][server] poolWalletError", poolWalletError);
//       return NextResponse.json(
//         { error: "POOL_WALLET_FAIL", message: "Erro ao criar wallet da pool." },
//         { status: 500 }
//       );
//     }

//     // 11) Wallet do criador (BAG)
//     const { data: creatorWallet } = await sb
//       .from("wallets")
//       .select("id, wallet_type")
//       .eq("user_id", userIdInternal)
//       .in("wallet_type", ["CREATOR_TREASURY", "USER"])
//       .order("wallet_type", { ascending: true })
//       .limit(1)
//       .maybeSingle();

//     // 12) Cria coin
//     const RISK_DISCLAIMER =
//       "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.";

//     const { data: coin, error: coinError } = await sb
//       .from("coins")
//       .insert({
//         slug,
//         symbol: ticker,
//         name: tokenName,
//         creator_id: creatorId,
//         coin_type_id: coinType.id,
//         status: "DRAFT",
//         narrative_short: headline,
//         narrative_long: story,
//         risk_disclaimer: RISK_DISCLAIMER,
//         supply_max: totalSupply,
//         supply_initial: totalSupply,
//         supply_circulating: poolCoins,
//         pool_wallet_id: poolWallet.id,
//       })
//       .select("id")
//       .single();

//     if (coinError || !coin) {
//       console.error("[LAUNCH][server] coinError", coinError);
//       return NextResponse.json(
//         { error: "COIN_CREATE_FAIL", message: "Erro ao criar a coin." },
//         { status: 500 }
//       );
//     }

//     const coinId = coin.id as string;

//     // 13) wallet_balances iniciais
//     const balanceRows: any[] = [
//       {
//         wallet_id: poolWallet.id,
//         coin_id: coinId,
//         balance_available: poolCoins,
//         balance_locked: 0,
//       },
//     ];

//     if (creatorWallet?.id && bagCoins > 0) {
//       balanceRows.push({
//         wallet_id: creatorWallet.id,
//         coin_id: coinId,
//         balance_available: bagCoins,
//         balance_locked: 0,
//       });
//     }

//     const { error: wbError } = await sb
//       .from("wallet_balances")
//       .insert(balanceRows);

//     if (wbError) {
//       console.error("[LAUNCH][server] wbError", wbError);
//     }

//     // 14) init AMM
//     const { error: ammError } = await sb.rpc("init_coin_market_state", {
//       p_coin_id: coinId,
//       p_base_reserve: baseReserve.toString(),
//       p_coin_reserve: poolCoins.toString(),
//     });

//     if (ammError) {
//       console.error("[LAUNCH][server] ammError", ammError);
//     }

//     // 15) deposits PIX (PENDING)
//     try {
//       const firstTx = input.pixData?.Charge?.Transactions?.[0];
//       const pix = firstTx?.Pix;
//       const ref =
//         pix?.reference ||
//         `charge_${input.pixData?.Charge?.galaxPayId ?? ""}`;

//       const amountBase = firstTx?.value ? firstTx.value / 100 : null;

//       if (amountBase != null) {
//         const { data: platformWallet } = await sb
//           .from("wallets")
//           .select("id")
//           .eq("wallet_type", "PLATFORM_TREASURY")
//           .eq("is_active", true)
//           .order("created_at", { ascending: true })
//           .limit(1)
//           .maybeSingle();

//         if (platformWallet?.id) {
//           const { error: depError } = await sb.from("deposits").insert({
//             wallet_id: platformWallet.id,
//             provider: "CELCOIN",
//             provider_ref: ref,
//             amount_base: amountBase,
//             currency: "BRL",
//             status: "PENDING",
//           });

//           if (depError) console.error("[LAUNCH][server] depError", depError);
//         }
//       }
//     } catch (e) {
//       console.warn("[LAUNCH][server] depósito PIX best-effort falhou", e);
//     }

//     // 16) post system
//     try {
//       const { error: postError } = await sb.from("posts").insert({
//         coin_id: coinId,
//         author_user_id: userIdInternal,
//         kind: "SYSTEM",
//         content: `🚀 Token ${tokenName} (${ticker}) foi criado na Arena. Experimento de alto risco, não promessa de retorno.`,
//         is_pinned: true,
//         is_system: true,
//         meta: {
//           tokenType,
//           totalSupply,
//           poolPercent,
//           faceValue,
//           poolCoins,
//           bagCoins,
//           baseReserve,
//         },
//       });

//       if (postError) console.error("[LAUNCH][server] postError", postError);
//     } catch (e) {
//       console.warn("[LAUNCH][server] post system best-effort falhou", e);
//     }

//     console.log("[LAUNCH][server] sucesso", { coinId, slug });
//     return NextResponse.json({ coinId, slug }, { status: 200 });
//   } catch (err: any) {
//     console.error("[LAUNCH][server] crash", err);
//     return NextResponse.json(
//       {
//         error: "SERVER_FAIL",
//         message: err?.message || "Falha interna ao lançar token.",
//       },
//       { status: 500 }
//     );
//   }
// }
// app/api/launch-token-after-pix/route.ts
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // garante ambiente Node (Clerk + service role)

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

type LaunchTokenInput = {
  tokenType: TokenType;
  publicName: string;
  tokenName: string;
  ticker: string;
  headline: string;
  story: string;
  totalSupply: number;
  poolPercent: number;
  faceValue: number;
  pixData: any;
};

// --- Supabase admin client (service role) ---
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_ENV_MISSING");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// helper: cria um id curto para logs
function makeReqId() {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export async function POST(req: Request) {
  const reqId = makeReqId();
  const t0 = Date.now();
  console.time(`[LAUNCH ${reqId}] total`);

  // ========= LOGS DE ENTRADA =========
  const method = req.method;
  const url = req.url;

  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const ua = req.headers.get("user-agent");

  console.log(`[LAUNCH ${reqId}] >>> incoming`, {
    method,
    url,
    host,
    origin,
    ua: ua?.slice(0, 60),
    hasAuthorization: !!authHeader,
    authorizationPreview: authHeader
      ? `${authHeader.split(" ")[0]} *** (${authHeader.length} chars)`
      : null,
    hasCookie: !!cookieHeader,
    hasSessionCookie: cookieHeader?.includes("__session") ?? false,
  });

  // ========= CHECK ENV =========
  console.log(`[LAUNCH ${reqId}] env check`, {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    hasClerkPub: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkJwtKey: !!process.env.CLERK_JWT_KEY,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    // 1) ✅ Auth Clerk pelo Bearer/cookie (não depende só de cookie)
    console.time(`[LAUNCH ${reqId}] clerk.authenticateRequest`);
    const { isAuthenticated, sessionClaims } =
      await clerkClient.authenticateRequest(req, {
        jwtKey: process.env.CLERK_JWT_KEY, // opcional p/ networkless
      });
    console.timeEnd(`[LAUNCH ${reqId}] clerk.authenticateRequest`);

    const clerkUserId = sessionClaims?.sub ?? null;
    const sessionId = (sessionClaims as any)?.sid ?? null;

    console.log(`[LAUNCH ${reqId}] authenticateRequest`, {
      isAuthenticated,
      clerkUserId,
      sessionId,
      authed: !!clerkUserId,
    });

    if (!isAuthenticated || !clerkUserId) {
      console.warn(`[LAUNCH ${reqId}] UNAUTHENTICATED -> 401`);
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Faça login para lançar." },
        { status: 401 }
      );
    }

    // 2) Body
    let input: LaunchTokenInput | null = null;
    try {
      input = (await req.json()) as LaunchTokenInput;
    } catch (e) {
      console.error(`[LAUNCH ${reqId}] body parse fail`, e);
      return NextResponse.json(
        { error: "BAD_JSON", message: "Body inválido (JSON)." },
        { status: 400 }
      );
    }

    console.log(`[LAUNCH ${reqId}] body received`, {
      tokenType: input.tokenType,
      publicName: input.publicName?.slice(0, 40),
      tokenName: input.tokenName,
      ticker: input.ticker,
      hasHeadline: !!input.headline,
      hasStory: !!input.story,
      totalSupply: input.totalSupply,
      poolPercent: input.poolPercent,
      faceValue: input.faceValue,
      hasPixData: !!input.pixData,
    });

    if (!input?.tokenName || !input?.ticker) {
      console.warn(`[LAUNCH ${reqId}] BAD_REQUEST missing tokenName/ticker`);
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "tokenName/ticker obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    console.log(`[LAUNCH ${reqId}] supabase admin ok`);

    // 3) users: garante public.users
    console.time(`[LAUNCH ${reqId}] users.find`);
    const { data: existingUser, error: userFindErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", clerkUserId)
      .maybeSingle();
    console.timeEnd(`[LAUNCH ${reqId}] users.find`);

    if (userFindErr) {
      console.error(`[LAUNCH ${reqId}] users.find FAIL`, userFindErr);
      return NextResponse.json(
        { error: "USERS_FIND_FAIL", message: userFindErr.message },
        { status: 500 }
      );
    }

    let userId: string;

    if (existingUser?.id) {
      userId = existingUser.id;
      console.log(`[LAUNCH ${reqId}] users.find OK -> existing user`, { userId });
    } else {
      console.log(`[LAUNCH ${reqId}] users.find OK -> creating user`);

      console.time(`[LAUNCH ${reqId}] clerk.users.getUser`);
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      console.timeEnd(`[LAUNCH ${reqId}] clerk.users.getUser`);

      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress || null;

      const displayName =
        clerkUser.fullName ||
        email?.split("@")[0] ||
        `user_${clerkUserId.slice(0, 8)}`;

      const usernameBase =
        clerkUser.username ||
        email?.split("@")[0] ||
        `user_${clerkUserId.slice(0, 8)}`;

      console.log(`[LAUNCH ${reqId}] clerk user snapshot`, {
        email: email ? email.replace(/(.{2}).+(@.+)/, "$1***$2") : null,
        fullName: clerkUser.fullName ?? null,
        username: clerkUser.username ?? null,
      });

      console.time(`[LAUNCH ${reqId}] users.insert`);
      const { data: newUser, error: newUserErr } = await supabase
        .from("users")
        .insert({
          auth_user_id: clerkUserId,
          role: "CREATOR",
          display_name: displayName,
          username: usernameBase,
        })
        .select("id")
        .single();
      console.timeEnd(`[LAUNCH ${reqId}] users.insert`);

      if (newUserErr || !newUser) {
        console.error(`[LAUNCH ${reqId}] users.insert FAIL`, newUserErr);
        return NextResponse.json(
          { error: "USERS_INSERT_FAIL", message: newUserErr?.message },
          { status: 500 }
        );
      }

      userId = newUser.id;
      console.log(`[LAUNCH ${reqId}] users.insert OK`, { userId });
    }

    // 4) creators: garante creator ligado ao user
    console.time(`[LAUNCH ${reqId}] creators.find`);
    const { data: existingCreator, error: creatorFindErr } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    console.timeEnd(`[LAUNCH ${reqId}] creators.find`);

    if (creatorFindErr) {
      console.error(`[LAUNCH ${reqId}] creators.find FAIL`, creatorFindErr);
      return NextResponse.json(
        { error: "CREATOR_FIND_FAIL", message: creatorFindErr.message },
        { status: 500 }
      );
    }

    let creatorId: string;
    if (existingCreator?.id) {
      creatorId = existingCreator.id;
      console.log(`[LAUNCH ${reqId}] creators.find OK -> existing creator`, { creatorId });
    } else {
      console.log(`[LAUNCH ${reqId}] creators.find OK -> creating creator`);

      console.time(`[LAUNCH ${reqId}] creators.insert`);
      const { data: newCreator, error: newCreatorErr } = await supabase
        .from("creators")
        .insert({
          user_id: userId,
          public_name: input.publicName || input.tokenName,
          is_active: true,
        })
        .select("id")
        .single();
      console.timeEnd(`[LAUNCH ${reqId}] creators.insert`);

      if (newCreatorErr || !newCreator) {
        console.error(`[LAUNCH ${reqId}] creators.insert FAIL`, newCreatorErr);
        return NextResponse.json(
          { error: "CREATOR_INSERT_FAIL", message: newCreatorErr?.message },
          { status: 500 }
        );
      }

      creatorId = newCreator.id;
      console.log(`[LAUNCH ${reqId}] creators.insert OK`, { creatorId });
    }

    // 5) coin_types
    const coinTypeCode =
      input.tokenType === "COMUNIDADE" ? "COMUNIDADE" : "MEME";

    console.log(`[LAUNCH ${reqId}] coinTypeCode resolved`, { coinTypeCode });

    console.time(`[LAUNCH ${reqId}] coin_types.select`);
    const { data: coinType, error: coinTypeErr } = await supabase
      .from("coin_types")
      .select("id, code")
      .eq("code", coinTypeCode)
      .single();
    console.timeEnd(`[LAUNCH ${reqId}] coin_types.select`);

    if (coinTypeErr || !coinType) {
      console.error(`[LAUNCH ${reqId}] coin_types FAIL`, coinTypeErr);
      return NextResponse.json(
        {
          error: "COIN_TYPE_FAIL",
          message: "coin_types precisa ter MEME e COMUNIDADE.",
        },
        { status: 500 }
      );
    }

    console.log(`[LAUNCH ${reqId}] coin_types OK`, {
      coinTypeId: coinType.id,
      coinTypeCode: coinType.code,
    });

    // 6) cálculos econômicos
    const totalSupply = Number(input.totalSupply || 0);
    const poolPercent = Number(input.poolPercent || 0);
    const faceValue = Number(input.faceValue || 0);

    console.log(`[LAUNCH ${reqId}] econ input`, {
      totalSupply,
      poolPercent,
      faceValue,
    });

    if (!totalSupply || !poolPercent || !faceValue) {
      console.warn(`[LAUNCH ${reqId}] ECON_INVALID -> 400`);
      return NextResponse.json(
        {
          error: "ECON_INVALID",
          message: "Supply / Pool% / FaceValue inválidos.",
        },
        { status: 400 }
      );
    }

    const poolCoins = (totalSupply * poolPercent) / 100;
    const bagCoins = totalSupply - poolCoins;
    const baseReserve = poolCoins * faceValue;

    console.log(`[LAUNCH ${reqId}] econ calc`, {
      poolCoins,
      bagCoins,
      baseReserve,
    });

    // 7) wallet da pool
    console.time(`[LAUNCH ${reqId}] wallets.pool.insert`);
    const { data: poolWallet, error: poolWalletErr } = await supabase
      .from("wallets")
      .insert({
        wallet_type: "POOL",
        label: `Pool ${input.ticker || input.tokenName}`,
        provider: "INTERNAL",
        balance_base: baseReserve,
        is_active: true,
      })
      .select("id")
      .single();
    console.timeEnd(`[LAUNCH ${reqId}] wallets.pool.insert`);

    if (poolWalletErr || !poolWallet) {
      console.error(`[LAUNCH ${reqId}] wallets.pool.insert FAIL`, poolWalletErr);
      return NextResponse.json(
        { error: "POOL_WALLET_FAIL", message: poolWalletErr?.message },
        { status: 500 }
      );
    }

    console.log(`[LAUNCH ${reqId}] wallets.pool.insert OK`, {
      poolWalletId: poolWallet.id,
    });

    // 8) wallet do criador (BAG)
    console.time(`[LAUNCH ${reqId}] wallets.creator.select`);
    const { data: creatorWallet } = await supabase
      .from("wallets")
      .select("id, wallet_type")
      .eq("user_id", userId)
      .in("wallet_type", ["CREATOR_TREASURY", "USER"])
      .order("wallet_type", { ascending: true })
      .limit(1)
      .maybeSingle();
    console.timeEnd(`[LAUNCH ${reqId}] wallets.creator.select`);

    console.log(`[LAUNCH ${reqId}] wallets.creator.select OK`, {
      creatorWalletId: creatorWallet?.id ?? null,
      creatorWalletType: creatorWallet?.wallet_type ?? null,
    });

    // 9) slug
    const baseSlug =
      (input.ticker && input.ticker.trim()) ||
      input.tokenName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const slug =
      (baseSlug || crypto.randomUUID().slice(0, 8)).toLowerCase();

    console.log(`[LAUNCH ${reqId}] slug resolved`, {
      baseSlug,
      slug,
    });

    // 10) cria coin
    const RISK_DISCLAIMER =
      "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.";

    console.time(`[LAUNCH ${reqId}] coins.insert`);
    const { data: coin, error: coinErr } = await supabase
      .from("coins")
      .insert({
        slug,
        symbol: input.ticker,
        name: input.tokenName,
        creator_id: creatorId,
        coin_type_id: coinType.id,
        status: "DRAFT",
        narrative_short: input.headline,
        narrative_long: input.story,
        risk_disclaimer: RISK_DISCLAIMER,
        supply_max: totalSupply,
        supply_initial: totalSupply,
        supply_circulating: poolCoins,
        pool_wallet_id: poolWallet.id,
      })
      .select("id")
      .single();
    console.timeEnd(`[LAUNCH ${reqId}] coins.insert`);

    if (coinErr || !coin) {
      console.error(`[LAUNCH ${reqId}] coins.insert FAIL`, coinErr);
      return NextResponse.json(
        { error: "COIN_INSERT_FAIL", message: coinErr?.message },
        { status: 500 }
      );
    }

    const coinId = coin.id as string;
    console.log(`[LAUNCH ${reqId}] coins.insert OK`, { coinId });

    // 11) saldos iniciais
    const balanceRows: any[] = [
      {
        wallet_id: poolWallet.id,
        coin_id: coinId,
        balance_available: poolCoins,
        balance_locked: 0,
      },
    ];

    if (creatorWallet?.id && bagCoins > 0) {
      balanceRows.push({
        wallet_id: creatorWallet.id,
        coin_id: coinId,
        balance_available: bagCoins,
        balance_locked: 0,
      });
    }

    console.log(`[LAUNCH ${reqId}] wallet_balances rows`, {
      rows: balanceRows.map((r) => ({
        wallet_id: r.wallet_id,
        coin_id: r.coin_id,
        balance_available: r.balance_available,
      })),
    });

    console.time(`[LAUNCH ${reqId}] wallet_balances.insert`);
    const { error: wbErr } = await supabase
      .from("wallet_balances")
      .insert(balanceRows);
    console.timeEnd(`[LAUNCH ${reqId}] wallet_balances.insert`);

    if (wbErr) console.error(`[LAUNCH ${reqId}] wallet_balances FAIL`, wbErr);
    else console.log(`[LAUNCH ${reqId}] wallet_balances OK`);

    // 12) init AMM
    console.time(`[LAUNCH ${reqId}] amm.init_coin_market_state`);
    const { error: ammErr } = await supabase.rpc(
      "init_coin_market_state",
      {
        p_coin_id: coinId,
        p_base_reserve: baseReserve.toString(),
        p_coin_reserve: poolCoins.toString(),
      }
    );
    console.timeEnd(`[LAUNCH ${reqId}] amm.init_coin_market_state`);

    if (ammErr) console.error(`[LAUNCH ${reqId}] amm init FAIL`, ammErr);
    else console.log(`[LAUNCH ${reqId}] amm init OK`);

    // 13) deposits PIX
    try {
      const firstTx = input.pixData?.Charge?.Transactions?.[0];
      const pix = firstTx?.Pix;
      const ref =
        pix?.reference ||
        `charge_${input.pixData?.Charge?.galaxPayId ?? ""}`;
      const amountBase =
        firstTx?.value ? firstTx.value / 100 : null;

      console.log(`[LAUNCH ${reqId}] deposit snapshot`, {
        pixRef: ref,
        amountBase,
        hasPlatformWalletLookup: true,
      });

      if (amountBase != null) {
        console.time(`[LAUNCH ${reqId}] wallets.platform.select`);
        const { data: platformWallet } = await supabase
          .from("wallets")
          .select("id")
          .eq("wallet_type", "PLATFORM_TREASURY")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        console.timeEnd(`[LAUNCH ${reqId}] wallets.platform.select`);

        console.log(`[LAUNCH ${reqId}] wallets.platform`, {
          platformWalletId: platformWallet?.id ?? null,
        });

        if (platformWallet?.id) {
          console.time(`[LAUNCH ${reqId}] deposits.insert`);
          await supabase.from("deposits").insert({
            wallet_id: platformWallet.id,
            provider: "CELCOIN",
            provider_ref: ref,
            amount_base: amountBase,
            currency: "BRL",
            status: "PENDING",
          });
          console.timeEnd(`[LAUNCH ${reqId}] deposits.insert`);
          console.log(`[LAUNCH ${reqId}] deposits.insert OK`);
        } else {
          console.warn(`[LAUNCH ${reqId}] deposits skipped (no platform wallet)`);
        }
      } else {
        console.warn(`[LAUNCH ${reqId}] deposits skipped (amountBase null)`);
      }
    } catch (e) {
      console.warn(`[LAUNCH ${reqId}] deposits FAIL`, e);
    }

    // 14) post SYSTEM
    try {
      console.time(`[LAUNCH ${reqId}] posts.insert`);
      await supabase.from("posts").insert({
        coin_id: coinId,
        author_user_id: userId,
        kind: "SYSTEM",
        content: `🚀 Token ${input.tokenName} (${input.ticker}) foi criado na Arena. Este é um experimento de narrativa de alto risco, não uma promessa de retorno.`,
        is_pinned: true,
        is_system: true,
        meta: {
          tokenType: input.tokenType,
          totalSupply,
          poolPercent,
          faceValue,
          poolCoins,
          bagCoins,
          baseReserve,
          clerkUserId,
          clerkSessionId: sessionId,
        },
      });
      console.timeEnd(`[LAUNCH ${reqId}] posts.insert`);
      console.log(`[LAUNCH ${reqId}] posts.insert OK`);
    } catch (e) {
      console.warn(`[LAUNCH ${reqId}] posts.insert FAIL`, e);
    }

    const dt = Date.now() - t0;
    console.log(`[LAUNCH ${reqId}] <<< success`, {
      coinId,
      slug,
      ms: dt,
    });

    console.timeEnd(`[LAUNCH ${reqId}] total`);
    return NextResponse.json({ coinId, slug });
  } catch (err: any) {
    console.error(`[LAUNCH ${reqId}] [fatal]`, err);

    console.timeEnd(`[LAUNCH ${reqId}] total`);
    return NextResponse.json(
      {
        error: err?.message || "LAUNCH_FAIL",
        message: err?.message || "Erro inesperado ao lançar token.",
      },
      { status: 500 }
    );
  }
}
