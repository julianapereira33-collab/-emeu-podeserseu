"use client";

import { useState, useTransition } from "react";
import { gerarLinkCompartilhamento } from "@/app/painel/compradora/compartilhar-actions";
import { LinkCompartilhavel } from "@/components/link-compartilhavel";

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
      {link && <LinkCompartilhavel link={link} />}
    </div>
  );
}
