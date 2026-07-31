import Link from "next/link";

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Como funciona</h1>
      <p className="mb-8 text-sm text-neutral-500">
        O passo a passo de uma venda ou locação na plataforma, e as regras que protegem os dois
        lados.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">O caminho de uma peça</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
          <li>A vendedora cadastra a peça com fotos e informações.</li>
          <li>A curadoria aprova (ou recusa) a peça antes de ela entrar na vitrine.</li>
          <li>A compradora encontra a peça na vitrine, reserva ou propõe um valor.</li>
          <li>
            A vendedora confirma se a peça ainda está disponível — só então a taxa de pré-venda é
            cobrada da compradora.
          </li>
          <li>Com a taxa paga, o contato entre as duas é liberado para combinar entrega/devolução.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Taxa da plataforma</h2>
        <p className="mb-3 text-sm text-neutral-700">
          A taxa incide sobre o valor da peça e varia pelo tipo de vendedora:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
          <li><strong>Pessoa física:</strong> 30%.</li>
          <li><strong>Loja:</strong> 20% — incentivo para lojas formalizadas.</li>
          <li>
            <strong>Venda assistida:</strong> 60% — quando a vendedora prefere delegar a
            negociação inteira à curadoria.
          </li>
        </ul>
        <p className="mt-3 text-sm text-neutral-700">
          O valor da peça em si (o combinado entre as partes) nunca passa pela plataforma — só a
          taxa. E ela só é cobrada depois da vendedora confirmar a disponibilidade, nunca no
          momento da reserva.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Propondo um valor diferente do anunciado</h2>
        <p className="mb-3 text-sm text-neutral-700">
          Quanto mais tempo uma peça está na vitrine, menor o valor mínimo aceito em uma proposta:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Até 30 dias na vitrine: mínimo 90% do valor anunciado.</li>
          <li>De 30 a 60 dias: mínimo 80%.</li>
          <li>De 60 a 90 dias: mínimo 70%.</li>
          <li>De 90 a 120 dias: mínimo 60%.</li>
          <li>Acima de 120 dias: mínimo 50%.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Exclusividade</h2>
        <p className="text-sm text-neutral-700">
          Peças anunciadas com exclusividade não podem estar à venda em nenhum outro canal
          (grupos de WhatsApp, outras plataformas etc.) enquanto estiverem na vitrine. O
          descumprimento gera um aviso e, na segunda ocorrência, banimento da conta.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Cashback</h2>
        <p className="text-sm text-neutral-700">
          A vendedora recebe 10% da taxa de volta em cashback a cada venda paga. A compradora
          ganha cashback ao compartilhar peças e gerar cliques reais nos links. O cashback vale
          por 90 dias e só pode ser usado para abater a taxa de uma futura reserva — nunca é
          sacado em dinheiro.
        </p>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        Para a lista formal, aceita no momento da transação, veja os{" "}
        <Link href="/termos" className="text-gold-dark underline hover:text-gold">
          Termos de uso
        </Link>
        .
      </p>
    </main>
  );
}
