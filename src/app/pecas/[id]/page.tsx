import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { appOrigin } from "@/lib/app-url";
import { ReservarForm } from "./reservar-form";
import { CompartilharBotao } from "./compartilhar-botao";
import { FotoGaleria } from "./foto-galeria";
import { FavoritoBotao } from "./favorito-botao";
import { DisponibilidadeCalendario } from "./disponibilidade-calendario";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: peca } = await supabase
    .from("pecas")
    .select("descricao, preco_anunciado, tipo, fotos_tratadas, fotos_originais")
    .eq("id", id)
    .maybeSingle();

  if (!peca) return {};

  const origin = await appOrigin();
  const fotos = peca.fotos_tratadas.length ? peca.fotos_tratadas : peca.fotos_originais;
  const preco = peca.preco_anunciado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const titulo = `${peca.descricao} — ${preco}`;
  const descricao =
    peca.tipo === "aluguel"
      ? "Disponível para aluguel em É meu, pode ser seu."
      : "Disponível para venda em É meu, pode ser seu.";

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      url: `${origin}/pecas/${id}`,
      images: fotos[0] ? [{ url: fotos[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
      images: fotos[0] ? [fotos[0]] : undefined,
    },
  };
}

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

  let favoritado = false;
  if (usuario) {
    const { data } = await supabase
      .from("favoritos")
      .select("id")
      .eq("usuario_id", usuario.id)
      .eq("peca_id", peca.id)
      .maybeSingle();
    favoritado = Boolean(data);
  }

  let periodosOcupados: { locacao_inicio: string | null; locacao_fim: string | null }[] = [];
  if (peca.tipo === "aluguel") {
    const { data } = await supabase.rpc("periodos_ocupados", { p_peca_id: peca.id });
    periodosOcupados = data ?? [];
  }

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-8 sm:grid-cols-2">
      <FotoGaleria fotos={fotos} alt={peca.descricao} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            {peca.tipo === "aluguel" ? "Aluguel" : "Venda"}
            {peca.exclusividade ? " · Exclusiva" : ""}
          </span>
          {!ehDona && (
            <FavoritoBotao pecaId={peca.id} favoritadoInicial={favoritado} logada={Boolean(usuario)} />
          )}
        </div>
        <h1 className="text-xl font-semibold">{peca.descricao}</h1>
        <p className="text-2xl font-semibold">
          {peca.preco_anunciado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        <p className="text-xs text-neutral-500">
          {peca.venda_assistida
            ? "+ taxa de intermediação de 60% do valor fechado (venda assistida), "
            : "+ taxa de intermediação de até 30% do valor fechado, "}
          cobrada da compradora ao confirmar a reserva. O valor da peça em si é combinado direto com
          a vendedora — nunca passa pela plataforma.{" "}
          <Link href="/como-funciona" className="underline">
            Como funciona
          </Link>
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

        {(peca.medida_busto_cm || peca.medida_cintura_cm || peca.medida_quadril_cm || peca.medida_comprimento_cm) && (
          <div>
            <p className="mb-1 text-xs text-neutral-400">Medidas reais (cm)</p>
            <dl className="grid grid-cols-4 gap-2 text-sm text-neutral-600">
              <div>
                <dt className="text-xs text-neutral-400">Busto</dt>
                <dd>{peca.medida_busto_cm ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Cintura</dt>
                <dd>{peca.medida_cintura_cm ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Quadril</dt>
                <dd>{peca.medida_quadril_cm ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Comprimento</dt>
                <dd>{peca.medida_comprimento_cm ?? "—"}</dd>
              </div>
            </dl>
          </div>
        )}

        {peca.tipo === "aluguel" && <DisponibilidadeCalendario periodos={periodosOcupados} />}

        {peca.video_url && (
          <div>
            <p className="mb-1 text-xs text-neutral-400">Vídeo do estado real</p>
            <video src={peca.video_url} controls className="w-full rounded-lg" />
          </div>
        )}

        {peca.status !== "aprovado" ? (
          <p className="rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
            Esta peça não está mais disponível na vitrine no momento.
          </p>
        ) : ehDona ? (
          <>
            <p className="rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
              Esta é uma das suas peças — acompanhe as reservas no seu painel.
            </p>
            <CompartilharBotao pecaId={peca.id} />
          </>
        ) : usuario ? (
          <>
            <ReservarForm
              pecaId={peca.id}
              precoAnunciado={peca.preco_anunciado}
              criadoEm={peca.criado_em}
              tipo={peca.tipo}
            />
            <CompartilharBotao pecaId={peca.id} />
          </>
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
