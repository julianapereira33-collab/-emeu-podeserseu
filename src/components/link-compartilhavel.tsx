"use client";

import { useState } from "react";

export function LinkCompartilhavel({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const temShareNativo = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p className="break-all rounded bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700">{link}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          {copiado ? "Copiado!" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(link)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          Enviar no WhatsApp
        </a>
        {temShareNativo && (
          <button
            type="button"
            onClick={() => navigator.share({ url: link })}
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
          >
            Compartilhar
          </button>
        )}
      </div>
    </div>
  );
}
