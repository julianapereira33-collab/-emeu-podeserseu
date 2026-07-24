import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { LinkGeralSection } from "./link-geral-section";

export default async function PainelParceiraPage() {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();
  const ehEmbaixadora = usuario?.papel.includes("embaixadora") ?? false;

  const { data: comissoes } = await supabase
    .from("comissoes")
    .select("*")
    .eq("parceira_id", usuario!.id)
    .order("criado_em", { ascending: false });

  const totalPendente = comissoes?.filter((c) => !c.paga).reduce((s, c) => s + c.valor, 0) ?? 0;
  const totalPago = comissoes?.filter((c) => c.paga).reduce((s, c) => s + c.valor, 0) ?? 0;

  const { data: rede } = ehEmbaixadora
    ? await supabase.from("usuarios").select("id, nome, whatsapp, cidade").eq("recrutado_por", usuario!.id)
    : { data: null };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {ehEmbaixadora ? "Painel de embaixadora" : "Painel de parceria"}
        </h1>
        <p className="text-sm text-neutral-500">
          Compartilhe qualquer peça aprovada da vitrine — você ganha comissão sobre a venda real
          originada pelo seu link, não pelo simples cadastro ou recrutamento.
        </p>
      </div>

      <div className="flex gap-6 text-sm">
        <p>
          Pendente: <strong>R$ {totalPendente.toFixed(2)}</strong>
        </p>
        <p>
          Já pago: <strong>R$ {totalPago.toFixed(2)}</strong>
        </p>
      </div>

      <LinkGeralSection />

      <section>
        <h2 className="mb-3 text-lg font-medium">Comissões</h2>
        <ul className="flex flex-col gap-2">
          {comissoes?.map((c) => (
            <li key={c.id} className="flex justify-between rounded border border-neutral-200 p-3 text-sm">
              <span>
                {c.tipo === "override" ? "Override (rede)" : "Direta"} · {c.percentual}%
              </span>
              <span className={c.paga ? "text-emerald-700" : "text-neutral-500"}>
                R$ {c.valor.toFixed(2)} {c.paga ? "· paga" : "· pendente"}
              </span>
            </li>
          ))}
          {(!comissoes || comissoes.length === 0) && (
            <p className="text-sm text-neutral-500">Nenhuma comissão registrada ainda.</p>
          )}
        </ul>
      </section>

      {ehEmbaixadora && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Minha rede (lojas recrutadas)</h2>
          <p className="mb-2 text-xs text-neutral-500">
            Você ganha um override sobre as vendas pagas dessas lojas, além da comissão direta dos
            seus próprios links.
          </p>
          <ul className="flex flex-col gap-2">
            {rede?.map((loja) => (
              <li key={loja.id} className="rounded border border-neutral-200 p-3 text-sm">
                {loja.nome} — {loja.whatsapp} {loja.cidade ? `· ${loja.cidade}` : ""}
              </li>
            ))}
            {(!rede || rede.length === 0) && (
              <p className="text-sm text-neutral-500">
                Nenhuma loja recrutada ainda — peça à curadoria para associar uma loja a você.
              </p>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
