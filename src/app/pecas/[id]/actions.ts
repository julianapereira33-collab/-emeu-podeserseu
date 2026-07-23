"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";

export type ReservarState = { erro?: string; sucesso?: boolean };

export async function reservar(
  pecaId: string,
  _prev: ReservarState,
  formData: FormData,
): Promise<ReservarState> {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    return { erro: "Você precisa entrar na sua conta para reservar." };
  }

  const valorPropostaRaw = String(formData.get("valor_proposta") ?? "").trim();
  const valorProposta = valorPropostaRaw ? Number(valorPropostaRaw.replace(",", ".")) : null;

  if (valorPropostaRaw && (Number.isNaN(valorProposta) || (valorProposta ?? 0) <= 0)) {
    return { erro: "Informe um valor de proposta válido." };
  }

  if (formData.get("termos_aceitos") !== "on") {
    return { erro: "É preciso aceitar os termos de uso para reservar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reservas").insert({
    peca_id: pecaId,
    compradora_id: usuario.id,
    valor_proposta: valorProposta,
    termos_aceitos: true,
  });

  if (error) {
    // As regras (piso mínimo, peça já reservada, mesmo WhatsApp) são
    // validadas no banco (trigger `trg_reservas_before_insert`) — a
    // mensagem já vem pronta para exibição.
    return { erro: error.message };
  }

  revalidatePath(`/pecas/${pecaId}`);
  revalidatePath("/vitrine");
  return { sucesso: true };
}
