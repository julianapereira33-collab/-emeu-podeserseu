"use client";

import { Suspense, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { entrar, type LoginState } from "./actions";

const initialState: LoginState = {};

function Avisos() {
  const searchParams = useSearchParams();

  if (searchParams.get("cadastrado") === "1") {
    return (
      <p className="rounded border border-gold bg-gold-light/40 px-3 py-2 text-sm text-neutral-900">
        Conta criada! Enviamos um e-mail de confirmação para o seu endereço. Confirme para poder
        entrar — se não achar, olhe também a caixa de spam.
      </p>
    );
  }

  if (searchParams.get("confirmacao") === "falhou") {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Esse link de e-mail já foi usado ou expirou. Entre com sua senha ou peça um novo link em
        &quot;Esqueci minha senha&quot;.
      </p>
    );
  }

  return null;
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(entrar, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/logo.png" alt="É meu, pode ser seu" width={96} height={96} className="rounded-full" priority />
        <h1 className="text-2xl font-semibold">Entrar</h1>
      </div>

      <Suspense fallback={null}>
        <Avisos />
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

        <Link href="/recuperar-senha" className="-mt-2 w-fit text-xs text-gold-dark underline">
          Esqueci minha senha
        </Link>

        {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded border border-gold bg-gold px-4 py-2 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-gold-dark underline">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
