import { Search, X } from 'lucide-react';

export default function FilterBar({ search, onSearch, filters = [], onFilterChange, activeFilters = {}, onClear }) {
  const hasActive = Object.values(activeFilters).some(v => v && v !== '');

  return (
    <div className="flex items-center gap-2 p-3 bg-white border border-border rounded-t-lg">
      <div className="flex items-center gap-1.5 bg-muted rounded px-2 py-1.5 flex-1 max-w-xs">
        <Search size={12} className="text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Buscar..."
          className="bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground w-full"
        />
        {search && (
          <button onClick={() => onSearch('')} className="text-muted-foreground hover:text-foreground">
            <X size={11} />
          </button>
        )}
      </div>

      {filters.map(f => (
        <select
          key={f.key}
          value={activeFilters[f.key] || ''}
          onChange={e => onFilterChange(f.key, e.target.value)}
          className="text-xs border border-border rounded px-2 py-1.5 bg-white text-foreground outline-none focus:border-primary cursor-pointer"
        >
          <option value="">{f.label}</option>
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {hasActive && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <X size={11} /> Limpar
        </button>
      )}
    </div>
  );
}