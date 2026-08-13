import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NovaSenhaForm } from "./nova-senha-form";

export default async function NovaSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image
          src="/logo.png"
          alt="É meu, pode ser seu"
          width={96}
          height={96}
          className="rounded-full"
          priority
        />
        <h1 className="text-2xl font-semibold">Criar nova senha</h1>
      </div>

      {user ? (
        <NovaSenhaForm />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            Este link de recuperação já foi usado ou expirou. Peça um novo para criar sua senha.
          </p>
          <Link
            href="/recuperar-senha"
            className="rounded border border-gold bg-gold px-4 py-2 text-center text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
          >
            Pedir um novo link
          </Link>
        </div>
      )}
    </main>
  );
}
