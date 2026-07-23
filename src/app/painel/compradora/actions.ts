"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function pagarTaxa(transacaoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_pagamento_taxa", {
    p_transacao_id: transacaoId,
  });

  if (error) return { erro: error.message };
  revalidatePath("/painel/compradora");
  return { sucesso: true };
}
