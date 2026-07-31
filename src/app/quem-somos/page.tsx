import Link from "next/link";

export default function QuemSomosPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Quem somos</h1>

      <div className="flex flex-col gap-5 text-justify text-sm leading-relaxed text-neutral-700">
        <p>
          O <strong>É meu, pode ser seu</strong> nasceu organizando vendas de vestidos de festa em
          grupo de WhatsApp e cresceu para uma plataforma dedicada à moda circular: um lugar para
          comprar, vender e alugar vestidos de festa em segunda mão, com curadoria em cada peça.
        </p>

        <p>
          Acreditamos que um vestido usado uma única vez não precisa terminar guardado no armário.
          Ao dar nova vida a essas peças, ajudamos a reduzir o desperdício da moda e tornamos
          looks especiais acessíveis a mais pessoas — sem abrir mão de qualidade.
        </p>

        <div>
          <h2 className="mb-2 text-lg font-medium text-neutral-900">Como cuidamos de cada peça</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Toda peça passa por curadoria manual antes de entrar na vitrine.</li>
            <li>
              A taxa da plataforma só é cobrada depois que a vendedora confirma que a peça
              continua disponível — nenhum valor é debitado no momento da reserva.
            </li>
            <li>
              O valor da peça em si é sempre combinado e pago diretamente entre vendedora e
              compradora — a plataforma nunca fica com esse dinheiro, só com a taxa de
              intermediação.
            </li>
          </ul>
        </div>

        <p>
          Quer entender as regras de venda e locação em detalhe?{" "}
          <Link href="/como-funciona" className="text-gold-dark underline hover:text-gold">
            Veja como funciona
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
