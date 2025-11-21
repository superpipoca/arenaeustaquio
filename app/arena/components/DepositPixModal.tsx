"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { X, QrCode, Copy, Loader2, Zap } from "lucide-react";
import styles from "./PixDepositModal.module.css";

type DepositPixModalProps = {
  open: boolean;
  onClose: () => void;
  suggestedAmount?: number;
  minAmount?: number;
  onPaid?: () => Promise<void> | void;
};

type PixGatewayResp = any; // pode vir no formato Celcoin completo

const safeParse = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");

// extractor simples pra Edge (texto puro / json)
const extractInvokeErrorMessage = (error: any): string | null => {
  if (!error) return null;

  const bodyCandidates = [
    error?.context?.responseText,
    error?.context?.body,
    error?.body,
    error?.details,
    error?.cause,
  ];

  for (const cand of bodyCandidates) {
    if (!cand) continue;

    if (typeof cand === "string" && cand.trim()) return cand.trim();

    if (typeof cand === "object") {
      const msg = cand?.error || cand?.message;
      if (msg) return String(msg);
    }
  }

  return error?.message || null;
};

export function DepositPixModal({
  open,
  onClose,
  suggestedAmount = 0,
  minAmount = 5,
  onPaid,
}: DepositPixModalProps) {
  const [step, setStep] = useState<"REVIEW" | "PIX">("REVIEW");

  // valor
  const [amountInput, setAmountInput] = useState(
    suggestedAmount > 0 ? String(suggestedAmount.toFixed(2)) : "50"
  );

  // pagador
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  // pix
  const [generating, setGenerating] = useState(false);
  const [pixData, setPixData] = useState<PixGatewayResp | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const amount = useMemo(() => safeParse(amountInput), [amountInput]);
  const canCreate = amount >= minAmount;

  // tenta puxar email + nome do user logado
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadUser() {
      setLoadingUser(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !data?.user) {
          setEmail("");
          return;
        }

        const u = data.user;
        const userEmail =
          u.email ||
          (Array.isArray(u.identities) && u.identities[0]?.email) ||
          "";

        if (!cancelled && userEmail) setEmail(userEmail);

        // tenta nome de metadata/perfil
        const metaName =
          (u.user_metadata?.full_name as string) ||
          (u.user_metadata?.name as string) ||
          "";

        if (!cancelled && metaName) setNome(metaName);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const quick = [20, 50, 100, 250, 500, 1000];

  const cpfValido = (v: string) => onlyDigits(v).length === 11;

  const canGeneratePix =
    canCreate &&
    !!nome.trim() &&
    !!email.trim() &&
    cpfValido(cpf) &&
    !generating &&
    !loadingUser;

  const handleGeneratePix = async () => {
    if (!canGeneratePix) return;

    try {
      setGenerating(true);
      setErrMsg(null);

      const cleanCpf = onlyDigits(cpf);

      const { data, error } = await supabase.functions.invoke("pix-deposit", {
        body: {
          amount_base: amount,
          cpf: cleanCpf,
          name: nome.trim(),
          email: email.trim(),
          description: `Depósito de base para trade na Arena`,
        },
      });

      if (error) {
        const serverMsg = extractInvokeErrorMessage(error);
        throw new Error(serverMsg || "Não rolou gerar o PIX.");
      }

      if (!data) throw new Error("Gateway não trouxe resposta do PIX.");

      setPixData(data);
      setStep("PIX");
    } catch (e: any) {
      setErrMsg(
        e?.message ||
          "Não foi possível gerar o PIX. Tenta de novo em alguns minutos."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ✅ suporta retorno Celcoin (Charge/Transactions/Pix)
  // ✅ e retorno simplificado (qrCodeBase64/copyPaste)
  const firstTx = pixData?.Charge?.Transactions?.[0];

  const qrCodeImageUrl =
    firstTx?.Pix?.image ||
    pixData?.qrCode ||
    pixData?.qr_code ||
    null;

  const copyPasteCode =
    firstTx?.Pix?.qrCode ||
    pixData?.copyPaste ||
    pixData?.copy_paste ||
    pixData?.pixCopyPaste ||
    "";

  const qrCodeBase64 =
    pixData?.qrCodeBase64 ||
    pixData?.qr_code_base64 ||
    null;

  const expiresAt =
    firstTx?.dueDate ||
    pixData?.expiresAt ||
    pixData?.expires_at ||
    null;

  const displayAmount =
    pixData?.amount ||
    pixData?.amount_base ||
    amount;

  const handleCopyCode = () => {
    if (!copyPasteCode) return;

    navigator.clipboard
      .writeText(copyPasteCode)
      .then(() => {
        setErrMsg("Código copiado. Agora paga sem novela.");
        setTimeout(() => setErrMsg(null), 1800);
      })
      .catch(() => setErrMsg("Não consegui copiar. Copia na mão."));
  };

  const handlePaid = async () => {
    setErrMsg(null);
    try {
      await onPaid?.();
      onClose();
    } catch (e: any) {
      setErrMsg(e?.message || "Ainda não pingou. Atualiza e tenta de novo.");
    }
  };

  function mascararCpf(v: string) {
    let value = v.replace(/\D/g, "").slice(0, 11);
    if (value.length >= 3) value = value.replace(/(\d{3})(\d)/, "$1.$2");
    if (value.length >= 7)
      value = value.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (value.length >= 11)
      value = value.replace(
        /(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
        "$1.$2.$3-$4"
      );
    return value;
  }

  return (
    <div className={styles["pix-modal"]}>
      <div
        className={styles["pix-modal__overlay"]}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Depositar via PIX"
      >
        <div
          className={styles["pix-modal__card"]}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles["pix-modal__head"]}>
            <div>
              <div className={styles["pix-modal__title"]}>
                Turbinar carteira via PIX
              </div>
              <div className={styles["pix-modal__subtitle"]}>
                Base pra entrar no jogo. Cai na hora.
              </div>
            </div>

            <button
              onClick={onClose}
              className={styles["pix-modal__close"]}
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </header>

          <div className={styles["pix-modal__body"]}>
            {step === "REVIEW" && (
              <>
                <div className={styles["pix-modal__warn"]}>
                  Seu saldo não segura essa ordem.{" "}
                  <strong>Bota base agora</strong> e volta pro trade.
                </div>

                <label className={styles["pix-modal__field"]}>
                  <span className={styles["pix-modal__label"]}>
                    Nome completo
                  </span>
                  <input
                    className={styles["pix-modal__input"]}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </label>

                <label className={styles["pix-modal__field"]}>
                  <span className={styles["pix-modal__label"]}>E-mail</span>
                  <input
                    className={styles["pix-modal__input"]}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    disabled={loadingUser}
                  />
                </label>

                <label className={styles["pix-modal__field"]}>
                  <span className={styles["pix-modal__label"]}>CPF</span>
                  <input
                    className={styles["pix-modal__input"]}
                    value={cpf}
                    onChange={(e) => setCpf(mascararCpf(e.target.value))}
                    placeholder="000.000.000-00"
                  />
                  <p className={styles["pix-modal__help"]}>
                    Só pra emitir cobrança PIX. Não vira "investimento regulado".
                  </p>
                </label>

                <label className={styles["pix-modal__field"]}>
                  <span className={styles["pix-modal__label"]}>
                    Valor do depósito (base)
                  </span>
                  <div className={styles["pix-modal__inputWrap"]}>
                    <span className={styles["pix-modal__prefix"]}>R$</span>
                    <input
                      type="number"
                      min={minAmount}
                      step="0.01"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className={styles["pix-modal__input"]}
                      placeholder="50"
                    />
                  </div>
                </label>

                <div className={styles["pix-modal__quickRow"]}>
                  {quick.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmountInput(String(q))}
                      className={styles["pix-modal__quickBtn"]}
                    >
                      R$ {q}
                    </button>
                  ))}
                </div>

                <div className={styles["pix-modal__feedback"]}>
                  <strong>Risco real:</strong> depósito não é investimento. É munição pra especular consciente.
                  Se você quer segurança, não aperta BUY.
                </div>

                {errMsg && (
                  <div
                    className={`${styles["pix-modal__feedback"]} ${styles["pix-modal__feedback--error"]}`}
                  >
                    {errMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGeneratePix}
                  disabled={!canGeneratePix}
                  className={styles["pix-modal__primaryBtn"]}
                >
                  {generating ? (
                    <span className={styles["pix-modal__btnRow"]}>
                      <Loader2 className={styles["spin"]} size={16} />
                      Gerando PIX…
                    </span>
                  ) : (
                    <span className={styles["pix-modal__btnRow"]}>
                      <Zap size={16} />
                      Gerar QR Code PIX
                    </span>
                  )}
                </button>
              </>
            )}

            {step === "PIX" && pixData && (
              <>
                <div className={styles["pix-modal__pixHead"]}>
                  <QrCode size={18} />
                  Escaneia ou copia o código.
                </div>

                <div className={styles["pix-modal__qrBox"]}>
                  {qrCodeImageUrl ? (
                    <img
                      src={qrCodeImageUrl}
                      alt="QR Code PIX"
                      className={styles["pix-modal__qrImg"]}
                    />
                  ) : qrCodeBase64 ? (
                    <img
                      src={
                        qrCodeBase64.startsWith("data:")
                          ? qrCodeBase64
                          : `data:image/png;base64,${qrCodeBase64}`
                      }
                      alt="QR Code PIX"
                      className={styles["pix-modal__qrImg"]}
                    />
                  ) : (
                    <p className={styles["pix-modal__note"]}>
                      QR não veio. Usa o copia-e-cola abaixo.
                    </p>
                  )}

                  {!!copyPasteCode && (
                    <>
                      <div className={styles["pix-modal__copyPaste"]}>
                        {copyPasteCode}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className={styles["pix-modal__copyBtn"]}
                      >
                        <span className={styles["pix-modal__btnRow"]}>
                          <Copy size={14} />
                          Copiar código PIX
                        </span>
                      </button>
                    </>
                  )}
                </div>

                <div className={styles["pix-modal__feedback"]}>
                  Valor: <strong>R$ {Number(displayAmount).toFixed(2)}</strong>
                  {expiresAt ? (
                    <>
                      {" "}• Expira em{" "}
                      {new Date(expiresAt).toLocaleString("pt-BR")}
                    </>
                  ) : null}
                </div>

                {errMsg && (
                  <div
                    className={`${styles["pix-modal__feedback"]} ${styles["pix-modal__feedback--error"]}`}
                  >
                    {errMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePaid}
                  className={styles["pix-modal__primaryBtn"]}
                  style={{ background: "var(--pm-cyan)", color: "#000" }}
                >
                  <span className={styles["pix-modal__btnRow"]}>
                    <Zap size={16} />
                    Já paguei — atualizar saldo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={styles["pix-modal__secondaryBtn"]}
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
