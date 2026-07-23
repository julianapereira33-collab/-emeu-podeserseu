"use client";

import { useTransition } from "react";
import { pagarTaxa } from "./actions";

export function PagarBotao({ transacaoId, valorTaxa }: { transacaoId: string; valorTaxa: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await pagarTaxa(transacaoId); })}
      className="rounded bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
    >
      {pending
        ? "Processando..."
        : `Pagar taxa (R$ ${valorTaxa.toFixed(2)}) e liberar contato`}
    </button>
  );
}
