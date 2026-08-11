"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { criarPagamentoPix, buscarPagamentoPix } from "@/lib/mercadopago/client";

function appUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  if (!host) throw new Error("URL da aplicação não configurada (VERCEL_URL)");
  return host.startsWith("http") ? host : `https://${host}`;
}

export async function solicitarAtendimento(tipo: "curadoria" | "prova_presencial") {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase.from("atendimentos_assistidos").insert({
    usuario_id: usuario.id,
    tipo,
  });

  if (error) return { erro: error.message };
  revalidatePath("/painel/vendedora");
  return { sucesso: true };
}

type ResultadoPagamento =
  | { erro: string }
  | { sucesso: true; pago: true }
  | { sucesso: true; qrCode: string; qrCodeBase64: string };

export async function pagarAtendimento(atendimentoId: string): Promise<ResultadoPagamento> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Não foi possível identificar seu e-mail de cadastro." };

  const { data: atendimento, error: erroAtendimento } = await supabase
    .from("atendimentos_assistidos")
    .select("*")
    .eq("id", atendimentoId)
    .single();

  if (erroAtendimento || !atendimento) return { erro: "Atendimento não encontrado." };
  if (!atendimento.valor) return { erro: "A curadoria ainda não definiu o valor deste atendimento." };
  if (atendimento.status_pagamento !== "pendente") return { erro: "Pagamento já processado." };

  // já existe uma cobrança Pix gerada — reaproveita em vez de gerar outra
  if (atendimento.mp_payment_id) {
    const pagamento = await buscarPagamentoPix(atendimento.mp_payment_id);
    if (pagamento.status === "approved") {
      revalidatePath("/painel/vendedora");
      return { erro: "Pagamento já aprovado — atualizando a página em instantes." };
    }
    if (["pending", "in_process"].includes(pagamento.status) && pagamento.qrCode && pagamento.qrCodeBase64) {
      return { sucesso: true as const, qrCode: pagamento.qrCode, qrCodeBase64: pagamento.qrCodeBase64 };
    }
    // rejeitada/cancelada/expirada: segue e gera uma nova cobrança abaixo
  }

  const descricao =
    atendimento.tipo === "curadoria"
      ? "Atendimento assistido - curadoria"
      : "Atendimento assistido - prova presencial";

  const pagamento = await criarPagamentoPix({
    valor: atendimento.valor,
    descricao,
    externalReference: atendimentoId,
    payerEmail: user.email,
    notificationUrl: `${appUrl()}/api/webhooks/mercadopago`,
    idempotencyKey: randomUUID(),
  });

  if (!pagamento.qrCode || !pagamento.qrCodeBase64) {
    return { erro: "Não foi possível gerar o QR code do Pix. Tente novamente." };
  }

  const { error: erroSalvar } = await supabase.rpc("iniciar_pagamento_pix_atendimento", {
    p_atendimento_id: atendimentoId,
    p_mp_payment_id: pagamento.id,
  });
  if (erroSalvar) return { erro: erroSalvar.message };

  return { sucesso: true as const, qrCode: pagamento.qrCode, qrCodeBase64: pagamento.qrCodeBase64 };
}

export async function verificarPagamentoAtendimento(atendimentoId: string) {
  const supabase = await createClient();

  const { data: atendimento } = await supabase
    .from("atendimentos_assistidos")
    .select("status_pagamento, mp_payment_id")
    .eq("id", atendimentoId)
    .single();

  if (!atendimento) return { pago: false };
  if (atendimento.status_pagamento === "pago") return { pago: true };
  if (!atendimento.mp_payment_id) return { pago: false };

  const pagamento = await buscarPagamentoPix(atendimento.mp_payment_id);
  if (pagamento.status !== "approved") return { pago: false };

  // confirma na hora caso o webhook ainda não tenha processado — chamada repetida é inofensiva
  const { error } = await supabase.rpc("confirmar_pagamento_atendimento", {
    p_atendimento_id: atendimentoId,
  });
  if (error && !error.message.includes("já processado")) return { pago: false };

  revalidatePath("/painel/vendedora");
  return { pago: true };
}
