import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_XML = {
  'Processado':      { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'Aguardando':      { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  'Doc. Gerado':     { color: 'bg-blue-100 text-blue-700', icon: FileText },
  'Erro':            { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function ImportacaoXML() {
  const [xmls, setXmls] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/purchases/xml-import');
      setXmls(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar XMLs importados');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [dragging, setDragging] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const simularImport = (nomes) => {
    nomes.forEach((nome) => {
      const novo = {
        id: Date.now() + Math.random(),
        arquivo: nome, chave: '', fornecedor: 'Processando...', nfe_num: '—',
        data_emissao: null, valor: 0, status: 'Aguardando', doc_entrada: null, erros: [],
      };
      setXmls((prev) => [novo, ...prev]);
      setTimeout(() => {
        setXmls((prev) => prev.map((x) => x.arquivo === nome
          ? { ...x, fornecedor: 'Fornecedor Importado', nfe_num: `00${Math.floor(Math.random() * 900) + 100}`, data_emissao: hoje, valor: Math.round(Math.random() * 20000 + 1000), status: 'Processado' }
          : x));
        toast.success(`${nome} processado!`);
      }, 1500);
    });
    toast.info(`${nomes.length} arquivo(s) enviado(s) para processamento`);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.xml'));
    if (!files.length) return toast.error('Apenas arquivos .xml são aceitos');
    simularImport(files.map((f) => f.name));
  };

  const gerarDocEntrada = (xml) => {
    setXmls(xmls.map((x) => x.id === xml.id ? { ...x, status: 'Doc. Gerado', doc_entrada: `DE-2025-${String(xmls.length + 40).padStart(4, '0')}` } : x));
    toast.success('Documento de entrada gerado com sucesso!');
  };

  const Chip = ({ status }) => {
    const cfg = STATUS_XML[status] || STATUS_XML['Aguardando'];
    const Icon = cfg.icon;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}><Icon size={10} />{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Importação de XML NF-e de Compra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Importe XMLs das notas fiscais dos fornecedores para gerar documentos de entrada automaticamente</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total importados', value: xmls.length },
          { label: 'Aguardando ação', value: xmls.filter((x) => x.status === 'Processado').length, color: 'text-yellow-600' },
          { label: 'Doc. gerados', value: xmls.filter((x) => x.status === 'Doc. Gerado').length, color: 'text-green-600' },
          { label: 'Com erros', value: xmls.filter((x) => x.status === 'Erro').length, color: xmls.filter((x) => x.status === 'Erro').length > 0 ? 'text-red-600' : '' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Área de upload */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-muted/30'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xml" multiple className="hidden"
          onChange={(e) => { const files = Array.from(e.target.files); if (files.length) simularImport(files.map((f) => f.name)); e.target.value = ''; }} />
        <Upload size={36} className={`mx-auto mb-3 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-semibold text-foreground">Arraste e solte os arquivos XML aqui</p>
        <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar arquivos .xml</p>
        <p className="text-xs text-muted-foreground mt-3">Suporta múltiplos arquivos XML de NF-e de compra</p>
      </div>

      {/* Tabela de XMLs */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs min-w-[800px]">
          <thead>
            <tr>
              <th>Arquivo</th><th>Fornecedor</th><th>NF-e</th><th>Emissão</th>
              <th>Valor</th><th>Status</th><th>Doc. Entrada</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {xmls.map((x) => (
              <tr key={x.id} className={`hover:bg-muted/30 ${x.status === 'Erro' ? 'bg-red-50/30' : ''}`}>
                <td>
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-muted-foreground shrink-0" />
                    <span className="font-mono text-[10px] max-w-[180px] truncate" title={x.arquivo}>{x.arquivo}</span>
                  </div>
                </td>
                <td className="font-medium">{x.fornecedor}</td>
                <td className="font-mono text-muted-foreground">{x.nfe_num}</td>
                <td className="text-muted-foreground">{fmtD(x.data_emissao)}</td>
                <td className="font-medium">{x.valor > 0 ? fmtBRL(x.valor) : '—'}</td>
                <td><Chip status={x.status} /></td>
                <td>
                  {x.doc_entrada
                    ? <span className="text-primary font-medium text-[11px]">{x.doc_entrada}</span>
                    : <span className="text-muted-foreground text-[11px]">—</span>}
                </td>
                <td>
                  <div className="flex gap-1">
                    {x.status === 'Processado' && (
                      <button type="button" onClick={() => gerarDocEntrada(x)} className="text-xs text-green-600 hover:underline flex items-center gap-0.5">
                        <CheckCircle size={11} /> Gerar Doc. Entrada
                      </button>
                    )}
                    {x.status === 'Erro' && (
                      <button type="button" onClick={() => setDetalhe(x)} className="text-xs text-red-600 hover:underline flex items-center gap-0.5">
                        <AlertCircle size={11} /> Ver erros
                      </button>
                    )}
                    {x.chave && (
                      <button type="button" onClick={() => setPreview(x)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Visualizar"><Eye size={12} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!xmls.length && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum XML importado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">NF-e {preview.nfe_num}</h2>
              <button type="button" onClick={() => setPreview(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {[
                { label: 'Fornecedor', value: preview.fornecedor },
                { label: 'Número NF-e', value: preview.nfe_num },
                { label: 'Data de Emissão', value: fmtD(preview.data_emissao) },
                { label: 'Valor Total', value: fmtBRL(preview.valor) },
                { label: 'Arquivo', value: preview.arquivo },
              ].map((f) => (
                <div key={f.label} className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium text-right max-w-[250px] truncate">{f.value}</span>
                </div>
              ))}
              <div>
                <span className="text-muted-foreground text-xs">Chave de Acesso</span>
                <p className="font-mono text-[10px] break-all bg-muted/30 p-2 rounded mt-1">{preview.chave}</p>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              {preview.status === 'Processado' && (
                <button type="button" onClick={() => { gerarDocEntrada(preview); setPreview(null); }} className="erp-btn-primary text-xs">Gerar Documento de Entrada</button>
              )}
              <button type="button" onClick={() => setPreview(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal erros */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-red-600">Erros no arquivo</h2>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-2">Arquivo: <strong>{detalhe.arquivo}</strong></p>
              {detalhe.erros.map((e, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />{e}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
