import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: compartilhamento } = await supabase
    .from("compartilhamentos")
    .select("peca_id")
    .eq("id", id)
    .maybeSingle();

  if (compartilhamento) {
    // Registra o clique real — é isso que conta para o cashback da
    // compradora, não o simples ato de compartilhar o link.
    await supabase.from("cliques_compartilhamento").insert({ compartilhamento_id: id });
  }

  const destino = compartilhamento?.peca_id ? `/pecas/${compartilhamento.peca_id}` : "/vitrine";
  return NextResponse.redirect(new URL(destino, request.url));
}
