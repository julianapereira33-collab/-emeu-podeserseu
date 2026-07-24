"use client";

import { useState, useTransition } from "react";
import { pagarTaxa } from "./actions";

export function PagarBotao({
  transacaoId,
  valorTaxa,
  saldoCashback,
}: {
  transacaoId: string;
  valorTaxa: number;
  saldoCashback: number;
}) {
  const [pending, startTransition] = useTransition();
  const [usarCashback, setUsarCashback] = useState(saldoCashback > 0);

  return (
    <div className="flex flex-col gap-1">
      {saldoCashback > 0 && (
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={usarCashback}
            onChange={(e) => setUsarCashback(e.target.checked)}
          />
          Usar cashback disponível (R$ {saldoCashback.toFixed(2)}) para abater a taxa
        </label>
      )}
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await pagarTaxa(transacaoId, usarCashback); })}
        className="w-fit rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending
          ? "Processando..."
          : `Pagar taxa (R$ ${valorTaxa.toFixed(2)}) e liberar contato`}
      </button>
    </div>
  );
}
