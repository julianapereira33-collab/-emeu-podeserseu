"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { criarPagamentoPix, buscarPagamentoPix } from "@/lib/mercadopago/client";

function appUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  if (!host) throw new Error("URL da aplicação não configurada (VERCEL_URL)");
  return host.startsWith("http") ? host : `https://${host}`;
}

type ResultadoPagamento =
  | { erro: string }
  | { sucesso: true; pago: true }
  | { sucesso: true; qrCode: string; qrCodeBase64: string };

export async function pagarTaxa(
  transacaoId: string,
  usarCashback: boolean,
): Promise<ResultadoPagamento> {
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

  // já existe uma cobrança Pix gerada para esta transação — reaproveita em vez de gerar outra
  if (transacao.mp_payment_id) {
    const pagamento = await buscarPagamentoPix(transacao.mp_payment_id);
    if (pagamento.status === "approved") {
      revalidatePath("/painel/compradora");
      return { erro: "Pagamento já aprovado — atualizando a página em instantes." };
    }
    if (["pending", "in_process"].includes(pagamento.status) && pagamento.qrCode && pagamento.qrCodeBase64) {
      return { sucesso: true as const, qrCode: pagamento.qrCode, qrCodeBase64: pagamento.qrCodeBase64 };
    }
    // rejeitada/cancelada/expirada: segue e gera uma nova cobrança abaixo
  }

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

  // cashback cobre a taxa inteira — confirma direto, sem gerar cobrança Pix
  if (valorAPagar <= 0) {
    const { error } = await supabase.rpc("confirmar_pagamento_taxa", {
      p_transacao_id: transacaoId,
      p_usar_cashback: usarCashback,
    });
    if (error) return { erro: error.message };
    revalidatePath("/painel/compradora");
    return { sucesso: true as const, pago: true as const };
  }

  const descricao = transacao.reservas.pecas?.descricao
    ? `Taxa - ${transacao.reservas.pecas.descricao}`
    : "Taxa de reserva";

  const pagamento = await criarPagamentoPix({
    valor: valorAPagar,
    descricao,
    externalReference: transacaoId,
    payerEmail: user.email,
    notificationUrl: `${appUrl()}/api/webhooks/mercadopago`,
    idempotencyKey: randomUUID(),
  });

  if (!pagamento.qrCode || !pagamento.qrCodeBase64) {
    return { erro: "Não foi possível gerar o QR code do Pix. Tente novamente." };
  }

  const { error: erroSalvar } = await supabase.rpc("iniciar_pagamento_pix", {
    p_transacao_id: transacaoId,
    p_mp_payment_id: pagamento.id,
    p_usar_cashback: usarCashback,
  });
  if (erroSalvar) return { erro: erroSalvar.message };

  return { sucesso: true as const, qrCode: pagamento.qrCode, qrCodeBase64: pagamento.qrCodeBase64 };
}

export async function verificarPagamentoTaxa(transacaoId: string) {
  const supabase = await createClient();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select("status_pagamento, mp_payment_id, usar_cashback_solicitado")
    .eq("id", transacaoId)
    .single();

  if (!transacao) return { pago: false };
  if (transacao.status_pagamento === "pago") return { pago: true };
  if (!transacao.mp_payment_id) return { pago: false };

  const pagamento = await buscarPagamentoPix(transacao.mp_payment_id);
  if (pagamento.status !== "approved") return { pago: false };

  // confirma na hora caso o webhook ainda não tenha processado — chamada repetida é inofensiva
  const { error } = await supabase.rpc("confirmar_pagamento_taxa", {
    p_transacao_id: transacaoId,
    p_usar_cashback: transacao.usar_cashback_solicitado,
  });
  if (error && !error.message.includes("já processado")) return { pago: false };

  revalidatePath("/painel/compradora");
  return { pago: true };
}
