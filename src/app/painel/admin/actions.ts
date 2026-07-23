"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function aprovarPeca(pecaId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pecas")
    .update({ status: "aprovado", motivo_reprovacao: null })
    .eq("id", pecaId);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}

export async function reprovarPeca(pecaId: string, motivo: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pecas")
    .update({ status: "reprovado", motivo_reprovacao: motivo || "Não especificado" })
    .eq("id", pecaId);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}

export async function registrarDenunciaAction(
  vendedoraId: string,
  motivo: string,
  evidencia: string,
) {
  if (!motivo.trim()) return { erro: "Descreva o motivo da denúncia." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_denuncia", {
    p_vendedora_id: vendedoraId,
    p_motivo: motivo,
    p_evidencia: evidencia || undefined,
  });

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true, banido: Boolean(data?.banido_em) };
}
