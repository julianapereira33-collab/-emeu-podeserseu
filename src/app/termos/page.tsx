const TERMOS_COMUNS = [
  "A taxa de pré-venda só é cobrada depois que a vendedora confirma a disponibilidade da peça — nenhum valor é debitado no momento da reserva ou da proposta.",
  "Após confirmada e paga, a taxa não é reembolsável.",
  "O valor da peça em si (100%) é combinado e pago diretamente entre vendedora e compradora, fora da plataforma. A plataforma nunca custodia esse valor — apenas a taxa de pré-venda.",
  "Reservas sem resposta da vendedora em até 24h são liberadas automaticamente de volta à vitrine, sem qualquer cobrança.",
  "Comprador e vendedor com o mesmo número de WhatsApp não podem transacionar entre si.",
  "A vendedora/locadora é responsável por informar medidas reais e precisas da peça (busto, cintura, quadril, comprimento) e por fotos e vídeo que representem fielmente seu estado. Se a peça recebida divergir de forma relevante das medidas ou do estado informado no cadastro, a compradora/locatária pode acionar a curadoria para mediar a devolução da taxa.",
  "Não entrega da peça pela vendedora/locadora após a taxa paga: a taxa é integralmente devolvida à compradora/locatária, e a vendedora/locadora recebe um aviso registrado pela curadoria — na segunda ocorrência (mesma regra da exclusividade), a conta é banida da plataforma.",
];

const TERMOS_VENDA = [
  "A peça vendida deixa de pertencer à vendedora após a entrega — a responsabilidade pela integridade da peça até a entrega é da vendedora.",
  "Peças anunciadas com exclusividade não podem estar à venda em nenhum outro canal (grupos de WhatsApp, outras plataformas, etc.) durante o período de exclusividade, sob pena de aviso e, na reincidência, banimento.",
];

const TERMOS_ALUGUEL = [
  "A locadora é responsável por entregar a peça no estado, prazo e local combinados com a locatária.",
  "Ajustes permitidos: apenas ajustes reversíveis que não danifiquem, diminuam ou desvalorizem a peça — costura à mão, com pontos que não marquem e não estraguem o tecido ao serem desmanchados (ex.: caseamento simples de bainha). Não são permitidos corte, colagem ou qualquer alteração definitiva sem autorização expressa e por escrito da locadora.",
  "Devolução: a peça deve ser devolvida sem os ajustes feitos (pontos desfeitos) e já limpa em lavanderia profissional, no prazo combinado.",
  "Não devolução, atraso significativo ou dano que impeça o reuso da peça: a locatária é responsável por indenizar a locadora no valor integral anunciado da peça.",
  "Divergências sobre o estado da peça na devolução, ou sobre a aplicação da indenização acima, são mediadas pela curadoria da plataforma.",
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
