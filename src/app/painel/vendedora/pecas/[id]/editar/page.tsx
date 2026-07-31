import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { EditarPecaForm } from "./editar-peca-form";

export default async function EditarPecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: peca } = await supabase.from("pecas").select("*").eq("id", id).maybeSingle();

  if (!peca || peca.dono_id !== usuario.id) notFound();
  if (peca.status !== "pendente" && peca.status !== "reprovado") {
    redirect("/painel/vendedora");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar peça</h1>
      <EditarPecaForm peca={peca} />
    </div>
  );
}
