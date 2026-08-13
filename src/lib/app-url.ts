import { headers } from "next/headers";

/**
 * Origem (protocolo + host) da requisição atual, usada para montar os links que o
 * Supabase Auth manda por e-mail (confirmação de cadastro, recuperação de senha).
 *
 * Diferente do `appUrl()` usado no pagamento: ali o endereço precisa ser sempre o
 * canônico de produção (o Mercado Pago chama o webhook de fora, sem requisição nossa);
 * aqui precisa ser o mesmo host em que a pessoa está navegando, para o link do e-mail
 * cair de volta no ambiente certo (localhost, preview da Vercel ou produção).
 */
export async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (host) {
    const ehLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const protocolo = h.get("x-forwarded-proto") ?? (ehLocal ? "http" : "https");
    return `${protocolo}://${host}`;
  }

  const fallback =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  if (!fallback) throw new Error("Não foi possível determinar o endereço da aplicação.");
  return fallback.startsWith("http") ? fallback : `https://${fallback}`;
}
