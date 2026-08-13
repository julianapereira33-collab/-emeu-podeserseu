"use server";

import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/app-url";
import { redirect } from "next/navigation";

export type CadastroState = { erro?: string };

export async function cadastrar(
  _prev: CadastroState,
  formData: FormData,
): Promise<CadastroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const tipo = String(formData.get("tipo") ?? "vendedora"); // vendedora | loja | compradora | parceira

  if (!nome || !whatsapp || !email || senha.length < 6) {
    return { erro: "Preencha nome, WhatsApp, e-mail e uma senha com pelo menos 6 caracteres." };
  }

  const papel = ["loja", "compradora", "parceira"].includes(tipo) ? tipo : "vendedora";

  const supabase = await createClient();

  // O perfil em public.usuarios é criado automaticamente pelo trigger
  // `on_auth_user_created` a partir desses metadados (ver migration
  // `fase1_trigger_novo_usuario`) — assim o cadastro funciona mesmo com
  // confirmação de e-mail pendente, sem depender de sessão ativa.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, whatsapp, cidade, papel },
      // o link do e-mail volta para /auth/confirm, que troca o token por sessão
      emailRedirectTo: `${await appOrigin()}/auth/confirm?next=/auth/confirmado`,
    },
  });

  if (signUpError || !signUpData.user) {
    return { erro: signUpError?.message ?? "Não foi possível criar a conta." };
  }

  if (!signUpData.session) {
    redirect("/login?cadastrado=1");
  }

  redirect("/painel");
}
