const BASE_URL = "https://api.mercadopago.com/v1/payments";

function accessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
  return token;
}

export type PagamentoPix = {
  id: string;
  status: string;
  externalReference: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
};

type RespostaMercadoPago = {
  id: number | string;
  status: string;
  status_detail?: string;
  message?: string;
  external_reference?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
    };
  };
};

function parsePagamento(json: RespostaMercadoPago): PagamentoPix {
  const dadosPix = json.point_of_interaction?.transaction_data;
  return {
    id: String(json.id),
    status: json.status,
    externalReference: json.external_reference ?? null,
    qrCode: dadosPix?.qr_code ?? null,
    qrCodeBase64: dadosPix?.qr_code_base64 ?? null,
  };
}

export async function criarPagamentoPix(params: {
  valor: number;
  descricao: string;
  externalReference: string;
  payerEmail: string;
  notificationUrl: string;
  idempotencyKey: string;
}): Promise<PagamentoPix> {
  const resposta = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
      "X-Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: Math.round(params.valor * 100) / 100,
      description: params.descricao,
      payment_method_id: "pix",
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
    }),
  });

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`Mercado Pago recusou a cobrança: ${json.message ?? resposta.statusText}`);
  }
  return parsePagamento(json);
}

export async function buscarPagamentoPix(paymentId: string): Promise<PagamentoPix> {
  const resposta = await fetch(`${BASE_URL}/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`Não foi possível consultar o pagamento: ${json.message ?? resposta.statusText}`);
  }
  return parsePagamento(json);
}

export async function criarPreferenciaCheckout(params: {
  valor: number;
  descricao: string;
  externalReference: string;
  payerEmail: string;
  notificationUrl: string;
  backUrl: string;
}): Promise<{ preferenceId: string }> {
  const resposta = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: params.descricao,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Math.round(params.valor * 100) / 100,
        },
      ],
      external_reference: params.externalReference,
      payer: { email: params.payerEmail },
      notification_url: params.notificationUrl,
      back_urls: {
        success: params.backUrl,
        failure: params.backUrl,
        pending: params.backUrl,
      },
      auto_return: "approved",
    }),
  });

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`Mercado Pago recusou a preferência: ${json.message ?? resposta.statusText}`);
  }
  return { preferenceId: json.id };
}

export async function buscarPagamentoPorReferencia(externalReference: string): Promise<PagamentoPix | null> {
  const resposta = await fetch(
    `${BASE_URL}/search?external_reference=${encodeURIComponent(externalReference)}&sort=date_created&criteria=desc`,
    { headers: { Authorization: `Bearer ${accessToken()}` } },
  );

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`Não foi possível consultar o pagamento: ${json.message ?? resposta.statusText}`);
  }

  const resultados: RespostaMercadoPago[] = json.results ?? [];
  return resultados.length > 0 ? parsePagamento(resultados[0]) : null;
}

export async function estornarPagamento(paymentId: string): Promise<void> {
  const resposta = await fetch(`${BASE_URL}/${paymentId}/refunds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
  });

  if (!resposta.ok) {
    const json = await resposta.json().catch(() => ({}));
    throw new Error(`Mercado Pago recusou o estorno: ${json.message ?? resposta.statusText}`);
  }
}
