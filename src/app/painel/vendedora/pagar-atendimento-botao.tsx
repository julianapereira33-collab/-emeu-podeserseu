"use client";

import { useEffect, useState, useTransition } from "react";
import { pagarAtendimento, verificarPagamentoAtendimento } from "./atendimento-actions";

export function PagarAtendimentoBotao({
  atendimentoId,
  valor,
}: {
  atendimentoId: string;
  valor: number;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [cobranca, setCobranca] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!cobranca) return;
    const intervalo = setInterval(() => {
      startTransition(async () => {
        const resultado = await verificarPagamentoAtendimento(atendimentoId);
        if (resultado.pago) clearInterval(intervalo);
      });
    }, 4000);
    return () => clearInterval(intervalo);
  }, [cobranca, atendimentoId]);

  function gerarCobranca() {
    setErro(null);
    startTransition(async () => {
      const resultado = await pagarAtendimento(atendimentoId);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      if ("qrCode" in resultado) {
        setCobranca({ qrCode: resultado.qrCode, qrCodeBase64: resultado.qrCodeBase64 });
      }
    });
  }

  async function copiar() {
    if (!cobranca) return;
    await navigator.clipboard.writeText(cobranca.qrCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (cobranca) {
    return (
      <div className="mt-2 flex flex-col items-start gap-2 rounded border border-gold bg-gold-light/20 p-3">
        <p className="text-xs font-medium text-neutral-700">
          Escaneie o QR code ou copie o código Pix no app do seu banco:
        </p>
        {/* base64 dinâmico vindo do Mercado Pago — next/image exige domínio configurado, img simples resolve */}
        <img
          src={`data:image/png;base64,${cobranca.qrCodeBase64}`}
          alt="QR code Pix"
          className="h-40 w-40"
        />
        <button
          type="button"
          onClick={copiar}
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs hover:bg-neutral-50"
        >
          {copiado ? "Copiado!" : "Copiar código Pix"}
        </button>
        <p className="text-xs text-neutral-500">
          Assim que o pagamento for confirmado, o atendimento é liberado automaticamente aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        disabled={pending}
        onClick={gerarCobranca}
        className="w-fit rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Gerando cobrança..." : `Pagar atendimento (R$ ${valor.toFixed(2)}) via Pix`}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
