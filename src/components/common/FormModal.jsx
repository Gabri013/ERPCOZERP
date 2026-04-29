import { X } from 'lucide-react';

// Modal genérico reutilizável para todos os formulários de criação/edição
export const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
export const lbl = 'block text-[11px] text-muted-foreground mb-0.5 font-medium';
export const req = <span className="text-red-500 ml-0.5">*</span>;

export default function FormModal({ title, subtitle, onClose, onSave, saving, children, size = 'md' }) {
  const sizeClass = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size] || 'max-w-xl';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30 shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90 disabled:opacity-60 min-w-[100px]"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}