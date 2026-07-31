import { CORES } from "@/lib/domain/regras";

export function SeletorCor({
  name,
  defaultValue,
  required,
  incluirTodos,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  incluirTodos?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {incluirTodos && (
        <label className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value=""
            defaultChecked={!defaultValue}
            className="peer sr-only"
          />
          <span className="block rounded-full border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 peer-checked:border-gold peer-checked:bg-gold-light/40">
            Todas
          </span>
        </label>
      )}
      {CORES.map((c) => (
        <label key={c.nome} className="cursor-pointer" title={c.nome}>
          <input
            type="radio"
            name={name}
            value={c.nome}
            defaultChecked={defaultValue === c.nome}
            required={required}
            className="peer sr-only"
          />
          <span
            className="block h-7 w-7 rounded-full border border-neutral-300 peer-checked:ring-2 peer-checked:ring-gold peer-checked:ring-offset-1"
            style={{ background: c.hex }}
          />
        </label>
      ))}
    </div>
  );
}
