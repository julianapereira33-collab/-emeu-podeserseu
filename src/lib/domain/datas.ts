/**
 * Formatação de data/hora sempre no fuso de Brasília.
 *
 * Server Components rodam em UTC na Vercel — sem `timeZone` explícito, um
 * `toLocaleString("pt-BR")` no servidor mostra 3 horas a mais do que o horário
 * real de quem está lendo, o que é grave em prazos (a reserva expira em 24h).
 */
export const FUSO_BRASIL = "America/Sao_Paulo";

export function formatarDataHora(valor: string | Date): string {
  return new Date(valor).toLocaleString("pt-BR", {
    timeZone: FUSO_BRASIL,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
