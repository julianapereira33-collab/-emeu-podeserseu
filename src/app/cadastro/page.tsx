"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cadastrar, type CadastroState } from "./actions";

const initialState: CadastroState = {};

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(cadastrar, initialState);
  const [tipo, setTipo] = useState("vendedora");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-neutral-500">É meu, pode ser seu</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Quero me cadastrar como
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="vendedora">Vendedora (pessoa física)</option>
            <option value="loja">Loja</option>
            <option value="compradora">Compradora</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input name="nome" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          WhatsApp
          <input
            name="whatsapp"
            required
            placeholder="5511999999999"
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cidade
          <input name="cidade" className="rounded border border-neutral-300 px-3 py-2" />
        </label>

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
            minLength={6}
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
          {pending ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
