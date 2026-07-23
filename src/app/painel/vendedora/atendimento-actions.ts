"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";

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

export async function pagarAtendimento(atendimentoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_pagamento_atendimento", {
    p_atendimento_id: atendimentoId,
  });

  if (error) return { erro: error.message };
  revalidatePath("/painel/vendedora");
  return { sucesso: true };
}
