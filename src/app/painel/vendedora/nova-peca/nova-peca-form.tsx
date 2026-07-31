"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aplicarMarcaDagua } from "@/lib/domain/watermark";
import { cadastrarPeca, sugerirPreco, type NovaPecaState } from "./actions";
import { TAMANHOS, ESTADOS } from "@/lib/domain/regras";
import { SeletorCor } from "@/components/seletor-cor";

const initialState: NovaPecaState = {};

type Foto = { original: string; tratada: string };
type Slot = "frente" | "costas" | "detalhe";
const SLOTS: { key: Slot; label: string }[] = [
  { key: "frente", label: "Frente" },
  { key: "costas", label: "Costas" },
  { key: "detalhe", label: "Detalhe" },
];

export function NovaPecaForm() {
  const [state, formAction, pending] = useActionState(cadastrarPeca, initialState);
  const [fotosPorSlot, setFotosPorSlot] = useState<Partial<Record<Slot, Foto>>>({});
  const [video, setVideo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<Slot | "video" | null>(null);
  const [erroFotos, setErroFotos] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [buscandoSugestao, setBuscandoSugestao] = useState(false);
  const [dados, setDados] = useState({ descricao: "", tamanho: "", tecido: "", estado: "" });

  const tudoPronto = SLOTS.every((s) => fotosPorSlot[s.key]) && Boolean(video);

  async function handleFotoSlot(slot: Slot, file: File | null) {
    if (!file) return;
    setEnviando(slot);
    setErroFotos(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, entre novamente.");

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

      setFotosPorSlot((prev) => ({
        ...prev,
        [slot]: {
          original: supabase.storage.from("pecas-fotos").getPublicUrl(pathOriginal).data.publicUrl,
          tratada: supabase.storage.from("pecas-fotos").getPublicUrl(pathTratada).data.publicUrl,
        },
      }));
    } catch (err) {
      setErroFotos(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setEnviando(null);
    }
  }

  async function handleVideo(file: File | null) {
    if (!file) return;
    setEnviando("video");
    setErroFotos(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, entre novamente.");

      const id = crypto.randomUUID();
      const extensao = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${id}-video.${extensao}`;

      const { error } = await supabase.storage
        .from("pecas-fotos")
        .upload(path, file, { upsert: false, contentType: file.type || "video/mp4" });
      if (error) throw error;

      setVideo(supabase.storage.from("pecas-fotos").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setErroFotos(err instanceof Error ? err.message : "Erro ao enviar vídeo.");
    } finally {
      setEnviando(null);
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
      <div className="flex flex-col gap-2 text-sm">
        <p className="font-medium">Fotos e vídeo (obrigatório)</p>
        <p className="text-xs text-neutral-500">
          Envie as 3 fotos abaixo e um vídeo curto mostrando o estado real da peça — isso ajuda a
          curadoria a aprovar mais rápido.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map(({ key, label }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">{label}</span>
              {fotosPorSlot[key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotosPorSlot[key]!.tratada}
                  alt={label}
                  className="aspect-[3/4] w-full rounded border border-neutral-300 object-cover"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">
                  {enviando === key ? "Enviando..." : "Vazio"}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFotoSlot(key, e.target.files?.[0] ?? null)}
                className="text-xs"
              />
            </label>
          ))}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-600">Vídeo do estado real</span>
          {video ? (
            <video src={video} controls className="w-full rounded border border-neutral-300" />
          ) : (
            <div className="flex h-16 items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">
              {enviando === "video" ? "Enviando..." : "Nenhum vídeo enviado"}
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleVideo(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
        </label>

        {erroFotos && <p className="text-xs text-red-600">{erroFotos}</p>}
      </div>

      {SLOTS.map(
        ({ key }) =>
          fotosPorSlot[key] && (
            <span key={key}>
              <input type="hidden" name="fotos_originais" value={fotosPorSlot[key]!.original} />
              <input type="hidden" name="fotos_tratadas" value={fotosPorSlot[key]!.tratada} />
            </span>
          ),
      )}
      {video && <input type="hidden" name="video_url" value={video} />}

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

        <label className="col-span-2 flex flex-col gap-1.5 text-sm">
          Cor
          <SeletorCor name="cor" required />
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

      {!tudoPronto && (
        <p className="text-xs text-neutral-500">
          Envie as 3 fotos (frente, costas, detalhe) e o vídeo para poder enviar para curadoria.
        </p>
      )}
      {state.erro && <p className="text-sm text-red-600">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending || enviando !== null || !tudoPronto}
        className="rounded border border-gold bg-gold px-4 py-2 text-sm text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Enviando para curadoria..." : "Enviar para curadoria"}
      </button>
    </form>
  );
}
