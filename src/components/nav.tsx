import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";
import { createClient } from "@/lib/supabase/server";
import { NotificacoesSino } from "./notificacoes-sino";
import type { Tables } from "@/types/database";

const marca = Playfair_Display({ subsets: ["latin"], weight: ["600"] });

export async function Nav() {
  const usuario = await getCurrentUsuario();

  let notificacoes: Tables<"notificacoes">[] = [];
  if (usuario) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(20);
    notificacoes = data ?? [];
  }

  return (
    <header className="border-b border-neutral-900 bg-neutral-900">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/vitrine" className="flex items-center gap-2 text-gold">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" />
          <span className={`${marca.className} text-lg tracking-wide`}>É meu, pode ser seu</span>
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
              <NotificacoesSino notificacoesIniciais={notificacoes} />
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
