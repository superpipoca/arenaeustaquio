import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

// se você usa supabase admin/service role, importa aqui
// import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "NOT_AUTH" }, { status: 401 });
  }

  const user = await currentUser();

  // ✅ aqui você garante/cria o perfil no seu banco
  // Exemplo (pseudo):
  // const { data } = await supabaseAdmin
  //   .from("users")
  //   .select("id")
  //   .eq("clerk_user_id", userId)
  //   .maybeSingle();
  //
  // if (!data) {
  //   await supabaseAdmin.from("users").insert({
  //     clerk_user_id: userId,
  //     email: user?.primaryEmailAddress?.emailAddress,
  //     first_name: user?.firstName,
  //     last_name: user?.lastName,
  //   });
  // }

  return NextResponse.json({ ok: true });
}
