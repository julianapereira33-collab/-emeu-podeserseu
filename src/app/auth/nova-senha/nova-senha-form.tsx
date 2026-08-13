"use client";

import { useActionState } from "react";
import { definirNovaSenha, type NovaSenhaState } from "./actions";

const initialState: NovaSenhaState = {};

export function NovaSenhaForm() {
  const [state, formAction, pending] = useActionState(definirNovaSenha, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nova senha
        <input
          name="senha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Repita a nova senha
        <input
          name="confirmacao"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gold bg-gold px-4 py-2 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
