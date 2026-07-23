import Link from "next/link";
import type { Tables } from "@/types/database";

export function PecaCard({ peca }: { peca: Tables<"pecas"> }) {
  const foto = peca.fotos_tratadas[0] ?? peca.fotos_originais[0];

  return (
    <Link
      href={`/pecas/${peca.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 transition hover:shadow-md"
    >
      <div className="aspect-[3/4] w-full bg-neutral-100">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={peca.descricao}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Sem foto
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            {peca.tipo === "aluguel" ? "Aluguel" : "Venda"}
          </span>
          {peca.exclusividade && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              Exclusiva
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-neutral-700">{peca.descricao}</p>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Tam. {peca.tamanho}</span>
          <span>{peca.cor}</span>
        </div>
        <p className="mt-1 font-semibold">
          {peca.preco_anunciado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      </div>
    </Link>
  );
}
