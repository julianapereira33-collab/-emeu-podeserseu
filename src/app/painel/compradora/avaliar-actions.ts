"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";

export type AvaliarState = { erro?: string; sucesso?: boolean };

export async function avaliar(
  input: { transacaoId: string; tipoAlvo: "peca" | "vendedora" | "locadora" },
  _prev: AvaliarState,
  formData: FormData,
): Promise<AvaliarState> {
  const usuario = await getCurrentUsuario();
  if (!usuario) return { erro: "Sessão expirada." };

  const nota = Number(formData.get("nota"));
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (!nota || nota < 1 || nota > 5) {
    return { erro: "Escolha uma nota de 1 a 5." };
  }

  const supabase = await createClient();

  // avaliado_id nunca vem do cliente — sempre derivado aqui do dono real da peça
  // ligada à transação, pra ninguém conseguir postar avaliação em quem quiser.
  let avaliadoId: string | null = null;
  if (input.tipoAlvo !== "peca") {
    const { data: transacao } = await supabase
      .from("transacoes")
      .select("reservas(pecas(dono_id))")
      .eq("id", input.transacaoId)
      .maybeSingle();
    avaliadoId = transacao?.reservas?.pecas?.dono_id ?? null;
    if (!avaliadoId) return { erro: "Não foi possível identificar quem avaliar." };
  }

  const { error } = await supabase.from("avaliacoes").insert({
    transacao_id: input.transacaoId,
    tipo_alvo: input.tipoAlvo,
    avaliador_id: usuario.id,
    avaliado_id: avaliadoId,
    nota,
    comentario: comentario || null,
  });

  if (error) return { erro: error.message };

  revalidatePath("/painel/compradora");
  return { sucesso: true };
}
