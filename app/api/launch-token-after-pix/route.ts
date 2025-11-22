// import { NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

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

// function isUuid(v: string) {
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//     v
//   );
// }

// function slugify(raw: string) {
//   return raw
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");
// }

// // ✅ decode simples só pra pegar o sub (dev/mvp)
// function decodeJwtSub(token: string): string | null {
//   try {
//     const parts = token.split(".");
//     if (parts.length < 2) return null;
//     const payload = JSON.parse(
//       Buffer.from(parts[1], "base64").toString("utf8")
//     );
//     return payload?.sub || payload?.user_id || null;
//   } catch {
//     return null;
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const input = (await req.json()) as LaunchTokenInput;

//     // ===== validações mínimas =====
//     if (!input?.ticker || !input?.tokenName || !input?.publicName) {
//       return NextResponse.json(
//         { message: "Campos obrigatórios ausentes.", code: "BAD_INPUT" },
//         { status: 400 }
//       );
//     }

//     if (
//       !Number.isFinite(input.totalSupply) ||
//       input.totalSupply <= 0 ||
//       !Number.isFinite(input.poolPercent) ||
//       input.poolPercent <= 0 ||
//       input.poolPercent > 100 ||
//       !Number.isFinite(input.faceValue) ||
//       input.faceValue <= 0
//     ) {
//       return NextResponse.json(
//         { message: "Config econômica inválida.", code: "BAD_ECON" },
//         { status: 400 }
//       );
//     }

//     // ===== pega Bearer do Clerk =====
//     const bearer =
//       req.headers.get("authorization")?.replace("Bearer ", "") || null;

//     if (!bearer) {
//       return NextResponse.json(
//         {
//           message: "Bearer do Clerk ausente no Authorization.",
//           code: "NO_BEARER",
//         },
//         { status: 401 }
//       );
//     }

//     const clerkUserId = decodeJwtSub(bearer);
//     if (!clerkUserId) {
//       return NextResponse.json(
//         {
//           message: "JWT inválido / sem sub.",
//           code: "BAD_JWT",
//         },
//         { status: 401 }
//       );
//     }

//     // ===== Supabase SERVICE ROLE =====
//     const supabaseUrl =
//       process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
//     const serviceKey =
//       process.env.SUPABASE_SERVICE_ROLE_KEY ||
//       process.env.SUPABASE_SERVICE_KEY;

//     if (!supabaseUrl || !serviceKey) {
//       return NextResponse.json(
//         {
//           message:
//             "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.",
//           code: "ENV_MISSING",
//         },
//         { status: 500 }
//       );
//     }

//     const sb = createClient(supabaseUrl, serviceKey, {
//       auth: { persistSession: false },
//     });

//     // ========= 1) resolve public.users =========
//     const lookupField = isUuid(clerkUserId) ? "auth_user_id" : "clerk_user_id";

//     let userIdInternal: string;

//     const { data: uFound, error: uFoundErr } = await sb
//       .from("users")
//       .select("id")
//       .eq(lookupField, clerkUserId)
//       .limit(1)
//       .maybeSingle();

//     if (uFoundErr) {
//       // coluna clerk_user_id não existe? devolve erro claro
//       if (
//         lookupField === "clerk_user_id" &&
//         String(uFoundErr.message || "").toLowerCase().includes("column")
//       ) {
//         return NextResponse.json(
//           {
//             message:
//               "Seu schema public.users não tem clerk_user_id. Crie a coluna TEXT UNIQUE.",
//             code: "SCHEMA_NEEDS_CLERK",
//             detail: uFoundErr,
//           },
//           { status: 500 }
//         );
//       }

//       return NextResponse.json(
//         {
//           message: "Erro ao buscar public.users.",
//           code: "USERS_LOOKUP_FAIL",
//           detail: uFoundErr,
//         },
//         { status: 500 }
//       );
//     }

//     if (uFound?.id) {
//       userIdInternal = uFound.id;
//     } else {
//       const insertRow: any = {
//         role: "CREATOR",
//         display_name: input.publicName,
//         username: slugify(input.publicName || input.ticker).slice(0, 24),
//       };

//       if (lookupField === "auth_user_id") insertRow.auth_user_id = clerkUserId;
//       else insertRow.clerk_user_id = clerkUserId;

//       const { data: uNew, error: uNewErr } = await sb
//         .from("users")
//         .insert(insertRow)
//         .select("id")
//         .single();

//       if (uNewErr || !uNew) {
//         return NextResponse.json(
//           {
//             message:
//               "Falha ao criar public.users (provável UUID vs Clerk).",
//             code: "USERS_INSERT_FAIL",
//             detail: uNewErr,
//           },
//           { status: 500 }
//         );
//       }

//       userIdInternal = uNew.id;
//     }

//     // ========= 2) resolve public.creators =========
//     const { data: cFound, error: cFoundErr } = await sb
//       .from("creators")
//       .select("id")
//       .eq("user_id", userIdInternal)
//       .limit(1)
//       .maybeSingle();

//     if (cFoundErr) {
//       return NextResponse.json(
//         {
//           message: "Erro ao buscar creators.",
//           code: "CREATOR_LOOKUP_FAIL",
//           detail: cFoundErr,
//         },
//         { status: 500 }
//       );
//     }

//     let creatorId: string;
//     if (cFound?.id) {
//       creatorId = cFound.id;
//     } else {
//       const { data: cNew, error: cNewErr } = await sb
//         .from("creators")
//         .insert({
//           user_id: userIdInternal,
//           public_name: input.publicName,
//           bio: input.headline,
//         })
//         .select("id")
//         .single();

//       if (cNewErr || !cNew) {
//         return NextResponse.json(
//           {
//             message: "Falha ao criar creators.",
//             code: "CREATOR_INSERT_FAIL",
//             detail: cNewErr,
//           },
//           { status: 500 }
//         );
//       }
//       creatorId = cNew.id;
//     }

//     // ========= 3) coin_types =========
//     const coinTypeCode =
//       input.tokenType === "COMUNIDADE" ? "COMUNIDADE" : "MEME";

//     const { data: coinType, error: coinTypeErr } = await sb
//       .from("coin_types")
//       .select("id, code")
//       .eq("code", coinTypeCode)
//       .single();

//     if (coinTypeErr || !coinType) {
//       return NextResponse.json(
//         {
//           message: "coin_types faltando (MEME/COMUNIDADE).",
//           code: "COIN_TYPE_MISSING",
//           detail: coinTypeErr,
//         },
//         { status: 500 }
//       );
//     }

//     const totalSupply = Number(input.totalSupply);
//     const poolPercent = Number(input.poolPercent);
//     const faceValue = Number(input.faceValue);

//     const poolCoins = (totalSupply * poolPercent) / 100;
//     const bagCoins = totalSupply - poolCoins;
//     const baseReserve = poolCoins * faceValue;

//     // ========= 4) pool wallet =========
//     const { data: poolWallet, error: poolWalletErr } = await sb
//       .from("wallets")
//       .insert({
//         wallet_type: "POOL",
//         label: `Pool ${input.ticker || input.tokenName}`,
//         provider: "INTERNAL",
//         balance_base: baseReserve,
//         is_active: true,
//       })
//       .select("id")
//       .single();

//     if (poolWalletErr || !poolWallet) {
//       return NextResponse.json(
//         {
//           message: "Erro ao criar wallet da pool.",
//           code: "POOL_WALLET_FAIL",
//           detail: poolWalletErr,
//         },
//         { status: 500 }
//       );
//     }

//     // ========= 5) wallet do criador =========
//     const { data: creatorWallet } = await sb
//       .from("wallets")
//       .select("id, wallet_type")
//       .eq("user_id", userIdInternal)
//       .in("wallet_type", ["CREATOR_TREASURY", "USER"])
//       .order("wallet_type", { ascending: true })
//       .limit(1)
//       .maybeSingle();

//     // ========= 6) slug =========
//     const baseSlug =
//       (input.ticker && input.ticker.trim()) || slugify(input.tokenName);
//     const slug = slugify(baseSlug || crypto.randomUUID().slice(0, 8));

//     const RISK_DISCLAIMER =
//       "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.";

//     // ========= 7) coins =========
//     const { data: coin, error: coinErr } = await sb
//       .from("coins")
//       .insert({
//         slug,
//         symbol: input.ticker,
//         name: input.tokenName,
//         creator_id: creatorId,
//         coin_type_id: coinType.id,
//         status: "DRAFT",
//         narrative_short: input.headline,
//         narrative_long: input.story,
//         risk_disclaimer: RISK_DISCLAIMER,
//         supply_max: totalSupply,
//         supply_initial: totalSupply,
//         supply_circulating: poolCoins,
//         pool_wallet_id: poolWallet.id,
//       })
//       .select("id")
//       .single();

//     if (coinErr || !coin) {
//       return NextResponse.json(
//         {
//           message: "Erro ao criar coin.",
//           code: "COIN_INSERT_FAIL",
//           detail: coinErr,
//         },
//         { status: 500 }
//       );
//     }

//     const coinId = coin.id as string;

//     // ========= 8) balances =========
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

//     await sb.from("wallet_balances").insert(balanceRows);

//     // ========= 9) init AMM =========
//     await sb.rpc("init_coin_market_state", {
//       p_coin_id: coinId,
//       p_base_reserve: baseReserve.toString(),
//       p_coin_reserve: poolCoins.toString(),
//     });

//     // ========= 10) deposits PIX =========
//     try {
//       const firstTx = input.pixData?.Charge?.Transactions?.[0];
//       const pix = firstTx?.Pix;
//       const ref =
//         pix?.reference ||
//         `charge_${input.pixData?.Charge?.galaxPayId ?? ""}`;
//       const amountBase =
//         firstTx?.value ? firstTx.value / 100 : null;

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
//           await sb.from("deposits").insert({
//             wallet_id: platformWallet.id,
//             provider: "CELCOIN",
//             provider_ref: ref,
//             amount_base: amountBase,
//             currency: "BRL",
//             status: "PENDING",
//           });
//         }
//       }
//     } catch {}

//     // ========= 11) post SYSTEM =========
//     try {
//       await sb.from("posts").insert({
//         coin_id: coinId,
//         author_user_id: userIdInternal,
//         kind: "SYSTEM",
//         content: `🚀 Token ${input.tokenName} (${input.ticker}) foi criado na Arena. Alto risco, zero promessa de retorno.`,
//         is_pinned: true,
//         is_system: true,
//       });
//     } catch {}

//     return NextResponse.json({ coinId, slug });
//   } catch (e: any) {
//     console.error("[API LAUNCH] ERRO REAL:", e);
//     return NextResponse.json(
//       {
//         message: e?.message || "Erro interno no launch.",
//         code: "LAUNCH_500",
//         detail: String(e),
//       },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Se você tiver Database types, use: createClient<Database>(...)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // <- SERVICE ROLE aqui
);

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

type LaunchBody = {
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

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    // ===== 0) Auth Clerk =====
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Faça login para lançar." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as LaunchBody;

    const {
      tokenType,
      publicName,
      tokenName,
      ticker,
      headline,
      story,
      totalSupply,
      poolPercent,
      faceValue,
      pixData,
    } = body;

    // validações mínimas server-side
    if (!tokenName || !ticker || !headline || !story) {
      return NextResponse.json(
        { error: "VALIDATION_FAIL", message: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }
    if (!(totalSupply > 0 && poolPercent > 0 && poolPercent <= 100 && faceValue > 0)) {
      return NextResponse.json(
        { error: "ECONOMICS_FAIL", message: "Supply/%Pool/Face inválidos." },
        { status: 400 }
      );
    }

    // ===== 1) Garante user interno via clerk_user_id =====
    const { data: existingUser, error: selUserErr } = await supabaseAdmin
      .from("users")
      .select("id, username, display_name")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (selUserErr) {
      console.error("[API LAUNCH] users select error", selUserErr);
      return NextResponse.json(
        { error: "USERS_SELECT_FAIL", detail: selUserErr.message },
        { status: 500 }
      );
    }

    let userIdInternal = existingUser?.id;

    if (!userIdInternal) {
      const cu = await currentUser();
      const email =
        cu?.emailAddresses?.[0]?.emailAddress ??
        null;

      const displayName =
        cu?.fullName ??
        cu?.firstName ??
        cu?.username ??
        email?.split("@")[0] ??
        publicName ??
        null;

      const baseUsernameRaw =
        cu?.username ??
        email?.split("@")[0] ??
        `user_${clerkUserId.slice(0, 8)}`;

      const baseUsername = slugify(baseUsernameRaw).replace(/-/g, "_") || `user_${clerkUserId.slice(0, 8)}`;

      // tenta alguns sufixos pra evitar colisão de username UNIQUE
      let inserted: { id: string; username: string } | null = null;
      for (let i = 0; i < 6; i++) {
        const attempt = i === 0 ? baseUsername : `${baseUsername}_${i + 1}`;

        const { data: newUser, error: insUserErr } = await supabaseAdmin
          .from("users")
          .insert({
            clerk_user_id: clerkUserId, // <<< AQUI é Clerk
            auth_user_id: null,         // <<< deixa legado nulo
            role: "CREATOR",
            display_name: displayName,
            username: attempt,
          })
          .select("id, username")
          .single();

        if (!insUserErr && newUser) {
          inserted = newUser as any;
          break;
        }

        // se foi erro de unique username, tenta outro sufixo
        const msg = insUserErr?.message?.toLowerCase() || "";
        if (!msg.includes("username") && !msg.includes("unique")) {
          console.error("[API LAUNCH] users insert error", insUserErr);
          return NextResponse.json(
            { error: "USERS_INSERT_FAIL", detail: insUserErr?.message },
            { status: 500 }
          );
        }
      }

      if (!inserted) {
        return NextResponse.json(
          { error: "USERS_INSERT_FAIL", message: "Não consegui criar usuário interno." },
          { status: 500 }
        );
      }

      userIdInternal = inserted.id;
    }

    // ===== 2) Garante creator (public.creators) =====
    const { data: existingCreator, error: selCreatorErr } = await supabaseAdmin
      .from("creators")
      .select("id")
      .eq("user_id", userIdInternal)
      .maybeSingle();

    if (selCreatorErr) {
      console.error("[API LAUNCH] creators select error", selCreatorErr);
      return NextResponse.json(
        { error: "CREATOR_SELECT_FAIL", detail: selCreatorErr.message },
        { status: 500 }
      );
    }

    let creatorId = existingCreator?.id;

    if (!creatorId) {
      const { data: newCreator, error: insCreatorErr } = await supabaseAdmin
        .from("creators")
        .insert({
          user_id: userIdInternal,
          public_name: publicName || tokenName,
        })
        .select("id")
        .single();

      if (insCreatorErr || !newCreator) {
        console.error("[API LAUNCH] creators insert error", insCreatorErr);
        return NextResponse.json(
          { error: "CREATOR_INSERT_FAIL", detail: insCreatorErr?.message },
          { status: 500 }
        );
      }
      creatorId = newCreator.id;
    }

    // ===== 3) Ticker único =====
    const { data: tickerTaken, error: tickerErr } = await supabaseAdmin
      .from("coins")
      .select("id")
      .ilike("symbol", ticker.trim())
      .maybeSingle();

    if (tickerErr) {
      console.error("[API LAUNCH] ticker check error", tickerErr);
      return NextResponse.json(
        { error: "TICKER_CHECK_FAIL", detail: tickerErr.message },
        { status: 500 }
      );
    }
    if (tickerTaken) {
      return NextResponse.json(
        { error: "TICKER_TAKEN", message: "Esse ticker já existe." },
        { status: 409 }
      );
    }

    // ===== 4) coin_types =====
    const coinTypeCode = tokenType === "COMUNIDADE" ? "COMUNIDADE" : "MEME";

    const { data: coinType, error: coinTypeErr } = await supabaseAdmin
      .from("coin_types")
      .select("id")
      .eq("code", coinTypeCode)
      .single();

    if (coinTypeErr || !coinType) {
      console.error("[API LAUNCH] coin_types error", coinTypeErr);
      return NextResponse.json(
        { error: "COIN_TYPE_FAIL", detail: coinTypeErr?.message },
        { status: 500 }
      );
    }

    // ===== 5) economics =====
    const poolCoins = (totalSupply * poolPercent) / 100;
    const bagCoins = totalSupply - poolCoins;
    const baseReserve = poolCoins * faceValue;

    // ===== 6) wallet pool =====
    const { data: poolWallet, error: poolWalletErr } = await supabaseAdmin
      .from("wallets")
      .insert({
        wallet_type: "POOL",
        label: `Pool ${ticker || tokenName}`,
        provider: "INTERNAL",
        balance_base: baseReserve,
        is_active: true,
      })
      .select("id")
      .single();

    if (poolWalletErr || !poolWallet) {
      console.error("[API LAUNCH] pool wallet error", poolWalletErr);
      return NextResponse.json(
        { error: "POOL_WALLET_FAIL", detail: poolWalletErr?.message },
        { status: 500 }
      );
    }

    // ===== 7) wallet do criador (pra BAG) =====
    const { data: creatorWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, wallet_type")
      .eq("user_id", userIdInternal)
      .in("wallet_type", ["CREATOR_TREASURY", "USER"])
      .order("wallet_type", { ascending: true })
      .limit(1)
      .maybeSingle();

    // ===== 8) slug =====
    const baseSlug = (ticker && ticker.trim()) || tokenName.trim();
    const slug = slugify(baseSlug) || randomUUID().slice(0, 8);

    // ===== 9) disclaimer =====
    const RISK_DISCLAIMER =
      "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.";

    // ===== 10) cria coin =====
    const { data: coin, error: coinErr } = await supabaseAdmin
      .from("coins")
      .insert({
        slug,
        symbol: ticker.trim(),
        name: tokenName.trim(),
        creator_id: creatorId,
        coin_type_id: coinType.id,
        status: "DRAFT",
        narrative_short: headline,
        narrative_long: story,
        risk_disclaimer: RISK_DISCLAIMER,
        supply_max: totalSupply,
        supply_initial: totalSupply,
        supply_circulating: poolCoins,
        pool_wallet_id: poolWallet.id,
      })
      .select("id")
      .single();

    if (coinErr || !coin) {
      console.error("[API LAUNCH] coin insert error", coinErr);
      return NextResponse.json(
        { error: "COIN_INSERT_FAIL", detail: coinErr?.message },
        { status: 500 }
      );
    }

    const coinId = coin.id as string;

    // ===== 11) balances =====
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

    const { error: wbErr } = await supabaseAdmin
      .from("wallet_balances")
      .insert(balanceRows);

    if (wbErr) {
      console.error("[API LAUNCH] wallet_balances error", wbErr);
      // não derruba o fluxo
    }

    // ===== 12) init AMM =====
    const { error: ammErr } = await supabaseAdmin.rpc(
      "init_coin_market_state",
      {
        p_coin_id: coinId,
        p_base_reserve: baseReserve.toString(),
        p_coin_reserve: poolCoins.toString(),
      }
    );

    if (ammErr) {
      console.error("[API LAUNCH] init_coin_market_state error", ammErr);
    }

    // ===== 13) deposits =====
    try {
      const firstTx = pixData?.Charge?.Transactions?.[0];
      const pix = firstTx?.Pix;
      const ref =
        pix?.reference ||
        `charge_${pixData?.Charge?.galaxPayId ?? ""}`;

      const amountBase = firstTx?.value
        ? firstTx.value / 100
        : null;

      if (amountBase != null) {
        const { data: platformWallet } = await supabaseAdmin
          .from("wallets")
          .select("id")
          .eq("wallet_type", "PLATFORM_TREASURY")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (platformWallet?.id) {
          await supabaseAdmin.from("deposits").insert({
            wallet_id: platformWallet.id,
            provider: "CELCOIN",
            provider_ref: ref,
            amount_base: amountBase,
            currency: "BRL",
            status: "PENDING",
          });
        }
      }
    } catch (e) {
      console.warn("[API LAUNCH] deposit warn", e);
    }

    // ===== 14) post system =====
    try {
      await supabaseAdmin.from("posts").insert({
        coin_id: coinId,
        author_user_id: userIdInternal,
        kind: "SYSTEM",
        content: `🚀 Token ${tokenName} (${ticker}) foi criado na Arena. Experimento de narrativa de alto risco.`,
        is_pinned: true,
        is_system: true,
        meta: {
          tokenType,
          totalSupply,
          poolPercent,
          faceValue,
          poolCoins,
          bagCoins,
          baseReserve,
        },
      });
    } catch (e) {
      console.warn("[API LAUNCH] posts warn", e);
    }

    return NextResponse.json({ coinId, slug }, { status: 200 });
  } catch (err: any) {
    console.error("[API LAUNCH] fatal", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", detail: err?.message },
      { status: 500 }
    );
  }
}
