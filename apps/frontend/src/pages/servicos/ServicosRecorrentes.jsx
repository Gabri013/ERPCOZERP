import { useState, useMemo } from 'react';
import { Plus, Search, RefreshCw, Eye, DollarSign, Calendar, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, ChevronDown, Repeat } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONTRATO = {
  Ativo:      { color: 'bg-green-100 text-green-700' },
  Suspenso:   { color: 'bg-yellow-100 text-yellow-700' },
  Encerrado:  { color: 'bg-gray-100 text-gray-500' },
  Inadimplente: { color: 'bg-red-100 text-red-700' },
};

const STATUS_PARCELA = {
  Pendente:    { color: 'bg-blue-100 text-blue-700',   icon: Clock },
  Pago:        { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  Atrasado:    { color: 'bg-red-100 text-red-700',     icon: AlertCircle },
  Cancelado:   { color: 'bg-gray-100 text-gray-500',   icon: XCircle },
};

const PERIODICIDADES = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];

const MOCK_CONTRATOS = [
  {
    id: 1, numero: 'CR-0001', cliente: 'Restaurante Sabor & Arte', servico: 'Manutenção preventiva câmara fria',
    periodicidade: 'Mensal', valor_parcela: 850, inicio: '2026-01-01', fim: '2026-12-31',
    status: 'Ativo', proxima_cobranca: '2026-05-01', total_parcelas: 12, parcelas_pagas: 4,
    responsavel: 'João Técnico', desc: 'Revisão mensal completa + reposição de consumíveis',
  },
  {
    id: 2, numero: 'CR-0002', cliente: 'Hotel Beira Mar', servico: 'Contrato de manutenção anual',
    periodicidade: 'Mensal', valor_parcela: 2200, inicio: '2026-02-01', fim: '2027-01-31',
    status: 'Ativo', proxima_cobranca: '2026-05-01', total_parcelas: 12, parcelas_pagas: 3,
    responsavel: 'Pedro Instalador', desc: 'Manutenção preventiva + corretiva ilimitada',
  },
  {
    id: 3, numero: 'CR-0003', cliente: 'Cozinha Industrial LTDA', servico: 'Contrato de assistência técnica',
    periodicidade: 'Trimestral', valor_parcela: 1800, inicio: '2026-01-01', fim: '2026-12-31',
    status: 'Inadimplente', proxima_cobranca: '2026-04-01', total_parcelas: 4, parcelas_pagas: 0,
    responsavel: 'Ana Técnica', desc: 'Visita trimestral preventiva + suporte remoto',
  },
  {
    id: 4, numero: 'CR-0004', cliente: 'Padaria São João', servico: 'Plano básico de manutenção',
    periodicidade: 'Mensal', valor_parcela: 450, inicio: '2025-06-01', fim: '2026-05-31',
    status: 'Ativo', proxima_cobranca: '2026-05-01', total_parcelas: 12, parcelas_pagas: 11,
    responsavel: 'João Técnico', desc: 'Revisão básica mensal',
  },
];

const MOCK_CONTAS = [
  { id: 1, contrato: 'CR-0001', cliente: 'Restaurante Sabor & Arte', competencia: '2026-05-01', vencimento: '2026-05-10', valor: 850, status: 'Pendente', nfse: '' },
  { id: 2, contrato: 'CR-0002', cliente: 'Hotel Beira Mar', competencia: '2026-05-01', vencimento: '2026-05-10', valor: 2200, status: 'Pendente', nfse: '' },
  { id: 3, contrato: 'CR-0001', cliente: 'Restaurante Sabor & Arte', competencia: '2026-04-01', vencimento: '2026-04-10', valor: 850, status: 'Pago', nfse: 'NFS-100120' },
  { id: 4, contrato: 'CR-0002', cliente: 'Hotel Beira Mar', competencia: '2026-04-01', vencimento: '2026-04-10', valor: 2200, status: 'Pago', nfse: 'NFS-100121' },
  { id: 5, contrato: 'CR-0003', cliente: 'Cozinha Industrial LTDA', competencia: '2026-04-01', vencimento: '2026-04-01', valor: 1800, status: 'Atrasado', nfse: '' },
  { id: 6, contrato: 'CR-0004', cliente: 'Padaria São João', competencia: '2026-05-01', vencimento: '2026-05-10', valor: 450, status: 'Pendente', nfse: '' },
];

export default function ServicosRecorrentes() {
  const [contas, setContas] = useState(MOCK_CONTAS);
  const [contratos] = useState(MOCK_CONTRATOS);
  const [aba, setAba] = useState('contratos');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [detalhe, setDetalhe] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const kpis = useMemo(() => ({
    contratos_ativos: contratos.filter((c) => c.status === 'Ativo').length,
    inadimplentes: contratos.filter((c) => c.status === 'Inadimplente').length,
    mrr: contratos.filter((c) => c.status === 'Ativo' && c.periodicidade === 'Mensal').reduce((s, c) => s + c.valor_parcela, 0),
    a_cobrar: contas.filter((c) => c.status === 'Pendente').reduce((s, c) => s + c.valor, 0),
    atrasado: contas.filter((c) => c.status === 'Atrasado').reduce((s, c) => s + c.valor, 0),
    cobrado_mes: contas.filter((c) => c.status === 'Pago' && c.competencia?.startsWith('2026-04')).reduce((s, c) => s + c.valor, 0),
  }), [contratos, contas]);

  const listaContas = useMemo(() => {
    let d = contas;
    if (filtroStatus !== 'Todos') d = d.filter((c) => c.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((c) => c.cliente.toLowerCase().includes(q) || c.contrato.toLowerCase().includes(q)); }
    return d;
  }, [contas, filtroStatus, busca]);

  const registrarPagamento = (conta) => {
    setContas(contas.map((c) => c.id === conta.id ? { ...c, status: 'Pago', nfse: `NFS-${Math.floor(Math.random() * 900000 + 100000)}` } : c));
    setShowActionsMenu(null);
    toast.success('Pagamento registrado e NFS-e gerada!');
  };

  const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const ChipContrato = ({ status }) => {
    const c = STATUS_CONTRATO[status] || STATUS_CONTRATO.Ativo;
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}>{status}</span>;
  };

  const ChipParcela = ({ status }) => {
    const c = STATUS_PARCELA[status] || STATUS_PARCELA.Pendente;
    const Icon = c.icon;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}><Icon size={10} />{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Repeat size={20} /> Serviços Recorrentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Contratos de manutenção, cobranças recorrentes e contas a receber</p>
        </div>
        <button type="button" onClick={() => toast.info('Novo contrato recorrente')} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Novo Contrato
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Contratos Ativos', value: kpis.contratos_ativos, color: 'text-green-600' },
          { label: 'Inadimplentes', value: kpis.inadimplentes, color: kpis.inadimplentes > 0 ? 'text-red-600' : 'text-foreground' },
          { label: 'MRR (Mensal)', value: fmtBRL(kpis.mrr), color: 'text-primary' },
          { label: 'A Cobrar', value: fmtBRL(kpis.a_cobrar), color: 'text-blue-600' },
          { label: 'Atrasado', value: fmtBRL(kpis.atrasado), color: kpis.atrasado > 0 ? 'text-red-600' : 'text-foreground' },
          { label: 'Cobrado (abr)', value: fmtBRL(kpis.cobrado_mes), color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-1">
        {[{ id: 'contratos', label: 'Contratos' }, { id: 'contas', label: 'Contas a Receber' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setAba(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Aba: Contratos */}
      {aba === 'contratos' && (
        <div className="erp-card overflow-x-auto">
          <table className="erp-table w-full">
            <thead>
              <tr>
                <th>Número</th><th>Cliente</th><th>Serviço</th><th>Periodicidade</th>
                <th>Valor/Parcela</th><th>Próx. Cobrança</th><th>Progresso</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetalhe(c)}>
                  <td className="font-mono text-xs font-medium text-primary">{c.numero}</td>
                  <td className="font-medium">{c.cliente}</td>
                  <td className="text-sm max-w-[160px] truncate">{c.servico}</td>
                  <td>{c.periodicidade}</td>
                  <td className="font-medium">{fmtBRL(c.valor_parcela)}</td>
                  <td className="text-muted-foreground text-xs">{c.proxima_cobranca}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(c.parcelas_pagas / c.total_parcelas) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{c.parcelas_pagas}/{c.total_parcelas}</span>
                    </div>
                  </td>
                  <td><ChipContrato status={c.status} /></td>
                  <td><button type="button" onClick={(e) => { e.stopPropagation(); setDetalhe(c); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aba: Contas a Receber */}
      {aba === 'contas' && (
        <>
          <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar cliente, contrato..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['Todos', ...Object.keys(STATUS_PARCELA)].map((s) => (
                <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                  className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead>
                <tr>
                  <th>Contrato</th><th>Cliente</th><th>Competência</th><th>Vencimento</th>
                  <th>Valor</th><th>NFS-e</th><th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaContas.map((c) => (
                  <tr key={c.id} className={`${c.status === 'Atrasado' ? 'bg-red-50/40' : ''} hover:bg-muted/40`}>
                    <td className="font-mono text-xs text-primary">{c.contrato}</td>
                    <td className="font-medium">{c.cliente}</td>
                    <td className="text-muted-foreground text-xs">{c.competencia}</td>
                    <td className="text-muted-foreground text-xs">{c.vencimento}</td>
                    <td className="font-medium">{fmtBRL(c.valor)}</td>
                    <td className="text-xs">{c.nfse || <span className="text-muted-foreground">—</span>}</td>
                    <td><ChipParcela status={c.status} /></td>
                    <td>
                      <div className="relative">
                        <button type="button" onClick={() => setShowActionsMenu(showActionsMenu === c.id ? null : c.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-xs">
                          Ações <ChevronDown size={11} />
                        </button>
                        {showActionsMenu === c.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-52">
                            <p className="text-[10px] text-muted-foreground font-semibold px-3 py-2 border-b border-border">Funções especiais</p>
                            <button type="button" onClick={() => toast.info('Ver tickets vinculados')} className="flex w-full px-3 py-2 text-xs hover:bg-muted">Ver tickets</button>
                            {c.status === 'Pendente' && (
                              <button type="button" onClick={() => toast.info('Gerar documento de venda do serviço')} className="flex w-full px-3 py-2 text-xs hover:bg-muted">Gerar doc. venda do serviço</button>
                            )}
                            {['Pendente', 'Atrasado'].includes(c.status) && (
                              <button type="button" onClick={() => registrarPagamento(c)} className="flex w-full px-3 py-2 text-xs hover:bg-green-50 text-green-600 font-medium">Lançar pagamento</button>
                            )}
                            <button type="button" onClick={() => toast.info('Exportando extrato...')} className="flex w-full px-3 py-2 text-xs hover:bg-muted">Exportar extrato</button>
                            <button type="button" onClick={() => toast.info('Cobrar coletivamente')} className="flex w-full px-3 py-2 text-xs hover:bg-muted">Cobrar coletivamente</button>
                            <button type="button" onClick={() => { setContas(contas.map((cc) => cc.id === c.id ? { ...cc, status: 'Cancelado' } : cc)); setShowActionsMenu(null); toast.info('Parcela cancelada'); }}
                              className="flex w-full px-3 py-2 text-xs hover:bg-red-50 text-red-600">Deletar</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!listaContas.length && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Nenhuma conta encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detalhe contrato */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{detalhe.numero}</h2>
                <p className="text-sm text-muted-foreground">{detalhe.cliente}</p>
              </div>
              <button type="button" onClick={() => setDetalhe(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-muted-foreground">Serviço</span><p className="font-medium">{detalhe.servico}</p></div>
                <div><span className="text-xs text-muted-foreground">Periodicidade</span><p className="font-medium">{detalhe.periodicidade}</p></div>
                <div><span className="text-xs text-muted-foreground">Valor por parcela</span><p className="font-bold text-primary">{fmtBRL(detalhe.valor_parcela)}</p></div>
                <div><span className="text-xs text-muted-foreground">Responsável</span><p>{detalhe.responsavel}</p></div>
                <div><span className="text-xs text-muted-foreground">Vigência</span><p>{detalhe.inicio} a {detalhe.fim}</p></div>
                <div><span className="text-xs text-muted-foreground">Próx. cobrança</span><p className="font-medium">{detalhe.proxima_cobranca}</p></div>
              </div>
              <div><span className="text-xs text-muted-foreground">Descrição</span><p>{detalhe.desc}</p></div>
              <div>
                <span className="text-xs text-muted-foreground">Progresso ({detalhe.parcelas_pagas}/{detalhe.total_parcelas} parcelas)</span>
                <div className="h-2 bg-muted rounded-full mt-1.5">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(detalhe.parcelas_pagas / detalhe.total_parcelas) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <ChipContrato status={detalhe.status} />
                <span className="text-xs text-muted-foreground">Valor total: <strong>{fmtBRL(detalhe.valor_parcela * detalhe.total_parcelas)}</strong></span>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => toast.info('Gerando cobrança para este contrato...')} className="erp-btn-primary flex items-center gap-1">
                <DollarSign size={13} /> Gerar Cobrança
              </button>
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
