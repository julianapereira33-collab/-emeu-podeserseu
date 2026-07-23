import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { redirect } from "next/navigation";
import { CuradoriaCard } from "./curadoria-card";

export default async function PainelAdminPage() {
  const usuario = await getCurrentUsuario();
  if (!usuario?.papel.includes("admin")) redirect("/painel");

  const supabase = await createClient();
  const { data: pendentes } = await supabase
    .from("pecas")
    .select("*")
    .eq("status", "pendente")
    .order("criado_em", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Curadoria — fila de aprovação</h1>

      {(!pendentes || pendentes.length === 0) && (
        <p className="text-sm text-neutral-500">Nenhuma peça aguardando curadoria.</p>
      )}

      <ul className="flex flex-col gap-3">
        {pendentes?.map((peca) => (
          <CuradoriaCard key={peca.id} peca={peca} />
        ))}
      </ul>
    </div>
  );
}
