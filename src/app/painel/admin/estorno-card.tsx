"use client";

import { useState, useTransition } from "react";
import { estornarTransacao } from "./estorno-actions";

export function EstornoCard({
  transacaoId,
  pecaDescricao,
  compradoraNome,
  vendedoraNome,
  valorTaxa,
  pagoEm,
}: {
  transacaoId: string;
  pecaDescricao: string;
  compradoraNome: string;
  vendedoraNome: string;
  valorTaxa: number;
  pagoEm: string;
}) {
  const [pending, startTransition] = useTransition();
  const [abrirMotivo, setAbrirMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      const res = await estornarTransacao(transacaoId, motivo);
      if (res.erro) {
        setErro(res.erro);
        return;
      }
      setFeito(true);
    });
  }

  if (feito) {
    return (
      <li className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
        {pecaDescricao} — estornado.
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded border border-neutral-200 p-3 text-sm">
      <div>
        <p className="font-medium">{pecaDescricao}</p>
        <p className="text-neutral-500">
          Compradora: {compradoraNome} · Vendedora: {vendedoraNome} · Taxa: R$ {valorTaxa.toFixed(2)}
        </p>
        <p className="text-xs text-neutral-400">Pago em {new Date(pagoEm).toLocaleString("pt-BR")}</p>
      </div>

      {!abrirMotivo ? (
        <button
          type="button"
          onClick={() => setAbrirMotivo(true)}
          className="w-fit rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
        >
          Estornar
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo do estorno (obrigatório, fica registrado)"
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
            rows={2}
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={confirmar}
              className="rounded bg-red-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {pending ? "Estornando..." : "Confirmar estorno"}
            </button>
            <button
              type="button"
              onClick={() => setAbrirMotivo(false)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
