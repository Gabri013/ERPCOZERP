import { X } from 'lucide-react';

// Modal genérico reutilizável para todos os formulários de criação/edição
export const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
export const lbl = 'block text-[11px] text-muted-foreground mb-0.5 font-medium';
export const req = <span className="text-red-500 ml-0.5">*</span>;

export default function FormModal({
  title,
  subtitle,
  onClose,
  onSave,
  saving,
  children,
  size = 'md',
  hideFooter,
}) {
  const sizeClass =
    { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size] || 'sm:max-w-xl';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div
        className={`bg-white rounded-lg shadow-2xl w-[95vw] ${sizeClass} max-h-[90vh] overflow-hidden flex flex-col`}
        role="dialog"
        aria-modal
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold">{title}</h2>
            {subtitle && <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted shrink-0">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-5 py-4">{children}</div>
        {!hideFooter && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 sm:px-5 py-3 border-t border-border bg-muted/30 shrink-0">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 sm:py-1.5 text-xs border border-border rounded hover:bg-muted">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 disabled:opacity-60 sm:min-w-[100px]"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}