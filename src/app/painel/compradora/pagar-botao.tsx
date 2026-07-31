"use client";

import { useEffect, useState, useTransition } from "react";
import { pagarTaxa, verificarPagamentoTaxa } from "./actions";

export function PagarBotao({
  transacaoId,
  valorTaxa,
  saldoCashback,
}: {
  transacaoId: string;
  valorTaxa: number;
  saldoCashback: number;
}) {
  const [pending, startTransition] = useTransition();
  const [usarCashback, setUsarCashback] = useState(saldoCashback > 0);
  const [erro, setErro] = useState<string | null>(null);
  const [cobranca, setCobranca] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!cobranca) return;
    const intervalo = setInterval(() => {
      startTransition(async () => {
        const resultado = await verificarPagamentoTaxa(transacaoId);
        if (resultado.pago) clearInterval(intervalo);
      });
    }, 4000);
    return () => clearInterval(intervalo);
  }, [cobranca, transacaoId]);

  function gerarCobranca() {
    setErro(null);
    startTransition(async () => {
      const resultado = await pagarTaxa(transacaoId, usarCashback);
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
      <div className="flex flex-col items-start gap-2 rounded border border-gold bg-gold-light/20 p-3">
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
          Assim que o pagamento for confirmado, o contato é liberado automaticamente aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {saldoCashback > 0 && (
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={usarCashback}
            onChange={(e) => setUsarCashback(e.target.checked)}
          />
          Usar cashback disponível (R$ {saldoCashback.toFixed(2)}) para abater a taxa
        </label>
      )}
      <button
        disabled={pending}
        onClick={gerarCobranca}
        className="w-fit rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Gerando cobrança..." : `Pagar taxa (R$ ${valorTaxa.toFixed(2)}) via Pix`}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
