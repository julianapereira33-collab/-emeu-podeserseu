import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { redirect } from "next/navigation";
import { CuradoriaCard } from "./curadoria-card";
import { DenunciaCard } from "./denuncia-card";
import { AtendimentoCard } from "./atendimento-card";
import { RedeSection } from "./rede-section";
import { ComissoesSection } from "./comissoes-section";

export default async function PainelAdminPage() {
  const usuario = await getCurrentUsuario();
  if (!usuario?.papel.includes("admin")) redirect("/painel");

  const supabase = await createClient();

  const { data: pendentes } = await supabase
    .from("pecas")
    .select("*")
    .eq("status", "pendente")
    .order("criado_em", { ascending: true });

  const { data: pecasExclusivas } = await supabase
    .from("pecas")
    .select("*, usuarios(nome, banido_em)")
    .eq("exclusividade", true)
    .in("status", ["aprovado", "reservado", "vendido"])
    .order("criado_em", { ascending: false });

  const { data: denuncias } = await supabase.from("denuncias_banimento").select("vendedora_id, avisos");
  const avisosPorVendedora = new Map<string, number>();
  denuncias?.forEach((d) => {
    avisosPorVendedora.set(d.vendedora_id, Math.max(avisosPorVendedora.get(d.vendedora_id) ?? 0, d.avisos));
  });

  const { data: atendimentos } = await supabase
    .from("atendimentos_assistidos")
    .select("*, usuarios(nome)")
    .neq("status", "concluido")
    .neq("status", "cancelado")
    .order("criado_em", { ascending: true });

  const { data: comissoesPendentes } = await supabase
    .from("comissoes")
    .select("id, tipo, percentual, valor, paga, usuarios(nome)")
    .eq("paga", false)
    .order("criado_em", { ascending: true });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Curadoria — fila de aprovação</h1>
        {(!pendentes || pendentes.length === 0) && (
          <p className="mt-2 text-sm text-neutral-500">Nenhuma peça aguardando curadoria.</p>
        )}
        <ul className="mt-3 flex flex-col gap-3">
          {pendentes?.map((peca) => (
            <CuradoriaCard key={peca.id} peca={peca} />
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-medium">Exclusividade — peças em vitrine</h2>
        <p className="text-xs text-neutral-500">
          Registre uma denúncia se a peça for encontrada à venda em outro canal durante a
          exclusividade. Na 2ª ocorrência da mesma vendedora, ela é banida automaticamente.
        </p>
        {(!pecasExclusivas || pecasExclusivas.length === 0) && (
          <p className="mt-2 text-sm text-neutral-500">Nenhuma peça exclusiva ativa no momento.</p>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {pecasExclusivas?.map((peca) => (
            <DenunciaCard
              key={peca.id}
              vendedoraId={peca.dono_id}
              vendedoraNome={peca.usuarios?.nome ?? "—"}
              pecaDescricao={peca.descricao}
              avisosAtuais={avisosPorVendedora.get(peca.dono_id) ?? 0}
              banida={Boolean(peca.usuarios?.banido_em)}
            />
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-medium">Atendimento assistido</h2>
        {(!atendimentos || atendimentos.length === 0) && (
          <p className="mt-2 text-sm text-neutral-500">Nenhuma solicitação em aberto.</p>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {atendimentos?.map((a) => (
            <AtendimentoCard key={a.id} atendimento={a} usuarioNome={a.usuarios?.nome ?? "—"} />
          ))}
        </ul>
      </div>

      <RedeSection />

      <ComissoesSection comissoes={comissoesPendentes ?? []} />
    </div>
  );
}
