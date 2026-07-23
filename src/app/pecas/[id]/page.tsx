import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { ReservarForm } from "./reservar-form";

export default async function PecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: peca } = await supabase.from("pecas").select("*").eq("id", id).maybeSingle();
  if (!peca) notFound();

  const usuario = await getCurrentUsuario();
  const ehDona = usuario?.id === peca.dono_id;
  const fotos = peca.fotos_tratadas.length ? peca.fotos_tratadas : peca.fotos_originais;

  const { data: avaliacoesDona } = await supabase
    .from("avaliacoes")
    .select("nota")
    .eq("avaliado_id", peca.dono_id)
    .in("tipo_alvo", ["vendedora", "locadora"]);

  const mediaDona =
    avaliacoesDona && avaliacoesDona.length > 0
      ? avaliacoesDona.reduce((soma, a) => soma + a.nota, 0) / avaliacoesDona.length
      : null;

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-8 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-100">
          {fotos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotos[0]} alt={peca.descricao} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              Sem foto
            </div>
          )}
        </div>
        {fotos.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {fotos.slice(1).map((foto) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={foto}
                src={foto}
                alt=""
                className="aspect-square rounded object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          {peca.tipo === "aluguel" ? "Aluguel" : "Venda"}
          {peca.exclusividade ? " · Exclusiva" : ""}
        </span>
        <h1 className="text-xl font-semibold">{peca.descricao}</h1>
        <p className="text-2xl font-semibold">
          {peca.preco_anunciado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        {mediaDona !== null && (
          <p className="text-xs text-neutral-500">
            ★ {mediaDona.toFixed(1)} ({avaliacoesDona!.length} avaliação
            {avaliacoesDona!.length > 1 ? "ões" : ""} de{" "}
            {peca.tipo === "aluguel" ? "locadora" : "vendedora"})
          </p>
        )}

        <dl className="grid grid-cols-2 gap-2 text-sm text-neutral-600">
          <div>
            <dt className="text-neutral-400">Tamanho</dt>
            <dd>{peca.tamanho}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Cor</dt>
            <dd>{peca.cor}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Tecido</dt>
            <dd>{peca.tecido ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Estado</dt>
            <dd>{peca.estado}</dd>
          </div>
        </dl>

        {peca.status !== "aprovado" ? (
          <p className="rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
            Esta peça não está mais disponível na vitrine no momento.
          </p>
        ) : ehDona ? (
          <p className="rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
            Esta é uma das suas peças — acompanhe as reservas no seu painel.
          </p>
        ) : usuario ? (
          <ReservarForm
            pecaId={peca.id}
            precoAnunciado={peca.preco_anunciado}
            criadoEm={peca.criado_em}
            tipo={peca.tipo}
          />
        ) : (
          <p className="text-sm text-neutral-600">
            <Link href="/login" className="underline">
              Entre na sua conta
            </Link>{" "}
            para reservar ou propor um valor por esta peça.
          </p>
        )}
      </div>
    </main>
  );
}
