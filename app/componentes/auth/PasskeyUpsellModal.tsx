"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function PasskeyUpsellModal() {
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 bg-black/70 grid place-items-center p-4 z-50">
      <div className="w-full max-w-sm bg-[#121212] border border-[#333] rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-2">
          Quer entrar mais rápido da próxima vez?
        </h2>
        <p className="text-sm text-neutral-300 mb-4">
          Ative a entrada com sua digital/FaceID. Sem senha, sem código.
        </p>

        <div className="flex gap-2">
          <button
            onClick={createPasskey}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#00ffff] text-black font-semibold px-4 py-3 disabled:opacity-60"
          >
            {loading ? "Ativando..." : "Ativar Passkey"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border border-[#333] px-4 py-3 text-neutral-300 hover:text-white"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
