/** Fallback shown while lazy route chunks load */
export default function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden />
        <p className="text-xs text-muted-foreground">Carregando módulo…</p>
      </div>
    </div>
  );
}
