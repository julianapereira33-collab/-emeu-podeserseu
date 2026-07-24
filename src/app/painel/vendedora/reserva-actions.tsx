"use client";

import { useTransition } from "react";
import { confirmarReserva, recusarReserva } from "./actions";

export function ReservaAcoes({ reservaId }: { reservaId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await confirmarReserva(reservaId); })}
        className="rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        Confirmar disponibilidade
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await recusarReserva(reservaId); })}
        className="rounded bg-neutral-200 px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-50"
      >
        Recusar
      </button>
    </div>
  );
}
