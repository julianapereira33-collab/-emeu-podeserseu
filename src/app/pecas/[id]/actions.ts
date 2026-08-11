"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { enviarWhatsapp } from "@/lib/evolution/client";

function appUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  return host ? (host.startsWith("http") ? host : `https://${host}`) : null;
}

export type ReservarState = { erro?: string; sucesso?: boolean };

export async function reservar(
  pecaId: string,
  _prev: ReservarState,
  formData: FormData,
): Promise<ReservarState> {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    return { erro: "Você precisa entrar na sua conta para reservar." };
  }

  const valorPropostaRaw = String(formData.get("valor_proposta") ?? "").trim();
  const valorProposta = valorPropostaRaw ? Number(valorPropostaRaw.replace(",", ".")) : null;

  if (valorPropostaRaw && (Number.isNaN(valorProposta) || (valorProposta ?? 0) <= 0)) {
    return { erro: "Informe um valor de proposta válido." };
  }

  if (formData.get("termos_aceitos") !== "on") {
    return { erro: "É preciso aceitar os termos de uso para reservar." };
  }
  const termosVersao = String(formData.get("termos_versao") ?? "").trim() || null;

  const supabase = await createClient();

  const { data: peca } = await supabase
    .from("pecas")
    .select("tipo, dono_id, descricao")
    .eq("id", pecaId)
    .maybeSingle();

  const locacaoInicio = String(formData.get("locacao_inicio") ?? "").trim() || null;
  const locacaoFim = String(formData.get("locacao_fim") ?? "").trim() || null;

  if (peca?.tipo === "aluguel") {
    if (!locacaoInicio || !locacaoFim) {
      return { erro: "Informe as datas de retirada e devolução." };
    }
    if (locacaoFim < locacaoInicio) {
      return { erro: "A data de devolução precisa ser depois da data de retirada." };
    }
  }

  if (peca?.tipo === "aluguel" && locacaoInicio && locacaoFim) {
    const { data: ocupados } = await supabase.rpc("periodos_ocupados", { p_peca_id: pecaId });
    const sobrepoe = ocupados?.some(
      (p) => p.locacao_inicio && p.locacao_fim && locacaoInicio <= p.locacao_fim && locacaoFim >= p.locacao_inicio,
    );
    if (sobrepoe) {
      return { erro: "Essas datas já estão reservadas para esta peça. Escolha outro período." };
    }
  }

  // Atribui a reserva a um link de parceira/embaixadora, se a compradora
  // chegou até aqui por um (ver rota /r/[id]). Não é crítico para o
  // fluxo principal — se o link não existir mais, só não gera comissão.
  const compartilhamentoId = (await cookies()).get("ref_compartilhamento")?.value;
  let compartilhamentoValido: string | null = null;
  if (compartilhamentoId) {
    const { data } = await supabase
      .from("compartilhamentos")
      .select("id")
      .eq("id", compartilhamentoId)
      .maybeSingle();
    compartilhamentoValido = data?.id ?? null;
  }

  const { error } = await supabase.from("reservas").insert({
    peca_id: pecaId,
    compradora_id: usuario.id,
    valor_proposta: valorProposta,
    termos_aceitos: true,
    termos_versao: termosVersao,
    compartilhamento_id: compartilhamentoValido,
    locacao_inicio: locacaoInicio,
    locacao_fim: locacaoFim,
  });

  if (error) {
    // As regras (piso mínimo, peça já reservada, mesmo WhatsApp) são
    // validadas no banco (trigger `trg_reservas_before_insert`) — a
    // mensagem já vem pronta para exibição.
    return { erro: error.message };
  }

  if (peca?.dono_id) {
    const { data: vendedora } = await supabase
      .from("usuarios")
      .select("whatsapp")
      .eq("id", peca.dono_id)
      .maybeSingle();
    const base = appUrl();
    if (vendedora?.whatsapp) {
      await enviarWhatsapp(
        vendedora.whatsapp,
        `Você recebeu uma reserva para "${peca.descricao}". Confirme a disponibilidade em até 24h${base ? ` em ${base}/painel/vendedora` : " no seu painel"}.`,
      );
    }
  }

  revalidatePath(`/pecas/${pecaId}`);
  revalidatePath("/vitrine");
  return { sucesso: true };
}

export async function toggleFavorito(pecaId: string): Promise<{ favoritado: boolean } | { erro: string }> {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Você precisa entrar na sua conta para favoritar." };

  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("favoritos")
    .select("id")
    .eq("usuario_id", usuario.id)
    .eq("peca_id", pecaId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase.from("favoritos").delete().eq("id", existente.id);
    if (error) return { erro: error.message };
    revalidatePath("/vitrine");
    revalidatePath(`/pecas/${pecaId}`);
    revalidatePath("/painel/compradora");
    return { favoritado: false };
  }

  const { error } = await supabase
    .from("favoritos")
    .insert({ usuario_id: usuario.id, peca_id: pecaId });
  if (error) return { erro: error.message };

  revalidatePath("/vitrine");
  revalidatePath(`/pecas/${pecaId}`);
  revalidatePath("/painel/compradora");
  return { favoritado: true };
}
