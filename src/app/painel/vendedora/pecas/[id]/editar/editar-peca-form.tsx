"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aplicarMarcaDagua } from "@/lib/domain/watermark";
import { TAMANHOS, ESTADOS } from "@/lib/domain/regras";
import { SeletorCor } from "@/components/seletor-cor";
import { atualizarPeca, type EditarPecaState } from "./actions";
import type { Tables } from "@/types/database";

const initialState: EditarPecaState = {};

type Foto = { original: string; tratada: string };

export function EditarPecaForm({ peca }: { peca: Tables<"pecas"> }) {
  const acaoComId = atualizarPeca.bind(null, peca.id);
  const [state, formAction, pending] = useActionState(acaoComId, initialState);
  const [novasFotos, setNovasFotos] = useState<Foto[]>([]);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [erroFotos, setErroFotos] = useState<string | null>(null);

  const fotosExistentesOriginais = peca.fotos_originais;
  const fotosExistentesTratadas = peca.fotos_tratadas;
  const fotosExistentesParaMostrar = fotosExistentesTratadas.length
    ? fotosExistentesTratadas
    : fotosExistentesOriginais;

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

      const novas: Foto[] = [];

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

        novas.push({
          original: supabase.storage.from("pecas-fotos").getPublicUrl(pathOriginal).data.publicUrl,
          tratada: supabase.storage.from("pecas-fotos").getPublicUrl(pathTratada).data.publicUrl,
        });
      }

      setNovasFotos((prev) => [...prev, ...novas]);
    } catch (err) {
      setErroFotos(err instanceof Error ? err.message : "Erro ao enviar fotos.");
    } finally {
      setEnviandoFotos(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1 text-sm">
        Fotos atuais
        <div className="flex gap-2 overflow-x-auto">
          {fotosExistentesParaMostrar.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f} src={f} alt="" className="h-20 w-20 rounded object-cover" />
          ))}
        </div>
      </div>
      {fotosExistentesOriginais.map((f) => (
        <input key={f} type="hidden" name="fotos_originais_existentes" value={f} />
      ))}
      {fotosExistentesTratadas.map((f) => (
        <input key={f} type="hidden" name="fotos_tratadas_existentes" value={f} />
      ))}

      <label className="flex flex-col gap-1 text-sm">
        Adicionar mais fotos
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
      {novasFotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {novasFotos.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.tratada} src={f.tratada} alt="" className="h-20 w-20 rounded object-cover" />
          ))}
        </div>
      )}
      {novasFotos.map((f) => (
        <input key={f.original} type="hidden" name="novas_fotos_originais" value={f.original} />
      ))}
      {novasFotos.map((f) => (
        <input key={f.tratada} type="hidden" name="novas_fotos_tratadas" value={f.tratada} />
      ))}

      <label className="flex flex-col gap-1 text-sm">
        Descrição
        <textarea
          name="descricao"
          required
          defaultValue={peca.descricao}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Tamanho
          <select
            name="tamanho"
            required
            defaultValue={peca.tamanho}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            {TAMANHOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="col-span-2 flex flex-col gap-1.5 text-sm">
          Cor
          <SeletorCor name="cor" defaultValue={peca.cor} required />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tecido
          <input
            name="tecido"
            defaultValue={peca.tecido ?? ""}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Estado
          <select
            name="estado"
            required
            defaultValue={peca.estado}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select
            name="tipo"
            required
            defaultValue={peca.tipo}
            className="rounded border border-neutral-300 px-3 py-2"
          >
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
            defaultValue={peca.preco_anunciado}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="exclusividade" defaultChecked={peca.exclusividade} />
        Anunciar com exclusividade (não pode estar à venda em outro canal)
      </label>

      {peca.status === "aprovado" && (
        <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Ao salvar, a peça volta para curadoria antes de reaparecer na vitrine.
        </p>
      )}

      {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending || enviandoFotos}
        className="rounded border border-gold bg-gold px-4 py-2 text-sm text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
