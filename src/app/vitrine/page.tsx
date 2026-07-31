import { createClient } from "@/lib/supabase/server";
import { PecaCard } from "@/components/peca-card";
import { TAMANHOS, ESTADOS } from "@/lib/domain/regras";
import { SeletorCor } from "@/components/seletor-cor";

type SearchParams = {
  tamanho?: string;
  cor?: string;
  tecido?: string;
  estado?: string;
  tipo?: string;
};

export default async function VitrinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filtros = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("pecas")
    .select("*")
    .eq("status", "aprovado")
    .order("criado_em", { ascending: false });

  if (filtros.tamanho) query = query.eq("tamanho", filtros.tamanho);
  if (filtros.cor) query = query.eq("cor", filtros.cor);
  if (filtros.tecido) query = query.ilike("tecido", `%${filtros.tecido}%`);
  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);

  const { data: pecas, error } = await query;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Vitrine</h1>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="order-2 min-w-0 flex-1 md:order-1">
          {error && <p className="text-sm text-red-600">Erro ao carregar a vitrine.</p>}

          {pecas && pecas.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhuma peça encontrada com esses filtros.</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pecas?.map((peca) => (
              <PecaCard key={peca.id} peca={peca} />
            ))}
          </div>
        </div>

        <aside className="order-1 md:sticky md:top-4 md:order-2 md:w-56 md:shrink-0">
          <form className="flex flex-col gap-4 text-sm" method="get">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Filtrar
            </h2>

            <label className="flex flex-col gap-1">
              Tamanho
              <select
                name="tamanho"
                defaultValue={filtros.tamanho ?? ""}
                className="rounded border border-neutral-300 px-2 py-1.5"
              >
                <option value="">Todos</option>
                {TAMANHOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              Estado
              <select
                name="estado"
                defaultValue={filtros.estado ?? ""}
                className="rounded border border-neutral-300 px-2 py-1.5"
              >
                <option value="">Todos</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              Tipo
              <select
                name="tipo"
                defaultValue={filtros.tipo ?? ""}
                className="rounded border border-neutral-300 px-2 py-1.5"
              >
                <option value="">Venda e aluguel</option>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              Cor
              <SeletorCor name="cor" defaultValue={filtros.cor} incluirTodos />
            </label>

            <label className="flex flex-col gap-1">
              Tecido
              <input
                name="tecido"
                defaultValue={filtros.tecido ?? ""}
                className="rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>

            <button
              type="submit"
              className="rounded border border-gold bg-gold px-4 py-1.5 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
            >
              Filtrar
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
