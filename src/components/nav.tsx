import Link from "next/link";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";

export async function Nav() {
  const usuario = await getCurrentUsuario();

  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/vitrine" className="font-semibold">
          É meu, pode ser seu
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/vitrine" className="hover:underline">
            Vitrine
          </Link>

          {usuario ? (
            <>
              <Link href="/painel" className="hover:underline">
                Meu painel
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="text-neutral-500 hover:underline">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded bg-neutral-900 px-3 py-1.5 text-white hover:opacity-90"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
