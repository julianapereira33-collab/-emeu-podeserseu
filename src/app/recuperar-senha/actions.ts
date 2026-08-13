"use server";

import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/app-url";

export type RecuperarSenhaState = { erro?: string; enviado?: boolean };

export async function enviarLinkRecuperacao(
  _prev: RecuperarSenhaState,
  formData: FormData,
): Promise<RecuperarSenhaState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { erro: "Informe o e-mail da sua conta." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await appOrigin()}/auth/confirm?next=/auth/nova-senha`,
  });

  // Nunca revelamos se o e-mail existe ou não na base — a resposta é sempre a mesma,
  // senão a tela vira um verificador de quem tem conta aqui.
  if (error) {
    console.error("Erro ao enviar link de recuperação de senha:", error.message);
  }

  return { enviado: true };
}
