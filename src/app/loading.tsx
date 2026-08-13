export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-gold"
      />
      <p className="text-sm text-neutral-500">Carregando...</p>
    </div>
  );
}
