import { TERMOS_VERSAO } from "@/lib/domain/termos";

const NATUREZA_RELACAO =
  'A plataforma "É meu, pode ser seu" atua exclusivamente como intermediadora, aproximando ' +
  "vendedoras/locadoras e compradoras/locatárias. A plataforma não é parte no contrato de compra " +
  "e venda ou de locação celebrado entre elas, não é proprietária, depositária, vendedora, " +
  "locadora nem fiadora das peças, e não recebe, custodia ou repassa o valor da peça ou do " +
  "aluguel. As obrigações da plataforma limitam-se ao serviço de intermediação que ela " +
  "efetivamente presta e cobra: curadoria dos anúncios, disponibilização da vitrine, " +
  "intermediação da reserva, liberação do contato e mediação de divergências nos termos deste " +
  "documento. Nada nesta cláusula afasta a responsabilidade da plataforma por defeitos do " +
  "próprio serviço de intermediação, nos termos do Código de Defesa do Consumidor.";

const TERMOS_COMUNS = [
  "A taxa de pré-venda só é cobrada depois que a vendedora confirma a disponibilidade da peça — nenhum valor é debitado no momento da reserva ou da proposta.",
  "Após confirmada e paga, a taxa não é reembolsável, ressalvadas as seguintes hipóteses: (i) exercício do direito de arrependimento em até 7 dias, nos termos do art. 49 do Código de Defesa do Consumidor, enquanto o contato entre as partes ainda não tiver sido liberado; (ii) não entrega da peça pela vendedora/locadora; (iii) divergência relevante entre a peça recebida e as medidas, fotos ou estado informados no anúncio.",
  "O valor da peça em si (100%) é combinado e pago diretamente entre vendedora e compradora, fora da plataforma. A plataforma nunca custodia esse valor — apenas a taxa de pré-venda.",
  "Reservas sem resposta da vendedora em até 24h são liberadas automaticamente de volta à vitrine, sem qualquer cobrança.",
  "Comprador e vendedor com o mesmo número de WhatsApp não podem transacionar entre si.",
  "A vendedora/locadora é responsável por informar medidas reais e precisas da peça (busto, cintura, quadril, comprimento) e por fotos e vídeo que representem fielmente seu estado.",
];

const DEVOLUCAO_TAXA =
  "Devolução da taxa. Nas hipóteses previstas nestes Termos (não entrega pela vendedora/locadora, " +
  "ou divergência relevante entre a peça recebida e as medidas, fotos ou estado anunciados), a " +
  "compradora/locatária deve acionar a curadoria em até 7 dias corridos contados da data combinada " +
  "para a entrega. A curadoria decidirá em até 5 dias úteis, ouvida a vendedora/locadora. Sendo " +
  "devida, a taxa é devolvida em dinheiro, pelo mesmo meio de pagamento utilizado, em até 10 dias " +
  "corridos da decisão. A devolução em dinheiro não pode ser substituída por cashback ou crédito " +
  "na plataforma, salvo opção expressa da compradora.";

const AVISOS_BANIMENTO =
  "Avisos e banimento. Antes do registro de um aviso, a vendedora/locadora será comunicada e " +
  "poderá se manifestar em até 5 dias. O aviso registrado indicará o motivo específico (não " +
  "entrega, violação de exclusividade ou divergência relevante de descrição). O segundo aviso, de " +
  "qualquer natureza, importa banimento da conta.";

const TERMOS_VENDA = [
  "A peça vendida deixa de pertencer à vendedora após a entrega — a responsabilidade pela integridade da peça até a entrega é da vendedora.",
  "Peças anunciadas com exclusividade não podem estar à venda em nenhum outro canal (grupos de WhatsApp, outras plataformas, etc.) durante o período de exclusividade, sob pena de aviso e, na reincidência, banimento.",
];

const TERMOS_ALUGUEL = [
  "A locadora é responsável por entregar a peça no estado, prazo e local combinados com a locatária.",
  "Ajustes permitidos: apenas ajustes reversíveis que não danifiquem, diminuam ou desvalorizem a peça — costura à mão, com pontos que não marquem e não estraguem o tecido ao serem desmanchados (ex.: caseamento simples de bainha). Não são permitidos corte, colagem ou qualquer alteração definitiva sem autorização expressa e por escrito da locadora.",
  "Devolução: a peça deve ser devolvida sem os ajustes feitos (pontos desfeitos) e já limpa em lavanderia profissional, no prazo combinado.",
  "Vistoria: as responsabilidades da locatária descritas abaixo só são exigíveis se houver registro fotográfico ou em vídeo do estado da peça no ato da retirada e no ato da devolução, feito pelas duas partes e enviado à curadoria pelo canal indicado.",
  "Divergências sobre o estado da peça na devolução, ou sobre a aplicação da responsabilidade abaixo, são mediadas pela curadoria da plataforma.",
];

const RESPONSABILIDADE_DEVOLUCAO = [
  "Atraso: tolerância de 6 horas sobre o horário combinado. A partir daí, multa moratória de 20% do valor do aluguel por dia de atraso, limitada a 30% do valor anunciado da peça.",
  "Não devolução: considera-se não devolvida a peça não restituída em até 7 dias corridos após a data combinada, ou cuja devolução seja recusada. Nesse caso a locatária responde pelo valor de reposição da peça, equivalente ao valor anunciado vigente na data da reserva, acrescido da multa moratória acumulada até o limite acima.",
  "Dano que impeça o reuso: mesma responsabilidade da não devolução, mediante laudo ou orçamento de costureira/lavanderia apresentado pela locadora à curadoria.",
  "Dano reparável: custo comprovado do reparo, mediante orçamento — não se aplica a responsabilidade pelo valor integral.",
  "Devolução sem a lavagem profissional: custo comprovado da lavanderia.",
  "Alteração definitiva não autorizada: enquadra-se como dano, aplicando-se as regras de dano reparável ou irreparável conforme o caso.",
];

export default async function TermosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const ehAluguel = tipo === "aluguel";
  const termosEspecificos = ehAluguel ? TERMOS_ALUGUEL : TERMOS_VENDA;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Termos de uso</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Aplicáveis a transações de {ehAluguel ? "aluguel" : "venda"} na plataforma &ldquo;É meu,
        pode ser seu&rdquo;. Versão {TERMOS_VERSAO}.
      </p>

      <div className="mb-6 rounded border-2 border-amber-400 bg-amber-50 p-3 text-sm font-medium text-neutral-900">
        {NATUREZA_RELACAO}
      </div>

      <h2 className="mb-2 text-lg font-medium">Regras gerais</h2>
      <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-neutral-700">
        {TERMOS_COMUNS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <ul className="mb-6 flex flex-col gap-2">
        <li className="rounded border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-neutral-900">
          {DEVOLUCAO_TAXA}
        </li>
        <li className="rounded border border-neutral-200 p-3 text-sm text-neutral-700">
          {AVISOS_BANIMENTO}
        </li>
      </ul>

      <h2 className="mb-2 text-lg font-medium">Específicas de {ehAluguel ? "aluguel" : "venda"}</h2>
      <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-neutral-700">
        {termosEspecificos.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      {ehAluguel && (
        <>
          <h3 className="mb-2 text-base font-medium">
            Responsabilidade da locatária pela devolução
          </h3>
          <ul className="list-disc space-y-2 rounded border-2 border-amber-400 bg-amber-50 p-4 pl-9 text-sm font-medium text-neutral-900">
            {RESPONSABILIDADE_DEVOLUCAO.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
