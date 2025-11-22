// "use client";

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
//   pixData: any;
//   clerkToken?: string;
// };

// type LaunchTokenResponse = { coinId: string; slug: string };

// export async function launchTokenAfterPix(
//   input: LaunchTokenInput
// ): Promise<LaunchTokenResponse> {
//   console.log("[LAUNCH] Chamando /api/launch-token-after-pix", input);

//   const res = await fetch("/api/launch-token-after-pix", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...(input.clerkToken
//         ? { Authorization: `Bearer ${input.clerkToken}` }
//         : {}),
//     },
//     body: JSON.stringify(input),
//   });

//   // ✅ tenta json, se falhar pega texto cru (html/empty)
//   let body: any = null;
//   let rawText: string | null = null;

//   try {
//     body = await res.json();
//   } catch {
//     try {
//       rawText = await res.text();
//     } catch {
//       rawText = null;
//     }
//   }

//   if (!res.ok) {
//     console.error("[LAUNCH] Falha ao lançar token:", {
//       status: res.status,
//       body,
//       rawText,
//     });

//     const code = body?.code || `LAUNCH_FAIL_${res.status}`;
//     const msg =
//       body?.message ||
//       rawText ||
//       "Erro interno ao lançar o token. Veja logs do server.";

//     const err = new Error(code);
//     (err as any).detail = msg;
//     throw err;
//   }

//   return body as LaunchTokenResponse;
// }
// app/lib/launchToken.ts
// app/lib/launchToken.ts
"use client";

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
  pixData: any;
  clerkToken?: string; // vindo do getToken()
};

type LaunchTokenResult = { coinId: string; slug: string };

export async function launchTokenAfterPix(
  input: LaunchTokenInput
): Promise<LaunchTokenResult> {
  console.log("[LAUNCH] Chamando /api/launch-token-after-pix", input);

  const res = await fetch("/api/launch-token-after-pix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.clerkToken
        ? { Authorization: `Bearer ${input.clerkToken}` }
        : {}),
    },
    credentials: "include", // garante cookie de sessão também
    body: JSON.stringify(input),
  });

  const rawText = await res.text();
  let body: any = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    console.error("[LAUNCH] Falha ao lançar token:", {
      status: res.status,
      body,
      rawText,
    });

    const code = body?.error || `LAUNCH_FAIL_${res.status}`;
    const msg =
      body?.message ||
      body?.long_message ||
      "Falha ao lançar token. Tente novamente.";

    const err = new Error(code);
    (err as any).status = res.status;
    (err as any).body = body;
    (err as any).message = msg;
    throw err;
  }

  return body as LaunchTokenResult;
}
