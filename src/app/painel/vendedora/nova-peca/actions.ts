"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { redirect } from "next/navigation";

export type NovaPecaState = { erro?: string };

export async function cadastrarPeca(
  _prev: NovaPecaState,
  formData: FormData,
): Promise<NovaPecaState> {
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
  const vendaAssistida = formData.get("venda_assistida") === "on";
  const fotosOriginais = formData.getAll("fotos_originais").map(String).filter(Boolean);
  const fotosTratadas = formData.getAll("fotos_tratadas").map(String).filter(Boolean);
  const videoUrl = String(formData.get("video_url") ?? "").trim();

  const preco = Number(precoRaw.replace(",", "."));

  if (!descricao || !tamanho || !cor || !estado || !tipo || !preco || preco <= 0) {
    return { erro: "Preencha descrição, tamanho, cor, estado, tipo e preço." };
  }
  if (fotosOriginais.length < 3) {
    return { erro: "Envie as 3 fotos obrigatórias (frente, costas, detalhe)." };
  }
  if (!videoUrl) {
    return { erro: "Envie um vídeo mostrando o estado real da peça." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pecas").insert({
    dono_id: usuario.id,
    descricao,
    tamanho,
    cor,
    tecido: tecido || null,
    estado,
    tipo,
    preco_anunciado: preco,
    exclusividade,
    venda_assistida: vendaAssistida,
    fotos_originais: fotosOriginais,
    fotos_tratadas: fotosTratadas,
    video_url: videoUrl,
  });

  if (error) return { erro: error.message };

  redirect("/painel/vendedora");
}

export async function sugerirPreco(input: {
  descricao: string;
  tamanho: string;
  tecido: string;
  estado: string;
}): Promise<{ sugestao?: string; erro?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { erro: "Sugestão de preço por IA não configurada (ANTHROPIC_API_KEY ausente)." };
  }

  const prompt = `Você ajuda vendedoras de um marketplace de moda circular (vestidos de festa em segunda mão) a precificar peças.
Dados da peça: descrição "${input.descricao}", tamanho ${input.tamanho}, tecido ${input.tecido || "não informado"}, estado ${input.estado}.
Responda em português, em no máximo 2 frases curtas, com uma faixa de preço sugerida em reais (R$) e uma justificativa breve. Não use markdown.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return { erro: "Não foi possível obter uma sugestão de preço agora." };
  }

  const data = await res.json();
  const texto = data.content?.[0]?.text as string | undefined;
  return { sugestao: texto };
}
