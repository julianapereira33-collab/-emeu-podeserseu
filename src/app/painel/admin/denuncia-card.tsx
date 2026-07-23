"use client";

import { useState, useTransition } from "react";
import { registrarDenunciaAction } from "./actions";

export function DenunciaCard({
  vendedoraId,
  vendedoraNome,
  pecaDescricao,
  avisosAtuais,
  banida,
}: {
  vendedoraId: string;
  vendedoraNome: string;
  pecaDescricao: string;
  avisosAtuais: number;
  banida: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);

  return (
    <li className="rounded border border-neutral-200 p-3 text-sm">
      <p className="font-medium">{pecaDescricao}</p>
      <p className="text-neutral-500">
        Vendedora: {vendedoraNome} · avisos anteriores: {avisosAtuais}
        {banida && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Banida</span>}
      </p>

      {!banida && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (ex: encontrada à venda em outro grupo)"
            className="min-w-48 flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <input
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            placeholder="Link/evidência (opcional)"
            className="min-w-40 flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await registrarDenunciaAction(vendedoraId, motivo, evidencia);
                setResultado(
                  res.erro ? res.erro : res.banido ? "Vendedora banida (2ª ocorrência)." : "Aviso registrado.",
                );
              })
            }
            className="rounded bg-red-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Registrar denúncia
          </button>
        </div>
      )}

      {resultado && <p className="mt-1 text-xs text-neutral-600">{resultado}</p>}
    </li>
  );
}
