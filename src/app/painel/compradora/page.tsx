import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { STATUS_RESERVA_LABEL } from "@/lib/domain/regras";
import { PagarBotao } from "./pagar-botao";
import { AvaliarForm } from "./avaliar-form";
import { CashbackSection } from "./cashback-section";

export default async function PainelCompradoraPage() {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const { data: reservas } = await supabase
    .from("reservas")
    .select("*, pecas(*, usuarios(nome, whatsapp)), transacoes(*)")
    .eq("compradora_id", usuario!.id)
    .order("criado_em", { ascending: false });

  const { data: avaliacoesFeitas } = await supabase
    .from("avaliacoes")
    .select("transacao_id, tipo_alvo")
    .eq("avaliador_id", usuario!.id);

  const { data: cashbackDisponivel } = await supabase
    .from("cashback")
    .select("valor")
    .eq("usuario_id", usuario!.id)
    .eq("usado", false)
    .gt("valido_ate", new Date().toISOString());

  const saldoCashback = cashbackDisponivel?.reduce((soma, c) => soma + c.valor, 0) ?? 0;

  const jaAvaliou = (transacaoId: string, tipoAlvo: string) =>
    avaliacoesFeitas?.some((a) => a.transacao_id === transacaoId && a.tipo_alvo === tipoAlvo) ?? false;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Minhas reservas</h1>

      <p className="rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
        O pagamento da taxa é feito via Pix (Mercado Pago) — clique em &quot;pagar taxa&quot; para
        gerar o QR code.
      </p>

      <CashbackSection saldo={saldoCashback} />

      <ul className="flex flex-col gap-3">
        {reservas?.map((r) => {
          const transacao = r.transacoes;
          const peca = r.pecas;
          const vendedora = peca?.usuarios;
          const ehAluguel = peca?.tipo === "aluguel";

          return (
            <li key={r.id} className="rounded border border-neutral-200 p-4 text-sm">
              <p className="font-medium">{peca?.descricao}</p>
              <p className="text-neutral-500">{STATUS_RESERVA_LABEL[r.status] ?? r.status}</p>

              {r.status === "confirmada" && transacao && transacao.status_pagamento === "pendente" && (
                <div className="mt-2">
                  <PagarBotao
                    transacaoId={transacao.id}
                    valorTaxa={transacao.valor_taxa}
                    saldoCashback={saldoCashback}
                  />
                </div>
              )}

              {r.status === "contato_liberado" && vendedora && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="rounded border border-gold bg-gold-light/30 px-3 py-2 text-neutral-900">
                    Contato liberado: {vendedora.nome} — WhatsApp {vendedora.whatsapp}
                    {transacao && transacao.cashback_utilizado > 0 && (
                      <span className="block text-xs">
                        (R$ {transacao.cashback_utilizado.toFixed(2)} abatidos com cashback)
                      </span>
                    )}
                  </div>

                  {transacao && (
                    <div className="flex flex-col gap-2 rounded border border-dashed border-neutral-300 p-3">
                      <p className="text-xs font-medium text-neutral-600">Avaliar esta transação</p>
                      {!jaAvaliou(transacao.id, "peca") && (
                        <AvaliarForm
                          transacaoId={transacao.id}
                          tipoAlvo="peca"
                          avaliadoId={null}
                          label="Peça"
                        />
                      )}
                      {!ehAluguel && !jaAvaliou(transacao.id, "vendedora") && (
                        <AvaliarForm
                          transacaoId={transacao.id}
                          tipoAlvo="vendedora"
                          avaliadoId={peca?.dono_id ?? null}
                          label="Vendedora"
                        />
                      )}
                      {ehAluguel && !jaAvaliou(transacao.id, "locadora") && (
                        <AvaliarForm
                          transacaoId={transacao.id}
                          tipoAlvo="locadora"
                          avaliadoId={peca?.dono_id ?? null}
                          label="Locadora"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}

        {(!reservas || reservas.length === 0) && (
          <p className="text-sm text-neutral-500">Você ainda não fez nenhuma reserva.</p>
        )}
      </ul>
    </div>
  );
}
