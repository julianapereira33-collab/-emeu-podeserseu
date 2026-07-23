"use client";

import { useState, useTransition } from "react";
import type { Tables } from "@/types/database";
import { aprovarPeca, reprovarPeca } from "./actions";

export function CuradoriaCard({ peca }: { peca: Tables<"pecas"> }) {
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const foto = peca.fotos_tratadas[0] ?? peca.fotos_originais[0];

  return (
    <li className="flex flex-col gap-3 rounded border border-neutral-200 p-4 sm:flex-row">
      <div className="h-32 w-24 shrink-0 overflow-hidden rounded bg-neutral-100">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="flex-1 text-sm">
        <p className="font-medium">{peca.descricao}</p>
        <p className="text-neutral-500">
          Tam. {peca.tamanho} · {peca.cor} · {peca.tecido ?? "sem tecido informado"} · {peca.estado}
        </p>
        <p className="text-neutral-500">
          {peca.tipo === "aluguel" ? "Aluguel" : "Venda"} · R$ {peca.preco_anunciado.toFixed(2)}
          {peca.exclusividade ? " · Exclusiva" : ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await aprovarPeca(peca.id); })}
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Aprovar
          </button>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da reprovação"
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await reprovarPeca(peca.id, motivo); })}
            className="rounded bg-red-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Reprovar
          </button>
        </div>
      </div>
    </li>
  );
}
