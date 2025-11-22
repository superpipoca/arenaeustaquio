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
import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 🔑 1) Pegar userId da requisição (cookies + Authorization header)
    const { userId } = getAuth(req);

    if (!userId) {
      // Aqui só cai se REALMENTE não tiver sessão válida
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // 👤 2) Buscar usuário na Clerk
    const user = await clerkClient.users.getUser(userId);

    const primaryEmail =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      null;

    if (!primaryEmail) {
      return NextResponse.json(
        { ok: false, error: "no_email" },
        { status: 400 }
      );
    }

    // 🧾 3) Montar username / display
    const baseUsername =
      primaryEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .slice(0, 30) || "user";

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      baseUsername;

    // 🗄️ 4) Supabase Admin
    const SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("[ensure-user-wallet] missing env vars");
      return NextResponse.json(
        { ok: false, error: "server_config_error" },
        { status: 200 } // não quebra o login, só avisa
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // 5) Chama RPC que cria user + wallet
    const { data, error } = await supabaseAdmin.rpc(
      "rpc_create_user_and_wallet",
      {
        p_username: baseUsername,
        p_display_name: fullName,
        p_avatar_url: user.imageUrl ?? null,
        p_bio: null,
        p_role: "CREATOR",
      }
    );

    if (error) {
      console.error("[ensure-user-wallet] rpc failed:", error);
      return NextResponse.json(
        { ok: false, error: error.message ?? "rpc_failed" },
        { status: 200 }
      );
    }

    // ✅ Sucesso
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    console.error("[ensure-user-wallet] unexpected:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected" },
      { status: 200 }
    );
  }
}
