"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";
import { estornarPagamento } from "@/lib/mercadopago/client";

export type EstornoState = { erro?: string; sucesso?: boolean };

/**
 * Estorno é ação exclusiva de admin, nunca self-service da compradora —
 * exige motivo por escrito (fica auditável em transacoes.estorno_motivo)
 * e só é permitido uma vez por transação, para reduzir risco de golpe.
 */
export async function estornarTransacao(transacaoId: string, motivo: string): Promise<EstornoState> {
  const usuario = await getCurrentUsuario();
  if (!usuario?.papel.includes("admin")) {
    return { erro: "Apenas a curadoria pode estornar um pagamento." };
  }

  const motivoLimpo = motivo.trim();
  if (motivoLimpo.length < 15) {
    return { erro: "Descreva o motivo do estorno (mínimo 15 caracteres) — fica registrado." };
  }

  const supabase = await createClient();
  const { data: transacao } = await supabase
    .from("transacoes")
    .select("status_pagamento, mp_payment_id")
    .eq("id", transacaoId)
    .maybeSingle();

  if (!transacao) return { erro: "Transação não encontrada." };
  if (transacao.status_pagamento === "estornado") {
    return { erro: "Essa transação já foi estornada anteriormente." };
  }
  if (transacao.status_pagamento !== "pago") {
    return { erro: "Só é possível estornar uma transação com status pago." };
  }
  if (!transacao.mp_payment_id) {
    return {
      erro:
        "Essa transação não tem um pagamento no Mercado Pago associado (provavelmente foi quitada " +
        "só com cashback) — reverta o cashback manualmente em vez de usar este estorno.",
    };
  }

  try {
    await estornarPagamento(transacao.mp_payment_id);
  } catch (err) {
    return { erro: err instanceof Error ? err.message : "Erro ao estornar no Mercado Pago." };
  }

  const { error } = await createServiceRoleClient()
    .from("transacoes")
    .update({
      status_pagamento: "estornado",
      estorno_motivo: motivoLimpo,
      estornado_por: usuario.id,
      estornado_em: new Date().toISOString(),
    })
    .eq("id", transacaoId);

  if (error) return { erro: error.message };

  revalidatePath("/painel/admin");
  revalidatePath("/painel/compradora");
  revalidatePath("/painel/vendedora");
  return { sucesso: true };
}
