"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";

export async function gerarLinkCompartilhamento(pecaId: string | null) {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Sessão expirada." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compartilhamentos")
    .insert({ usuario_id: usuario.id, peca_id: pecaId })
    .select("id")
    .single();

  if (error) return { erro: error.message };

  revalidatePath("/painel/compradora");
  return { sucesso: true, id: data.id };
}
