import { useState, useMemo } from 'react';
import { Plus, Search, Download, Upload, Eye, CheckCircle, XCircle, Clock, AlertCircle, FileText, Send, ChevronDown, Printer } from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_BOLETO = {
  'Aguardando remessa': { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  'Remessa enviada':    { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  'Registrado':         { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  'Liquidado':          { color: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500' },
  'Vencido':            { color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
  'Cancelado':          { color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
};

const MOCK_BOLETOS = [
  { id: 1, numero_doc: 'BOL-0001', cliente: 'Cliente Exemplo SP', conta_receber: 21027, banco: 'SICOOB', vencimento: addDias(hoje, -3), valor: 6000, nosso_numero: '0013384-C', linha_digitavel: '75692.30126 01000.008803 01340.290012 6 12990000060000', status: 'Vencido', data_emissao: addDias(hoje, -15) },
  { id: 2, numero_doc: 'BOL-0002', cliente: 'Hotel Beira Mar', conta_receber: 21025, banco: 'SICOOB', vencimento: addDias(hoje, 5), valor: 4800, nosso_numero: '0013385-A', linha_digitavel: '75692.30126 01000.008803 01340.290012 7 12990000048000', status: 'Registrado', data_emissao: addDias(hoje, -3) },
  { id: 3, numero_doc: 'BOL-0003', cliente: 'Cozinha Industrial LTDA', conta_receber: 21024, banco: 'Banco do Brasil', vencimento: addDias(hoje, 8), valor: 7500, nosso_numero: '0013386-B', linha_digitavel: '00190.00009 02084.068002 00112.906178 1 97740000075000', status: 'Remessa enviada', data_emissao: addDias(hoje, -2) },
  { id: 4, numero_doc: 'BOL-0004', cliente: 'Padaria São João', conta_receber: 20915, banco: 'Banco do Brasil', vencimento: addDias(hoje, 15), valor: 275.10, nosso_numero: '0013387-C', linha_digitavel: '', status: 'Aguardando remessa', data_emissao: hoje },
];

const MOCK_REMESSAS = [
  { id: 534, empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', convenio: '04', numero: '419', data_criacao: addDias(hoje, -2) + ' 17:30', status: 'Arquivo enviado para o banco', metodo: 'Automático pelo EDI Financeiro', arquivo: 'Cobranca.30104.40618K.534.REM', valor: 2267.53 },
  { id: 533, empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', convenio: '04', numero: '418', data_criacao: addDias(hoje, -4) + ' 17:30', status: 'Arquivo enviado para o banco', metodo: 'Automático pelo EDI Financeiro', arquivo: 'Cobranca.30104.40618K.533.REM', valor: 2313.08 },
  { id: 532, empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', convenio: '04', numero: '417', data_criacao: addDias(hoje, -4) + ' 09:30', status: 'Arquivo gerado aguardando envio', metodo: '—', arquivo: 'Cobranca.30104.40618K.532.REM', valor: 315 },
];

export default function BoletoBancario() {
  const [aba, setAba] = useState('boletos');
  const [boletos, setBoletos] = useState(MOCK_BOLETOS);
  const [remessas] = useState(MOCK_REMESSAS);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [detalhe, setDetalhe] = useState(null);
  const [showBoleto, setShowBoleto] = useState(null);

  const lista = useMemo(() => {
    let d = boletos;
    if (filtroStatus !== 'Todos') d = d.filter((b) => b.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((b) => b.cliente.toLowerCase().includes(q) || b.nosso_numero.toLowerCase().includes(q)); }
    return d;
  }, [boletos, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    total: boletos.length,
    registrados: boletos.filter((b) => ['Registrado', 'Remessa enviada'].includes(b.status)).length,
    vencidos: boletos.filter((b) => b.status === 'Vencido').length,
    valor_aberto: boletos.filter((b) => !['Liquidado', 'Cancelado'].includes(b.status)).reduce((s, b) => s + b.valor, 0),
    valor_liquidado: boletos.filter((b) => b.status === 'Liquidado').reduce((s, b) => s + b.valor, 0),
  }), [boletos]);

  const Chip = ({ status }) => {
    const c = STATUS_BOLETO[status] || STATUS_BOLETO['Aguardando remessa'];
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Boletos Bancários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Emissão, remessa, retorno e conciliação automática</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => toast.info('Novo arquivo de remessa')} className="erp-btn-ghost text-xs flex items-center gap-1.5">
            <Upload size={13} /> Novo arquivo de remessa
          </button>
          <button type="button" onClick={() => toast.info('Importar retorno bancário')} className="erp-btn-ghost text-xs flex items-center gap-1.5">
            <Download size={13} /> Importar retorno
          </button>
          <button type="button" onClick={() => toast.info('Emitir novo boleto')} className="erp-btn-primary flex items-center gap-2">
            <Plus size={14} /> Emitir Boleto
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: kpis.total },
          { label: 'Registrados/Enviados', value: kpis.registrados, color: 'text-blue-600' },
          { label: 'Vencidos', value: kpis.vencidos, color: kpis.vencidos > 0 ? 'text-red-600' : 'text-foreground' },
          { label: 'Valor Aberto', value: fmtBRL(kpis.valor_aberto), color: 'text-primary' },
          { label: 'Valor Liquidado', value: fmtBRL(kpis.valor_liquidado), color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-1">
        {[{ id: 'boletos', label: 'Boletos' }, { id: 'remessas', label: 'Arquivos de Remessa' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setAba(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'boletos' && (
        <>
          <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 text-xs w-full" placeholder="Cliente, nosso número..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['Todos', ...Object.keys(STATUS_BOLETO)].map((s) => (
                <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                  className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full text-xs">
              <thead>
                <tr>
                  <th>Documento</th><th>Cliente</th><th>Banco</th><th>Nosso Número</th>
                  <th>Emissão</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((b) => (
                  <tr key={b.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetalhe(b)}>
                    <td className="font-mono font-medium text-primary">{b.numero_doc}</td>
                    <td className="font-medium">{b.cliente}</td>
                    <td>{b.banco}</td>
                    <td className="font-mono text-muted-foreground">{b.nosso_numero}</td>
                    <td className="text-muted-foreground">{fmtD(b.data_emissao)}</td>
                    <td className={b.status === 'Vencido' ? 'font-bold text-red-600' : 'text-muted-foreground'}>{fmtD(b.vencimento)}</td>
                    <td className="font-medium">{fmtBRL(b.valor)}</td>
                    <td><Chip status={b.status} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setShowBoleto(b)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Ver boleto"><Printer size={12} /></button>
                        <button type="button" onClick={() => toast.success('E-mail enviado!')} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Enviar por e-mail"><Send size={12} /></button>
                        {b.status !== 'Liquidado' && (
                          <button type="button" onClick={() => { setBoletos(boletos.map((x) => x.id === b.id ? { ...x, status: 'Liquidado' } : x)); toast.success('Boleto liquidado!'); }}
                            className="p-1 rounded hover:bg-green-50 text-green-600" title="Liquidar"><CheckCircle size={12} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === 'remessas' && (
        <div className="erp-card overflow-x-auto">
          <table className="erp-table w-full text-xs">
            <thead>
              <tr>
                <th>Cód.</th><th>Empresa</th><th>Banco</th><th>Convênio</th>
                <th>Número</th><th>Data/Hora</th><th>Status</th><th>Método</th><th>Arquivo</th><th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {remessas.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td>
                    <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${r.status.includes('enviado') ? 'bg-green-500' : r.status.includes('aguardando') ? 'bg-yellow-400' : 'bg-blue-500'}`} />
                    {r.id}
                  </td>
                  <td className="text-muted-foreground text-[10px]">{r.empresa}</td>
                  <td>{r.banco}</td>
                  <td className="text-center">{r.convenio}</td>
                  <td className="font-medium">{r.numero}</td>
                  <td className="text-muted-foreground">{r.data_criacao}</td>
                  <td><span className="text-[10px] text-muted-foreground">{r.status}</span></td>
                  <td className="text-[10px] text-muted-foreground">{r.metodo}</td>
                  <td className="font-mono text-[10px]">{r.arquivo}</td>
                  <td className="font-medium">{fmtBRL(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualização do boleto */}
      {showBoleto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Fatura a pagar</h2>
              <button type="button" onClick={() => setShowBoleto(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-6 text-center text-sm mb-4">
              <p className="text-muted-foreground">R$</p>
              <p className="text-4xl font-bold text-primary">{fmtBRL(showBoleto.valor)}</p>
              <div className="mt-4 space-y-1 text-muted-foreground text-xs">
                <p>Emissão em: {fmtD(showBoleto.data_emissao)}</p>
                <p>Vencimento: <span className="font-medium text-foreground">{fmtD(showBoleto.vencimento)}</span></p>
                <p>Status: <span className="font-medium">{showBoleto.status}</span></p>
              </div>
            </div>
            {/* Layout simplificado do boleto */}
            <div className="mx-4 mb-4 border-2 border-gray-800 rounded-sm text-[10px]">
              <div className="p-3 border-b border-gray-400 flex items-center justify-between">
                <div className="font-bold text-sm">{showBoleto.banco} | 001-9</div>
                <div className="text-muted-foreground">Recibo do Pagador</div>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-400">
                <div><span className="text-muted-foreground">Beneficiário:</span> <strong>COZINCA INOX LTDA</strong></div>
                <div><span className="text-muted-foreground">Nosso Número:</span> {showBoleto.nosso_numero}</div>
                <div><span className="text-muted-foreground">Pagador:</span> {showBoleto.cliente}</div>
                <div><span className="text-muted-foreground">Valor:</span> <strong>{fmtBRL(showBoleto.valor)}</strong></div>
              </div>
              {showBoleto.linha_digitavel && (
                <div className="p-3 bg-gray-50 font-mono text-center tracking-wide text-xs">{showBoleto.linha_digitavel}</div>
              )}
              <div className="p-3 text-center text-[9px] text-muted-foreground">Pagável em qualquer agência bancária até a data de vencimento.</div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button type="button" onClick={() => toast.info('Baixando boleto...')} className="erp-btn-ghost flex items-center gap-1.5 text-xs"><Download size={13} /> Baixar boleto</button>
              <button type="button" onClick={() => toast.success('E-mail enviado!')} className="erp-btn-primary flex items-center gap-1.5 text-xs"><Send size={13} /> Enviar por e-mail</button>
              <button type="button" onClick={() => setShowBoleto(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
