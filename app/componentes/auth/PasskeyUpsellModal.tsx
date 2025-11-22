"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export default function PasskeyUpsellModal() {
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const last = (localStorage.getItem("last_auth_strategy") ||
      null) as "passkey" | "email_code" | null;

    const canUsePasskeys =
      typeof window !== "undefined" &&
      window.isSecureContext &&
      "PublicKeyCredential" in window;

    const hasPasskeys = (user.passkeys?.length || 0) > 0;

    if (last === "email_code" && canUsePasskeys && !hasPasskeys) {
      setOpen(true);
    }
  }, [isLoaded, user]);

  const close = useCallback(() => setOpen(false), []);

  const createPasskey = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await user.createPasskey();
      localStorage.setItem("last_auth_strategy", "passkey");
      setOpen(false);
    } catch (e) {
      console.error(e);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passkey-upsell-title"
      aria-describedby="passkey-upsell-desc"
      onMouseDown={(e) => {
        // clique fora fecha
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-kicker">Autenticação mais rápida</div>
          <h2 id="passkey-upsell-title" className="modal-title">
            Quer entrar mais rápido da próxima vez?
          </h2>
          <p id="passkey-upsell-desc" className="modal-text">
            Ative a entrada com sua digital/FaceID. Sem senha, sem código e com
            menos fricção.
          </p>
        </div>

        <div className="modal-actions">
          <button
            onClick={createPasskey}
            disabled={loading}
            className="btn-primary modal-btn"
          >
            {loading ? "Ativando..." : "Ativar Passkey"}
          </button>

          <button onClick={close} className="btn-outline modal-btn">
            Agora não
          </button>
        </div>

        <div className="modal-footnote">
          Você continua podendo usar e-mail/OTP quando quiser.
        </div>
      </div>
    </div>
  );
}
