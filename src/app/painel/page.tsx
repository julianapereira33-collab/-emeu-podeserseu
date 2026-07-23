import Link from "next/link";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { PAPEL_LABEL } from "@/lib/domain/regras";

const PAINEIS: { papel: string; href: string; titulo: string; descricao: string }[] = [
  {
    papel: "vendedora",
    href: "/painel/vendedora",
    titulo: "Painel da vendedora",
    descricao: "Cadastre peças e confirme reservas recebidas.",
  },
  {
    papel: "loja",
    href: "/painel/vendedora",
    titulo: "Painel da loja",
    descricao: "Cadastre peças e confirme reservas recebidas (taxa de loja: 20%).",
  },
  {
    papel: "compradora",
    href: "/painel/compradora",
    titulo: "Minhas reservas",
    descricao: "Acompanhe suas reservas e pague a taxa quando confirmada.",
  },
  {
    papel: "admin",
    href: "/painel/admin",
    titulo: "Curadoria (admin)",
    descricao: "Aprove ou reprove peças enviadas para a vitrine.",
  },
];

export default async function PainelHubPage() {
  const usuario = await getCurrentUsuario();
  const paineisDisponiveis = PAINEIS.filter((p) => usuario?.papel.includes(p.papel));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {usuario?.nome}</h1>
        <p className="text-sm text-neutral-500">
          Papéis: {usuario?.papel.map((p) => PAPEL_LABEL[p] ?? p).join(", ") || "—"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {paineisDisponiveis.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="rounded-lg border border-neutral-200 p-4 hover:shadow-md"
          >
            <h2 className="font-medium">{p.titulo}</h2>
            <p className="text-sm text-neutral-500">{p.descricao}</p>
          </Link>
        ))}

        {paineisDisponiveis.length === 0 && (
          <p className="text-sm text-neutral-500">
            Sua conta ainda não tem um painel associado. Fale com a curadoria.
          </p>
        )}
      </div>
    </div>
  );
}
