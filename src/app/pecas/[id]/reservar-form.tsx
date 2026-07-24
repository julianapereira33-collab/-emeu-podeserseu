"use client";

import { useActionState } from "react";
import Link from "next/link";
import { reservar, type ReservarState } from "./actions";
import { propostaMinima } from "@/lib/domain/regras";

const initialState: ReservarState = {};

export function ReservarForm({
  pecaId,
  precoAnunciado,
  criadoEm,
  tipo,
}: {
  pecaId: string;
  precoAnunciado: number;
  criadoEm: string;
  tipo: string;
}) {
  const action = reservar.bind(null, pecaId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const minimo = propostaMinima(precoAnunciado, criadoEm);

  if (state.sucesso) {
    return (
      <p className="rounded border border-gold bg-gold-light/30 px-3 py-2 text-sm text-neutral-900">
        Reserva enviada! A vendedora tem 24h para confirmar a disponibilidade — você será avisada
        pelo WhatsApp cadastrado. Nenhuma cobrança foi feita ainda.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-neutral-200 p-4">
      <p className="text-sm font-medium">Reservar ou propor um valor</p>
      <label className="flex flex-col gap-1 text-sm">
        Proposta de valor (opcional — deixe em branco para reservar pelo valor anunciado)
        <input
          name="valor_proposta"
          type="number"
          step="0.01"
          min={minimo}
          placeholder={`mínimo aceito: R$ ${minimo.toFixed(2)}`}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <p className="text-xs text-neutral-500">
        Proposta mínima aceita hoje: R$ {minimo.toFixed(2)} (piso cresce quanto mais tempo a peça
        fica em vitrine).
      </p>

      <label className="flex items-start gap-2 text-xs text-neutral-600">
        <input type="checkbox" name="termos_aceitos" required className="mt-0.5" />
        <span>
          Li e aceito os{" "}
          <Link href={`/termos?tipo=${tipo}`} target="_blank" className="underline">
            termos de uso para {tipo === "aluguel" ? "aluguel" : "venda"}
          </Link>
          , incluindo que a taxa não é reembolsável após o pagamento.
        </span>
      </label>

      {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gold bg-gold px-4 py-2 text-sm text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Reservar / propor valor"}
      </button>
    </form>
  );
}
