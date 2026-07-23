const TERMOS_COMUNS = [
  "A taxa de pré-venda só é cobrada depois que a vendedora confirma a disponibilidade da peça — nenhum valor é debitado no momento da reserva ou da proposta.",
  "Após confirmada e paga, a taxa não é reembolsável.",
  "O valor da peça em si (100%) é combinado e pago diretamente entre vendedora e compradora, fora da plataforma. A plataforma nunca custodia esse valor — apenas a taxa de pré-venda.",
  "Reservas sem resposta da vendedora em até 24h são liberadas automaticamente de volta à vitrine, sem qualquer cobrança.",
  "Comprador e vendedor com o mesmo número de WhatsApp não podem transacionar entre si.",
];

const TERMOS_VENDA = [
  "A peça vendida deixa de pertencer à vendedora após a entrega — a responsabilidade pela integridade da peça até a entrega é da vendedora.",
  "Peças anunciadas com exclusividade não podem estar à venda em nenhum outro canal (grupos de WhatsApp, outras plataformas, etc.) durante o período de exclusividade, sob pena de aviso e, na reincidência, banimento.",
];

const TERMOS_ALUGUEL = [
  "A locadora é responsável por devolver a peça no estado combinado com a locatária, no prazo acordado entre as partes.",
  "Danos ou atrasos na devolução são de responsabilidade das partes e devem ser resolvidos diretamente entre locadora e locatária — a plataforma media disputas, mas não garante o pagamento de indenizações.",
];

export default async function TermosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const termosEspecificos = tipo === "aluguel" ? TERMOS_ALUGUEL : TERMOS_VENDA;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Termos de uso</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Aplicáveis a transações de {tipo === "aluguel" ? "aluguel" : "venda"} na plataforma
        &ldquo;É meu, pode ser seu&rdquo;.
      </p>

      <h2 className="mb-2 text-lg font-medium">Regras gerais</h2>
      <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-neutral-700">
        {TERMOS_COMUNS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2 className="mb-2 text-lg font-medium">
        Específicas de {tipo === "aluguel" ? "aluguel" : "venda"}
      </h2>
      <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
        {termosEspecificos.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </main>
  );
}
