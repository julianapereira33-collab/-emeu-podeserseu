import { NextRequest, NextResponse } from "next/server";
import { buscarPagamentoPix } from "@/lib/mercadopago/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  let paymentId: string | null = null;

  try {
    const body = await request.json();
    if (body?.type === "payment" && body?.data?.id) {
      paymentId = String(body.data.id);
    }
  } catch {
    // corpo vazio ou não-JSON — tenta pelos query params abaixo
  }

  if (!paymentId) {
    const url = new URL(request.url);
    paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  }

  if (!paymentId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // nunca confia no status vindo da notificação — sempre confirma direto na API do Mercado Pago
  const pagamento = await buscarPagamentoPix(paymentId);

  if (pagamento.status !== "approved" || !pagamento.externalReference) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const supabase = createServiceRoleClient();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select("status_pagamento, usar_cashback_solicitado")
    .eq("id", pagamento.externalReference)
    .maybeSingle();

  if (!transacao || transacao.status_pagamento === "pago") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { error } = await supabase.rpc("confirmar_pagamento_taxa", {
    p_transacao_id: pagamento.externalReference,
    p_usar_cashback: transacao.usar_cashback_solicitado,
  });

  if (error && !error.message.includes("já processado")) {
    console.error("Erro ao confirmar pagamento via webhook Mercado Pago:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  // Mercado Pago faz uma checagem inicial via GET ao cadastrar a URL — responde OK.
  return NextResponse.json({ ok: true });
}
