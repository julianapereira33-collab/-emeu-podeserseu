"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { criarPreferenciaCheckout, buscarPagamentoPorReferencia } from "@/lib/mercadopago/client";

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

type ResultadoCheckout = { erro: string } | { sucesso: true; preferenceId: string };

export async function pagarAtendimento(atendimentoId: string): Promise<ResultadoCheckout> {
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

  const descricao =
    atendimento.tipo === "curadoria"
      ? "Atendimento assistido - curadoria"
      : "Atendimento assistido - prova presencial";

  const { preferenceId } = await criarPreferenciaCheckout({
    valor: atendimento.valor,
    descricao,
    externalReference: atendimentoId,
    payerEmail: user.email,
    notificationUrl: `${appUrl()}/api/webhooks/mercadopago`,
    backUrl: `${appUrl()}/painel/vendedora`,
  });

  return { sucesso: true as const, preferenceId };
}

export async function verificarPagamentoAtendimento(atendimentoId: string) {
  const supabase = await createClient();

  const { data: atendimento } = await supabase
    .from("atendimentos_assistidos")
    .select("status_pagamento")
    .eq("id", atendimentoId)
    .single();

  if (!atendimento) return { pago: false };
  if (atendimento.status_pagamento === "pago") return { pago: true };

  const pagamento = await buscarPagamentoPorReferencia(atendimentoId);
  if (!pagamento || pagamento.status !== "approved") return { pago: false };

  // confirma na hora caso o webhook ainda não tenha processado — chamada repetida é inofensiva
  const { error } = await supabase.rpc("confirmar_pagamento_atendimento", {
    p_atendimento_id: atendimentoId,
  });
  if (error && !error.message.includes("já processado")) return { pago: false };

  revalidatePath("/painel/vendedora");
  return { pago: true };
}
