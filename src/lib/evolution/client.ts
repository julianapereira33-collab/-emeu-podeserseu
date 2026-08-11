const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

/**
 * Envia uma mensagem de WhatsApp via Evolution API (self-hosted, substitui o Z-API).
 * Canal auxiliar: a notificação in-app já cobre o essencial, então uma falha aqui
 * nunca deve derrubar o fluxo de reserva — só loga e segue.
 */
export async function enviarWhatsapp(whatsapp: string, texto: string): Promise<void> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return;

  const numeroLimpo = whatsapp.replace(/\D/g, "");
  const numero = numeroLimpo.startsWith("55") ? numeroLimpo : `55${numeroLimpo}`;

  try {
    const resp = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: numero, text: texto }),
      },
    );
    if (!resp.ok) {
      console.error(`Falha ao enviar WhatsApp para ${numero}:`, resp.status, await resp.text());
    }
  } catch (err) {
    console.error(`Erro ao enviar WhatsApp para ${numero}:`, err);
  }
}
