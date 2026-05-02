/**
 * Em viewport &lt; sm (640px): renderiza lista em cards.
 * Em sm+: o modo tabela deve ser usado pelo componente pai (ex.: DataTable) dentro de overflow-x-auto.
 *
 * columns: { key, label, render?, mobileHidden?, sortable? }[]
 */
export function ResponsiveTableCards({
  columns,
  rows,
  loading,
  onRowClick,
  getRowKey = (row, i) => row?.id ?? i,
  emptyMessage = 'Nenhum registro encontrado',
}) {
  const visibleCols = columns.filter((c) => !c.mobileHidden);

  if (loading) {
    return (
      <div className="space-y-3 p-3 sm:hidden">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-white p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground sm:hidden">{emptyMessage}</div>
    );
  }

  return (
    <div className="divide-y divide-border border-t border-border sm:hidden">
      {rows.map((row, i) => (
        <div
          key={getRowKey(row, i)}
          role={onRowClick ? 'button' : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={(e) => {
            if (e.target.closest('button,a,[role="menuitem"]')) return;
            onRowClick?.(row);
          }}
          onKeyDown={(e) => {
            if (!onRowClick) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRowClick(row);
            }
          }}
          className={`w-full text-left p-4 bg-white hover:bg-muted/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
        >
          <dl className="space-y-2 text-xs">
            {visibleCols.map((col) => {
              const raw = row[col.key];
              const display = col.render ? col.render(raw, row) : raw ?? '—';
              return (
                <div key={col.key} className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground shrink-0">{col.label}</dt>
                  <dd className="font-medium text-right min-w-0 break-words">{display}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

export default ResponsiveTableCards;
