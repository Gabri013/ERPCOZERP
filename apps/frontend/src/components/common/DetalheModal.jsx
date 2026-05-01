import { X, Printer, Download } from 'lucide-react';

// Modal de visualização de detalhes de qualquer registro
export default function DetalheModal({ title, subtitle, onClose, onPrint, onExport, children }) {
  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Printer size={12} /> Imprimir
            </button>
            {onExport && (
              <button onClick={onExport} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">
                <Download size={12} /> Exportar PDF
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted ml-1">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end px-5 py-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">Fechar</button>
        </div>
      </div>
    </div>
  );
}