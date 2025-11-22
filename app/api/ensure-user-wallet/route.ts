// import { NextResponse } from "next/server";
// import { auth, clerkClient } from "@clerk/nextjs/server";
// import { createClient } from "@supabase/supabase-js";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// // ✅ Helper de Timeout genérico
// function withTimeout<T>(p: PromiseLike<T>, ms = 6000): Promise<T> {
//   return new Promise<T>((resolve, reject) => {
//     const timer = setTimeout(() => reject(new Error("timeout")), ms);
//     p.then(
//       (value) => {
//         clearTimeout(timer);
//         resolve(value);
//       },
//       (err) => {
//         clearTimeout(timer);
//         reject(err);
//       }
//     );
//   });
// }

// export async function POST() {
//   try {
//     // 1. Autenticação (Clerk v5+)
//     const { userId } = await auth();
    
//     if (!userId) {
//       return NextResponse.json({ error: "unauthorized" }, { status: 401 });
//     }

//     // 2. Instanciar o cliente (AQUI ERA O ERRO COMUM)
//     // clerkClient agora deve ser aguardado
//     const client = await clerkClient();
//     const user = await client.users.getUser(userId);

//     // 3. Extrair dados do usuário
//     const primaryEmail =
//       user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
//         ?.emailAddress ||
//       user.emailAddresses?.[0]?.emailAddress ||
//       null;

//     if (!primaryEmail) {
//       return NextResponse.json({ error: "no_email" }, { status: 400 });
//     }

//     // Sanitiza username
//     const baseUsername =
//       primaryEmail
//         .split("@")[0]
//         .replace(/[^a-zA-Z0-9._-]/g, "")
//         .slice(0, 30) || "user";

//     const fullName =
//       [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || baseUsername;

//     // 4. Configurar Supabase Admin
//     const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
//     const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

//     if (!SUPABASE_URL || !SERVICE_ROLE) {
//       console.error("[ensure-user-wallet] Env vars missing");
//       // Retornamos 200 com erro lógico para não quebrar o frontend, mas logamos o erro crítico
//       return NextResponse.json({ ok: false, error: "server_config_error" }, { status: 200 });
//     }

//     const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
//       auth: { persistSession: false },
//     });

//     // 5. Preparar a chamada RPC
//     const rpcThenable = supabaseAdmin.rpc("rpc_create_user_and_wallet", {
//       p_username: baseUsername,
//       p_display_name: fullName,
//       p_avatar_url: user.imageUrl ?? null,
//       p_bio: null,
//       p_role: "CREATOR",
//     });

//     // 6. Executar com Timeout
//     // O tipo do retorno do RPC do Supabase é inferido aqui
//     const { data, error } = await withTimeout(rpcThenable, 6000);

//     if (error) {
//       console.error("[ensure-user-wallet] RPC failed:", error);
//       // Retorna 200 com ok:false para o front seguir a vida (login não pode travar por causa disso)
//       return NextResponse.json({ ok: false, error: error.message || "rpc_failed" }, { status: 200 });
//     }

//     return NextResponse.json({ ok: true, data });

//   } catch (err: any) {
//     if (err?.message === "timeout") {
//       console.warn("[ensure-user-wallet] Timed out - processing in background");
//       return NextResponse.json({ ok: true, pending: true }, { status: 202 });
//     }

//     console.error("[ensure-user-wallet] Unexpected error:", err);
//     return NextResponse.json({ ok: false, error: "unexpected" }, { status: 200 });
//   }
// }
// app/api/ensure-user-wallet/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RpcResult = {
  user_id?: string;
  wallet_id?: string;
  // ajuste se sua RPC retorna mais campos
};

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";

const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Timeout hard — não cancela o RPC, só evita travar request
function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error("timeout")), ms)
    ),
  ]);
}

function json(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST() {
  try {
    // 1) Auth Clerk
    const { userId } = auth();
    if (!userId) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    // 2) Clerk backend client (v5+)
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const primaryEmail =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      null;

    if (!primaryEmail) {
      return json({ ok: false, error: "no_email" }, 400);
    }

    const baseUsername =
      primaryEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .slice(0, 30) || "user";

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      baseUsername;

    // 3) Env check (aqui é erro real de server)
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("[ensure-user-wallet] missing env", {
        hasUrl: !!SUPABASE_URL,
        hasServiceRole: !!SERVICE_ROLE,
      });
      return json({ ok: false, error: "server_config_error" }, 500);
    }

    // 4) Supabase admin
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
      global: { fetch },
    });

    const payload = {
      p_username: baseUsername,
      p_display_name: fullName,
      p_avatar_url: user.imageUrl ?? null,
      p_bio: null,
      p_role: "CREATOR",
    };

    /**
     * 5) IMPORTANTÍSSIMO:
     * rpc() retorna um PostgrestBuilder (thenable).
     * Forço virar Promise "de verdade" com .then(r => r)
     * pra evitar bug de typing + timeout.
     */
    const rpcPromise = supabaseAdmin
      .rpc("rpc_create_user_and_wallet", payload)
      .then((r) => r) as Promise<{
        data: RpcResult | null;
        error: PostgrestError | null;
      }>;

    const { data, error } = await withTimeout(rpcPromise, 6000);

    // 6) Erros de RPC
    if (error) {
      const msg = (error.message || "").toLowerCase();

      // idempotência / já existe => não quebra login
      const duplicate =
        error.code === "23505" ||
        msg.includes("duplicate") ||
        msg.includes("already exists");

      if (duplicate) {
        return json({ ok: true, alreadyExists: true });
      }

      console.error("[ensure-user-wallet] rpc error:", error);
      return json({
        ok: false,
        error: "rpc_failed",
        detail: error.message,
        code: error.code,
      });
    }

    return json({ ok: true, data });

  } catch (err: any) {
    if (err?.message === "timeout") {
      console.warn("[ensure-user-wallet] timeout");
      // não travar jornada por causa de wallet
      return json({ ok: true, pending: true }, 202);
    }

    console.error("[ensure-user-wallet] unexpected:", err);
    return json({
      ok: false,
      error: "unexpected",
      detail: err?.message ?? String(err),
    });
  }
}
