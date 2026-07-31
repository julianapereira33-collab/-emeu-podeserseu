"use client";

import { useState, useTransition } from "react";
import { gerarFotoEditorial, definirAprovacaoFotoEditorial } from "./foto-editorial-actions";

export function FotoEditorialWidget({
  pecaId,
  fotoEditorialUrl,
  aprovada,
}: {
  pecaId: string;
  fotoEditorialUrl: string | null;
  aprovada: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(fotoEditorialUrl);
  const [jaAprovada, setJaAprovada] = useState(aprovada);
  const [erro, setErro] = useState<string | null>(null);

  function gerar() {
    setErro(null);
    startTransition(async () => {
      const res = await gerarFotoEditorial(pecaId);
      if ("erro" in res) {
        setErro(res.erro);
        return;
      }
      setPreview(res.url);
      setJaAprovada(false);
    });
  }

  function decidir(aprovar: boolean) {
    setErro(null);
    startTransition(async () => {
      const res = await definirAprovacaoFotoEditorial(pecaId, aprovar);
      if ("erro" in res) {
        setErro(res.erro);
        return;
      }
      setJaAprovada(aprovar);
      if (!aprovar) setPreview(null);
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-dashed border-neutral-200 pt-2">
      <p className="text-[11px] font-medium text-neutral-600">Foto editorial (IA)</p>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Foto editorial gerada" className="aspect-[3/4] w-full rounded object-cover" />
      )}

      {erro && <p className="text-[11px] text-red-600">{erro}</p>}

      {!preview && (
        <button
          type="button"
          onClick={gerar}
          disabled={pending}
          className="w-fit rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-50 disabled:opacity-50"
        >
          {pending ? "Gerando..." : "Gerar foto editorial"}
        </button>
      )}

      {preview && !jaAprovada && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => decidir(true)}
            disabled={pending}
            className="rounded border border-gold bg-gold px-2 py-1 text-[11px] text-neutral-900 hover:bg-gold-dark disabled:opacity-50"
          >
            Usar na vitrine
          </button>
          <button
            type="button"
            onClick={() => decidir(false)}
            disabled={pending}
            className="rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-50 disabled:opacity-50"
          >
            Descartar
          </button>
        </div>
      )}

      {preview && jaAprovada && (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-green-700">Ativa na vitrine</span>
          <button
            type="button"
            onClick={() => decidir(false)}
            disabled={pending}
            className="rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-50 disabled:opacity-50"
          >
            Voltar pra foto real
          </button>
        </div>
      )}
    </div>
  );
}
