import { useState, useMemo } from 'react';
import {
  Plus, Search, Eye, ChevronDown, CheckCircle, XCircle, Clock,
  AlertCircle, Calendar, RefreshCw, FileText, Ban, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_APROVACAO = {
  'Aguardando Aprovação': { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  'Aprovado':             { color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  'Reprovado':            { color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  'Baixada':              { color: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
};

const STATUS_COR = {
  Pendente:  { dot: 'bg-blue-500' },
  Atrasada:  { dot: 'bg-red-500' },
  Baixada:   { dot: 'bg-gray-400' },
  Reprogramada: { dot: 'bg-yellow-500' },
};

const MOCK = [
  { id: 21515, tipo: 'Confirmada', classificacao: '41.03 - Internet', valor: 150, valor_contabil: 150, vencimento: addDias(hoje, -2), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Boleto Bancário', valor_agendado: 150, pessoa: 'Nomus', competencia: addDias(hoje, -2), descricao: 'Parcela 12 de 12', status: 'Pendente', aprovacao: 'Reprovado', data_baixa: '', valor_pago: 0 },
  { id: 21514, tipo: 'Confirmada', classificacao: '41.03 - Internet', valor: 150, valor_contabil: 150, vencimento: addDias(hoje, -30), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Boleto Bancário', valor_agendado: 150, pessoa: 'Nomus', competencia: addDias(hoje, -30), descricao: 'Parcela 11 de 12', status: 'Baixada', aprovacao: 'Aprovado', data_baixa: addDias(hoje, -28), valor_pago: 150 },
  { id: 21513, tipo: 'Confirmada', classificacao: '41.03 - Internet', valor: 150, valor_contabil: 150, vencimento: addDias(hoje, -60), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Boleto Bancário', valor_agendado: 150, pessoa: 'Nomus', competencia: addDias(hoje, -60), descricao: 'Parcela 10 de 12', status: 'Baixada', aprovacao: 'Aprovado', data_baixa: addDias(hoje, -58), valor_pago: 150 },
  { id: 21198, tipo: 'Confirmada', classificacao: '32 - Materiais de consumo operacionais', valor: 3000, valor_contabil: 3000, vencimento: addDias(hoje, 10), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Boleto Bancário', valor_agendado: 3000, pessoa: 'PLENO INDUSTRIA', competencia: addDias(hoje, -5), descricao: 'Documento 3312 - Parcela 2 de 2', status: 'Pendente', aprovacao: 'Aprovado', data_baixa: '', valor_pago: 0 },
  { id: 21197, tipo: 'Confirmada', classificacao: '32 - Materiais de consumo operacionais', valor: 3000, valor_contabil: 3000, vencimento: addDias(hoje, -15), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Boleto Bancário', valor_agendado: 3000, pessoa: 'PLENO INDUSTRIA', competencia: addDias(hoje, -20), descricao: 'Documento 3312 - Parcela 1 de 2', status: 'Atrasada', aprovacao: 'Aguardando Aprovação', data_baixa: '', valor_pago: 0 },
  { id: 21160, tipo: 'Confirmada', classificacao: '32 - Materiais de consumo operacionais', valor: 611.08, valor_contabil: 611.08, vencimento: addDias(hoje, -5), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Cheque', valor_agendado: 611.08, pessoa: 'João Pedro', competencia: addDias(hoje, -8), descricao: 'Documento 70 - Parcela 1 de 1', status: 'Atrasada', aprovacao: 'Reprovado', data_baixa: '', valor_pago: 0 },
  { id: 21106, tipo: 'Confirmada', classificacao: '41.07 - Água', valor: 1200, valor_contabil: 1200, vencimento: addDias(hoje, -20), empresa: 'COZINCA INOX LTDA', banco: 'SICOOB', forma_pag: 'Cartão de Débito', valor_agendado: 1200, pessoa: 'Fornecedor Exemplo RJ', competencia: addDias(hoje, -20), descricao: '—', status: 'Baixada', aprovacao: 'Aprovado', data_baixa: addDias(hoje, -19), valor_pago: 1200 },
];

export default function ContasPagar() {
  const [dados, setDados] = useState(MOCK);
  const [aba, setAba] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFuncoesMenu, setShowFuncoesMenu] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const totais = useMemo(() => ({
    Todos: dados.length,
    Pendentes: dados.filter((d) => d.status === 'Pendente').length,
    'Em dia': dados.filter((d) => d.status === 'Pendente' && new Date(d.vencimento) >= new Date()).length,
    Atrasadas: dados.filter((d) => d.status === 'Atrasada').length,
    Reprogramadas: dados.filter((d) => d.status === 'Reprogramada').length,
    Baixadas: dados.filter((d) => d.status === 'Baixada').length,
  }), [dados]);

  const lista = useMemo(() => {
    let d = dados;
    if (aba !== 'Todos') {
      const map = { Pendentes: 'Pendente', Atrasadas: 'Atrasada', Reprogramadas: 'Reprogramada', Baixadas: 'Baixada' };
      if (map[aba]) d = d.filter((r) => r.status === map[aba]);
    }
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.pessoa?.toLowerCase().includes(q) || String(r.id).includes(q)); }
    return d;
  }, [dados, aba, busca]);

  const kpis = useMemo(() => ({
    total_pagar: dados.filter((d) => d.status !== 'Baixada').reduce((s, r) => s + r.valor, 0),
    atrasado: dados.filter((d) => d.status === 'Atrasada').reduce((s, r) => s + r.valor, 0),
    aguardando_aprovacao: dados.filter((d) => d.aprovacao === 'Aguardando Aprovação').length,
    pago_mes: dados.filter((d) => d.status === 'Baixada').reduce((s, r) => s + r.valor_pago, 0),
  }), [dados]);

  const aprovar = (id) => {
    setDados(dados.map((d) => d.id === id ? { ...d, aprovacao: 'Aprovado' } : d));
    setDetalhe((p) => p?.id === id ? { ...p, aprovacao: 'Aprovado' } : p);
    toast.success('Pagamento aprovado!');
  };

  const reprovar = (id) => {
    setDados(dados.map((d) => d.id === id ? { ...d, aprovacao: 'Reprovado' } : d));
    setDetalhe((p) => p?.id === id ? { ...p, aprovacao: 'Reprovado' } : p);
    toast.error('Pagamento reprovado.');
  };

  const baixar = (conta) => {
    setDados(dados.map((d) => d.id === conta.id ? { ...d, status: 'Baixada', data_baixa: hoje, valor_pago: d.valor } : d));
    setDetalhe(null);
    toast.success(`Conta ${conta.id} baixada!`);
  };

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === lista.length ? [] : lista.map((r) => r.id));

  const AprovChip = ({ status }) => {
    const c = STATUS_APROVACAO[status] || STATUS_APROVACAO['Aguardando Aprovação'];
    return status ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.color}`}>{status}</span> : null;
  };
  const DotStatus = ({ status }) => {
    const c = STATUS_COR[status] || STATUS_COR.Pendente;
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.dot}`} />;
  };

  const ABAS = ['Todos', 'Pendentes', 'Em dia', 'Atrasadas', 'Reprogramadas', 'Baixadas'];

  return (
    <div className="space-y-3" onClick={() => { setShowActionsMenu(false); setShowFuncoesMenu(false); }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-foreground">Contas a pagar</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => toast.info('Agendar pagamento')} className="erp-btn-primary flex items-center gap-1.5 text-xs">
            <Calendar size={13} /> Agendar pagamento
          </button>

          {/* Ações */}
          <div className="relative">
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); }}
              className="erp-btn-ghost flex items-center gap-1 text-xs">
              Ações <ChevronDown size={11} />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-56">
                {[
                  { label: 'Forçar baixa', action: () => { if (!selectedIds.length) return toast.error('Selecione contas'); setDados(dados.map((d) => selectedIds.includes(d.id) ? { ...d, status: 'Baixada', data_baixa: hoje, valor_pago: d.valor } : d)); setSelectedIds([]); toast.success('Baixa aplicada!'); } },
                  { label: 'Pagar em lote', action: () => toast.info('Pagamento em lote') },
                  { label: 'Baixa sem numerário', action: () => toast.info('Baixa sem numerário') },
                  { label: 'Editar contas a pagar', action: () => toast.info('Editar em lote') },
                  { label: 'Aprovar pagamento', action: () => { selectedIds.forEach((id) => aprovar(id)); setSelectedIds([]); } },
                  { label: 'Reprovar pagamento', action: () => { selectedIds.forEach((id) => reprovar(id)); setSelectedIds([]); }, danger: true },
                  { label: 'Estornar aprovação para pagamento', action: () => toast.info('Estornar aprovação') },
                  { label: 'Excluir', action: () => { setDados(dados.filter((d) => !selectedIds.includes(d.id))); setSelectedIds([]); toast.success('Excluído!'); }, danger: true },
                ].map((item) => (
                  <button key={item.label} type="button" onClick={() => { item.action(); setShowActionsMenu(false); }}
                    className={`flex w-full px-3 py-2 text-xs hover:bg-muted text-left ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-foreground'} ${item.label === 'Aprovar pagamento' ? 'font-semibold text-blue-700 hover:bg-blue-50' : ''}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Funções especiais */}
          <div className="relative">
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowFuncoesMenu(!showFuncoesMenu); setShowActionsMenu(false); }}
              className="erp-btn-ghost flex items-center gap-1 text-xs">
              Funções especiais <ChevronDown size={11} />
            </button>
            {showFuncoesMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-56">
                {['Renegociar contas a pagar', 'Baixar com cheque a pagar', 'Gestão de impostos retidos'].map((label) => (
                  <button key={label} type="button" onClick={() => { toast.info(label); setShowFuncoesMenu(false); }}
                    className="flex w-full px-3 py-2 text-xs hover:bg-muted text-foreground">{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Filtros avançados */}
          <button type="button" className="erp-btn-ghost text-xs flex items-center gap-1">
            <AlertCircle size={12} /> Filtros avançados
          </button>
        </div>
      </div>

      {/* Alerta de aprovação pendente */}
      {kpis.aguardando_aprovacao > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-sm text-orange-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span><strong>{kpis.aguardando_aprovacao} pagamento(s)</strong> aguardando aprovação.</span>
          <button type="button" onClick={() => setAba('Pendentes')} className="ml-auto text-xs underline">Ver pendentes</button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total a pagar', value: fmtBRL(kpis.total_pagar), color: 'text-primary' },
          { label: 'Atrasado', value: fmtBRL(kpis.atrasado), color: 'text-red-600' },
          { label: 'Aguard. Aprovação', value: kpis.aguardando_aprovacao, color: 'text-orange-600' },
          { label: 'Pago no mês', value: fmtBRL(kpis.pago_mes), color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex flex-col sm:flex-row gap-2 flex-wrap">
        {['Código', 'Classificação', 'Valor a pagar'].map((ph) => (
          <input key={ph} className="erp-input text-xs w-32" placeholder={ph} />
        ))}
        <select className="erp-input text-xs"><option>Empresa — Selecione</option><option>COZINCA INOX LTDA</option></select>
        <select className="erp-input text-xs"><option>Conta bancária — Selecione</option><option>Banco do Brasil</option><option>SICOOB</option></select>
        <input className="erp-input text-xs w-32" placeholder="Pessoa" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
        <button type="button" onClick={() => setBusca('')} className="erp-btn-ghost text-xs">Exibir todos</button>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a} type="button" onClick={() => setAba(a)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a} <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{totais[a] || 0}</span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        {selectedIds.length > 0 && (
          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700 flex items-center justify-between">
            <span>{selectedIds.length} conta(s) selecionada(s)</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { selectedIds.forEach((id) => aprovar(id)); setSelectedIds([]); }} className="text-green-600 hover:underline">Aprovar todas</button>
              <button type="button" onClick={() => setSelectedIds([])} className="hover:underline">Limpar</button>
            </div>
          </div>
        )}
        <table className="erp-table w-full text-xs min-w-[1400px]">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" checked={selectedIds.length === lista.length && lista.length > 0} onChange={toggleAll} /></th>
              <th>Cód.</th><th>Tipo</th><th>Classificação</th><th>Valor a pagar</th>
              <th>Vencimento</th><th>Empresa</th><th>Banco</th><th>Forma Pag.</th>
              <th>Pessoa</th><th>Descrição</th><th>Status</th>
              <th>Aprovação</th><th>Data baixa</th><th>Valor pago</th><th>Saldo</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-muted/30 font-semibold text-xs">
              <td /><td colSpan={4} className="text-right pr-2 text-muted-foreground">Valor Total:</td>
              <td colSpan={10}>{fmtBRL(lista.reduce((s, r) => s + r.valor, 0))}</td>
              <td /><td>{fmtBRL(lista.reduce((s, r) => s + (r.valor - r.valor_pago), 0))}</td><td />
            </tr>
            {lista.map((r) => (
              <tr key={r.id} className={`cursor-pointer hover:bg-muted/30 ${r.status === 'Atrasada' ? 'bg-red-50/40' : ''}`}
                onClick={() => setDetalhe(r)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                </td>
                <td className="font-mono font-medium text-primary">{r.id}</td>
                <td className="text-muted-foreground">{r.tipo}</td>
                <td>{r.classificacao}</td>
                <td className="font-medium">{fmtBRL(r.valor)}</td>
                <td className={r.status === 'Atrasada' ? 'font-bold text-red-600' : 'text-muted-foreground'}>{fmtD(r.vencimento)}</td>
                <td className="text-[10px] text-muted-foreground">{r.empresa}</td>
                <td>{r.banco}</td>
                <td className="text-muted-foreground">{r.forma_pag}</td>
                <td className="font-medium max-w-[120px] truncate">{r.pessoa}</td>
                <td className="text-muted-foreground text-[10px] max-w-[130px] truncate">{r.descricao}</td>
                <td><DotStatus status={r.status} /></td>
                <td><AprovChip status={r.aprovacao} /></td>
                <td className="text-muted-foreground">{fmtD(r.data_baixa)}</td>
                <td className="font-medium text-green-700">{r.valor_pago > 0 ? fmtBRL(r.valor_pago) : '—'}</td>
                <td className="font-medium">{fmtBRL(r.valor - r.valor_pago)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                    {r.aprovacao === 'Aguardando Aprovação' && (
                      <button type="button" onClick={() => aprovar(r.id)} className="p-1 rounded hover:bg-green-50 text-green-600" title="Aprovar"><CheckCircle size={12} /></button>
                    )}
                    {r.status !== 'Baixada' && r.aprovacao === 'Aprovado' && (
                      <button type="button" onClick={() => baixar(r)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Baixar"><XCircle size={12} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={17} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Conta a Pagar #{detalhe.id}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <DotStatus status={detalhe.status} />
                  <span className="text-sm text-muted-foreground">{detalhe.status}</span>
                  <AprovChip status={detalhe.aprovacao} />
                </div>
              </div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Pessoa / Fornecedor', value: detalhe.pessoa },
                { label: 'Classificação', value: detalhe.classificacao },
                { label: 'Valor a pagar', value: fmtBRL(detalhe.valor), color: 'text-primary font-bold' },
                { label: 'Vencimento', value: fmtD(detalhe.vencimento), color: detalhe.status === 'Atrasada' ? 'text-red-600 font-bold' : '' },
                { label: 'Forma de pagamento', value: detalhe.forma_pag },
                { label: 'Conta bancária', value: detalhe.banco },
                { label: 'Descrição', value: detalhe.descricao },
                { label: 'Competência', value: fmtD(detalhe.competencia) },
              ].map((f) => (
                <div key={f.label}>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                  <p className={f.color || 'font-medium'}>{f.value}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex flex-wrap gap-2">
              {detalhe.aprovacao === 'Aguardando Aprovação' && (
                <>
                  <button type="button" onClick={() => aprovar(detalhe.id)} className="erp-btn-primary flex items-center gap-1 text-xs">
                    <CheckCircle size={13} /> Aprovar Pagamento
                  </button>
                  <button type="button" onClick={() => reprovar(detalhe.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs hover:bg-red-600 flex items-center gap-1">
                    <XCircle size={13} /> Reprovar
                  </button>
                </>
              )}
              {detalhe.status !== 'Baixada' && detalhe.aprovacao === 'Aprovado' && (
                <button type="button" onClick={() => baixar(detalhe)} className="erp-btn-primary flex items-center gap-1 text-xs">
                  <CheckCircle size={13} /> Registrar Pagamento
                </button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
