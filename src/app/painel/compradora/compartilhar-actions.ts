"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";

export async function gerarLinkCompartilhamento(pecaId: string | null) {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Sessão expirada." };

  const supabase = await createClient();

  const existente = await buscarLinkExistente(supabase, usuario.id, pecaId);
  if (existente) return { sucesso: true, id: existente };

  const { data, error } = await supabase
    .from("compartilhamentos")
    .insert({ usuario_id: usuario.id, peca_id: pecaId })
    .select("id")
    .single();

  if (error) {
    // corrida rara (duas abas clicando ao mesmo tempo): a outra já criou o link
    if (error.code === "23505") {
      const criadoPelaOutraAba = await buscarLinkExistente(supabase, usuario.id, pecaId);
      if (criadoPelaOutraAba) return { sucesso: true, id: criadoPelaOutraAba };
    }
    return { erro: error.message };
  }

  revalidatePath("/painel/compradora");
  return { sucesso: true, id: data.id };
}

async function buscarLinkExistente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuarioId: string,
  pecaId: string | null,
) {
  let query = supabase.from("compartilhamentos").select("id").eq("usuario_id", usuarioId);
  query = pecaId ? query.eq("peca_id", pecaId) : query.is("peca_id", null);
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}
