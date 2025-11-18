// app/lib/pixPayment.ts
"use client";

const WORKER_URL =
  "https://pagamento-cellcoin.brenel-marinho.workers.dev/";

// Tipo bem aberto pra não travar o TS. Depois você pode refinar.
export type PixChargeResponse = any;

type CreatePixChargeParams = {
  value: number; // valor em BRL (ex: 19.9)
  cpf: string;
  name: string;
  email?: string;
  description?: string;
  metadata?: Record<string, any>;
};

export async function createPixCharge({
  value,
  cpf,
  name,
  email,
  description,
  metadata,
}: CreatePixChargeParams): Promise<PixChargeResponse> {
  // tira tudo que não é dígito
  const cleanCpf = cpf.replace(/\D/g, "");

  const payload = {
    value,
    description: description ?? "Taxa de criação de token 3ustaquio",
    Customer: {
      document: cleanCpf,
      documentType: "CPF",
      name,
      emails: email ? [email] : [],
    },
    metadata: metadata ?? {},
  };

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erro ao gerar cobrança PIX");
  }

  return res.json();
}
