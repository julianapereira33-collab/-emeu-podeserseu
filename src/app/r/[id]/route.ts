import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

// Não precisa ser segredo — só evita que o hash seja revertido por rainbow table
// trivial do espaço de IPv4. A dona do link só enxerga o hash, nunca o IP.
const PEPPER = "emeu-podeserseu-cliques-v1";

function hashIp(ip: string) {
  return createHash("sha256").update(`${PEPPER}:${ip}`).digest("hex");
}

// Robôs de preview (WhatsApp, Facebook, Telegram etc.) buscam esta URL pra montar a
// prévia do link quando alguém cola no grupo — isso não é um acesso real de alguém
// interessado na peça, e não pode contar como clique de cashback/comissão.
const BOT_DE_PREVIEW =
  /whatsapp|facebookexternalhit|telegrambot|slackbot|discordbot|twitterbot|linkedinbot|bot|crawler|spider|preview/i;

function ehBotDePreview(userAgent: string | null) {
  return Boolean(userAgent && BOT_DE_PREVIEW.test(userAgent));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: compartilhamento } = await supabase
    .from("compartilhamentos")
    .select("id, peca_id")
    .eq("id", id)
    .maybeSingle();

  const destino = compartilhamento?.peca_id ? `/pecas/${compartilhamento.peca_id}` : "/vitrine";
  const response = NextResponse.redirect(new URL(destino, request.url));

  if (compartilhamento && !ehBotDePreview(request.headers.get("user-agent"))) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    // Registra o clique real — é isso que conta para cashback/comissão,
    // não o simples ato de compartilhar o link.
    await supabase.from("cliques_compartilhamento").insert({
      compartilhamento_id: id,
      ip_hash: ip ? hashIp(ip) : null,
    });

    // Guarda a origem por 30 dias para atribuir a próxima reserva desta
    // visitante a quem compartilhou o link (cashback da compradora não
    // depende disso, só a comissão de parceira/embaixadora).
    response.cookies.set("ref_compartilhamento", id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}
