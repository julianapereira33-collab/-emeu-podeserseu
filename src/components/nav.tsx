import Link from "next/link";
import Image from "next/image";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";

export async function Nav() {
  const usuario = await getCurrentUsuario();

  return (
    <header className="border-b border-neutral-900 bg-neutral-900">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/vitrine" className="flex items-center gap-2 font-semibold tracking-wide text-gold">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" />
          É meu, pode ser seu
        </Link>

        <div className="flex items-center gap-4 text-sm text-white">
          <Link href="/vitrine" className="hover:text-gold">
            Vitrine
          </Link>
          <Link href="/quem-somos" className="hidden hover:text-gold sm:inline">
            Quem somos
          </Link>
          <Link href="/como-funciona" className="hidden hover:text-gold sm:inline">
            Como funciona
          </Link>

          {usuario ? (
            <>
              <Link href="/painel" className="hover:text-gold">
                Meu painel
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="text-neutral-400 hover:text-gold">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded border border-gold bg-gold px-3 py-1.5 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
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
