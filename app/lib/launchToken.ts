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
// app/lib/launchToken.ts (CLIENT-SIDE)

type TokenType = "PESSOA" | "PROJETO" | "COMUNIDADE" | "";

export type LaunchTokenAfterPixPayload = {
  clerkToken: string;        // ✅ vem do getToken()
  tokenType: TokenType;
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

export type LaunchTokenAfterPixResponse = {
  coinId: string;
  slug: string;
};

export async function launchTokenAfterPix(
  payload: LaunchTokenAfterPixPayload
): Promise<LaunchTokenAfterPixResponse> {
  const { clerkToken, ...body } = payload;

  // console.log("clerkToken " + clerkToken);

  if (!clerkToken) {
    throw new Error("clerkToken ausente. Faça login novamente.");
  }

  const res = await fetch("/api/launch-token-after-pix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clerkToken}`, // ✅ pulo do gato
    },
    body: JSON.stringify(body),
  });

  console.log("retorno do pix " + JSON.stringify(res));

  if (!res.ok) {
    // tenta ler erro JSON primeiro, depois texto
    let msg = "";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        msg = j?.message || j?.error || JSON.stringify(j);
      } else {
        msg = await res.text();
      }
    } catch {}

    throw new Error(msg || `Erro ${res.status} ao lançar token.`);
  }

  return res.json();
}
