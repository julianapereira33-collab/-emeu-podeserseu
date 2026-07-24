"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function promoverPapel(whatsapp: string, papel: "parceira" | "embaixadora") {
  if (!whatsapp.trim()) return { erro: "Informe o WhatsApp da usuária." };

  const supabase = await createClient();
  const { data: alvo, error: buscaError } = await supabase
    .from("usuarios")
    .select("id, papel")
    .eq("whatsapp", whatsapp.trim())
    .maybeSingle();

  if (buscaError) return { erro: buscaError.message };
  if (!alvo) return { erro: "Nenhuma usuária encontrada com esse WhatsApp." };
  if (alvo.papel.includes(papel)) return { erro: "Essa usuária já tem esse papel." };

  const { error } = await supabase
    .from("usuarios")
    .update({ papel: [...alvo.papel, papel] })
    .eq("id", alvo.id);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}

export async function definirRecrutadoPor(whatsappLoja: string, whatsappEmbaixadora: string) {
  if (!whatsappLoja.trim() || !whatsappEmbaixadora.trim()) {
    return { erro: "Informe o WhatsApp da loja e da embaixadora." };
  }

  const supabase = await createClient();

  const { data: embaixadora, error: e1 } = await supabase
    .from("usuarios")
    .select("id, papel")
    .eq("whatsapp", whatsappEmbaixadora.trim())
    .maybeSingle();
  if (e1) return { erro: e1.message };
  if (!embaixadora) return { erro: "Embaixadora não encontrada." };
  if (!embaixadora.papel.includes("embaixadora")) {
    return { erro: "Essa usuária ainda não tem o papel de embaixadora." };
  }

  const { data: loja, error: e2 } = await supabase
    .from("usuarios")
    .select("id")
    .eq("whatsapp", whatsappLoja.trim())
    .maybeSingle();
  if (e2) return { erro: e2.message };
  if (!loja) return { erro: "Loja não encontrada." };

  const { error } = await supabase
    .from("usuarios")
    .update({ recrutado_por: embaixadora.id })
    .eq("id", loja.id);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}

export async function marcarComissaoPaga(comissaoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comissoes").update({ paga: true }).eq("id", comissaoId);

  if (error) return { erro: error.message };
  revalidatePath("/painel/admin");
  return { sucesso: true };
}
