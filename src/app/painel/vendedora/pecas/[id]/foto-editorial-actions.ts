"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";
import { gerarFotoEditorialBase64 } from "@/lib/openai/client";
import type { Tables } from "@/types/database";

async function podeEditar(
  pecaId: string,
): Promise<{ peca: Tables<"pecas"> } | { erro: string }> {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Sessão expirada, entre novamente." };

  const supabase = await createClient();
  const { data: peca } = await supabase.from("pecas").select("*").eq("id", pecaId).maybeSingle();
  if (!peca) return { erro: "Peça não encontrada." };

  const ehAdmin = usuario.papel.includes("admin");
  if (peca.dono_id !== usuario.id && !ehAdmin) return { erro: "Sem permissão." };

  return { peca };
}

function revalidarPeca(pecaId: string) {
  revalidatePath("/painel/vendedora");
  revalidatePath(`/pecas/${pecaId}`);
  revalidatePath("/vitrine");
}

export async function gerarFotoEditorial(pecaId: string): Promise<{ url: string } | { erro: string }> {
  const checagem = await podeEditar(pecaId);
  if ("erro" in checagem) return { erro: checagem.erro };
  const { peca } = checagem;

  const fotoBase = peca.fotos_tratadas[0] ?? peca.fotos_originais[0];
  if (!fotoBase) return { erro: "Cadastre pelo menos uma foto antes de gerar a versão editorial." };

  try {
    const base64 = await gerarFotoEditorialBase64(fotoBase, peca.descricao);
    const buffer = Buffer.from(base64, "base64");
    const path = `${peca.dono_id}/${peca.id}-editorial.png`;

    const supabase = await createClient();
    const { error: erroUpload } = await supabase.storage
      .from("pecas-fotos")
      .upload(path, buffer, { upsert: true, contentType: "image/png" });
    if (erroUpload) return { erro: erroUpload.message };

    const url = supabase.storage.from("pecas-fotos").getPublicUrl(path).data.publicUrl;

    // Escrita via service role: dono não tem UPDATE liberado em pecas.status = 'aprovado' via RLS,
    // e a foto editorial precisa poder ser gerada mesmo depois de a peça já estar na vitrine.
    const { error: erroDb } = await createServiceRoleClient()
      .from("pecas")
      .update({ foto_editorial_url: url, foto_editorial_aprovada: false })
      .eq("id", pecaId);
    if (erroDb) return { erro: erroDb.message };

    revalidarPeca(pecaId);
    return { url };
  } catch (err) {
    return { erro: err instanceof Error ? err.message : "Erro ao gerar foto editorial." };
  }
}

export async function definirAprovacaoFotoEditorial(
  pecaId: string,
  aprovada: boolean,
): Promise<{ ok: true } | { erro: string }> {
  const checagem = await podeEditar(pecaId);
  if ("erro" in checagem) return { erro: checagem.erro };

  const update: { foto_editorial_aprovada: boolean; foto_editorial_url?: null } = {
    foto_editorial_aprovada: aprovada,
  };
  if (!aprovada) update.foto_editorial_url = null;

  const { error } = await createServiceRoleClient().from("pecas").update(update).eq("id", pecaId);
  if (error) return { erro: error.message };

  revalidarPeca(pecaId);
  return { ok: true };
}
