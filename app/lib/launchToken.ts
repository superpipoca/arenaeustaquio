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
};

export async function launchTokenAfterPix(input: LaunchTokenInput) {
  console.log("[LAUNCH] Chamando /api/launch-token-after-pix", input);

  const res = await fetch("/api/launch-token-after-pix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let body: any = null;
  let rawText: string | null = null;

  try {
    rawText = await res.text();
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
    throw new Error(code);
  }

  return body as { coinId: string; slug: string };
}
