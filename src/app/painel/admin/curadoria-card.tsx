"use client";

import { useState, useTransition } from "react";
import type { Tables } from "@/types/database";
import { aprovarPeca, reprovarPeca } from "./actions";

export function CuradoriaCard({ peca }: { peca: Tables<"pecas"> }) {
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const fotos = peca.fotos_tratadas.length ? peca.fotos_tratadas : peca.fotos_originais;

  return (
    <li className="flex flex-col gap-3 rounded border border-neutral-200 p-4 sm:flex-row">
      <div className="flex shrink-0 gap-1">
        {fotos.slice(0, 3).map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f} src={f} alt="" className="h-32 w-24 rounded object-cover" />
        ))}
      </div>

      <div className="flex-1 text-sm">
        <p className="font-medium">{peca.descricao}</p>
        <p className="text-neutral-500">
          Tam. {peca.tamanho} · {peca.cor} · {peca.tecido ?? "sem tecido informado"} · {peca.estado}
        </p>
        <p className="text-neutral-500">
          Medidas: busto {peca.medida_busto_cm ?? "—"} · cintura {peca.medida_cintura_cm ?? "—"} ·
          quadril {peca.medida_quadril_cm ?? "—"} · comprimento {peca.medida_comprimento_cm ?? "—"} cm
        </p>
        <p className="text-neutral-500">
          {peca.tipo === "aluguel" ? "Aluguel" : "Venda"} · R$ {peca.preco_anunciado.toFixed(2)}
          {peca.exclusividade ? " · Exclusiva" : ""}
        </p>
        {peca.video_url && (
          <a
            href={peca.video_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold-dark underline"
          >
            Ver vídeo do estado real
          </a>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await aprovarPeca(peca.id); })}
            className="rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
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
