import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveTableCards } from '@/components/ui/ResponsiveTable';
import { cn } from '@/lib/utils';

export default function DataTable({
  columns,
  data,
  loading,
  onRowClick,
  pageSize = 15,
  /** Coluna fixa à direita (última coluna ou com stickyRight) */
  stickyActions = true,
}) {
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  let sorted = [...data];
  if (sortCol) {
    sorted.sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const stickyIdx = columns.findIndex((c) => c.stickyRight);
  const lastStickyIndex = stickyIdx >= 0 ? stickyIdx : stickyActions ? columns.length - 1 : -1;

  const renderHeaderCell = (col, idx) => {
    const isSticky = stickyActions && idx === lastStickyIndex && lastStickyIndex >= 0;
    return (
      <th
        key={col.key}
        className={cn(
          'text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap select-none',
          col.sortable !== false ? 'cursor-pointer hover:text-foreground' : '',
          isSticky && 'sticky right-0 z-20 bg-muted shadow-[inset_1px_0_0_0_hsl(var(--border))]',
        )}
        style={{ width: col.width }}
        onClick={() => col.sortable !== false && handleSort(col.key)}
      >
        <div className="flex items-center gap-1">
          {col.label}
          {col.sortable !== false &&
            (sortCol === col.key ? (
              sortDir === 'asc' ? (
                <ChevronUp size={11} />
              ) : (
                <ChevronDown size={11} />
              )
            ) : (
              <ChevronsUpDown size={11} className="opacity-40" />
            ))}
        </div>
      </th>
    );
  };

  const renderBodyCell = (col, row, idx) => {
    const isSticky = stickyActions && idx === lastStickyIndex && lastStickyIndex >= 0;
    return (
      <td
        key={col.key}
        className={cn(
          'px-3 py-2 text-foreground whitespace-nowrap bg-white group-hover:bg-muted/50',
          isSticky &&
            'sticky right-0 z-10 shadow-[inset_1px_0_0_0_hsl(var(--border))] bg-white group-hover:bg-muted/50',
        )}
      >
        {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
      </td>
    );
  };

  const pagination = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 py-2 border-t border-border bg-white">
      <span className="text-[11px] text-muted-foreground text-center sm:text-left">
        {sorted.length} registro(s) | Página {page} de {totalPages}
      </span>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`w-6 h-6 rounded text-[11px] font-medium transition-colors ${p === page ? 'cozinha-blue-bg text-white' : 'hover:bg-muted text-muted-foreground'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-1 rounded hover:bg-muted disabled:opacity-40 transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Desktop / tablet: rolagem horizontal + largura mínima */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[600px] text-xs border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">{columns.map((col, idx) => renderHeaderCell(col, idx))}</tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`group border-b border-border hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, idx) => renderBodyCell(col, row, idx))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <ResponsiveTableCards
        columns={columns}
        rows={paged}
        loading={loading}
        onRowClick={onRowClick}
        getRowKey={(row, i) => row?.id ?? i}
      />

      {totalPages > 1 && pagination}
    </div>
  );
}
