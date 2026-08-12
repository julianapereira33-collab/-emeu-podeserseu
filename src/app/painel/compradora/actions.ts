"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { criarPreferenciaCheckout, buscarPagamentoPorReferencia } from "@/lib/mercadopago/client";

function appUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  if (!host) throw new Error("URL da aplicação não configurada (VERCEL_URL)");
  return host.startsWith("http") ? host : `https://${host}`;
}

type ResultadoCheckout =
  | { erro: string }
  | { sucesso: true; pago: true }
  | { sucesso: true; preferenceId: string };

export async function pagarTaxa(
  transacaoId: string,
  usarCashback: boolean,
): Promise<ResultadoCheckout> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Não foi possível identificar seu e-mail de cadastro." };

  const { data: transacao, error: erroTransacao } = await supabase
    .from("transacoes")
    .select("*, reservas!inner(compradora_id, pecas(descricao))")
    .eq("id", transacaoId)
    .single();

  if (erroTransacao || !transacao) return { erro: "Transação não encontrada." };
  if (transacao.status_pagamento !== "pendente") return { erro: "Pagamento já processado." };

  let valorAPagar = transacao.valor_taxa;
  if (usarCashback) {
    const { data: cashback } = await supabase
      .from("cashback")
      .select("valor")
      .eq("usuario_id", transacao.reservas.compradora_id)
      .eq("usado", false)
      .gt("valido_ate", new Date().toISOString());
    const saldoCashback = cashback?.reduce((soma, c) => soma + c.valor, 0) ?? 0;
    valorAPagar = Math.max(0, transacao.valor_taxa - Math.min(saldoCashback, transacao.valor_taxa));
  }

  // cashback cobre a taxa inteira — confirma direto, sem gerar cobrança
  if (valorAPagar <= 0) {
    const { error } = await supabase.rpc("confirmar_pagamento_taxa", {
      p_transacao_id: transacaoId,
      p_usar_cashback: usarCashback,
    });
    if (error) return { erro: error.message };
    revalidatePath("/painel/compradora");
    return { sucesso: true as const, pago: true as const };
  }

  // registra a intenção de usar cashback antes de abrir o checkout — o webhook
  // lê isso da transação na hora de confirmar, já que o pagamento em si só existe
  // depois que a compradora escolhe o meio (Pix/cartão/boleto) dentro do modal
  const { error: erroRegistrar } = await supabase.rpc("registrar_intencao_pagamento_taxa", {
    p_transacao_id: transacaoId,
    p_usar_cashback: usarCashback,
  });
  if (erroRegistrar) return { erro: erroRegistrar.message };

  const descricao = transacao.reservas.pecas?.descricao
    ? `Taxa - ${transacao.reservas.pecas.descricao}`
    : "Taxa de reserva";

  const { preferenceId } = await criarPreferenciaCheckout({
    valor: valorAPagar,
    descricao,
    externalReference: transacaoId,
    payerEmail: user.email,
    notificationUrl: `${appUrl()}/api/webhooks/mercadopago`,
    backUrl: `${appUrl()}/painel/compradora`,
  });

  return { sucesso: true as const, preferenceId };
}

export async function verificarPagamentoTaxa(transacaoId: string) {
  const supabase = await createClient();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select("status_pagamento, usar_cashback_solicitado")
    .eq("id", transacaoId)
    .single();

  if (!transacao) return { pago: false };
  if (transacao.status_pagamento === "pago") return { pago: true };

  const pagamento = await buscarPagamentoPorReferencia(transacaoId);
  if (!pagamento || pagamento.status !== "approved") return { pago: false };

  // confirma na hora caso o webhook ainda não tenha processado — chamada repetida é inofensiva
  const { error } = await supabase.rpc("confirmar_pagamento_taxa", {
    p_transacao_id: transacaoId,
    p_usar_cashback: transacao.usar_cashback_solicitado,
  });
  if (error && !error.message.includes("já processado")) return { pago: false };

  revalidatePath("/painel/compradora");
  return { pago: true };
}
