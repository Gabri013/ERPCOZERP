import { useState, useMemo } from 'react';
import { Plus, Search, Eye, CheckCircle, XCircle, FileText, Upload, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_COR = {
  'Rascunho':    'bg-gray-100 text-gray-600',
  'Confirmado':  'bg-green-100 text-green-700',
  'Cancelado':   'bg-red-100 text-red-700',
};

const MOCK = [
  {
    id: 'DE-2025-0038', pedido: 'PC-2025-0042', fornecedor: 'Fornecedor Inox SP', nfe_num: '000.123', nfe_serie: '1',
    data_entrada: addDias(hoje, -1), data_emissao: addDias(hoje, -2), chave_acesso: '35250462137272000155550010001234561982341234',
    status: 'Confirmado', valor_produtos: 13500, valor_ipi: 0, valor_icms: 1350, valor_pis: 0, valor_cofins: 0, valor_frete: 0, valor_total: 13500,
    itens: [
      { produto: 'Chapa Inox 304 2mm', ncm: '7219.12.00', cfop: '1101', quantidade: 50, unidade: 'chapa', valor_unit: 270, valor_total: 13500, icms_aliq: 12, ipi_aliq: 0, pis_aliq: 1.65, cofins_aliq: 7.6 },
    ],
    contas_pagar: [{ codigo: 21600, valor: 13500, vencimento: addDias(hoje, 30), forma_pag: 'Boleto Bancário' }],
  },
  {
    id: 'DE-2025-0037', pedido: 'PC-2025-0040', fornecedor: 'Metalúrgica Brasil', nfe_num: '000.089', nfe_serie: '1',
    data_entrada: addDias(hoje, -10), data_emissao: addDias(hoje, -11), chave_acesso: '35250412345678000195550010000897651234567890',
    status: 'Confirmado', valor_produtos: 8750, valor_ipi: 875, valor_icms: 1050, valor_pis: 144.37, valor_cofins: 665, valor_frete: 300, valor_total: 9725,
    itens: [
      { produto: 'Tubo Inox 1" SCH10', ncm: '7306.40.00', cfop: '1101', quantidade: 200, unidade: 'm', valor_unit: 43.75, valor_total: 8750, icms_aliq: 12, ipi_aliq: 10, pis_aliq: 1.65, cofins_aliq: 7.6 },
    ],
    contas_pagar: [{ codigo: 21540, valor: 9725, vencimento: addDias(hoje, -5), forma_pag: 'Boleto Bancário' }],
  },
];

export default function DocumentoEntrada() {
  const [documentos, setDocumentos] = useState(MOCK);
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [abaDetalhe, setAbaDetalhe] = useState('geral');

  const lista = useMemo(() => {
    if (!busca) return documentos;
    const q = busca.toLowerCase();
    return documentos.filter((d) => d.id.toLowerCase().includes(q) || d.fornecedor.toLowerCase().includes(q) || d.nfe_num.includes(q));
  }, [documentos, busca]);

  const confirmar = (id) => {
    setDocumentos(documentos.map((d) => d.id === id ? { ...d, status: 'Confirmado' } : d));
    setDetalhe((p) => p?.id === id ? { ...p, status: 'Confirmado' } : p);
    toast.success('Documento de entrada confirmado! Estoque e financeiro atualizados.');
  };

  const ABAS_DET = [
    { id: 'geral', label: 'Geral' },
    { id: 'itens', label: 'Itens' },
    { id: 'tributos', label: 'Tributos' },
    { id: 'financeiro', label: 'Financeiro' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Documentos de Entrada</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recebimento de mercadorias integrado ao estoque e financeiro</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => toast.info('Importar XML NF-e')} className="erp-btn-ghost flex items-center gap-1.5 text-xs"><Upload size={13} /> Importar XML</button>
          <button type="button" onClick={() => toast.info('Novo documento de entrada')} className="erp-btn-primary flex items-center gap-2"><Plus size={14} /> Novo Documento</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Total documentos</p><p className="text-lg font-bold">{documentos.length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Valor total recebido</p><p className="text-lg font-bold text-primary">{fmtBRL(documentos.reduce((s, d) => s + d.valor_total, 0))}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Rascunhos</p><p className="text-lg font-bold text-yellow-600">{documentos.filter((d) => d.status === 'Rascunho').length}</p></div>
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Número, fornecedor, NF-e..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <input type="date" className="erp-input text-xs" />
        <input type="date" className="erp-input text-xs" />
        <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
      </div>

      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs min-w-[800px]">
          <thead>
            <tr>
              <th>Nº Doc.</th><th>Pedido</th><th>Fornecedor</th><th>NF-e</th>
              <th>Data Entrada</th><th>V. Produtos</th><th>V. Total</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((d) => (
              <tr key={d.id} className="cursor-pointer hover:bg-muted/30" onClick={() => { setDetalhe(d); setAbaDetalhe('geral'); }}>
                <td className="font-mono font-semibold text-primary">{d.id}</td>
                <td className="text-muted-foreground">{d.pedido}</td>
                <td className="font-medium">{d.fornecedor}</td>
                <td className="font-mono text-xs">{d.nfe_num}</td>
                <td className="text-muted-foreground">{fmtD(d.data_entrada)}</td>
                <td>{fmtBRL(d.valor_produtos)}</td>
                <td className="font-bold">{fmtBRL(d.valor_total)}</td>
                <td><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COR[d.status]}`}>{d.status}</span></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setDetalhe(d); setAbaDetalhe('geral'); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                    {d.status === 'Rascunho' && (
                      <button type="button" onClick={() => confirmar(d.id)} className="p-1 rounded hover:bg-green-50 text-green-600" title="Confirmar"><CheckCircle size={12} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">Nenhum documento encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe com abas */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{detalhe.id}</h2>
                <p className="text-sm text-muted-foreground">{detalhe.fornecedor} — NF-e {detalhe.nfe_num}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[detalhe.status]}`}>{detalhe.status}</span>
                <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
              </div>
            </div>

            {/* Sub-abas */}
            <div className="border-b border-border flex gap-0 px-2">
              {ABAS_DET.map((a) => (
                <button key={a.id} type="button" onClick={() => setAbaDetalhe(a.id)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 ${abaDetalhe === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{a.label}</button>
              ))}
            </div>

            <div className="p-4">
              {abaDetalhe === 'geral' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Fornecedor', value: detalhe.fornecedor },
                    { label: 'Pedido de Compra', value: detalhe.pedido || '—' },
                    { label: 'Nº NF-e', value: detalhe.nfe_num },
                    { label: 'Série', value: detalhe.nfe_serie },
                    { label: 'Data de Emissão', value: fmtD(detalhe.data_emissao) },
                    { label: 'Data de Entrada', value: fmtD(detalhe.data_entrada) },
                  ].map((f) => (
                    <div key={f.label}><span className="text-xs text-muted-foreground">{f.label}</span><p className="font-medium">{f.value}</p></div>
                  ))}
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Chave de Acesso NF-e</span>
                    <p className="font-mono text-xs break-all">{detalhe.chave_acesso}</p>
                  </div>
                </div>
              )}

              {abaDetalhe === 'itens' && (
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted"><th className="text-left p-2">Produto</th><th className="p-2">NCM</th><th className="p-2">CFOP</th><th className="text-right p-2">Qtd</th><th className="text-left p-2">Un</th><th className="text-right p-2">V. Unit.</th><th className="text-right p-2">Total</th></tr></thead>
                  <tbody>
                    {detalhe.itens.map((it, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="p-2 font-medium">{it.produto}</td>
                        <td className="p-2 text-center font-mono">{it.ncm}</td>
                        <td className="p-2 text-center">{it.cfop}</td>
                        <td className="p-2 text-right">{it.quantidade}</td>
                        <td className="p-2">{it.unidade}</td>
                        <td className="p-2 text-right">{fmtBRL(it.valor_unit)}</td>
                        <td className="p-2 text-right font-medium">{fmtBRL(it.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {abaDetalhe === 'tributos' && (
                <div className="space-y-3">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="text-left p-2">Produto</th><th className="text-right p-2">ICMS %</th><th className="text-right p-2">IPI %</th><th className="text-right p-2">PIS %</th><th className="text-right p-2">COFINS %</th></tr></thead>
                    <tbody>
                      {detalhe.itens.map((it, i) => (
                        <tr key={i} className="border-b border-border/30">
                          <td className="p-2 font-medium">{it.produto}</td>
                          <td className="p-2 text-right">{it.icms_aliq}%</td>
                          <td className="p-2 text-right">{it.ipi_aliq}%</td>
                          <td className="p-2 text-right">{it.pis_aliq}%</td>
                          <td className="p-2 text-right">{it.cofins_aliq}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['V. Produtos', detalhe.valor_produtos], ['V. IPI', detalhe.valor_ipi],
                      ['V. ICMS', detalhe.valor_icms], ['V. PIS', detalhe.valor_pis],
                      ['V. COFINS', detalhe.valor_cofins], ['V. Frete', detalhe.valor_frete],
                    ].map(([label, v]) => (
                      <div key={label} className="flex justify-between p-2 bg-muted/30 rounded"><span className="text-muted-foreground">{label}</span><span className="font-medium">{fmtBRL(v)}</span></div>
                    ))}
                    <div className="col-span-2 flex justify-between p-2 bg-primary/10 rounded font-bold"><span>Valor Total</span><span>{fmtBRL(detalhe.valor_total)}</span></div>
                  </div>
                </div>
              )}

              {abaDetalhe === 'financeiro' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Contas a Pagar Geradas</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="text-left p-2">Código</th><th className="text-right p-2">Valor</th><th className="text-left p-2">Vencimento</th><th className="text-left p-2">Forma de Pagamento</th></tr></thead>
                    <tbody>
                      {detalhe.contas_pagar?.map((c) => (
                        <tr key={c.codigo} className="border-b border-border/30">
                          <td className="p-2 font-mono text-primary">{c.codigo}</td>
                          <td className="p-2 text-right font-medium">{fmtBRL(c.valor)}</td>
                          <td className="p-2">{fmtD(c.vencimento)}</td>
                          <td className="p-2 text-muted-foreground">{c.forma_pag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-2">
              {detalhe.status === 'Rascunho' && (
                <button type="button" onClick={() => confirmar(detalhe.id)} className="erp-btn-primary flex items-center gap-1 text-xs"><CheckCircle size={12} /> Confirmar Entrada</button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs ml-auto">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
