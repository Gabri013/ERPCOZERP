import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle, XCircle, AlertTriangle,
  Truck, Package, ArrowRight, FileText,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const fmtDT = (v) => v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const MOCK_OPPT = {
  id: 'OPPT-2025-001', cliente: 'Indústria Química Alfa S/A', cnpj: '11.222.333/0001-44',
  produto: 'Caldeirão inox 300L c/ tampa', codigo: 'SV-CALDEIRAO',
  pedido_venda: 'PV-2025-0020', data_abertura: addDias(hoje, -10),
  prazo: addDias(hoje, 15), status: 'Em Produção',
  valor_servico: 8500, descricao_servico: 'Fabricação de caldeirão inox 300L com tampa e pés reguláveis',
  materiais: [
    { id: 1, codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm', qtd_recebida: 85, qtd_consumida: 60, qtd_sobra: 0, unidade: 'kg' },
    { id: 2, codigo: 'MP-TUBO-2',         descricao: 'Tubo Inox 2" SCH10',  qtd_recebida: 12, qtd_consumida: 8,  qtd_sobra: 0, unidade: 'm' },
  ],
  nfe_entrada: [{ id: 1, num: 'A-00445', serie: '1', data: addDias(hoje, -9), cfop: '5901', valor: 0, status: 'Entrada Gerada', emitente: 'Ind. Química Alfa S/A' }],
  nfe_saida: [],
  producao: [{ id: 1, data: addDias(hoje, -2) + 'T10:00:00', qtd: 1, lote: 'LT-PT-001', obs: 'Produção em andamento' }],
  contas_receber: [{ id: 1, descricao: 'Serviço de fabricação — OPPT-2025-001', vencimento: addDias(hoje, 20), valor: 8500, status: 'Pendente' }],
};

const STATUS_COR = {
  'Aberta':             'bg-blue-100 text-blue-700',
  'Mat. Recebidos':     'bg-teal-100 text-teal-700',
  'Em Produção':        'bg-orange-100 text-orange-700',
  'Produção Concluída': 'bg-purple-100 text-purple-700',
  'NF-e Emitida':       'bg-green-100 text-green-700',
  'Encerrada':          'bg-gray-100 text-gray-500',
};

const CFOP_MAP = {
  '5901': 'Remessa p/ industrialização por encomenda (do cliente)',
  '5902': 'Retorno de produto fabricado',
  '5903': 'Retorno de sobras de materiais',
  '5124': 'Industrialização para outra empresa (NF-e de serviço)',
};

export default function DetalhePT() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [oppt, setOppt] = useState(location.state?.oppt || MOCK_OPPT);
  const [aba, setAba] = useState('dados');
  const [materiais, setMateriais] = useState(oppt.materiais || []);
  const [nfeEntrada, setNfeEntrada] = useState(oppt.nfe_entrada || []);
  const [nfeSaida, setNfeSaida] = useState(oppt.nfe_saida || []);
  const [producao, setProducao] = useState(oppt.producao || []);
  const [contasReceber, setContasReceber] = useState(oppt.contas_receber || []);

  // Forms
  const [showRecebimento, setShowRecebimento] = useState(false);
  const [showReporte, setShowReporte] = useState(false);
  const [showRetorno, setShowRetorno] = useState(false);
  const [showNFService, setShowNFService] = useState(false);
  const [showSobras, setShowSobras] = useState(false);
  const [showSugestao, setShowSugestao] = useState(false);

  const [formRec, setFormRec] = useState({ num: '', emitente: oppt.cliente, data: hoje, cfop: '5901' });
  const [formRep, setFormRep] = useState({ data: hoje, qtd: 1, lote: '', obs: '' });
  const [matConsumido, setMatConsumido] = useState([]);
  const [formRet, setFormRet] = useState({ num: '', data: hoje, cfop: '5902', tipo: 'Retorno Produto', valor: oppt.valor_servico });
  const [formSobra, setFormSobra] = useState({ num: '', data: hoje, cfop: '5903' });
  const [matSobrasQtd, setMatSobrasQtd] = useState([]);
  const [formServ, setFormServ] = useState({ num: '', serie: '1', data: hoje, cfop: '5124', valor: oppt.valor_servico });

  const ABAS = [
    { id: 'dados',       label: 'Dados Gerais' },
    { id: 'materiais',   label: `Materiais (${materiais.length})` },
    { id: 'recebimento', label: `Recebimento (${nfeEntrada.length})` },
    { id: 'producao',    label: `Produção (${producao.length})` },
    { id: 'retorno',     label: `Retorno/Sobras (${nfeSaida.length})` },
    { id: 'nfe',         label: 'NF-e Serviço' },
    { id: 'financeiro',  label: `Financeiro (${contasReceber.length})` },
  ];

  const registrarRecebimento = () => {
    const nova = { id: Date.now(), ...formRec, status: 'Entrada Gerada', itens: materiais.length };
    setNfeEntrada([...nfeEntrada, nova]);
    setOppt((o) => ({ ...o, status: 'Mat. Recebidos' }));
    setShowRecebimento(false);
    toast.success(`NF-e de remessa do cliente registrada! Estoque de materiais de terceiros atualizado.`);
  };

  const registrarProducao = () => {
    const novoRep = { id: Date.now(), ...formRep };
    setProducao([...producao, novoRep]);
    setMateriais(materiais.map((m, i) => ({ ...m, qtd_consumida: m.qtd_consumida + (matConsumido[i] || 0) })));
    setOppt((o) => ({ ...o, status: 'Em Produção' }));
    setShowReporte(false);
    toast.success('Produção registrada! Estoque de materiais de terceiros atualizado.');
  };

  const registrarRetorno = () => {
    const novaNfe = { id: Date.now(), ...formRet, status: 'Autorizada' };
    setNfeSaida([...nfeSaida, novaNfe]);
    setOppt((o) => ({ ...o, status: 'Produção Concluída' }));
    setShowRetorno(false);
    toast.success('NF-e de retorno emitida! Produto entregue ao cliente.');
  };

  const registrarSobras = () => {
    setMateriais(materiais.map((m, i) => ({ ...m, qtd_sobra: m.qtd_sobra + (matSobrasQtd[i] || 0) })));
    const novaNfe = { id: Date.now(), ...formSobra, tipo: 'Retorno Sobras', valor: 0, status: 'Autorizada' };
    setNfeSaida([...nfeSaida, novaNfe]);
    setShowSobras(false);
    toast.success('NF-e de devolução de sobras emitida!');
  };

  const emitirNFServico = () => {
    const nova = { id: Date.now(), ...formServ, tipo: 'NF-e Serviço', status: 'Autorizada' };
    setNfeSaida([...nfeSaida, nova]);
    setOppt((o) => ({ ...o, status: 'NF-e Emitida' }));
    setShowNFService(false);
    toast.success('NF-e de serviço de industrialização emitida! Conta a receber gerada.');
  };

  const StatusNFe = ({ status }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${['Autorizada', 'Entrada Gerada'].includes(status) ? 'bg-green-100 text-green-700' : status === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>
  );

  const sugestaoRetorno = materiais.map((m) => ({
    ...m, qtd_retornar: m.qtd_recebida - m.qtd_consumida - m.qtd_sobra,
  })).filter((m) => m.qtd_retornar > 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/producao/para-terceiros')} className="p-1 rounded hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{oppt.id} — {oppt.produto}</h1>
          <p className="text-sm text-muted-foreground">{oppt.cliente} · {oppt.cnpj}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COR[oppt.status] || 'bg-muted'}`}>{oppt.status}</span>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Valor do Serviço',       value: fmtBRL(oppt.valor_servico), color: 'text-primary' },
          { label: 'Mat. Recebidos',          value: `${materiais.reduce((s, m) => s + m.qtd_recebida, 0)} un.`, color: '' },
          { label: 'Saldo em Nosso Poder',    value: `${materiais.reduce((s, m) => s + (m.qtd_recebida - m.qtd_consumida - m.qtd_sobra), 0)} un.`, color: 'text-teal-600' },
          { label: 'Prazo',                  value: fmtD(oppt.prazo), color: oppt.prazo < hoje ? 'text-red-600' : '' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA DADOS */}
      {aba === 'dados' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Dados da Ordem</h3>
            <div className="space-y-2">
              {[
                { label: 'Nº OPPT', value: oppt.id },
                { label: 'Produto / Serviço', value: oppt.produto },
                { label: 'Pedido de Venda', value: oppt.pedido_venda },
                { label: 'Abertura', value: fmtD(oppt.data_abertura) },
                { label: 'Prazo', value: fmtD(oppt.prazo) },
                { label: 'Descrição do Serviço', value: oppt.descricao_servico },
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-xs border-b border-border/30 pb-1.5">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium text-right max-w-[60%]">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Cliente</h3>
            <div className="space-y-2">
              {[{ label: 'Razão Social', value: oppt.cliente }, { label: 'CNPJ', value: oppt.cnpj }].map((f) => (
                <div key={f.label} className="flex justify-between text-xs border-b border-border/30 pb-1.5">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => setAba('recebimento')} className="w-full erp-btn-ghost text-xs flex items-center gap-1.5 justify-center"><Truck size={12} /> Registrar Recebimento</button>
              <button type="button" onClick={() => { setMatConsumido(materiais.map(() => 0)); setShowReporte(true); }} className="w-full erp-btn-ghost text-xs flex items-center gap-1.5 justify-center"><Package size={12} /> Registrar Produção</button>
              <button type="button" onClick={() => setShowNFService(true)} className="w-full erp-btn-primary text-xs flex items-center gap-1.5 justify-center"><FileText size={12} /> Emitir NF-e de Serviço</button>
            </div>
          </div>
        </div>
      )}

      {/* ABA MATERIAIS */}
      {aba === 'materiais' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Materiais do cliente em nosso poder para fabricação</p>
            {sugestaoRetorno.length > 0 && (
              <button type="button" onClick={() => setShowSugestao(true)} className="erp-btn-ghost text-xs flex items-center gap-1.5 text-orange-600 border-orange-300">
                <Info size={12} /> Sugestão de Retorno ({sugestaoRetorno.length})
              </button>
            )}
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-3 py-2">Código</th>
                  <th className="text-left px-3 py-2">Descrição</th>
                  <th className="text-right px-3 py-2">Recebido</th>
                  <th className="text-right px-3 py-2">Consumido</th>
                  <th className="text-right px-3 py-2">Sobra</th>
                  <th className="text-right px-3 py-2">Saldo (a retornar)</th>
                  <th className="text-center px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map((m) => {
                  const saldo = m.qtd_recebida - m.qtd_consumida - m.qtd_sobra;
                  return (
                    <tr key={m.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono font-medium">{m.codigo}</td>
                      <td className="px-3 py-2">{m.descricao}</td>
                      <td className="px-3 py-2 text-right">{m.qtd_recebida} {m.unidade}</td>
                      <td className="px-3 py-2 text-right text-blue-700">{m.qtd_consumida > 0 ? `${m.qtd_consumida} ${m.unidade}` : '—'}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{m.qtd_sobra > 0 ? `${m.qtd_sobra} ${m.unidade}` : '—'}</td>
                      <td className={`px-3 py-2 text-right font-bold ${saldo > 0 ? 'text-primary' : 'text-green-600'}`}>{saldo} {m.unidade}</td>
                      <td className="px-3 py-2 text-center">
                        {saldo === 0 ? <CheckCircle size={13} className="text-green-500 mx-auto" /> : <AlertTriangle size={13} className="text-orange-500 mx-auto" title="Saldo a retornar" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA RECEBIMENTO */}
      {aba === 'recebimento' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 justify-between">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-700 flex-1">
              <strong>CFOP 5901/6901</strong> — Remessa emitida pelo cliente para industrialização por encomenda. Registre a entrada desta NF-e para controlar os materiais do cliente em nosso poder.
            </div>
            <button type="button" onClick={() => setShowRecebimento(true)} className="erp-btn-primary text-xs flex items-center gap-1.5 shrink-0">
              <Plus size={12} /> Registrar Recebimento
            </button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>NF-e Cliente</th><th>Emitente</th><th>Data</th><th>CFOP</th><th>Descrição</th><th>Status</th></tr></thead>
              <tbody>
                {nfeEntrada.map((n) => (
                  <tr key={n.id}>
                    <td className="font-mono font-semibold">{n.num}</td>
                    <td>{n.emitente}</td>
                    <td>{fmtD(n.data)}</td>
                    <td className="font-mono">{n.cfop}</td>
                    <td className="text-xs text-muted-foreground">{CFOP_MAP[n.cfop] || n.cfop}</td>
                    <td><StatusNFe status={n.status} /></td>
                  </tr>
                ))}
                {!nfeEntrada.length && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">Nenhuma NF-e de remessa recebida</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA PRODUÇÃO */}
      {aba === 'producao' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Registre a produção efetuada e os materiais do cliente consumidos</p>
            <button type="button" onClick={() => { setMatConsumido(materiais.map(() => 0)); setShowReporte(true); }}
              className="erp-btn-primary text-xs flex items-center gap-1.5"><Plus size={12} /> Registrar Produção</button>
          </div>
          {producao.length > 0 ? (
            <div className="erp-card overflow-x-auto">
              <table className="erp-table w-full">
                <thead><tr><th>Data/Hora</th><th>Qtd Produzida</th><th>Lote</th><th>Observação</th></tr></thead>
                <tbody>
                  {producao.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDT(p.data)}</td>
                      <td className="font-bold text-green-700">{p.qtd}</td>
                      <td className="font-mono">{p.lote || '—'}</td>
                      <td className="text-muted-foreground">{p.obs || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma produção registrada</div>
          )}
        </div>
      )}

      {/* ABA RETORNO / SOBRAS */}
      {aba === 'retorno' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 justify-between flex-wrap">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700 flex-1">
              Emita NF-e para <strong>retornar o produto fabricado</strong> ao cliente (CFOP 5902) e para <strong>devolver as sobras de materiais</strong> não utilizados (CFOP 5903).
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { setFormRet({ ...formRet, tipo: 'Retorno Produto', cfop: '5902' }); setShowRetorno(true); }}
                className="erp-btn-primary text-xs flex items-center gap-1.5"><ArrowRight size={12} /> Retorno Produto</button>
              <button type="button" onClick={() => { setMatSobrasQtd(materiais.map(() => 0)); setShowSobras(true); }}
                className="erp-btn-ghost text-xs flex items-center gap-1.5"><Package size={12} /> Devolução Sobras</button>
            </div>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>NF-e</th><th>Data</th><th>CFOP</th><th>Tipo</th><th className="text-right">Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {nfeSaida.filter((n) => ['5902', '5903'].includes(n.cfop)).map((n) => (
                  <tr key={n.id}>
                    <td className="font-mono font-semibold">{n.num}</td>
                    <td>{fmtD(n.data)}</td>
                    <td className="font-mono">{n.cfop}</td>
                    <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${n.tipo === 'Retorno Produto' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{n.tipo}</span></td>
                    <td className="text-right">{n.valor > 0 ? fmtBRL(n.valor) : '—'}</td>
                    <td><StatusNFe status={n.status} /></td>
                    <td><button type="button" onClick={() => toast.info('Baixando XML...')} className="text-xs text-primary hover:underline">XML</button></td>
                  </tr>
                ))}
                {!nfeSaida.filter((n) => ['5902', '5903'].includes(n.cfop)).length && (
                  <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma NF-e de retorno emitida</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA NF-e SERVIÇO */}
      {aba === 'nfe' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 justify-between">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex-1">
              <strong>CFOP 5124</strong> — Industrialização efetuada para outra empresa. Emita a NF-e de serviço para cobrar do cliente pelo trabalho realizado.
            </div>
            <button type="button" onClick={() => setShowNFService(true)} className="erp-btn-primary text-xs flex items-center gap-1.5 shrink-0">
              <FileText size={12} /> Emitir NF-e de Serviço
            </button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>NF-e</th><th>Série</th><th>Data</th><th>CFOP</th><th className="text-right">Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {nfeSaida.filter((n) => n.cfop === '5124').map((n) => (
                  <tr key={n.id}>
                    <td className="font-mono font-semibold text-primary">{n.num}</td>
                    <td>{n.serie || '—'}</td>
                    <td>{fmtD(n.data)}</td>
                    <td className="font-mono">{n.cfop}</td>
                    <td className="text-right font-bold">{fmtBRL(n.valor)}</td>
                    <td><StatusNFe status={n.status} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => toast.info('Baixando XML...')} className="text-xs text-primary hover:underline">XML</button>
                        <button type="button" onClick={() => toast.info('Imprimindo DANFE...')} className="text-xs text-muted-foreground hover:underline">DANFE</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!nfeSaida.filter((n) => n.cfop === '5124').length && (
                  <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma NF-e de serviço emitida</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA FINANCEIRO */}
      {aba === 'financeiro' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Valor do Serviço</p><p className="text-base font-bold text-primary">{fmtBRL(oppt.valor_servico)}</p></div>
            <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Status Cobrança</p><p className="text-base font-bold text-green-600">{contasReceber.some((c) => c.status === 'Recebido') ? 'Recebido' : 'Pendente'}</p></div>
          </div>
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2 bg-muted/20 border-b border-border text-xs font-semibold">Contas a Receber</div>
            <table className="erp-table w-full">
              <thead><tr><th>Descrição</th><th>Vencimento</th><th className="text-right">Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {contasReceber.map((c) => (
                  <tr key={c.id}>
                    <td className="text-xs">{c.descricao}</td>
                    <td>{fmtD(c.vencimento)}</td>
                    <td className="text-right font-bold text-primary">{fmtBRL(c.valor)}</td>
                    <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.status === 'Recebido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                    <td>{c.status === 'Pendente' && <button type="button" onClick={() => { setContasReceber(contasReceber.map((cr) => cr.id === c.id ? { ...cr, status: 'Recebido' } : cr)); toast.success('Conta baixada!'); }} className="text-xs text-green-600 hover:underline">Baixar</button>}</td>
                  </tr>
                ))}
                {!contasReceber.length && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma conta gerada</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      {showRecebimento && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Registrar Recebimento de Materiais</h2>
              <button type="button" onClick={() => setShowRecebimento(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><label className="erp-label">Nº NF-e do Cliente *</label><input className="erp-input w-full font-mono" value={formRec.num} onChange={(e) => setFormRec({ ...formRec, num: e.target.value })} /></div>
              <div><label className="erp-label">Data de Entrada</label><input type="date" className="erp-input w-full" value={formRec.data} onChange={(e) => setFormRec({ ...formRec, data: e.target.value })} /></div>
              <div><label className="erp-label">CFOP</label>
                <select className="erp-input w-full" value={formRec.cfop} onChange={(e) => setFormRec({ ...formRec, cfop: e.target.value })}>
                  <option value="5901">5901 — Remessa (mesmo estado)</option>
                  <option value="6901">6901 — Remessa (outro estado)</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRecebimento(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={registrarRecebimento} className="erp-btn-primary text-xs flex items-center gap-1.5"><CheckCircle size={12} /> Registrar Entrada</button>
            </div>
          </div>
        </div>
      )}

      {showReporte && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Registrar Produção para o Cliente</h2>
              <button type="button" onClick={() => setShowReporte(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={formRep.data} onChange={(e) => setFormRep({ ...formRep, data: e.target.value })} /></div>
                <div><label className="erp-label">Qtd Produzida *</label><input type="number" min="0" className="erp-input w-full font-bold" value={formRep.qtd} onChange={(e) => setFormRep({ ...formRep, qtd: Number(e.target.value) })} /></div>
                <div className="col-span-2"><label className="erp-label">Lote</label><input className="erp-input w-full font-mono" placeholder="LT-PT-..." value={formRep.lote} onChange={(e) => setFormRep({ ...formRep, lote: e.target.value })} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Materiais do Cliente Consumidos</p>
                {materiais.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs mb-2">
                    <span className="flex-1 font-mono">{m.codigo}</span>
                    <input type="number" step="0.001" min="0" placeholder="Qtd consumida" className="erp-input w-28 text-xs text-right"
                      value={matConsumido[i] || ''} onChange={(e) => { const a = [...matConsumido]; a[i] = Number(e.target.value); setMatConsumido(a); }} />
                    <span className="text-muted-foreground">{m.unidade}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowReporte(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={registrarProducao} className="erp-btn-primary text-xs flex items-center gap-1.5"><CheckCircle size={12} /> Registrar</button>
            </div>
          </div>
        </div>
      )}

      {showRetorno && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Emitir NF-e de Retorno do Produto</h2>
              <button type="button" onClick={() => setShowRetorno(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><label className="erp-label">Nº NF-e *</label><input className="erp-input w-full font-mono" value={formRet.num} onChange={(e) => setFormRet({ ...formRet, num: e.target.value })} /></div>
              <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={formRet.data} onChange={(e) => setFormRet({ ...formRet, data: e.target.value })} /></div>
              <div><label className="erp-label">CFOP</label>
                <select className="erp-input w-full" value={formRet.cfop} onChange={(e) => setFormRet({ ...formRet, cfop: e.target.value })}>
                  <option value="5902">5902 — Retorno (mesmo estado)</option>
                  <option value="6902">6902 — Retorno (outro estado)</option>
                </select>
              </div>
              <div className="col-span-2"><label className="erp-label">Valor</label><input type="number" step="0.01" className="erp-input w-full" value={formRet.valor} onChange={(e) => setFormRet({ ...formRet, valor: Number(e.target.value) })} /></div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRetorno(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={registrarRetorno} className="erp-btn-primary text-xs flex items-center gap-1.5"><ArrowRight size={12} /> Emitir NF-e</button>
            </div>
          </div>
        </div>
      )}

      {showSobras && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Devolução de Sobras ao Cliente</h2>
              <button type="button" onClick={() => setShowSobras(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="erp-label">Nº NF-e *</label><input className="erp-input w-full font-mono" value={formSobra.num} onChange={(e) => setFormSobra({ ...formSobra, num: e.target.value })} /></div>
                <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={formSobra.data} onChange={(e) => setFormSobra({ ...formSobra, data: e.target.value })} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Quantidades de Sobras a Devolver</p>
                {materiais.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs mb-2">
                    <span className="flex-1 font-mono">{m.codigo}</span>
                    <span className="text-muted-foreground">saldo: {m.qtd_recebida - m.qtd_consumida - m.qtd_sobra} {m.unidade}</span>
                    <input type="number" step="0.001" min="0" className="erp-input w-20 text-xs text-right"
                      value={matSobrasQtd[i] || ''} onChange={(e) => { const a = [...matSobrasQtd]; a[i] = Number(e.target.value); setMatSobrasQtd(a); }} />
                    <span className="text-muted-foreground">{m.unidade}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowSobras(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={registrarSobras} className="erp-btn-primary text-xs flex items-center gap-1.5"><Package size={12} /> Emitir NF-e de Sobras</button>
            </div>
          </div>
        </div>
      )}

      {showNFService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Emitir NF-e de Industrialização (CFOP 5124)</h2>
              <button type="button" onClick={() => setShowNFService(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><label className="erp-label">Nº NF-e *</label><input className="erp-input w-full font-mono" value={formServ.num} onChange={(e) => setFormServ({ ...formServ, num: e.target.value })} /></div>
              <div><label className="erp-label">Série</label><input className="erp-input w-full" value={formServ.serie} onChange={(e) => setFormServ({ ...formServ, serie: e.target.value })} /></div>
              <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={formServ.data} onChange={(e) => setFormServ({ ...formServ, data: e.target.value })} /></div>
              <div className="col-span-2"><label className="erp-label">Valor do Serviço (R$)</label><input type="number" step="0.01" className="erp-input w-full font-bold" value={formServ.valor} onChange={(e) => setFormServ({ ...formServ, valor: Number(e.target.value) })} /></div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNFService(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={emitirNFServico} className="erp-btn-primary text-xs flex items-center gap-1.5"><FileText size={12} /> Emitir NF-e</button>
            </div>
          </div>
        </div>
      )}

      {showSugestao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Sugestão de Materiais a Retornar</h2>
              <button type="button" onClick={() => setShowSugestao(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Com base nas requisições das ordens, os seguintes materiais do cliente têm saldo e devem ser devolvidos:</p>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="p-2 text-left">Material</th><th className="p-2 text-right">Qtd Sugerida</th></tr></thead>
                <tbody>
                  {sugestaoRetorno.map((m) => (
                    <tr key={m.id} className="border-b border-border/30">
                      <td className="p-2"><div className="font-mono">{m.codigo}</div><div className="text-muted-foreground">{m.descricao}</div></td>
                      <td className="p-2 text-right font-bold text-primary">{m.qtd_retornar} {m.unidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowSugestao(false); setMatSobrasQtd(sugestaoRetorno.map((m) => m.qtd_retornar)); setShowSobras(true); }} className="erp-btn-primary text-xs">Usar na Devolução</button>
              <button type="button" onClick={() => setShowSugestao(false)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
