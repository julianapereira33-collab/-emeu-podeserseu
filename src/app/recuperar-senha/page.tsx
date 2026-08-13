"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { enviarLinkRecuperacao, type RecuperarSenhaState } from "./actions";

const initialState: RecuperarSenhaState = {};

export default function RecuperarSenhaPage() {
  const [state, formAction, pending] = useActionState(enviarLinkRecuperacao, initialState);

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
        <h1 className="text-2xl font-semibold">Esqueci minha senha</h1>
      </div>

      {state.enviado ? (
        <div className="flex flex-col gap-4">
          <p className="rounded border border-gold bg-gold-light/40 px-3 py-2 text-sm text-neutral-900">
            Se existir uma conta com esse e-mail, enviamos um link para você criar uma senha nova.
            Confira também a caixa de spam.
          </p>
          <Link
            href="/login"
            className="rounded border border-gold bg-gold px-4 py-2 text-center text-neutral-900 hover:bg-gold-dark hover:border-gold-dark"
          >
            Voltar para o login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-600">
            Informe o e-mail da sua conta e enviaremos um link para você criar uma senha nova.
          </p>

          <form action={formAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              E-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded border border-neutral-300 px-3 py-2"
              />
            </label>

            {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

            <button
              type="submit"
              disabled={pending}
              className="rounded border border-gold bg-gold px-4 py-2 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
            >
              {pending ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>

          <p className="text-sm text-neutral-500">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-gold-dark underline">
              Entrar
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
