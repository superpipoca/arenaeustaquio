// app/lib/userProfile.client.ts
export async function getOrCreateUserProfile() {
  const res = await fetch("/api/ensure-user-profile", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
  });

  const text = await res.text(); // pega qualquer coisa: json, html, vazio…

  if (!res.ok) {
    // tenta parsear como json só se der
    let body: any = null;
    try { body = JSON.parse(text); } catch {}

    console.error("[ensure-user-profile] status:", res.status, "body:", body ?? text);

    if (body?.error === "NOT_AUTH") {
      const err: any = new Error("NOT_AUTH");
      throw err;
    }

    throw new Error(`PROFILE_FAIL_${res.status}`);
  }

  // se ok, tenta json; se não for json, só retorna ok
  try { return JSON.parse(text); } catch { return { ok: true }; }
}
