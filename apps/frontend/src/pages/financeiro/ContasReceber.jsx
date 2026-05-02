import { useState, useMemo } from 'react';
import {
  Plus, Search, Download, Upload, Eye, ChevronDown, CheckCircle,
  XCircle, Clock, AlertCircle, Calendar, RefreshCw, DollarSign,
  FileText, Send, RotateCcw, Ban, Banknote,
} from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';

const STATUS_COR = {
  Pendente:  { dot: 'bg-blue-500',  label: 'Pendente' },
  'Em dia':  { dot: 'bg-green-500', label: 'Em dia' },
  Atrasada:  { dot: 'bg-red-500',   label: 'Atrasada' },
  Baixada:   { dot: 'bg-gray-400',  label: 'Baixada' },
  Reprogramada: { dot: 'bg-yellow-500', label: 'Reprogramada' },
};

const CLASSIFICACOES = [
  '10.01 - Receita com produto', '10.02 - Receita com serviço',
  '10.06 - Receita por locação', '10.10 - Adiantamento de cliente',
];
const FORMAS_PAG = ['Boleto Bancário', 'Transferência Eletrônica', 'Cartão de Débito', 'Cheque', 'Dinheiro', 'Pix'];
const CONTAS_BANC = ['Banco do Brasil', 'SICOOB', 'Itaú', 'Bradesco'];
const EMPRESAS = ['COZINCA INOX LTDA'];

const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const MOCK = [
  { id: 21027, tipo: 'Confirmada', classificacao: '10.01 - Receita com produto', valor: 6000, valor_contabil: 6000, vencimento: addDias(hoje, -5), empresa: 'COZINCA INOX LTDA', banco: 'SICOOB', forma_pag: 'Boleto Bancário', valor_agendado: 6000, data_agendamento: addDias(hoje, -5), pessoa: 'Cliente Exemplo SP', competencia: addDias(hoje, -30), descricao: 'Documento 2632 - Parcela 2 de 3', status: 'Atrasada', data_baixa: '', valor_recebido: 0, nosso_numero: '0013384-C' },
  { id: 21026, tipo: 'Confirmada', classificacao: '10.01 - Receita com produto', valor: 12000, valor_contabil: 12000, vencimento: addDias(hoje, -10), empresa: 'COZINCA INOX LTDA', banco: 'SICOOB', forma_pag: 'Boleto Bancário', valor_agendado: 12000, data_agendamento: addDias(hoje, -10), pessoa: 'Cliente Exemplo SP', competencia: addDias(hoje, -35), descricao: 'Documento 2632 - Parcela 1 de 3', status: 'Baixada', data_baixa: addDias(hoje, -9), valor_recebido: 12000, nosso_numero: '0013384-B' },
  { id: 21025, tipo: 'Adiantamento de cliente', classificacao: '10.01 - Receita com produto', valor: 6000, valor_contabil: 6000, vencimento: addDias(hoje, 5), empresa: 'COZINCA INOX LTDA', banco: 'SICOOB', forma_pag: 'Boleto Bancário', valor_agendado: 6000, data_agendamento: addDias(hoje, 5), pessoa: 'Cliente Exemplo SP', competencia: addDias(hoje, -20), descricao: 'Documento 2631 - Parcela 2 de 2', status: 'Pendente', data_baixa: '', valor_recebido: 0, nosso_numero: '0013383-S' },
  { id: 21024, tipo: 'Confirmada', classificacao: '10.01 - Receita com produto', valor: 6000, valor_contabil: 6000, vencimento: addDias(hoje, 8), empresa: 'COZINCA INOX LTDA', banco: 'SICOOB', forma_pag: 'Boleto Bancário', valor_agendado: 6000, data_agendamento: addDias(hoje, 8), pessoa: 'Cliente Exemplo SP', competencia: addDias(hoje, -20), descricao: 'Documento 2631 - Parcela 1 de 2', status: 'Em dia', data_baixa: '', valor_recebido: 0, nosso_numero: '0013383-D' },
  { id: 20915, tipo: 'Confirmada', classificacao: '10.01 - Receita com produto', valor: 275.10, valor_contabil: 275.10, vencimento: addDias(hoje, 15), empresa: 'COZINCA INOX LTDA', banco: 'Banco do Brasil', forma_pag: 'Boleto Bancário', valor_agendado: 275.10, data_agendamento: addDias(hoje, 15), pessoa: 'Cliente Exemplo RJ', competencia: addDias(hoje, -10), descricao: 'Pedido 003039 - Parcela 2 de 2', status: 'Em dia', data_baixa: '', valor_recebido: 0, nosso_numero: '' },
];

export default function ContasReceber() {
  const [dados, setDados] = useState(MOCK);
  const [aba, setAba] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFuncoesMenu, setShowFuncoesMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [showRenegociar, setShowRenegociar] = useState(null);
  const [showClassifModal, setShowClassifModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const totais = useMemo(() => ({
    Todos: dados.length,
    Pendentes: dados.filter((d) => d.status === 'Pendente').length,
    'Em dia': dados.filter((d) => d.status === 'Em dia').length,
    Atrasadas: dados.filter((d) => d.status === 'Atrasada').length,
    Reprogramadas: dados.filter((d) => d.status === 'Reprogramada').length,
    Baixadas: dados.filter((d) => d.status === 'Baixada').length,
  }), [dados]);

  const lista = useMemo(() => {
    let d = dados;
    if (aba !== 'Todos') {
      const map = { Pendentes: 'Pendente', 'Em dia': 'Em dia', Atrasadas: 'Atrasada', Reprogramadas: 'Reprogramada', Baixadas: 'Baixada' };
      d = d.filter((r) => r.status === map[aba]);
    }
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.pessoa?.toLowerCase().includes(q) || r.descricao?.toLowerCase().includes(q) || String(r.id).includes(q)); }
    return d;
  }, [dados, aba, busca]);

  const kpis = useMemo(() => ({
    total_receber: dados.filter((d) => d.status !== 'Baixada').reduce((s, r) => s + r.valor, 0),
    atrasado: dados.filter((d) => d.status === 'Atrasada').reduce((s, r) => s + r.valor, 0),
    a_vencer: dados.filter((d) => d.status === 'Em dia').reduce((s, r) => s + r.valor, 0),
    recebido_mes: dados.filter((d) => d.status === 'Baixada').reduce((s, r) => s + r.valor_recebido, 0),
  }), [dados]);

  const baixar = (conta) => {
    setDados(dados.map((d) => d.id === conta.id ? { ...d, status: 'Baixada', data_baixa: hoje, valor_recebido: d.valor } : d));
    setDetalhe(null);
    toast.success(`Conta ${conta.id} baixada com sucesso!`);
  };

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === lista.length ? [] : lista.map((r) => r.id));

  const DotStatus = ({ status }) => {
    const c = STATUS_COR[status] || STATUS_COR.Pendente;
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.dot}`} title={c.label} />;
  };

  const ABAS = ['Todos', 'Pendentes', 'Em dia', 'Atrasadas', 'Reprogramadas', 'Baixadas'];

  return (
    <div className="space-y-3" onClick={() => { setShowActionsMenu(false); setShowFuncoesMenu(false); setShowImportMenu(false); }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-foreground">Contas a receber</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => toast.info('Agendamento de recebimento')} className="erp-btn-primary flex items-center gap-1.5 text-xs">
            <Calendar size={13} /> Agendar recebimento
          </button>

          {/* Ações */}
          <div className="relative">
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); setShowFuncoesMenu(false); }}
              className="erp-btn-ghost flex items-center gap-1 text-xs">
              Ações <ChevronDown size={11} />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-52">
                {[
                  { label: 'Forçar baixa', action: () => { if (!selectedIds.length) { toast.error('Selecione contas'); return; } setDados(dados.map((d) => selectedIds.includes(d.id) ? { ...d, status: 'Baixada', data_baixa: hoje, valor_recebido: d.valor } : d)); setSelectedIds([]); toast.success('Baixa aplicada!'); } },
                  { label: 'Baixa sem numerário', action: () => toast.info('Baixa sem numerário selecionada') },
                  { label: 'Baixar em lote', action: () => toast.info('Baixa em lote') },
                  { label: 'Exportar selecionados', action: () => toast.info('Exportando...') },
                  { label: 'Excluir selecionados', action: () => { setDados(dados.filter((d) => !selectedIds.includes(d.id))); setSelectedIds([]); toast.success('Excluído!'); }, danger: true },
                ].map((item) => (
                  <button key={item.label} type="button" onClick={() => { item.action(); setShowActionsMenu(false); }}
                    className={`flex w-full px-3 py-2 text-xs hover:bg-muted text-left ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-foreground'}`}>
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
                {[
                  'Renegociar contas a receber',
                  'Baixar com cheque a receber',
                  'Transformar adiantamentos ao cliente em conta a pagar',
                ].map((label) => (
                  <button key={label} type="button" onClick={() => { setShowRenegociar(true); setShowFuncoesMenu(false); toast.info(label); }}
                    className="flex w-full px-3 py-2 text-xs hover:bg-muted text-foreground">{label}</button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={() => toast.info('Acessar Recebimentos')} className="erp-btn-ghost text-xs">Acessar Recebimentos</button>

          {/* Importação */}
          <div className="relative">
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowImportMenu(!showImportMenu); }}
              className="erp-btn-ghost flex items-center gap-1 text-xs">
              Importação de dados <ChevronDown size={11} />
            </button>
            {showImportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-52">
                {['Importar retorno CNAB', 'Importar via planilha Excel'].map((label) => (
                  <button key={label} type="button" className="flex w-full px-3 py-2 text-xs hover:bg-muted text-foreground">{label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total a receber', value: fmtBRL(kpis.total_receber), color: 'text-primary' },
          { label: 'Atrasado', value: fmtBRL(kpis.atrasado), color: 'text-red-600' },
          { label: 'A vencer', value: fmtBRL(kpis.a_vencer), color: 'text-blue-600' },
          { label: 'Recebido no mês', value: fmtBRL(kpis.recebido_mes), color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Cód., pessoa, descrição..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <input type="date" className="erp-input text-xs" placeholder="Data inicial" />
        <input type="date" className="erp-input text-xs" placeholder="Data final" />
        <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
        <button type="button" onClick={() => { setBusca(''); }} className="erp-btn-ghost text-xs">Exibir todos</button>
      </div>

      {/* Abas de status */}
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
            <button type="button" onClick={() => setSelectedIds([])} className="hover:underline">Limpar seleção</button>
          </div>
        )}
        <table className="erp-table w-full text-xs min-w-[1200px]">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" checked={selectedIds.length === lista.length && lista.length > 0} onChange={toggleAll} className="rounded" /></th>
              <th>Cód.</th><th>Tipo</th><th>Classificação</th><th>Valor a receber</th>
              <th>Vencimento</th><th>Empresa</th><th>Banco</th><th>Forma Pag.</th>
              <th>Pessoa</th><th>Descrição</th><th>Status</th><th>Data baixa</th>
              <th>Valor recebido</th><th>Saldo</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Valor total */}
            <tr className="bg-muted/30 font-semibold text-xs">
              <td /><td colSpan={4} className="text-right pr-2 text-muted-foreground">Valor Total:</td>
              <td colSpan={9}>{fmtBRL(lista.reduce((s, r) => s + r.valor, 0))}</td>
              <td /><td>{fmtBRL(lista.reduce((s, r) => s + (r.valor - r.valor_recebido), 0))}</td><td />
            </tr>
            {lista.map((r) => (
              <tr key={r.id} className={`cursor-pointer hover:bg-muted/30 ${r.status === 'Atrasada' ? 'bg-red-50/40' : ''}`}
                onClick={() => setDetalhe(r)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                </td>
                <td className="font-mono font-medium text-primary">{r.id}</td>
                <td className="text-muted-foreground">{r.tipo}</td>
                <td>{r.classificacao}</td>
                <td className="font-medium">{fmtBRL(r.valor)}</td>
                <td className={r.status === 'Atrasada' ? 'font-bold text-red-600' : 'text-muted-foreground'}>{fmtD(r.vencimento)}</td>
                <td className="text-muted-foreground text-[10px]">{r.empresa}</td>
                <td>{r.banco}</td>
                <td className="text-muted-foreground">{r.forma_pag}</td>
                <td className="font-medium">{r.pessoa}</td>
                <td className="text-muted-foreground text-[10px] max-w-[150px] truncate">{r.descricao}</td>
                <td><DotStatus status={r.status} /></td>
                <td className="text-muted-foreground">{fmtD(r.data_baixa)}</td>
                <td className="font-medium text-green-700">{r.valor_recebido > 0 ? fmtBRL(r.valor_recebido) : '—'}</td>
                <td className="font-medium">{fmtBRL(r.valor - r.valor_recebido)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                    {r.status !== 'Baixada' && (
                      <button type="button" onClick={() => baixar(r)} className="p-1 rounded hover:bg-green-50 text-green-600" title="Baixar">
                        <CheckCircle size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={16} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Conta a Receber #{detalhe.id}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <DotStatus status={detalhe.status} />
                  <span className="text-sm text-muted-foreground">{detalhe.status}</span>
                </div>
              </div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Pessoa', value: detalhe.pessoa },
                { label: 'Classificação', value: detalhe.classificacao },
                { label: 'Valor a receber', value: fmtBRL(detalhe.valor), bold: true, color: 'text-primary' },
                { label: 'Vencimento', value: fmtD(detalhe.vencimento), color: detalhe.status === 'Atrasada' ? 'text-red-600 font-bold' : '' },
                { label: 'Forma de pagamento', value: detalhe.forma_pag },
                { label: 'Conta bancária', value: detalhe.banco },
                { label: 'Empresa', value: detalhe.empresa },
                { label: 'Nosso número', value: detalhe.nosso_numero || '—' },
              ].map((f) => (
                <div key={f.label}>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                  <p className={`font-medium ${f.color || ''}`}>{f.value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Descrição</span>
                <p>{detalhe.descricao}</p>
              </div>
            </div>

            {/* Abas de ações no detalhe */}
            <div className="px-4 pb-4 border-t border-border pt-3 flex flex-wrap gap-2">
              {detalhe.status !== 'Baixada' && (
                <>
                  <button type="button" onClick={() => baixar(detalhe)} className="erp-btn-primary flex items-center gap-1.5 text-xs">
                    <CheckCircle size={13} /> Registrar Recebimento
                  </button>
                  <button type="button" onClick={() => toast.info('Gerar boleto bancário')} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
                    <FileText size={13} /> Gerar Boleto
                  </button>
                  <button type="button" onClick={() => toast.info('E-mail de cobrança enviado!')} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
                    <Send size={13} /> Cobrar por E-mail
                  </button>
                  <button type="button" onClick={() => { setShowClassifModal(detalhe); setDetalhe(null); }} className="erp-btn-ghost text-xs">
                    Classificações Financeiras
                  </button>
                </>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal classificações financeiras */}
      {showClassifModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Editar classificações financeiras</h3>
              <button type="button" onClick={() => setShowClassifModal(null)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-primary border-b border-border pb-2">
                <span>Classificações Financeiras</span><span className="text-right">Valor</span>
              </div>
              {[
                { classif: '10.01 - Receita com produto', valor: 600 },
                { classif: '10.06 - Receita por locação', valor: 400 },
              ].map((c, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center">
                  <select className="erp-input text-xs" defaultValue={c.classif}>
                    {CLASSIFICACOES.map((cl) => <option key={cl}>{cl}</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <input type="number" className="erp-input text-xs flex-1" defaultValue={c.valor} />
                    <button type="button" className="text-red-400 hover:text-red-600"><XCircle size={13} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="text-xs text-primary hover:underline">+ Adicionar classificação financeira</button>
              <div className="bg-muted/30 rounded p-2 text-xs space-y-1">
                <div className="flex justify-between"><span>Valor a ser rateado</span><span className="font-medium">{fmtBRL(showClassifModal.valor)}</span></div>
                <div className="flex justify-between text-green-600"><span>Valor rateado</span><span className="font-medium">{fmtBRL(showClassifModal.valor)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Valor pendente de rateiro</span><span>0,00</span></div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowClassifModal(null)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={() => { setShowClassifModal(null); toast.success('Classificações salvas!'); }} className="erp-btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
