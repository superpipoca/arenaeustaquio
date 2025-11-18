// "use client";

// import { supabase } from "../lib/supabaseClient";
// import { getOrCreateCreatorProfile } from "./creatorProfile";

// export type LaunchTokenInput = {
//   tokenType: "PESSOA" | "PROJETO" | "COMUNIDADE" | "";
//   publicName: string;
//   tokenName: string;
//   ticker: string;
//   headline: string;
//   story: string;
//   totalSupply: number;
//   poolPercent: number;
//   faceValue: number;
//   pixData: any; // resposta completa vinda da Celcoin (Charge/Transactions/Pix)
// };

// export async function launchTokenAfterPix(input: LaunchTokenInput) {
//   const LOG = "[launchTokenAfterPix]";

//   // log inicial "sanitizado"
//   console.log(LOG, "▶️ Iniciando lançamento de token", {
//     tokenType: input.tokenType,
//     publicName: input.publicName,
//     tokenName: input.tokenName,
//     ticker: input.ticker,
//     totalSupply: input.totalSupply,
//     poolPercent: input.poolPercent,
//     faceValue: input.faceValue,
//     pixHasCharge: !!input.pixData?.Charge,
//   });

//   try {
//     // 1) Garante usuário autenticado
//     console.log(LOG, "1) Buscando usuário autenticado...");
//     const { data: auth, error: authError } = await supabase.auth.getUser();

//     if (authError || !auth?.user) {
//       console.error(LOG, "❌ auth.getUser falhou", { authError, auth });
//       throw new Error("Você precisa estar logado para lançar o token.");
//     }

//     const authUserId = auth.user.id;
//     console.log(LOG, "✅ Usuário autenticado", { authUserId });

//     // 2) Resolve o user interno (public.users)
//     console.log(LOG, "2) Buscando user interno em public.users...", {
//       authUserId,
//     });

//     const { data: userRow, error: userError } = await supabase
//       .from("users")
//       .select("id")
//       .eq("auth_user_id", authUserId)
//       .single();

//     if (userError || !userRow) {
//       console.error(LOG, "❌ user interno não encontrado", {
//         userError,
//         userRow,
//       });
//       throw new Error(
//         "Perfil interno de usuário não encontrado em public.users. Rode o onboarding de criador antes."
//       );
//     }

//     const userId: string = userRow.id;
//     console.log(LOG, "✅ User interno encontrado", { userId });

//     // 3) Garante o creator (public.creators)
//     console.log(LOG, "3) Buscando/criando perfil de creator...");
//     const { creatorId } = await getOrCreateCreatorProfile();
//     console.log(LOG, "✅ Creator resolvido", { creatorId });

//     // 4) Resolve o tipo de moeda (coin_types)
//     const coinTypeCode =
//       input.tokenType === "COMUNIDADE" ? "COMUNIDADE" : "MEME";

//     console.log(LOG, "4) Buscando coin_type...", { coinTypeCode });

//     const { data: coinType, error: coinTypeError } = await supabase
//       .from("coin_types")
//       .select("id, code")
//       .eq("code", coinTypeCode)
//       .single();

//     if (coinTypeError || !coinType) {
//       console.error(LOG, "❌ coin_type não encontrado", {
//         coinTypeError,
//         coinType,
//       });
//       throw new Error(
//         "Tipo de token não configurado em coin_types. Verifique se MEME / COMUNIDADE existem."
//       );
//     }

//     console.log(LOG, "✅ coin_type OK", { coinTypeId: coinType.id });

//     // 5) Cálculos de supply / pool / bag
//     console.log(LOG, "5) Calculando supply/pool/bag/face...");

//     const totalSupply = Number(input.totalSupply || 0);
//     const poolPercent = Number(input.poolPercent || 0);
//     const faceValue = Number(input.faceValue || 0);

//     console.log(LOG, "🧮 Valores numéricos computados", {
//       totalSupply,
//       poolPercent,
//       faceValue,
//     });

//     if (!totalSupply || !poolPercent || !faceValue) {
//       console.error(LOG, "❌ Configuração inválida de supply/pool/face", {
//         totalSupply,
//         poolPercent,
//         faceValue,
//       });
//       throw new Error("Configuração de supply / pool / face value inválida.");
//     }

//     const poolCoins = (totalSupply * poolPercent) / 100;
//     const bagCoins = totalSupply - poolCoins;
//     const baseReserve = poolCoins * faceValue;

//     console.log(LOG, "✅ Supply calculado", {
//       poolCoins,
//       bagCoins,
//       baseReserve,
//     });

//     // 6) Cria a wallet da pool (wallet_type = 'POOL')
//     console.log(LOG, "6) Criando wallet da pool...");

//     const { data: poolWallet, error: poolWalletError } = await supabase
//       .from("wallets")
//       .insert({
//         wallet_type: "POOL",
//         label: `Pool ${input.ticker || input.tokenName}`,
//         provider: "INTERNAL",
//         balance_base: baseReserve, // liquidez inicial em base
//       })
//       .select("id")
//       .single();

//     if (poolWalletError || !poolWallet) {
//       console.error(LOG, "❌ Erro ao criar wallet da pool", {
//         poolWalletError,
//         poolWallet,
//       });
//       throw new Error(
//         poolWalletError?.message || "Erro ao criar wallet da pool do token."
//       );
//     }

//     console.log(LOG, "✅ Pool wallet criada", { poolWalletId: poolWallet.id });

//     // 7) Tenta achar carteira do criador para o BAG
//     console.log(LOG, "7) Buscando carteira do criador para o BAG...", {
//       userId,
//     });

//     const { data: creatorWallet, error: creatorWalletError } = await supabase
//       .from("wallets")
//       .select("id, wallet_type")
//       .eq("user_id", userId)
//       .in("wallet_type", ["CREATOR_TREASURY", "USER"])
//       .order("wallet_type", { ascending: true }) // CREATOR_TREASURY vem antes de USER
//       .limit(1)
//       .single();

//     if (creatorWalletError) {
//       console.warn(
//         LOG,
//         "⚠️ Nenhuma wallet dedicada do criador encontrada. BAG pode ficar sem destino.",
//         creatorWalletError
//       );
//     } else {
//       console.log(LOG, "✅ Carteira do criador encontrada", {
//         creatorWalletId: creatorWallet?.id,
//         walletType: creatorWallet?.wallet_type,
//       });
//     }

//     // 8) Gera slug da moeda
//     console.log(LOG, "8) Gerando slug da moeda...");

//     const baseSlug =
//       (input.ticker && input.ticker.trim()) ||
//       input.tokenName
//         .toLowerCase()
//         .normalize("NFD")
//         .replace(/[\u0300-\u036f]/g, "")
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/^-+|-+$/g, "");

//     const slug = (baseSlug || crypto.randomUUID().slice(0, 8)).toLowerCase();

//     console.log(LOG, "✅ Slug gerado", { slug, baseSlug });

//     // 9) Disclaimer padrão de risco
//     const RISK_DISCLAIMER =
//       "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.";

//     // 10) Cria a coin
//     console.log(LOG, "10) Inserindo registro em public.coins...");

//     const { data: coin, error: coinError } = await supabase
//       .from("coins")
//       .insert({
//         slug,
//         symbol: input.ticker,
//         name: input.tokenName,
//         creator_id: creatorId,
//         coin_type_id: coinType.id,
//         status: "ACTIVE", // já entra ativa na Arena
//         narrative_short: input.headline,
//         narrative_long: input.story,
//         risk_disclaimer: RISK_DISCLAIMER,
//         supply_max: totalSupply,
//         supply_initial: totalSupply,
//         supply_circulating: poolCoins, // circulação = o que está na pool
//         pool_wallet_id: poolWallet.id,
//       })
//       .select("id")
//       .single();

//     if (coinError || !coin) {
//       console.error(LOG, "❌ Erro ao criar coin", { coinError, coin });
//       throw new Error(coinError?.message || "Erro ao criar registro da moeda.");
//     }

//     const coinId: string = coin.id;
//     console.log(LOG, "✅ Coin criada", { coinId });

//     // 11) Grava saldos iniciais: pool + bag do criador
//     console.log(LOG, "11) Inserindo wallet_balances iniciais...");

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

//     if (balanceRows.length > 0) {
//       const { error: wbError } = await supabase
//         .from("wallet_balances")
//         .insert(balanceRows);
//       if (wbError) {
//         console.error(LOG, "⚠️ Erro ao gravar wallet_balances", wbError);
//       } else {
//         console.log(LOG, "✅ wallet_balances inseridos", {
//           rows: balanceRows.length,
//         });
//       }
//     }

//     // 12) Inicializa o AMM (coin_market_state) com base_reserve / coin_reserve
//     console.log(LOG, "12) Chamando RPC init_coin_market_state...", {
//       coinId,
//       baseReserve,
//       poolCoins,
//     });

//     const { error: ammError } = await supabase.rpc("init_coin_market_state", {
//       p_coin_id: coinId,
//       p_base_reserve: baseReserve.toString(),
//       p_coin_reserve: poolCoins.toString(),
//     });

//     if (ammError) {
//       console.error(LOG, "⚠️ Erro ao inicializar estado de mercado (AMM)", ammError);
//     } else {
//       console.log(LOG, "✅ AMM inicializado com sucesso");
//     }

//     // 13) Registra depósito da taxa via PIX em deposits (PENDING)
//     console.log(LOG, "13) Registrando depósito da taxa PIX (deposits)...");

//     try {
//       const firstTx = input.pixData?.Charge?.Transactions?.[0];
//       const pix = firstTx?.Pix;
//       const ref =
//         pix?.reference ||
//         `charge_${input.pixData?.Charge?.galaxPayId ?? ""}`;
//       const amountBase = firstTx?.value ? firstTx.value / 100 : null;

//       console.log(LOG, "PIX Transaction raw", {
//         hasCharge: !!input.pixData?.Charge,
//         hasTx: !!firstTx,
//         pixRef: pix?.reference,
//         valueCentavos: firstTx?.value,
//         amountBase,
//       });

//       if (amountBase != null) {
//         const { data: platformWallet, error: platformWalletError } =
//           await supabase
//             .from("wallets")
//             .select("id")
//             .eq("wallet_type", "PLATFORM_TREASURY")
//             .eq("is_active", true)
//             .order("created_at", { ascending: true })
//             .limit(1)
//             .single();

//         if (platformWalletError || !platformWallet) {
//           console.error(
//             LOG,
//             "⚠️ Não foi possível localizar wallet PLATFORM_TREASURY para registrar depósito",
//             { platformWalletError, platformWallet }
//           );
//         } else {
//           const { error: depError } = await supabase.from("deposits").insert({
//             wallet_id: platformWallet.id,
//             provider: "CELCOIN",
//             provider_ref: ref,
//             amount_base: amountBase,
//             currency: "BRL",
//             status: "PENDING", // confirmação ainda manual / via webhook
//           });

//           if (depError) {
//             console.error(LOG, "⚠️ Erro ao registrar depósito PIX", depError);
//           } else {
//             console.log(LOG, "✅ Depósito PIX registrado em deposits", {
//               provider_ref: ref,
//               amountBase,
//             });
//           }
//         }
//       } else {
//         console.warn(
//           LOG,
//           "⚠️ Não foi possível inferir amountBase da cobrança PIX. Depósito não registrado."
//         );
//       }
//     } catch (e) {
//       console.warn(LOG, "⚠️ Exceção ao registrar depósito da taxa PIX", e);
//     }

//     // 14) Cria um post de sistema na timeline da moeda
//     console.log(LOG, "14) Criando post de sistema na timeline...");

//     try {
//       const { error: postError } = await supabase.from("posts").insert({
//         coin_id: coinId,
//         author_user_id: userId,
//         kind: "SYSTEM",
//         content: `🚀 Token ${input.tokenName} (${input.ticker}) foi criado na Arena. Este é um experimento de narrativa de alto risco, não uma promessa de retorno.`,
//         is_pinned: true,
//         is_system: true,
//         meta: {
//           tokenType: input.tokenType,
//           totalSupply,
//           poolPercent,
//           faceValue,
//           poolCoins,
//           bagCoins,
//           baseReserve,
//         },
//       });

//       if (postError) {
//         console.error(LOG, "⚠️ Erro ao criar post de sistema", postError);
//       } else {
//         console.log(LOG, "✅ Post de sistema criado com sucesso");
//       }
//     } catch (e) {
//       console.warn(LOG, "⚠️ Exceção ao criar post de sistema", e);
//     }

//     console.log(LOG, "🏁 Lançamento concluído com sucesso", {
//       coinId,
//       slug,
//     });

//     return { coinId, slug };
//   } catch (err: any) {
//     console.error(LOG, "💥 ERRO GERAL NO LANÇAMENTO", {
//       message: err?.message,
//       stack: err?.stack,
//     });
//     throw err;
//   }
// }
// app/lib/launchToken.ts
"use client";

import { supabase } from "../lib/supabaseClient";
import { getOrCreateCreatorProfile } from "./creatorProfile";

export type LaunchTokenInput = {
  tokenType: "PESSOA" | "PROJETO" | "COMUNIDADE" | "";
  publicName: string;
  tokenName: string;
  ticker: string;
  headline: string;
  story: string;
  totalSupply: number;
  poolPercent: number;
  faceValue: number;
  pixData: any; // resposta completa vinda da Celcash/GalaxPay (Charge/Transactions/Pix)
};

export async function launchTokenAfterPix(input: LaunchTokenInput) {
  console.log("[LAUNCH] Iniciando launchTokenAfterPix", {
    tokenType: input.tokenType,
    publicName: input.publicName,
    tokenName: input.tokenName,
    ticker: input.ticker,
    totalSupply: input.totalSupply,
    poolPercent: input.poolPercent,
    faceValue: input.faceValue,
  });

  // 1) Garante usuário autenticado (auth.users)
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    console.error("[LAUNCH] Usuário não autenticado:", authError);
    throw new Error("Você precisa estar logado para lançar o token.");
  }

  const authUserId = auth.user.id;
  console.log("[LAUNCH] Usuário autenticado:", { authUserId });

  // 2) Garante perfil interno em public.users (cria se não existir)
  console.log("[LAUNCH] Verificando perfil em public.users para", authUserId);

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .limit(1);

  if (usersError) {
    console.error("[LAUNCH] Erro ao buscar public.users:", usersError);
    throw new Error(
      "Erro ao carregar seu perfil interno. Tente novamente em alguns instantes."
    );
  }

  let userId: string;

  if (usersData && usersData.length > 0) {
    userId = usersData[0].id;
    console.log("[LAUNCH] Perfil em public.users já existe:", { userId });
  } else {
    console.log(
      "[LAUNCH] Nenhum perfil em public.users encontrado. Criando automaticamente..."
    );

    const displayName =
      (auth.user.user_metadata as any)?.full_name ||
      auth.user.email?.split("@")[0] ||
      null;

    const usernameBase =
      (auth.user.user_metadata as any)?.user_name ||
      auth.user.email?.split("@")[0] ||
      `user_${authUserId.slice(0, 8)}`;

    const { data: newUser, error: newUserError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        role: "CREATOR",
        display_name: displayName,
        username: usernameBase,
      })
      .select("id")
      .single();

    if (newUserError || !newUser) {
      console.error("[LAUNCH] Erro ao criar public.users:", newUserError);
      throw new Error(
        "Não foi possível criar seu perfil interno. Tente novamente."
      );
    }

    userId = newUser.id;
    console.log("[LAUNCH] Perfil interno criado em public.users:", { userId });
  }

  // 3) Garante o creator (public.creators)
  console.log("[LAUNCH] Resolvendo perfil de creator...");
  const { creatorId } = await getOrCreateCreatorProfile();
  console.log("[LAUNCH] Creator resolvido:", { creatorId });

  // 4) Resolve o tipo de moeda (coin_types)
  const coinTypeCode =
    input.tokenType === "COMUNIDADE" ? "COMUNIDADE" : "MEME";

  console.log("[LAUNCH] Buscando coin_types para", coinTypeCode);

  const { data: coinType, error: coinTypeError } = await supabase
    .from("coin_types")
    .select("id, code")
    .eq("code", coinTypeCode)
    .single();

  if (coinTypeError || !coinType) {
    console.error("[LAUNCH] Erro ao buscar coin_types:", coinTypeError);
    throw new Error(
      "Tipo de token não configurado em coin_types. Verifique se MEME / COMUNIDADE existem."
    );
  }

  // 5) Cálculos de supply / pool / face
  const totalSupply = Number(input.totalSupply || 0);
  const poolPercent = Number(input.poolPercent || 0);
  const faceValue = Number(input.faceValue || 0);

  console.log("[LAUNCH] Configuração econômica recebida:", {
    totalSupply,
    poolPercent,
    faceValue,
  });

  if (!totalSupply || !poolPercent || !faceValue) {
    console.error("[LAUNCH] Configuração de supply/pool/face inválida.", {
      totalSupply,
      poolPercent,
      faceValue,
    });
    throw new Error("Configuração de supply / pool / face value inválida.");
  }

  const poolCoins = (totalSupply * poolPercent) / 100;
  const bagCoins = totalSupply - poolCoins;
  const baseReserve = poolCoins * faceValue;

  console.log("[LAUNCH] Cálculos do modelo econômico:", {
    poolCoins,
    bagCoins,
    baseReserve,
  });

  // 6) Cria a wallet da pool (wallet_type = 'POOL')
  console.log("[LAUNCH] Criando wallet da pool...");

  const { data: poolWallet, error: poolWalletError } = await supabase
    .from("wallets")
    .insert({
      wallet_type: "POOL",
      label: `Pool ${input.ticker || input.tokenName}`,
      provider: "INTERNAL",
      balance_base: baseReserve, // liquidez inicial em base
    })
    .select("id")
    .single();

  if (poolWalletError || !poolWallet) {
    console.error("[LAUNCH] Erro ao criar wallet da pool:", poolWalletError);
    throw new Error(
      poolWalletError?.message || "Erro ao criar wallet da pool do token."
    );
  }

  console.log("[LAUNCH] Wallet da pool criada:", { poolWalletId: poolWallet.id });

  // 7) Tenta achar carteira do criador para o BAG
  console.log("[LAUNCH] Buscando wallet do criador para o BAG...");

  const { data: creatorWallet, error: creatorWalletError } = await supabase
    .from("wallets")
    .select("id, wallet_type")
    .eq("user_id", userId)
    .in("wallet_type", ["CREATOR_TREASURY", "USER"])
    .order("wallet_type", { ascending: true }) // CREATOR_TREASURY vem antes de USER
    .limit(1)
    .single();

  if (creatorWalletError) {
    console.warn(
      "[LAUNCH] Nenhuma wallet dedicada do criador encontrada. BAG não terá destino explícito.",
      creatorWalletError
    );
  } else {
    console.log("[LAUNCH] Wallet do criador encontrada:", creatorWallet);
  }

  // 8) Gera slug da moeda
  const baseSlug =
    (input.ticker && input.ticker.trim()) ||
    input.tokenName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const slug = (baseSlug || crypto.randomUUID().slice(0, 8)).toLowerCase();

  console.log("[LAUNCH] Slug gerado para a moeda:", { slug });

  // 9) Disclaimer padrão de risco
  const RISK_DISCLAIMER =
    "Este token é um experimento especulativo de narrativa. Não é investimento seguro, não é produto financeiro regulado, não tem garantia de retorno. Você pode perder 100% do valor colocado aqui. Ao usar o 3ustaquio, você declara que entende que isso é jogo de alto risco e age por conta própria.";

  // 10) Cria a coin
  console.log("[LAUNCH] Inserindo registro em public.coins...");

  const { data: coin, error: coinError } = await supabase
    .from("coins")
    .insert({
      slug,
      symbol: input.ticker,
      name: input.tokenName,
      creator_id: creatorId,
      coin_type_id: coinType.id,
      status: "ACTIVE", // se quiser draft, trocar para 'DRAFT'
      narrative_short: input.headline,
      narrative_long: input.story,
      risk_disclaimer: RISK_DISCLAIMER,
      supply_max: totalSupply,
      supply_initial: totalSupply,
      supply_circulating: poolCoins, // circulação = o que está na pool
      pool_wallet_id: poolWallet.id,
    })
    .select("id")
    .single();

  if (coinError || !coin) {
    console.error("[LAUNCH] Erro ao criar registro da moeda:", coinError);
    throw new Error(coinError?.message || "Erro ao criar registro da moeda.");
  }

  const coinId: string = coin.id;
  console.log("[LAUNCH] Moeda criada em public.coins:", { coinId });

  // 11) Grava saldos iniciais: pool + bag do criador
  console.log("[LAUNCH] Gravando saldos iniciais em wallet_balances...");

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

  if (balanceRows.length > 0) {
    const { error: wbError } = await supabase
      .from("wallet_balances")
      .insert(balanceRows);
    if (wbError) {
      console.error("[LAUNCH] Erro ao gravar wallet_balances:", wbError);
    } else {
      console.log("[LAUNCH] wallet_balances inseridos com sucesso.");
    }
  }

  // 12) Inicializa o AMM (coin_market_state) com base_reserve / coin_reserve
  console.log("[LAUNCH] Inicializando estado de mercado (AMM)...", {
    coinId,
    baseReserve,
    poolCoins,
  });

  const { error: ammError } = await supabase.rpc("init_coin_market_state", {
    p_coin_id: coinId,
    p_base_reserve: baseReserve.toString(),
    p_coin_reserve: poolCoins.toString(),
  });

  if (ammError) {
    console.error(
      "[LAUNCH] Erro ao inicializar estado de mercado (AMM):",
      ammError
    );
  } else {
    console.log("[LAUNCH] Estado de mercado (AMM) inicializado.");
  }

  // 13) Registra depósito da taxa via PIX em deposits (PENDING)
  console.log("[LAUNCH] Registrando depósito da taxa PIX em deposits...");

  try {
    const firstTx = input.pixData?.Charge?.Transactions?.[0];
    const pix = firstTx?.Pix;
    const ref =
      pix?.reference ||
      `charge_${input.pixData?.Charge?.galaxPayId ?? ""}`;
    const amountBase = firstTx?.value ? firstTx.value / 100 : null; // valor em BRL convertendo de centavos

    console.log("[LAUNCH] Parsed PIX transaction:", {
      reference: ref,
      rawValue: firstTx?.value,
      amountBase,
    });

    if (amountBase != null) {
      const { data: platformWallet, error: platformWalletError } =
        await supabase
          .from("wallets")
          .select("id")
          .eq("wallet_type", "PLATFORM_TREASURY")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

      if (platformWalletError || !platformWallet) {
        console.warn(
          "[LAUNCH] Não foi possível localizar wallet PLATFORM_TREASURY:",
          platformWalletError
        );
      } else {
        const { error: depError } = await supabase.from("deposits").insert({
          wallet_id: platformWallet.id,
          provider: "CELCOIN", // rótulo interno; pode renomear para CELCASH/GALAXPAY se quiser
          provider_ref: ref,
          amount_base: amountBase,
          currency: "BRL",
          status: "PENDING", // confirmação ainda manual / via webhook
        });

        if (depError) {
          console.error("[LAUNCH] Erro ao registrar depósito PIX:", depError);
        } else {
          console.log("[LAUNCH] Depósito PIX registrado em deposits.");
        }
      }
    } else {
      console.warn(
        "[LAUNCH] amountBase nulo ao tentar registrar depósito PIX. PixData:",
        input.pixData
      );
    }
  } catch (e) {
    console.warn("[LAUNCH] Não foi possível registrar depósito da taxa PIX:", e);
  }

  // 14) Cria um post de sistema na timeline da moeda
  console.log("[LAUNCH] Criando post de sistema na timeline da moeda...");

  try {
    const { error: postError } = await supabase.from("posts").insert({
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
      },
    });

    if (postError) {
      console.error(
        "[LAUNCH] Não foi possível criar post de sistema para a moeda:",
        postError
      );
    } else {
      console.log("[LAUNCH] Post de sistema criado para a moeda.");
    }
  } catch (e) {
    console.warn(
      "[LAUNCH] Exceção ao tentar criar post de sistema para a moeda:",
      e
    );
  }

  console.log("[LAUNCH] Token criado com sucesso. Retornando coinId e slug.", {
    coinId,
    slug,
  });

  return { coinId, slug };
}
