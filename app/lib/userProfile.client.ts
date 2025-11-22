export async function getOrCreateUserProfile() {
  const res = await fetch("/api/ensure-user-profile", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body?.error === "NOT_AUTH") {
      const err: any = new Error("NOT_AUTH");
      throw err;
    }
    throw new Error("PROFILE_FAIL");
  }

  return res.json();
}
