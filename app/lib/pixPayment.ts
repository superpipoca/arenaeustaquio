// app/lib/pixPayment.ts
"use client";

const WORKER_URL =
  "https://pagamento-cellcoin.brenel-marinho.workers.dev/";

export type PixChargeResponse = any;

type CreatePixChargeParams = {
  value: number; // valor em BRL, ex: 129.99
  cpf: string;
  name: string;
  email?: string;
  description?: string; // vai para additionalInfo / instructions
  // Se quiser, depois podemos plugar phones/address aqui
};

function makeMyId(prefix: string = "pay"): string {
  const rand = Math.random().toString(16).slice(2, 10);
  const ts = Date.now().toString(16);
  return `${prefix}-${rand}${ts}`;
}

export async function createPixCharge({
  value,
  cpf,
  name,
  email,
  description,
}: CreatePixChargeParams): Promise<PixChargeResponse> {
  // tira tudo que não é dígito do CPF
  const cleanCpf = cpf.replace(/\D/g, "");

  // A doc do exemplo usa 12999 para 129,99 -> centavos
  const valueInCents = Math.round(value * 100);

  // payday no formato AAAA-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  const desc =
    description ?? "Taxa de criação de token na plataforma 3ustaquio";

  // Monta o payload no formato exigido pela API, mantendo só PaymentMethodPix
  const payload = {
    myId: makeMyId("pay"),
    value: valueInCents,
    additionalInfo: desc,
    payday: today,
    payedOutsideGalaxPay: false,
    // para PIX usamos "pix" aqui
    mainPaymentMethodId: "pix",

    Customer: {
      myId: makeMyId("cust"),
      // galaxPayId é opcional no exemplo, podemos omitir por enquanto
      name,
      document: cleanCpf,
      emails: email ? [email] : [],
      // phones e Address podem ser plugados depois, se você quiser
      // phones: [],
      // Address: { ... }
    },

    PaymentMethodPix: {
      fine: 0, // multa em centavos (ajusta se quiser usar)
      interest: 0, // juros em centavos
      instructions: desc,
      Deadline: {
        type: "days", // ou "minutes", depende da sua config
        value: 1, // expira em 1 dia
      },
    },
  };

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    // tenta decodificar o erro que o Worker/Celcoin mandou
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) {
        if (typeof parsed.error === "string") {
          try {
            const inner = JSON.parse(parsed.error);
            throw new Error(
              inner?.error?.message ||
                JSON.stringify(inner?.error || inner)
            );
          } catch {
            throw new Error(parsed.error);
          }
        } else {
          throw new Error(
            parsed.error.message || JSON.stringify(parsed.error)
          );
        }
      }
    } catch {
      throw new Error(text || "Erro ao gerar cobrança PIX");
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as any;
  }
}
