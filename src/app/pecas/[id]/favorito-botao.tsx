"use client";

import { useState, useTransition } from "react";
import { toggleFavorito } from "./actions";

export function FavoritoBotao({
  pecaId,
  favoritadoInicial,
  logada,
}: {
  pecaId: string;
  favoritadoInicial: boolean;
  logada: boolean;
}) {
  const [favoritado, setFavoritado] = useState(favoritadoInicial);
  const [pending, startTransition] = useTransition();

  if (!logada) return null;

  function alternar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const proximo = !favoritado;
    setFavoritado(proximo);
    startTransition(async () => {
      const res = await toggleFavorito(pecaId);
      if ("erro" in res) setFavoritado(!proximo);
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pending}
      aria-pressed={favoritado}
      aria-label={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow hover:bg-white disabled:opacity-60"
    >
      <span className={favoritado ? "text-red-500" : "text-neutral-400"}>
        {favoritado ? "♥" : "♡"}
      </span>
    </button>
  );
}
