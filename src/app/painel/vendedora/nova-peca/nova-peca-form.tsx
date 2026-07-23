"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aplicarMarcaDagua } from "@/lib/domain/watermark";
import { cadastrarPeca, sugerirPreco, type NovaPecaState } from "./actions";
import { TAMANHOS, ESTADOS } from "@/lib/domain/regras";

const initialState: NovaPecaState = {};

type Foto = { original: string; tratada: string };

export function NovaPecaForm() {
  const [state, formAction, pending] = useActionState(cadastrarPeca, initialState);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [erroFotos, setErroFotos] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [buscandoSugestao, setBuscandoSugestao] = useState(false);
  const [dados, setDados] = useState({ descricao: "", tamanho: "", tecido: "", estado: "" });

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setEnviandoFotos(true);
    setErroFotos(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, entre novamente.");

      const novasFotos: Foto[] = [];

      for (const file of Array.from(fileList)) {
        const id = crypto.randomUUID();
        const watermarked = await aplicarMarcaDagua(file);

        const pathOriginal = `${user.id}/${id}-original.jpg`;
        const pathTratada = `${user.id}/${id}-tratada.jpg`;

        const [up1, up2] = await Promise.all([
          supabase.storage.from("pecas-fotos").upload(pathOriginal, file, { upsert: false }),
          supabase.storage
            .from("pecas-fotos")
            .upload(pathTratada, watermarked, { upsert: false, contentType: "image/jpeg" }),
        ]);

        if (up1.error) throw up1.error;
        if (up2.error) throw up2.error;

        novasFotos.push({
          original: supabase.storage.from("pecas-fotos").getPublicUrl(pathOriginal).data.publicUrl,
          tratada: supabase.storage.from("pecas-fotos").getPublicUrl(pathTratada).data.publicUrl,
        });
      }

      setFotos((prev) => [...prev, ...novasFotos]);
    } catch (err) {
      setErroFotos(err instanceof Error ? err.message : "Erro ao enviar fotos.");
    } finally {
      setEnviandoFotos(false);
    }
  }

  async function handleSugestao() {
    setBuscandoSugestao(true);
    setSugestao(null);
    const res = await sugerirPreco(dados);
    setSugestao(res.sugestao ?? res.erro ?? null);
    setBuscandoSugestao(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <label className="flex flex-col gap-1 text-sm">
        Fotos
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      {enviandoFotos && <p className="text-xs text-neutral-500">Enviando e aplicando marca d&apos;água...</p>}
      {erroFotos && <p className="text-xs text-red-600">{erroFotos}</p>}
      {fotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {fotos.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.tratada} src={f.tratada} alt="" className="h-20 w-20 rounded object-cover" />
          ))}
        </div>
      )}
      {fotos.map((f) => (
        <input key={f.original} type="hidden" name="fotos_originais" value={f.original} />
      ))}
      {fotos.map((f) => (
        <input key={f.tratada} type="hidden" name="fotos_tratadas" value={f.tratada} />
      ))}

      <label className="flex flex-col gap-1 text-sm">
        Descrição
        <textarea
          name="descricao"
          required
          value={dados.descricao}
          onChange={(e) => setDados((d) => ({ ...d, descricao: e.target.value }))}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Tamanho
          <select
            name="tamanho"
            required
            value={dados.tamanho}
            onChange={(e) => setDados((d) => ({ ...d, tamanho: e.target.value }))}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="">Selecione</option>
            {TAMANHOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cor
          <input name="cor" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tecido
          <input
            name="tecido"
            value={dados.tecido}
            onChange={(e) => setDados((d) => ({ ...d, tecido: e.target.value }))}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Estado
          <select
            name="estado"
            required
            value={dados.estado}
            onChange={(e) => setDados((d) => ({ ...d, estado: e.target.value }))}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="">Selecione</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select name="tipo" required className="rounded border border-neutral-300 px-3 py-2">
            <option value="venda">Venda</option>
            <option value="aluguel">Aluguel</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Preço anunciado (R$)
          <input
            name="preco_anunciado"
            type="number"
            step="0.01"
            min="1"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="exclusividade" />
        Anunciar com exclusividade (não pode estar à venda em outro canal)
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="venda_assistida" />
        Quero delegar a negociação à curadoria (venda assistida — taxa de 60%)
      </label>

      <div className="rounded border border-dashed border-neutral-300 p-3 text-sm">
        <button
          type="button"
          onClick={handleSugestao}
          disabled={buscandoSugestao || !dados.descricao}
          className="text-xs underline disabled:opacity-50"
        >
          {buscandoSugestao ? "Consultando..." : "Sugerir preço com IA"}
        </button>
        {sugestao && <p className="mt-2 text-neutral-600">{sugestao}</p>}
      </div>

      {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending || enviandoFotos}
        className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Enviando para curadoria..." : "Enviar para curadoria"}
      </button>
    </form>
  );
}
