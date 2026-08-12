"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { useMercadoPagoInit } from "@/lib/mercadopago/use-init";
import { pagarAtendimento, verificarPagamentoAtendimento } from "./atendimento-actions";

const Wallet = dynamic(() => import("@mercadopago/sdk-react").then((m) => m.Wallet), { ssr: false });

export function PagarAtendimentoBotao({
  atendimentoId,
  valor,
}: {
  atendimentoId: string;
  valor: number;
}) {
  useMercadoPagoInit();

  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [pago, setPago] = useState(false);

  useEffect(() => {
    if (!preferenceId || pago) return;
    const intervalo = setInterval(() => {
      startTransition(async () => {
        const resultado = await verificarPagamentoAtendimento(atendimentoId);
        if (resultado.pago) {
          setPago(true);
          clearInterval(intervalo);
        }
      });
    }, 4000);
    return () => clearInterval(intervalo);
  }, [preferenceId, pago, atendimentoId]);

  function iniciarPagamento() {
    setErro(null);
    startTransition(async () => {
      const resultado = await pagarAtendimento(atendimentoId);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      setPreferenceId(resultado.preferenceId);
    });
  }

  if (pago) {
    return <p className="mt-2 text-xs text-green-700">Pagamento confirmado.</p>;
  }

  if (preferenceId) {
    return (
      <div className="mt-2 flex flex-col items-start gap-2 rounded border border-gold bg-gold-light/20 p-3">
        <p className="text-xs font-medium text-neutral-700">Escolha como pagar (Pix, cartão ou boleto):</p>
        <Wallet
          initialization={{ preferenceId }}
          customization={{ valueProp: "payment_methods_logos" }}
          onError={(erroBrick) => setErro(erroBrick.message)}
        />
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
        onClick={iniciarPagamento}
        className="w-fit rounded border border-gold bg-gold px-3 py-1.5 text-xs text-neutral-900 hover:bg-gold-dark hover:border-gold-dark disabled:opacity-50"
      >
        {pending ? "Gerando cobrança..." : `Pagar atendimento (R$ ${valor.toFixed(2)})`}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
