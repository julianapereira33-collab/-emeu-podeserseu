"use client";

import { useState, useTransition } from "react";
import { gerarLinkCompartilhamento } from "./compartilhar-actions";

export function CashbackSection({ saldo }: { saldo: number }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  return (
    <section className="rounded border border-neutral-200 p-4">
      <h2 className="text-lg font-medium">Meu cashback</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Saldo disponível: <strong>R$ {saldo.toFixed(2)}</strong> (válido por 90 dias da data em que
        foi creditado, só pode ser usado para abater a taxa de uma futura reserva aqui na
        plataforma — nunca sacável).
      </p>

      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await gerarLinkCompartilhamento(null);
            if (res.sucesso && res.id) {
              setLink(`${window.location.origin}/r/${res.id}`);
            }
          })
        }
        className="mt-3 rounded bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700"
      >
        Gerar link para compartilhar (a cada 5 cliques reais, R$ 15 de cashback)
      </button>

      {link && (
        <p className="mt-2 break-all rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
          {link}
        </p>
      )}
    </section>
  );
}
