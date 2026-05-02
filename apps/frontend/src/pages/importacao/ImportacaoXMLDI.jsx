import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtUSD = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

export default function ImportacaoXMLDI() {
  const navigate = useNavigate();
  const [xmlsDI, setXmlsDI] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/purchases/import/xml-di');
      setXmlsDI(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar XMLs de DI importados');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importando, setImportando] = useState(false);
  const inputRef = useRef();

  const simularImport = (nomes) => {
    setImportando(true);
    nomes.forEach((nome) => {
      const novo = {
        id: Date.now() + Math.random(), arquivo: nome,
        num_di: 'Processando...', data_registro: null,
        importador: 'COZINCA INOX LTDA', cnpj: '62.137.272/0001-55',
        num_adicoes: 0, num_itens: 0, recinto: '—',
        total_usd: 0, taxa_cambio: 0, total_brl: 0,
        status: 'Processando', processo: null, adicoes: [],
      };
      setXmlsDI((prev) => [novo, ...prev]);
      setTimeout(() => {
        const numDI = `DI/2025/${String(Date.now()).slice(-8)}`;
        setXmlsDI((prev) => prev.map((x) => x.arquivo === nome ? {
          ...x, num_di: numDI, data_registro: hoje, num_adicoes: 1, num_itens: 2,
          recinto: 'Porto de Santos', total_usd: Math.round(Math.random() * 50000 + 5000),
          taxa_cambio: 5.12, total_brl: 0, status: 'Processado',
        } : x));
        toast.success(`XML da DI processado: ${nome}`);
        setImportando(false);
      }, 2000);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.xml'));
    if (!files.length) return toast.error('Somente arquivos .xml da DI são aceitos');
    simularImport(files.map((f) => f.name));
  };

  const gerarProcesso = (di) => {
    setXmlsDI(xmlsDI.map((x) => x.id === di.id ? { ...x, processo: `IMP-2025-${String(xmlsDI.length + 10).padStart(3, '0')}`, status: 'Processo Gerado' } : x));
    toast.success(`Processo de importação gerado a partir da DI ${di.num_di}!`);
  };

  const STATUS_COR = {
    'Processando':      'bg-yellow-100 text-yellow-700',
    'Processado':       'bg-blue-100 text-blue-700',
    'Processo Gerado':  'bg-green-100 text-green-700',
    'Erro':             'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Importação de XML da DI — Siscomex</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Importe o XML da Declaração de Importação extraído do Siscomex para criar o processo automaticamente</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">DIs importadas</p><p className="text-lg font-bold">{xmlsDI.length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Aguardando processo</p><p className="text-lg font-bold text-blue-600">{xmlsDI.filter((x) => x.status === 'Processado').length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Processos gerados</p><p className="text-lg font-bold text-green-600">{xmlsDI.filter((x) => x.status === 'Processo Gerado').length}</p></div>
      </div>

      {/* Área de upload */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-muted/30'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xml" multiple className="hidden"
          onChange={(e) => { const files = Array.from(e.target.files); if (files.length) simularImport(files.map((f) => f.name)); e.target.value = ''; }} />
        <div className="flex items-center justify-center gap-2 mb-3">
          <Globe size={28} className={dragging ? 'text-primary' : 'text-muted-foreground'} />
          <ArrowRight size={20} className="text-muted-foreground" />
          <FileText size={28} className={dragging ? 'text-primary' : 'text-muted-foreground'} />
        </div>
        <p className="font-semibold text-foreground text-lg">Arraste o XML da DI extraído do Siscomex</p>
        <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar o arquivo .xml</p>
        <div className="mt-4 grid grid-cols-3 gap-3 max-w-md mx-auto text-xs text-muted-foreground">
          {['Lê adições da DI automaticamente', 'Importa alíquotas de tributos', 'Cria processo de importação'].map((t) => (
            <div key={t} className="flex items-start gap-1 text-left"><CheckCircle size={11} className="text-green-500 mt-0.5 shrink-0" />{t}</div>
          ))}
        </div>
      </div>

      {/* Tabela de DIs */}
      <div className="erp-card overflow-x-auto">
        <div className="px-4 py-2 bg-muted/20 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold">DIs Importadas</span>
          {importando && <span className="text-xs text-muted-foreground animate-pulse">Processando XML...</span>}
        </div>
        <table className="erp-table w-full text-xs min-w-[800px]">
          <thead>
            <tr>
              <th>Arquivo</th><th>Número DI</th><th>Registro</th>
              <th>Adições</th><th>Itens</th><th>Total USD</th>
              <th>Recinto</th><th>Status</th><th>Processo</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {xmlsDI.map((x) => (
              <tr key={x.id} className="hover:bg-muted/30">
                <td>
                  <div className="flex items-center gap-1.5">
                    <FileText size={11} className="text-muted-foreground" />
                    <span className="font-mono text-[10px] max-w-[160px] truncate" title={x.arquivo}>{x.arquivo}</span>
                  </div>
                </td>
                <td className="font-mono font-medium text-primary">{x.num_di}</td>
                <td className="text-muted-foreground">{fmtD(x.data_registro)}</td>
                <td className="text-center">{x.num_adicoes || '—'}</td>
                <td className="text-center">{x.num_itens || '—'}</td>
                <td className="font-medium">{x.total_usd > 0 ? fmtUSD(x.total_usd) : '—'}</td>
                <td className="text-muted-foreground">{x.recinto}</td>
                <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COR[x.status] || 'bg-muted'}`}>{x.status}</span></td>
                <td>
                  {x.processo
                    ? <button type="button" onClick={() => navigate(`/importacao/di/${x.processo}`)} className="text-primary font-medium hover:underline text-xs">{x.processo}</button>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td>
                  <div className="flex gap-1">
                    {x.status === 'Processado' && (
                      <button type="button" onClick={() => setPreview(x)} className="text-xs text-blue-600 hover:underline">Preview</button>
                    )}
                    {x.status === 'Processado' && (
                      <button type="button" onClick={() => gerarProcesso(x)} className="text-xs text-green-600 hover:underline">Gerar Processo</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!xmlsDI.length && <tr><td colSpan={10} className="text-center py-6 text-muted-foreground">Nenhum XML importado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Preview da DI */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h2 className="font-semibold">{preview.num_di}</h2><p className="text-xs text-muted-foreground">{preview.arquivo}</p></div>
              <button type="button" onClick={() => setPreview(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm border-b border-border">
              {[
                { label: 'Importador', value: preview.importador },
                { label: 'CNPJ', value: preview.cnpj },
                { label: 'Data de Registro', value: fmtD(preview.data_registro) },
                { label: 'Recinto Aduaneiro', value: preview.recinto },
                { label: 'Número de Adições', value: preview.num_adicoes },
                { label: 'Total USD', value: fmtUSD(preview.total_usd) },
              ].map((f) => (
                <div key={f.label}><span className="text-xs text-muted-foreground">{f.label}</span><p className="font-medium">{f.value}</p></div>
              ))}
            </div>

            {preview.adicoes.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-2">Adições</h3>
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted"><th className="text-left p-2">Produto</th><th className="p-2">NCM</th><th className="text-right p-2">Qtd</th><th className="text-right p-2">USD</th><th className="text-right p-2">II</th><th className="text-right p-2">IPI</th></tr></thead>
                  <tbody>
                    {preview.adicoes.map((a, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="p-2 font-medium">{a.produto}</td>
                        <td className="p-2 font-mono text-center">{a.ncm}</td>
                        <td className="p-2 text-right">{a.qtd} {a.unidade}</td>
                        <td className="p-2 text-right">{fmtUSD(a.valor_usd)}</td>
                        <td className="p-2 text-right">{a.ii_aliq}%</td>
                        <td className="p-2 text-right">{a.ipi_aliq}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => { gerarProcesso(preview); setPreview(null); }} className="erp-btn-primary text-xs flex items-center gap-1.5">
                <Globe size={13} /> Gerar Processo de Importação
              </button>
              <button type="button" onClick={() => setPreview(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
