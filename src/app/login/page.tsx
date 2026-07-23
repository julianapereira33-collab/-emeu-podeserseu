"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { entrar, type LoginState } from "./actions";

const initialState: LoginState = {};

function AvisoCadastro() {
  const searchParams = useSearchParams();
  if (searchParams.get("cadastrado") !== "1") return null;

  return (
    <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      Conta criada! Se a confirmação de e-mail estiver ativa no projeto, confirme antes de entrar.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(entrar, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-neutral-500">É meu, pode ser seu</p>
      </div>

      <Suspense fallback={null}>
        <AvisoCadastro />
      </Suspense>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            name="senha"
            type="password"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="underline">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
