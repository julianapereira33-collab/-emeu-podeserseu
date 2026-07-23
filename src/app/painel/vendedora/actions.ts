"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function confirmarReserva(reservaId: string) {
  const supabase = await createClient();

  const { data: reserva, error: fetchError } = await supabase
    .from("reservas")
    .select("valor_proposta")
    .eq("id", reservaId)
    .single();

  if (fetchError) {
    return { erro: fetchError.message };
  }

  const { error } = await supabase
    .from("reservas")
    .update({ status: "confirmada", valor_aceito: reserva.valor_proposta })
    .eq("id", reservaId);

  if (error) return { erro: error.message };

  revalidatePath("/painel/vendedora");
  return { sucesso: true };
}

export async function recusarReserva(reservaId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reservas")
    .update({ status: "recusada" })
    .eq("id", reservaId);

  if (error) return { erro: error.message };

  revalidatePath("/painel/vendedora");
  return { sucesso: true };
}
