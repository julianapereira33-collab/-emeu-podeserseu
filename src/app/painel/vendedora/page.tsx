import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { STATUS_PECA_LABEL, STATUS_RESERVA_LABEL } from "@/lib/domain/regras";
import { ReservaAcoes } from "./reserva-actions";
import { AtendimentoSection } from "./atendimento-section";

export default async function PainelVendedoraPage() {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const { data: pecas } = await supabase
    .from("pecas")
    .select("*")
    .eq("dono_id", usuario!.id)
    .order("criado_em", { ascending: false });

  const { data: reservas } = await supabase
    .from("reservas")
    .select("*, pecas!inner(descricao, preco_anunciado, dono_id)")
    .eq("pecas.dono_id", usuario!.id)
    .order("criado_em", { ascending: false });

  const { data: atendimentos } = await supabase
    .from("atendimentos_assistidos")
    .select("*")
    .eq("usuario_id", usuario!.id)
    .order("criado_em", { ascending: false });

  const { data: cashbackRecebido } = await supabase
    .from("cashback")
    .select("valor, usado, valido_ate")
    .eq("usuario_id", usuario!.id)
    .eq("origem", "venda");

  const saldoCashback =
    cashbackRecebido
      ?.filter((c) => !c.usado && new Date(c.valido_ate) > new Date())
      .reduce((soma, c) => soma + c.valor, 0) ?? 0;

  const pendentes = reservas?.filter((r) => r.status === "aguardando_confirmacao") ?? [];
  const outras = reservas?.filter((r) => r.status !== "aguardando_confirmacao") ?? [];
  const banida = Boolean(usuario?.banido_em);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel da vendedora</h1>
        {!banida && (
          <Link
            href="/painel/vendedora/nova-peca"
            className="rounded border border-gold bg-gold px-4 py-2 text-sm text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
          >
            Cadastrar peça
          </Link>
        )}
      </div>

      {banida && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Sua conta foi banida por violação de exclusividade e não pode cadastrar novas peças.
          Fale com a curadoria se acredita que isso é um engano.
        </p>
      )}

      <p className="text-sm text-neutral-600">
        Cashback recebido (10% da taxa a cada venda), disponível para abater a taxa de uma futura
        compra ou aluguel: <strong>R$ {saldoCashback.toFixed(2)}</strong>
      </p>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Reservas aguardando sua confirmação ({pendentes.length})
        </h2>
        {pendentes.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma reserva pendente no momento.</p>
        )}
        <ul className="flex flex-col gap-3">
          {pendentes.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 p-3"
            >
              <div className="text-sm">
                <p className="font-medium">{r.pecas.descricao}</p>
                <p className="text-neutral-600">
                  {r.valor_proposta
                    ? `Proposta: R$ ${r.valor_proposta.toFixed(2)} (anunciado R$ ${r.pecas.preco_anunciado.toFixed(2)})`
                    : `Reserva pelo valor anunciado: R$ ${r.pecas.preco_anunciado.toFixed(2)}`}
                </p>
                <p className="text-xs text-neutral-500">
                  Prazo para responder: {new Date(r.prazo_confirmacao).toLocaleString("pt-BR")}
                </p>
              </div>
              <ReservaAcoes reservaId={r.id} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Histórico de reservas</h2>
        <ul className="flex flex-col gap-2">
          {outras.map((r) => (
            <li key={r.id} className="flex justify-between rounded border border-neutral-200 p-3 text-sm">
              <span>{r.pecas.descricao}</span>
              <span className="text-neutral-500">
                {STATUS_RESERVA_LABEL[r.status] ?? r.status}
              </span>
            </li>
          ))}
          {outras.length === 0 && (
            <p className="text-sm text-neutral-500">Sem histórico ainda.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Minhas peças</h2>
        <ul className="flex flex-col gap-2">
          {pecas?.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 p-3 text-sm"
            >
              <div>
                <p className="font-medium">{p.descricao}</p>
                <p className="text-neutral-500">
                  Tam. {p.tamanho} · {p.cor} · R$ {p.preco_anunciado.toFixed(2)}
                  {p.venda_assistida ? " · Venda assistida" : ""}
                </p>
                {p.status === "reprovado" && p.motivo_reprovacao && (
                  <p className="text-xs text-red-600">Motivo: {p.motivo_reprovacao}</p>
                )}
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                {STATUS_PECA_LABEL[p.status] ?? p.status}
              </span>
            </li>
          ))}
          {(!pecas || pecas.length === 0) && (
            <p className="text-sm text-neutral-500">Você ainda não cadastrou nenhuma peça.</p>
          )}
        </ul>
      </section>

      <AtendimentoSection atendimentos={atendimentos ?? []} />
    </div>
  );
}
