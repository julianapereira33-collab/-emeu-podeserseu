"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { enviarWhatsapp } from "@/lib/evolution/client";

function appUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  return host ? (host.startsWith("http") ? host : `https://${host}`) : null;
}

async function notificarCompradora(reservaId: string, mensagem: (pecaDescricao: string) => string) {
  const supabase = await createClient();
  const { data: reserva } = await supabase
    .from("reservas")
    .select("compradora_id, pecas(descricao), usuarios!reservas_compradora_id_fkey(whatsapp)")
    .eq("id", reservaId)
    .maybeSingle();

  const whatsapp = reserva?.usuarios?.whatsapp;
  if (whatsapp) {
    await enviarWhatsapp(whatsapp, mensagem(reserva?.pecas?.descricao ?? "a peça"));
  }
}

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

  const base = appUrl();
  await notificarCompradora(
    reservaId,
    (peca) =>
      `A vendedora confirmou a disponibilidade de "${peca}". Pague a taxa para liberar o contato${base ? ` em ${base}/painel/compradora` : ""}.`,
  );

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

  await notificarCompradora(
    reservaId,
    (peca) => `"${peca}" não está mais disponível para essa reserva. Nada foi cobrado.`,
  );

  revalidatePath("/painel/vendedora");
  return { sucesso: true };
}
