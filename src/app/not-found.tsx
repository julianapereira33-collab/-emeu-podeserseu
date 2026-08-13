import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm uppercase tracking-widest text-neutral-400">Erro 404</p>
      <h1 className="text-2xl font-semibold">Não encontramos esta página</h1>
      <p className="text-sm text-neutral-600">
        O endereço pode ter mudado, ou a peça que você procura já saiu da vitrine.
      </p>

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/vitrine"
          className="rounded border border-gold bg-gold px-4 py-2 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
        >
          Ver a vitrine
        </Link>
        <Link href="/" className="text-sm text-gold-dark underline">
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
