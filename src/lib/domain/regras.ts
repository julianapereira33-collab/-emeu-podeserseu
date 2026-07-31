/**
 * Regras de negócio espelhadas do banco (ver migrations `fase1_regras_negocio`).
 * Mantidas aqui só para validação otimista no frontend — a fonte de verdade
 * e a validação definitiva sempre acontecem no Postgres (trigger
 * `trg_reservas_before_insert` + função `piso_percentual`).
 */

export function pisoPercentual(criadoEm: string): number {
  const dias = (Date.now() - new Date(criadoEm).getTime()) / (1000 * 60 * 60 * 24);
  if (dias <= 30) return 0.9;
  if (dias <= 60) return 0.8;
  if (dias <= 90) return 0.7;
  if (dias <= 120) return 0.6;
  return 0.5;
}

export function propostaMinima(precoAnunciado: number, criadoEm: string): number {
  return Math.round(precoAnunciado * pisoPercentual(criadoEm) * 100) / 100;
}

export const PAPEL_LABEL: Record<string, string> = {
  vendedora: "Vendedora",
  loja: "Loja",
  compradora: "Compradora",
  parceira: "Parceira",
  embaixadora: "Embaixadora de cidade",
  admin: "Curadoria / Admin",
};

export const STATUS_PECA_LABEL: Record<string, string> = {
  pendente: "Em curadoria",
  aprovado: "Na vitrine",
  reprovado: "Reprovada",
  reservado: "Reservada",
  vendido: "Vendida / Alugada",
};

export const STATUS_RESERVA_LABEL: Record<string, string> = {
  aguardando_confirmacao: "Aguardando confirmação da vendedora",
  confirmada: "Confirmada — aguardando pagamento da taxa",
  recusada: "Recusada / expirada",
  contato_liberado: "Contato liberado",
};

export const TAMANHOS = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
];
export const ESTADOS = ["novo", "seminovo", "usado"] as const;

export const CORES = [
  { nome: "Preto", hex: "#111111" },
  { nome: "Branco", hex: "#ffffff" },
  { nome: "Vermelho", hex: "#c0392b" },
  { nome: "Rosa", hex: "#e8a0bf" },
  { nome: "Laranja", hex: "#e67e22" },
  { nome: "Amarelo", hex: "#f1c40f" },
  { nome: "Verde", hex: "#27ae60" },
  { nome: "Azul", hex: "#2980b9" },
  { nome: "Roxo", hex: "#8e44ad" },
  { nome: "Dourado", hex: "#cfa93b" },
  { nome: "Prateado", hex: "#bdc3c7" },
  { nome: "Nude", hex: "#e7c9a9" },
  { nome: "Bege", hex: "#d8c7a1" },
  { nome: "Marrom", hex: "#7b4b2a" },
  { nome: "Cinza", hex: "#8a8a8a" },
  { nome: "Estampado", hex: "conic-gradient(#c0392b,#f1c40f,#27ae60,#2980b9,#8e44ad,#c0392b)" },
  { nome: "Outra", hex: "#999999" },
] as const;
