"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function definirValorAtendimento(atendimentoId: string, valor: number) {
  if (!valor || valor <= 0) return { erro: "Informe um valor válido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("atendimentos_assistidos")
    .update({ valor, status: "agendado" })
    .eq("id", atendimentoId);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}

export async function concluirAtendimento(atendimentoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("atendimentos_assistidos")
    .update({ status: "concluido" })
    .eq("id", atendimentoId);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}
