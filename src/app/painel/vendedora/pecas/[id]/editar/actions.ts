"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { redirect } from "next/navigation";

export type EditarPecaState = { erro?: string };

export async function atualizarPeca(
  pecaId: string,
  _prev: EditarPecaState,
  formData: FormData,
): Promise<EditarPecaState> {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Sessão expirada, entre novamente." };

  const descricao = String(formData.get("descricao") ?? "").trim();
  const tamanho = String(formData.get("tamanho") ?? "").trim();
  const cor = String(formData.get("cor") ?? "").trim();
  const tecido = String(formData.get("tecido") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const precoRaw = String(formData.get("preco_anunciado") ?? "").trim();
  const exclusividade = formData.get("exclusividade") === "on";
  const novasFotosOriginais = formData.getAll("novas_fotos_originais").map(String).filter(Boolean);
  const novasFotosTratadas = formData.getAll("novas_fotos_tratadas").map(String).filter(Boolean);
  const fotosOriginaisExistentes = formData
    .getAll("fotos_originais_existentes")
    .map(String)
    .filter(Boolean);
  const fotosTratadasExistentes = formData
    .getAll("fotos_tratadas_existentes")
    .map(String)
    .filter(Boolean);

  const preco = Number(precoRaw.replace(",", "."));

  if (!descricao || !tamanho || !cor || !estado || !tipo || !preco || preco <= 0) {
    return { erro: "Preencha descrição, tamanho, cor, estado, tipo e preço." };
  }

  const fotosOriginais = [...fotosOriginaisExistentes, ...novasFotosOriginais];
  const fotosTratadas = [...fotosTratadasExistentes, ...novasFotosTratadas];
  if (fotosOriginais.length === 0) {
    return { erro: "A peça precisa de ao menos uma foto." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pecas")
    .update({
      descricao,
      tamanho,
      cor,
      tecido: tecido || null,
      estado,
      tipo,
      preco_anunciado: preco,
      exclusividade,
      fotos_originais: fotosOriginais,
      fotos_tratadas: fotosTratadas,
      // volta para curadoria depois de editada, se estava reprovada
      status: "pendente",
      motivo_reprovacao: null,
    })
    .eq("id", pecaId)
    .eq("dono_id", usuario.id);

  if (error) return { erro: error.message };

  redirect("/painel/vendedora");
}
