"use client";

import { useEffect, useState } from "react";

export function FotoGaleria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [aberta, setAberta] = useState<number | null>(null);

  useEffect(() => {
    if (aberta === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAberta(null);
      if (e.key === "ArrowRight") setAberta((i) => (i === null ? i : (i + 1) % fotos.length));
      if (e.key === "ArrowLeft")
        setAberta((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aberta, fotos.length]);

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400">
        Sem foto
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAberta(0)}
        className="group relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-lg bg-neutral-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[0]}
          alt={alt}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          Ampliar
        </span>
      </button>

      {fotos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {fotos.slice(1).map((foto, i) => (
            <button
              key={foto}
              type="button"
              onClick={() => setAberta(i + 1)}
              className="cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" className="aspect-square rounded object-cover" />
            </button>
          ))}
        </div>
      )}

      {aberta !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAberta(null)}
        >
          <button
            type="button"
            onClick={() => setAberta(null)}
            className="absolute right-4 top-4 text-2xl text-white hover:text-gold"
            aria-label="Fechar"
          >
            ✕
          </button>

          {fotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAberta((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
                }}
                className="absolute left-4 text-3xl text-white hover:text-gold"
                aria-label="Foto anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAberta((i) => (i === null ? i : (i + 1) % fotos.length));
                }}
                className="absolute right-4 text-3xl text-white hover:text-gold"
                aria-label="Próxima foto"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[aberta]}
            alt={alt}
            className="max-h-full max-w-full cursor-zoom-out object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
