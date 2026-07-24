"use client";

import { useState, useTransition } from "react";
import type { Tables } from "@/types/database";
import { definirValorAtendimento, concluirAtendimento } from "./atendimento-actions";

export function AtendimentoCard({
  atendimento,
  usuarioNome,
}: {
  atendimento: Tables<"atendimentos_assistidos">;
  usuarioNome: string;
}) {
  const [pending, startTransition] = useTransition();
  const [valor, setValor] = useState(atendimento.valor?.toString() ?? "");

  return (
    <li className="rounded border border-neutral-200 p-3 text-sm">
      <p className="font-medium">
        {atendimento.tipo === "curadoria" ? "Curadoria assistida" : "Prova presencial"} —{" "}
        {usuarioNome}
      </p>
      <p className="text-neutral-500">
        Status: {atendimento.status} · Pagamento: {atendimento.status_pagamento}
        {atendimento.valor ? ` · R$ ${atendimento.valor.toFixed(2)}` : ""}
      </p>
      {atendimento.observacoes && (
        <p className="text-xs text-neutral-500">Obs: {atendimento.observacoes}</p>
      )}

      {atendimento.status === "solicitado" && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor R$"
            className="w-28 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await definirValorAtendimento(atendimento.id, Number(valor));
              })
            }
            className="rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
          >
            Definir valor e agendar
          </button>
        </div>
      )}

      {atendimento.status === "agendado" && (
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await concluirAtendimento(atendimento.id); })}
          className="mt-2 rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
        >
          Marcar como concluído
        </button>
      )}
    </li>
  );
}
