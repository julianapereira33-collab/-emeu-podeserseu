"use client";

import { useActionState } from "react";
import { avaliar, type AvaliarState } from "./avaliar-actions";

const initialState: AvaliarState = {};

export function AvaliarForm({
  transacaoId,
  tipoAlvo,
  label,
}: {
  transacaoId: string;
  tipoAlvo: "peca" | "vendedora" | "locadora";
  label: string;
}) {
  const action = avaliar.bind(null, { transacaoId, tipoAlvo });
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.sucesso) {
    return <p className="text-xs text-gold-dark">Avaliação de {label} enviada. Obrigada!</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 text-xs">
      <span className="w-24 shrink-0">{label}</span>
      <select name="nota" required defaultValue="" className="rounded border border-neutral-300 px-1.5 py-1">
        <option value="" disabled>
          Nota
        </option>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} estrela{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>
      <input
        name="comentario"
        placeholder="Comentário (opcional)"
        className="min-w-40 flex-1 rounded border border-neutral-300 px-2 py-1"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gold bg-gold px-3 py-1 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Avaliar"}
      </button>
      {state.erro && <span className="w-full text-red-600">{state.erro}</span>}
    </form>
  );
}
