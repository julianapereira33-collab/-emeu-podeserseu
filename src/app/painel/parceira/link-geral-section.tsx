"use client";

import { useState, useTransition } from "react";
import { gerarLinkCompartilhamento } from "@/app/painel/compradora/compartilhar-actions";
import { LinkCompartilhavel } from "@/components/link-compartilhavel";

export function LinkGeralSection() {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  return (
    <section className="rounded border border-neutral-200 p-4">
      <h2 className="text-lg font-medium">Link de divulgação</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Este link leva para a vitrine geral. Para promover uma peça específica e ganhar comissão
        sobre ela, use o botão &quot;Compartilhar esta peça&quot; na página de cada peça.
      </p>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await gerarLinkCompartilhamento(null);
            if (res.sucesso && res.id) setLink(`${window.location.origin}/r/${res.id}`);
          })
        }
        className="mt-3 rounded bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700"
      >
        Gerar link geral
      </button>
      {link && <LinkCompartilhavel link={link} />}
    </section>
  );
}
