type Periodo = { locacao_inicio: string | null; locacao_fim: string | null };

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function paraISO(data: Date) {
  return data.toISOString().slice(0, 10);
}

function ocupado(iso: string, periodos: Periodo[]) {
  return periodos.some(
    (p) => p.locacao_inicio && p.locacao_fim && iso >= p.locacao_inicio && iso <= p.locacao_fim,
  );
}

function Mes({ ano, mes, periodos }: { ano: number; mes: number; periodos: Periodo[] }) {
  const primeiroDia = new Date(ano, mes, 1);
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const offset = primeiroDia.getDay();
  const celulas = [...Array(offset).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-neutral-600">
        {MESES[mes]} de {ano}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="text-neutral-400">
            {d}
          </span>
        ))}
        {celulas.map((dia, i) => {
          if (dia === null) return <span key={`v${i}`} />;
          const iso = paraISO(new Date(ano, mes, dia));
          const indisponivel = ocupado(iso, periodos);
          return (
            <span
              key={iso}
              className={
                "flex h-6 items-center justify-center rounded " +
                (indisponivel
                  ? "bg-red-100 text-red-700 line-through"
                  : "bg-neutral-50 text-neutral-700")
              }
            >
              {dia}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function DisponibilidadeCalendario({ periodos }: { periodos: Periodo[] }) {
  const hoje = new Date();
  const proximo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  return (
    <div className="flex flex-col gap-2 rounded border border-neutral-200 p-3">
      <p className="text-xs font-medium text-neutral-600">
        Disponibilidade de locação — dias em vermelho já estão reservados
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Mes ano={hoje.getFullYear()} mes={hoje.getMonth()} periodos={periodos} />
        <Mes ano={proximo.getFullYear()} mes={proximo.getMonth()} periodos={periodos} />
      </div>
    </div>
  );
}
