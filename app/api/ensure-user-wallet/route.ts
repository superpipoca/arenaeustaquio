// app/api/ensure-user-wallet/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ aceita PromiseLike (thenable) — supabase.rpc retorna Postgrest*Builder, não Promise real
function withTimeout<T>(p: PromiseLike<T>, ms = 6000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function POST() {
  try {
    // ✅ padrão recomendado no App Router: auth() é async
    const { userId, isAuthenticated } = await auth(); :contentReference[oaicite:0]{index=0}
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);

    // ✅ usa primaryEmail primeiro
    const primaryEmail =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null;

    if (!primaryEmail) {
      return NextResponse.json({ error: "no_email" }, { status: 400 });
    }

    const baseUsername =
      primaryEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .slice(0, 30) || null;

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null;

    const SUPABASE_URL =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("[ensure-user-wallet] missing envs");
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // ✅ rpc() retorna builder thenable (PromiseLike)
    const rpcThenable = supabaseAdmin.rpc("rpc_create_user_and_wallet", { :contentReference[oaicite:1]{index=1}
      p_username: baseUsername,
      p_display_name: fullName ?? baseUsername,
      p_avatar_url: user.imageUrl ?? null,
      p_bio: null,
      p_role: "CREATOR",
    });

    // ✅ timeout pra rota nunca pendurar o login
    const { data, error } = await withTimeout(rpcThenable, 6000);

    if (error) {
      console.error("[ensure-user-wallet] rpc error:", error);
      // não bloqueia onboarding
      return NextResponse.json({ ok: false, error: "rpc_failed" }, { status: 200 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    if (err?.message === "timeout") {
      // ✅ dá ok/pending pra não travar UX
      return NextResponse.json({ ok: true, pending: true }, { status: 202 });
    }

    console.error("[ensure-user-wallet] unexpected:", err);
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 200 });
  }
}
