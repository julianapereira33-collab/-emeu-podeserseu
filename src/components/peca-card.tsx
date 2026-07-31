import Link from "next/link";
import type { Tables } from "@/types/database";
import { FavoritoBotao } from "@/app/pecas/[id]/favorito-botao";

export function PecaCard({
  peca,
  favoritado = false,
  logada = false,
}: {
  peca: Tables<"pecas">;
  favoritado?: boolean;
  logada?: boolean;
}) {
  const foto = peca.fotos_tratadas[0] ?? peca.fotos_originais[0];
  const vendida = peca.status === "vendido";
  const diasDesdeCadastro = (Date.now() - new Date(peca.criado_em).getTime()) / (1000 * 60 * 60 * 24);
  const ehNova = !vendida && peca.status === "aprovado" && diasDesdeCadastro <= 7;

  return (
    <Link
      href={`/pecas/${peca.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 transition hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full bg-neutral-100">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={peca.descricao}
            className={
              "h-full w-full object-cover transition group-hover:scale-[1.02]" +
              (vendida ? " grayscale" : "")
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Sem foto
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {vendida && (
            <span className="w-fit rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
              {peca.tipo === "aluguel" ? "Locado" : "Vendido"}
            </span>
          )}
          {ehNova && (
            <span className="w-fit rounded-full bg-gold px-2 py-0.5 text-xs text-neutral-900">
              Novo
            </span>
          )}
        </div>
        <div className="absolute right-2 top-2">
          <FavoritoBotao pecaId={peca.id} favoritadoInicial={favoritado} logada={logada} />
        </div>
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
