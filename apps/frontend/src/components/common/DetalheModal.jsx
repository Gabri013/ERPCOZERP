import { X, Printer, Download } from 'lucide-react';

// Modal de visualização de detalhes de qualquer registro
export default function DetalheModal({ title, subtitle, onClose, onPrint, onExport, children }) {
  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold truncate">{title}</h2>
            {subtitle && <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            <button type="button" onClick={handlePrint} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Printer size={12} /> <span className="hidden sm:inline">Imprimir</span>
            </button>
            {onExport && (
              <button type="button" onClick={onExport} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">
                <Download size={12} /> <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            )}
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-5 py-4">{children}</div>
        <div className="flex justify-end px-4 sm:px-5 py-3 border-t border-border">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 sm:py-1.5 text-xs border border-border rounded hover:bg-muted">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}