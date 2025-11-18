// app/lib/creatorProfile.ts
"use client";

import { supabase } from "./supabaseClient";

/**
 * Garante que exista um registro em `public.users` e `public.creators`
 * para o usuário logado.
 *
 * - Se não estiver logado -> lança erro "NOT_AUTH".
 * - Se já existir user/creator -> só retorna os ids.
 * - Se não existir -> cria user (role CREATOR) + creator.
 */
export async function getOrCreateCreatorProfile() {
  // 1. Pega usuário autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("NOT_AUTH");
  }

  const authUserId = user.id;

  // 2. Garante que existe linha em public.users
  const { data: existingUsers, error: userSelectError } = await supabase
    .from("users")
    .select("id, role, username")
    .eq("auth_user_id", authUserId)
    .limit(1);

  if (userSelectError) {
    console.error("Erro ao buscar user:", userSelectError);
    throw userSelectError;
  }

  let userId: string;

  if (existingUsers && existingUsers.length > 0) {
    const existing = existingUsers[0];
    userId = existing.id;

    // Se não for CREATOR, promove
    if (existing.role !== "CREATOR") {
      const { error: updateRoleError } = await supabase
        .from("users")
        .update({
          role: "CREATOR",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateRoleError) {
        console.error("Erro ao atualizar role do user:", updateRoleError);
        throw updateRoleError;
      }
    }
  } else {
    // Cria novo user com role CREATOR
    const suggestedUsername =
      (user.user_metadata as any)?.username ||
      user.email?.split("@")[0] ||
      `user_${authUserId.slice(0, 6)}`;

    const displayName =
      (user.user_metadata as any)?.full_name || user.email || suggestedUsername;

    const avatarUrl = (user.user_metadata as any)?.avatar_url ?? null;

    const { data: insertedUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        role: "CREATOR",
        username: suggestedUsername,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select("id")
      .single();

    if (insertUserError) {
      console.error("Erro ao criar user:", insertUserError);
      throw insertUserError;
    }

    userId = insertedUser.id;
  }

  // 3. Garante que existe linha em public.creators
  const { data: existingCreators, error: creatorsSelectError } = await supabase
    .from("creators")
    .select("id, handle")
    .eq("user_id", userId)
    .limit(1);

  if (creatorsSelectError) {
    console.error("Erro ao buscar creator:", creatorsSelectError);
    throw creatorsSelectError;
  }

  let creatorId: string;

  if (existingCreators && existingCreators.length > 0) {
    creatorId = existingCreators[0].id;
  } else {
    // Gera handle @username simples
    const baseHandle =
      (user.user_metadata as any)?.username ||
      user.email?.split("@")[0] ||
      `user_${authUserId.slice(0, 6)}`;

    const normalized = baseHandle
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);

    const handle = `@${normalized || `user_${authUserId.slice(0, 6)}`}`;

    const { data: insertedCreator, error: insertCreatorError } = await supabase
      .from("creators")
      .insert({
        user_id: userId,
        handle,
      })
      .select("id, handle")
      .single();

    if (insertCreatorError) {
      console.error("Erro ao criar creator:", insertCreatorError);
      throw insertCreatorError;
    }

    creatorId = insertedCreator.id;
  }

  return { userId, creatorId };
}
