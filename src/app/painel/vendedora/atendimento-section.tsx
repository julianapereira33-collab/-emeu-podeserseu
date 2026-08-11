"use client";

import { useTransition } from "react";
import type { Tables } from "@/types/database";
import { solicitarAtendimento } from "./atendimento-actions";
import { PagarAtendimentoBotao } from "./pagar-atendimento-botao";

export function AtendimentoSection({ atendimentos }: { atendimentos: Tables<"atendimentos_assistidos">[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Atendimento assistido</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Peça ajuda da curadoria para negociar por você, ou solicite uma prova presencial.
      </p>

      <div className="mb-4 flex gap-2">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await solicitarAtendimento("curadoria"); })}
          className="rounded bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700"
        >
          Solicitar curadoria assistida
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await solicitarAtendimento("prova_presencial"); })}
          className="rounded bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700"
        >
          Solicitar prova presencial
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {atendimentos.map((a) => (
          <li key={a.id} className="rounded border border-neutral-200 p-3 text-sm">
            <p>
              {a.tipo === "curadoria" ? "Curadoria assistida" : "Prova presencial"} — status: {a.status}
              {a.valor ? ` · R$ ${a.valor.toFixed(2)}` : " · aguardando valor da curadoria"}
            </p>
            {a.valor && a.status_pagamento === "pendente" && (
              <PagarAtendimentoBotao atendimentoId={a.id} valor={a.valor} />
            )}
          </li>
        ))}
        {atendimentos.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma solicitação ainda.</p>
        )}
      </ul>
    </section>
  );
}
