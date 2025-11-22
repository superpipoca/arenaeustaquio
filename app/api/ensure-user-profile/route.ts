import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { userId } = await auth(); // padrão App Router :contentReference[oaicite:0]{index=0}

    if (!userId) {
      return NextResponse.json({ error: "NOT_AUTH" }, { status: 401 });
    }

    // TODO: cria/garante perfil no banco aqui

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[ensure-user-profile] server error:", err);
    return NextResponse.json(
      { error: "SERVER_FAIL", message: err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
