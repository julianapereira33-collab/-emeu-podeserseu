"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarNotificacaoLida(notificacaoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true })
    .eq("id", notificacaoId);

  if (error) return { erro: error.message };
  revalidatePath("/", "layout");
  return { sucesso: true };
}

export async function marcarTodasNotificacoesLidas() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true })
    .eq("lida", false);

  if (error) return { erro: error.message };
  revalidatePath("/", "layout");
  return { sucesso: true };
}
