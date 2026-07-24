"use client";

import { useTransition } from "react";
import { marcarComissaoPaga } from "./rede-actions";

type ComissaoComParceira = {
  id: string;
  tipo: string;
  percentual: number;
  valor: number;
  paga: boolean;
  usuarios: { nome: string } | null;
};

export function ComissoesSection({ comissoes }: { comissoes: ComissaoComParceira[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Comissões pendentes de pagamento</h2>
      <ul className="flex flex-col gap-2">
        {comissoes.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 p-3 text-sm"
          >
            <span>
              {c.usuarios?.nome ?? "—"} · {c.tipo === "override" ? "override" : "direta"} ·{" "}
              {c.percentual}% · R$ {c.valor.toFixed(2)}
            </span>
            <button
              disabled={pending}
              onClick={() => startTransition(async () => { await marcarComissaoPaga(c.id); })}
              className="rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
            >
              Marcar como paga
            </button>
          </li>
        ))}
        {comissoes.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma comissão pendente.</p>
        )}
      </ul>
    </section>
  );
}
