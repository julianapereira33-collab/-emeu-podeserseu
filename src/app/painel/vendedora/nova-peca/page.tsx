import { NovaPecaForm } from "./nova-peca-form";

export default function NovaPecaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Cadastrar peça</h1>
        <p className="text-sm text-neutral-500">
          Sua peça vai para a fila de curadoria antes de aparecer na vitrine.
        </p>
      </div>
      <NovaPecaForm />
    </div>
  );
}
