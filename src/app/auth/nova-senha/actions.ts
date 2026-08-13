"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NovaSenhaState = { erro?: string };

export async function definirNovaSenha(
  _prev: NovaSenhaState,
  formData: FormData,
): Promise<NovaSenhaState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  if (senha !== confirmacao) return { erro: "As duas senhas não são iguais." };

  const supabase = await createClient();

  // A sessão vem do link de recuperação, trocado por sessão em /auth/confirm.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "O link expirou. Peça um novo link em “Esqueci minha senha”." };
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível alterar a senha. Tente de novo." };

  redirect("/painel");
}
