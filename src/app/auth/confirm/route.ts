import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const TIPOS_VALIDOS: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/** Só aceita caminho interno — nunca redireciona para fora do site. */
function destinoSeguro(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/auth/confirmado";
  return next;
}

/**
 * Fecha o ciclo dos e-mails do Supabase Auth (confirmação de cadastro e recuperação
 * de senha): troca o token do link por uma sessão de verdade e devolve a pessoa para
 * dentro do site já logada.
 *
 * Aceita os dois formatos de link que o Supabase pode mandar, dependendo do template
 * configurado no projeto:
 * - `?token_hash=...&type=...` (template com `{{ .TokenHash }}`) → `verifyOtp`
 * - `?code=...` (fluxo PKCE, `{{ .ConfirmationURL }}`) → `exchangeCodeForSession`
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  const code = searchParams.get("code");
  const destino = destinoSeguro(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && tipo && TIPOS_VALIDOS.includes(tipo as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(destino, request.url));
    console.error("Falha ao confirmar link de e-mail (verifyOtp):", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destino, request.url));
    console.error("Falha ao confirmar link de e-mail (exchangeCodeForSession):", error.message);
  }

  return NextResponse.redirect(new URL("/login?confirmacao=falhou", request.url));
}
