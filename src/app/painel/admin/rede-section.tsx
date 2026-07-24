"use client";

import { useState, useTransition } from "react";
import { promoverPapel, definirRecrutadoPor } from "./rede-actions";

export function RedeSection() {
  const [pending, startTransition] = useTransition();
  const [whatsappPromover, setWhatsappPromover] = useState("");
  const [papelPromover, setPapelPromover] = useState<"parceira" | "embaixadora">("parceira");
  const [whatsappLoja, setWhatsappLoja] = useState("");
  const [whatsappEmbaixadora, setWhatsappEmbaixadora] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Parceiros e embaixadoras</h2>

      <div className="flex flex-wrap items-end gap-2 text-xs">
        <label className="flex flex-col gap-1">
          WhatsApp da usuária
          <input
            value={whatsappPromover}
            onChange={(e) => setWhatsappPromover(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Promover a
          <select
            value={papelPromover}
            onChange={(e) => setPapelPromover(e.target.value as "parceira" | "embaixadora")}
            className="rounded border border-neutral-300 px-2 py-1"
          >
            <option value="parceira">Parceira</option>
            <option value="embaixadora">Embaixadora de cidade</option>
          </select>
        </label>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await promoverPapel(whatsappPromover, papelPromover);
              setMensagem(res.erro ?? "Papel atualizado.");
            })
          }
          className="rounded border border-gold bg-gold px-3 py-1.5 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
        >
          Promover
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2 text-xs">
        <label className="flex flex-col gap-1">
          WhatsApp da loja
          <input
            value={whatsappLoja}
            onChange={(e) => setWhatsappLoja(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Recrutada pela embaixadora (WhatsApp)
          <input
            value={whatsappEmbaixadora}
            onChange={(e) => setWhatsappEmbaixadora(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await definirRecrutadoPor(whatsappLoja, whatsappEmbaixadora);
              setMensagem(res.erro ?? "Vínculo de recrutamento definido.");
            })
          }
          className="rounded border border-gold bg-gold px-3 py-1.5 text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
        >
          Vincular
        </button>
      </div>

      {mensagem && <p className="text-xs text-neutral-600">{mensagem}</p>}
    </section>
  );
}
