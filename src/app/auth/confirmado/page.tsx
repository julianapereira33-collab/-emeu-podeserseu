import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EmailConfirmadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/logo.png"
          alt="É meu, pode ser seu"
          width={96}
          height={96}
          className="rounded-full"
          priority
        />
        <h1 className="text-2xl font-semibold">E-mail confirmado</h1>
      </div>

      <p className="rounded border border-gold bg-gold-light/40 px-3 py-2 text-sm text-neutral-900">
        Sua conta está pronta. Bem-vinda ao É meu, pode ser seu.
      </p>

      <div className="flex flex-col gap-2">
        <Link
          href={user ? "/painel" : "/login"}
          className="rounded border border-gold bg-gold px-4 py-2 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
        >
          {user ? "Ir para o meu painel" : "Entrar"}
        </Link>
        <Link href="/vitrine" className="text-sm text-gold-dark underline">
          Ver a vitrine
        </Link>
      </div>
    </main>
  );
}
