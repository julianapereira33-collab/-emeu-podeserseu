"use client";

import { useState, useTransition } from "react";
import { confirmarReserva, recusarReserva } from "./actions";

type ResultadoAcao = { erro?: string; sucesso?: boolean };

export function ReservaAcoes({ reservaId }: { reservaId: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoRecusa, setConfirmandoRecusa] = useState(false);

  function executar(acao: (id: string) => Promise<ResultadoAcao>) {
    setErro(null);
    startTransition(async () => {
      const resultado = await acao(reservaId);
      if (resultado?.erro) setErro(resultado.erro);
    });
  }

  // Recusar libera a peça de volta para a vitrine e avisa a compradora — pede confirmação
  if (confirmandoRecusa) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-xs text-neutral-700">
          Recusar esta reserva? A peça volta para a vitrine e a compradora é avisada.
        </p>
        <div className="flex gap-2">
          <button
            disabled={pending}
            onClick={() => executar(recusarReserva)}
            className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Recusando..." : "Sim, recusar"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              setConfirmandoRecusa(false);
              setErro(null);
            }}
            className="rounded bg-neutral-200 px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
        {erro && <p className="text-xs text-red-600">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => executar(confirmarReserva)}
          className="rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
        >
          {pending ? "Confirmando..." : "Confirmar disponibilidade"}
        </button>
        <button
          disabled={pending}
          onClick={() => setConfirmandoRecusa(true)}
          className="rounded bg-neutral-200 px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-50"
        >
          Recusar
        </button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
