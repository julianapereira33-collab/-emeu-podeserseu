"use client";

import { useState, useTransition } from "react";
import { gerarLinkCompartilhamento } from "@/app/painel/compradora/compartilhar-actions";

export function CompartilharBotao({ pecaId }: { pecaId: string }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  return (
    <div className="text-xs">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await gerarLinkCompartilhamento(pecaId);
            if (res.sucesso && res.id) setLink(`${window.location.origin}/r/${res.id}`);
          })
        }
        className="underline text-neutral-500"
      >
        Compartilhar esta peça e ganhar cashback
      </button>
      {link && <p className="mt-1 break-all rounded bg-neutral-50 px-2 py-1">{link}</p>}
    </div>
  );
}
