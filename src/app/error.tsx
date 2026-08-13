"use client"; // error boundaries precisam ser Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Erro não tratado na página:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Alguma coisa deu errado</h1>
      <p className="text-sm text-neutral-600">
        Não conseguimos carregar esta página agora. Pode ter sido uma instabilidade momentânea —
        tente de novo em instantes.
      </p>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => unstable_retry()}
          className="rounded border border-gold bg-gold px-4 py-2 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
        >
          Tentar de novo
        </button>
        <Link href="/vitrine" className="text-sm text-gold-dark underline">
          Voltar para a vitrine
        </Link>
      </div>

      {error.digest && (
        <p className="text-xs text-neutral-400">
          Se o problema continuar, informe este código: {error.digest}
        </p>
      )}
    </main>
  );
}
