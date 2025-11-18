"use client";

// import { supabaseClient } from "./supabaseClient";
import { SupabaseClient } from "@supabase/supabase-js";

export type CreatorProfile = {
  userId: string;
  creatorId: string;
};

function buildHandleFromName(nameOrEmail: string | null): string {
  const base =
    (nameOrEmail || "criador")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "") || "criador";

  return `@${base.slice(0, 15)}`;
}

export async function getOrCreateCreatorProfile(): Promise<CreatorProfile> {
  const supabase = SupabaseClient as any;

  // 1) Usuário autenticado (auth.users)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Usuário não autenticado");

  const authUserId = user.id as string;
  const email = (user.email as string | null) ?? null;
  const meta = (user.user_metadata as any) || {};
  const metaName =
    meta.full_name || meta.name || meta.username || null;

  // 2) Linha em public.users
  let { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("id, role, display_name")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (dbUserError) throw dbUserError;

  if (!dbUser) {
    const displayName =
      metaName ||
      email?.split("@")[0] ||
      "Criador sem nome";

    const { data: newUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        role: "CREATOR",
        display_name: displayName,
      })
      .select("id, role, display_name")
      .single();

    if (insertUserError) throw insertUserError;
    dbUser = newUser;
  } else if (dbUser.role !== "CREATOR") {
    // garante que o cara é CREATOR na jornada do criador
    const { error: updateRoleError } = await supabase
      .from("users")
      .update({ role: "CREATOR" })
      .eq("id", dbUser.id);

    if (updateRoleError) throw updateRoleError;
  }

  // 3) Linha em public.creators
  let { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", dbUser.id)
    .maybeSingle();

  if (creatorError) throw creatorError;

  if (!creator) {
    const handle = buildHandleFromName(dbUser.display_name || email);
    const { data: newCreator, error: newCreatorError } = await supabase
      .from("creators")
      .insert({
        user_id: dbUser.id,
        handle,
      })
      .select("id")
      .single();

    if (newCreatorError) throw newCreatorError;
    creator = newCreator;
  }

  return {
    userId: dbUser.id,
    creatorId: creator.id,
  };
}
