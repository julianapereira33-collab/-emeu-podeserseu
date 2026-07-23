import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { STATUS_RESERVA_LABEL } from "@/lib/domain/regras";
import { PagarBotao } from "./pagar-botao";

export default async function PainelCompradoraPage() {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const { data: reservas } = await supabase
    .from("reservas")
    .select("*, pecas(*, usuarios(nome, whatsapp)), transacoes(*)")
    .eq("compradora_id", usuario!.id)
    .order("criado_em", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Minhas reservas</h1>

      <p className="rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
        Nesta fase de desenvolvimento, o pagamento da taxa é simulado por um botão — a integração
        real com o gateway Pix (Mercado Pago) entra antes de ir para produção.
      </p>

      <ul className="flex flex-col gap-3">
        {reservas?.map((r) => {
          const transacao = r.transacoes;
          const vendedora = r.pecas?.usuarios;

          return (
            <li key={r.id} className="rounded border border-neutral-200 p-4 text-sm">
              <p className="font-medium">{r.pecas?.descricao}</p>
              <p className="text-neutral-500">{STATUS_RESERVA_LABEL[r.status] ?? r.status}</p>

              {r.status === "confirmada" && transacao && transacao.status_pagamento === "pendente" && (
                <div className="mt-2">
                  <PagarBotao transacaoId={transacao.id} valorTaxa={transacao.valor_taxa} />
                </div>
              )}

              {r.status === "contato_liberado" && vendedora && (
                <div className="mt-2 rounded bg-emerald-50 px-3 py-2 text-emerald-700">
                  Contato liberado: {vendedora.nome} — WhatsApp {vendedora.whatsapp}
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
