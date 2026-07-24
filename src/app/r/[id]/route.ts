import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  if (compartilhamento) {
    // Registra o clique real — é isso que conta para cashback/comissão,
    // não o simples ato de compartilhar o link.
    await supabase.from("cliques_compartilhamento").insert({ compartilhamento_id: id });

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
