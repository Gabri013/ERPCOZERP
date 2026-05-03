import { inp, lbl, req } from '@/components/common/FormModal';

const TYPES = new Set(['texto', 'numero', 'select', 'data', 'checkbox']);

function selectChoices(field) {
  const raw = field?.options;
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw.choices)) {
    return raw.choices
      .map((c) => {
        if (c && typeof c === 'object' && 'value' in c) {
          return { value: String(c.value), label: String(c.label ?? c.value) };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw.map((x) => ({ value: String(x), label: String(x) }));
  }
  return [];
}

/**
 * Renderiza campos definidos no metadata engine (NcMetaField).
 * @param {{ fields: Array<{ id: string; fieldCode: string; label: string; dataType: string; required?: boolean; options?: unknown }>; values: Record<string, unknown>; onChange: (fieldCode: string, value: unknown) => void; className?: string }} props
 */
export default function DynamicForm({ fields, values, onChange, className = '' }) {
  const list = Array.isArray(fields) ? fields.filter((f) => f?.fieldCode && TYPES.has(String(f.dataType || ''))) : [];
  if (list.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Campos personalizados</p>
      {list.map((f) => {
        const code = f.fieldCode;
        const v = values[code];
        const dt = String(f.dataType || 'texto');

        if (dt === 'checkbox') {
          return (
            <label key={code} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={Boolean(v)}
                onChange={(e) => onChange(code, e.target.checked)}
              />
              <span className="text-xs">
                {f.label}
                {f.required ? req : null}
              </span>
            </label>
          );
        }

        return (
          <div key={code}>
            <label className={lbl}>
              {f.label}
              {f.required ? req : null}
            </label>
            {dt === 'texto' && (
              <input className={inp} value={v == null ? '' : String(v)} onChange={(e) => onChange(code, e.target.value)} />
            )}
            {dt === 'numero' && (
              <input
                type="number"
                className={inp}
                value={v === '' || v === undefined || v === null ? '' : Number(v)}
                onChange={(e) => {
                  const t = e.target.value;
                  onChange(code, t === '' ? '' : Number(t));
                }}
              />
            )}
            {dt === 'data' && (
              <input
                type="date"
                className={inp}
                value={v == null ? '' : String(v).slice(0, 10)}
                onChange={(e) => onChange(code, e.target.value)}
              />
            )}
            {dt === 'select' && (
              <select className={inp} value={v == null ? '' : String(v)} onChange={(e) => onChange(code, e.target.value)}>
                <option value="">—</option>
                {selectChoices(f).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
