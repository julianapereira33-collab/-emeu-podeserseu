"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { useMercadoPagoInit } from "@/lib/mercadopago/use-init";
import { pagarTaxa, verificarPagamentoTaxa } from "./actions";

const Wallet = dynamic(() => import("@mercadopago/sdk-react").then((m) => m.Wallet), { ssr: false });

export function PagarBotao({
  transacaoId,
  valorTaxa,
  saldoCashback,
}: {
  transacaoId: string;
  valorTaxa: number;
  saldoCashback: number;
}) {
  useMercadoPagoInit();

  const [pending, startTransition] = useTransition();
  const [usarCashback, setUsarCashback] = useState(saldoCashback > 0);
  const [erro, setErro] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [pago, setPago] = useState(false);

  useEffect(() => {
    if (!preferenceId || pago) return;
    const intervalo = setInterval(() => {
      startTransition(async () => {
        const resultado = await verificarPagamentoTaxa(transacaoId);
        if (resultado.pago) {
          setPago(true);
          clearInterval(intervalo);
        }
      });
    }, 4000);
    return () => clearInterval(intervalo);
  }, [preferenceId, pago, transacaoId]);

  function iniciarPagamento() {
    setErro(null);
    startTransition(async () => {
      const resultado = await pagarTaxa(transacaoId, usarCashback);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      if ("pago" in resultado) {
        setPago(true);
        return;
      }
      setPreferenceId(resultado.preferenceId);
    });
  }

  if (pago) {
    return <p className="text-xs text-green-700">Pagamento confirmado — contato liberado.</p>;
  }

  if (preferenceId) {
    return (
      <div className="flex flex-col items-start gap-2 rounded border border-gold bg-gold-light/20 p-3">
        <p className="text-xs font-medium text-neutral-700">Escolha como pagar (Pix, cartão ou boleto):</p>
        <Wallet
          initialization={{ preferenceId }}
          customization={{ valueProp: "payment_methods_logos" }}
          onError={(erroBrick) => setErro(erroBrick.message)}
        />
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
        onClick={iniciarPagamento}
        className="w-fit rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Gerando cobrança..." : `Pagar taxa (R$ ${valorTaxa.toFixed(2)})`}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
