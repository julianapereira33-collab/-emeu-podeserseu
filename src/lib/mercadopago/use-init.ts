"use client";

import { useEffect } from "react";
import { initMercadoPago } from "@mercadopago/sdk-react";

let inicializado = false;

export function useMercadoPagoInit() {
  useEffect(() => {
    if (inicializado) return;
    const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    if (!publicKey) return;
    initMercadoPago(publicKey, { locale: "pt-BR" });
    inicializado = true;
  }, []);
}
