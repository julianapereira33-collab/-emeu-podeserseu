"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { revalidatePath } from "next/cache";

export type AvaliarState = { erro?: string; sucesso?: boolean };

export async function avaliar(
  input: { transacaoId: string; tipoAlvo: "peca" | "vendedora" | "locadora"; avaliadoId: string | null },
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
  const { error } = await supabase.from("avaliacoes").insert({
    transacao_id: input.transacaoId,
    tipo_alvo: input.tipoAlvo,
    avaliador_id: usuario.id,
    avaliado_id: input.avaliadoId,
    nota,
    comentario: comentario || null,
  });

  if (error) return { erro: error.message };

  revalidatePath("/painel/compradora");
  return { sucesso: true };
}
