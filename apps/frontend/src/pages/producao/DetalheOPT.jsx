import { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle, XCircle, AlertTriangle, FileText,
  Printer, Package, Truck, ArrowRight, DollarSign, Save,
} from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const MOCK_OPT = {
  id: 'OPT-2025-001', fornecedor: 'Metalúrgica Bessa Ltda', cnpj: '12.345.678/0001-99',
  produto: 'Chapas cortadas a laser', codigo: 'SV-CORTE-LASER',
  pedido_compra: 'PC-2025-0041', pedido_venda: 'PV-2025-0018',
  data_abertura: addDias(hoje, -15), prazo: addDias(hoje, 5),
  status: 'Em Produção', valor_servico: 4800, custo_materiais: 12500,
  materiais: [
    { id: 1, codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm', qtd_empenhada: 120, qtd_remetida: 120, qtd_consumida: 0, qtd_sobra: 0, qtd_retornada: 0, unidade: 'kg', valor_unit: 35.50 },
    { id: 2, codigo: 'MP-CHAPA-304-2MM',  descricao: 'Chapa Inox 304 2mm',  qtd_empenhada: 80,  qtd_remetida: 80,  qtd_consumida: 0, qtd_sobra: 0, qtd_retornada: 0, unidade: 'kg', valor_unit: 28.00 },
  ],
  nfe_remessa: [
    { id: 1, num: '001234', serie: '1', data: addDias(hoje, -14), cfop: '5901', valor: 6260, status: 'Autorizada', chave: '35260512.345.6780001990550010001234001' },
  ],
  nfe_retorno: [],
  producao: [],
  contas_pagar: [
    { id: 1, descricao: 'Serviço de corte a laser — NF-e PC-2025-0041', vencimento: addDias(hoje, 15), valor: 4800, status: 'Pendente' },
  ],
};

const STATUS_COR = {
  'Aberta':             'bg-blue-100 text-blue-700',
  'Mat. Remetidos':     'bg-teal-100 text-teal-700',
  'Em Produção':        'bg-orange-100 text-orange-700',
  'Produção Concluída': 'bg-purple-100 text-purple-700',
  'NF-e Recebida':      'bg-green-100 text-green-700',
  'Encerrada':          'bg-gray-100 text-gray-500',
};

const CFOP_MAP = {
  '5901': 'Remessa p/ industrialização por conta de terceiros',
  '6901': 'Remessa p/ industrialização por conta de terceiros (outro estado)',
  '5902': 'Retorno de industrialização por conta de terceiros',
  '6902': 'Retorno de industrialização por conta de terceiros (outro estado)',
  '5903': 'Retorno de mercadoria remetida p/ industrialização e não aplicada no referido processo',
  '1124': 'Industrialização efetuada por outra empresa',
};

export default function DetalheOPT() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [opt, setOpt] = useState(location.state?.opt || MOCK_OPT);
  const [aba, setAba] = useState('dados');
  const [showRemessa, setShowRemessa] = useState(false);
  const [showReporte, setShowReporte] = useState(false);
  const [showDevolucao, setShowDevolucao] = useState(false);
  const [showSobras, setShowSobras] = useState(false);
  const [materiais, setMateriais] = useState(opt.materiais || []);
  const [nfeRemessa, setNfeRemessa] = useState(opt.nfe_remessa || []);
  const [nfeRetorno, setNfeRetorno] = useState(opt.nfe_retorno || []);
  const [producao, setProducao] = useState(opt.producao || []);
  const [contasPagar, setContasPagar] = useState(opt.contas_pagar || []);

  // Form states
  const [formRem, setFormRem] = useState({ num: '', serie: '1', data: hoje, cfop: '5901', obs: '' });
  const [formRep, setFormRep] = useState({ data: hoje, qtd: 1, lote: '', obs: '' });
  const [formDev, setFormDev] = useState({ num: '', data: hoje, cfop: '5902', tipo: 'Retorno Produção', valor: opt.custo_materiais || 0, obs: '' });
  const [matConsumido, setMatConsumido] = useState([]);
  const [matSobras, setMatSobras] = useState([]);

  const custoTotal = opt.valor_servico + opt.custo_materiais;

  const ABAS = [
    { id: 'dados',     label: 'Dados Gerais' },
    { id: 'materiais', label: `Materiais (${materiais.length})` },
    { id: 'remessa',   label: `Remessa NF-e (${nfeRemessa.length})` },
    { id: 'producao',  label: `Produção (${producao.length})` },
    { id: 'devolucao', label: `Retorno/Sobras (${nfeRetorno.length})` },
    { id: 'nfe',       label: 'NF-e' },
    { id: 'financeiro', label: `Financeiro (${contasPagar.length})` },
  ];

  const gerarRemessa = () => {
    const nova = { id: Date.now(), ...formRem, status: 'Autorizada', chave: `NF-${Date.now()}`, valor: materiais.reduce((s, m) => s + m.qtd_remetida * m.valor_unit, 0) };
    setNfeRemessa([...nfeRemessa, nova]);
    setOpt((o) => ({ ...o, status: 'Mat. Remetidos' }));
    setShowRemessa(false);
    toast.success(`NF-e de remessa ${formRem.num} gerada! Materiais enviados ao fornecedor.`);
  };

  const registrarProducao = () => {
    const novoRep = { id: Date.now(), ...formRep };
    setProducao([...producao, novoRep]);
    setMateriais(materiais.map((m, i) => ({ ...m, qtd_consumida: m.qtd_consumida + (matConsumido[i] || 0) })));
    setOpt((o) => ({ ...o, status: 'Em Produção' }));
    setShowReporte(false);
    toast.success('Produção registrada! Estoque de mat. em poder de terceiros atualizado.');
  };

  const registrarDevolucao = () => {
    const novaNfe = { id: Date.now(), ...formDev, status: 'Entrada Gerada' };
    setNfeRetorno([...nfeRetorno, novaNfe]);
    if (formDev.tipo === 'Retorno Produção') {
      setMateriais(materiais.map((m, i) => ({ ...m, qtd_retornada: m.qtd_retornada + (matConsumido[i] || 0) })));
      setOpt((o) => ({ ...o, status: 'Produção Concluída' }));
    } else if (formDev.tipo === 'Retorno Sobras') {
      setMateriais(materiais.map((m, i) => ({ ...m, qtd_sobra: m.qtd_sobra + (matSobras[i] || 0) })));
    }
    setShowDevolucao(false);
    toast.success(`NF-e de ${formDev.tipo.toLowerCase()} registrada! Estoque atualizado.`);
  };

  const StatusNFe = ({ status }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status === 'Autorizada' || status === 'Entrada Gerada' ? 'bg-green-100 text-green-700' : status === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/producao/terceiros')} className="p-1 rounded hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{opt.id} — {opt.produto}</h1>
          <p className="text-sm text-muted-foreground">{opt.fornecedor} · {opt.cnpj}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COR[opt.status] || 'bg-muted'}`}>{opt.status}</span>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Custo Mat. Remetidos', value: fmtBRL(opt.custo_materiais), color: '' },
          { label: 'Valor do Serviço', value: fmtBRL(opt.valor_servico), color: 'text-blue-600' },
          { label: 'Custo Total da OPT', value: fmtBRL(custoTotal), color: 'text-primary' },
          { label: 'Prazo', value: fmtD(opt.prazo), color: opt.prazo < hoje ? 'text-red-600' : '' },
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
                { label: 'Nº OPT', value: opt.id },
                { label: 'Produto / Serviço', value: opt.produto },
                { label: 'Código', value: opt.codigo },
                { label: 'Pedido de Compra', value: opt.pedido_compra },
                { label: 'Pedido de Venda', value: opt.pedido_venda || '—' },
                { label: 'Abertura', value: fmtD(opt.data_abertura) },
                { label: 'Prazo', value: fmtD(opt.prazo) },
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-xs border-b border-border/30 pb-1.5">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Fornecedor</h3>
            <div className="space-y-2">
              {[
                { label: 'Razão Social', value: opt.fornecedor },
                { label: 'CNPJ', value: opt.cnpj },
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-xs border-b border-border/30 pb-1.5">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-semibold mt-4 mb-3">Custos</h3>
            <div className="space-y-2">
              {[
                { label: 'Custo dos Materiais', value: fmtBRL(opt.custo_materiais) },
                { label: 'Custo do Serviço',    value: fmtBRL(opt.valor_servico) },
                { label: 'Custo Total',          value: fmtBRL(custoTotal), bold: true },
              ].map((f) => (
                <div key={f.label} className={`flex justify-between text-sm border-b border-border/30 pb-1.5 ${f.bold ? 'font-bold text-primary' : ''}`}>
                  <span className={f.bold ? '' : 'text-muted-foreground'}>{f.label}</span>
                  <span>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Ações rápidas */}
          <div className="sm:col-span-2 erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Ações Rápidas</h3>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setAba('remessa')} className="erp-btn-primary text-xs flex items-center gap-1.5"><Truck size={12} /> Emitir NF-e de Remessa</button>
              <button type="button" onClick={() => setAba('producao')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Package size={12} /> Registrar Produção</button>
              <button type="button" onClick={() => setAba('devolucao')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><ArrowRight size={12} /> Registrar Retorno</button>
              <button type="button" onClick={() => setAba('financeiro')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><DollarSign size={12} /> Ver Financeiro</button>
            </div>
          </div>
        </div>
      )}

      {/* ABA MATERIAIS */}
      {aba === 'materiais' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Materiais empenhados para remessa ao fornecedor</p>
            <button type="button" onClick={() => toast.info('Adicionar material')} className="erp-btn-primary text-xs flex items-center gap-1"><Plus size={12} /> Material</button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-3 py-2">Código</th>
                  <th className="text-left px-3 py-2">Descrição</th>
                  <th className="text-right px-3 py-2">Qtd Empenhada</th>
                  <th className="text-right px-3 py-2">Qtd Remetida</th>
                  <th className="text-right px-3 py-2">Qtd Consumida</th>
                  <th className="text-right px-3 py-2">Qtd Sobra</th>
                  <th className="text-right px-3 py-2">Saldo em Poder</th>
                  <th className="text-right px-3 py-2">Valor Unit.</th>
                  <th className="text-right px-3 py-2">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map((m) => {
                  const saldo = m.qtd_remetida - m.qtd_consumida - m.qtd_sobra - m.qtd_retornada;
                  return (
                    <tr key={m.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono font-medium">{m.codigo}</td>
                      <td className="px-3 py-2">{m.descricao}</td>
                      <td className="px-3 py-2 text-right">{m.qtd_empenhada} {m.unidade}</td>
                      <td className="px-3 py-2 text-right font-medium">{m.qtd_remetida} {m.unidade}</td>
                      <td className="px-3 py-2 text-right text-blue-700">{m.qtd_consumida > 0 ? `${m.qtd_consumida} ${m.unidade}` : '—'}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{m.qtd_sobra > 0 ? `${m.qtd_sobra} ${m.unidade}` : '—'}</td>
                      <td className={`px-3 py-2 text-right font-bold ${saldo > 0 ? 'text-primary' : 'text-green-600'}`}>{saldo} {m.unidade}</td>
                      <td className="px-3 py-2 text-right">{fmtBRL(m.valor_unit)}</td>
                      <td className="px-3 py-2 text-right font-bold">{fmtBRL(m.qtd_remetida * m.valor_unit)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={8} className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right text-primary">{fmtBRL(materiais.reduce((s, m) => s + m.qtd_remetida * m.valor_unit, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA REMESSA */}
      {aba === 'remessa' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex-1 mr-3">
              <strong>CFOP 5901/6901</strong> — Remessa para industrialização por conta de terceiros. Emita a NF-e para enviar materiais ao fornecedor. Isso irá abastecer o estoque de materiais em poder de terceiros.
            </div>
            <button type="button" onClick={() => setShowRemessa(true)} className="erp-btn-primary text-xs flex items-center gap-1.5 shrink-0">
              <Plus size={12} /> Gerar NF-e de Remessa
            </button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>NF-e</th><th>Série</th><th>Data</th><th>CFOP</th><th>Descrição CFOP</th><th className="text-right">Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {nfeRemessa.map((n) => (
                  <tr key={n.id}>
                    <td className="font-mono font-semibold">{n.num}</td>
                    <td>{n.serie}</td>
                    <td>{fmtD(n.data)}</td>
                    <td className="font-mono">{n.cfop}</td>
                    <td className="text-xs text-muted-foreground">{CFOP_MAP[n.cfop] || n.cfop}</td>
                    <td className="text-right font-medium">{fmtBRL(n.valor)}</td>
                    <td><StatusNFe status={n.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => toast.info('Baixando XML...')} className="text-xs text-primary hover:underline">XML</button>
                        <button type="button" onClick={() => toast.info('Imprimindo DANFE...')} className="text-xs text-muted-foreground hover:underline">DANFE</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!nfeRemessa.length && <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">Nenhuma NF-e de remessa gerada</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA PRODUÇÃO */}
      {aba === 'producao' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Registre a produção efetuada pelo fornecedor e os materiais consumidos</p>
            <button type="button" onClick={() => { setMatConsumido(materiais.map(() => 0)); setShowReporte(true); }}
              className="erp-btn-primary text-xs flex items-center gap-1.5"><Plus size={12} /> Registrar Produção</button>
          </div>
          {producao.length > 0 && (
            <div className="erp-card overflow-x-auto">
              <table className="erp-table w-full">
                <thead><tr><th>Data</th><th>Qtd Produzida</th><th>Lote</th><th>Observação</th></tr></thead>
                <tbody>
                  {producao.map((p, i) => (
                    <tr key={i}>
                      <td>{fmtD(p.data)}</td>
                      <td className="font-bold text-green-700">{p.qtd}</td>
                      <td className="font-mono">{p.lote || '—'}</td>
                      <td className="text-muted-foreground">{p.obs || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!producao.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma produção registrada</div>}
        </div>
      )}

      {/* ABA DEVOLUÇÃO / SOBRAS */}
      {aba === 'devolucao' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700 flex-1">
              Registre o <strong>Retorno da Produção</strong> (CFOP 5902) com os produtos fabricados, e as <strong>Sobras de Materiais</strong> (CFOP 5903) não utilizadas pelo fornecedor.
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { setFormDev({ ...formDev, tipo: 'Retorno Produção', cfop: '5902' }); setShowDevolucao(true); }}
                className="erp-btn-primary text-xs flex items-center gap-1.5"><ArrowRight size={12} /> Retorno Produção</button>
              <button type="button" onClick={() => { setFormDev({ ...formDev, tipo: 'Retorno Sobras', cfop: '5903' }); setShowDevolucao(true); }}
                className="erp-btn-ghost text-xs flex items-center gap-1.5"><Package size={12} /> Retorno Sobras</button>
            </div>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>NF-e Fornecedor</th><th>Data</th><th>CFOP</th><th>Tipo</th><th className="text-right">Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {nfeRetorno.map((n) => (
                  <tr key={n.id}>
                    <td className="font-mono font-semibold">{n.num}</td>
                    <td>{fmtD(n.data)}</td>
                    <td className="font-mono">{n.cfop}</td>
                    <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${n.tipo === 'Retorno Produção' ? 'bg-green-100 text-green-700' : n.tipo === 'NF-e Serviço' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{n.tipo}</span></td>
                    <td className="text-right font-medium">{fmtBRL(n.valor)}</td>
                    <td><StatusNFe status={n.status} /></td>
                    <td><button type="button" onClick={() => toast.info('Abrindo documento...')} className="text-xs text-primary hover:underline">Ver Doc.</button></td>
                  </tr>
                ))}
                {!nfeRetorno.length && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Nenhum retorno registrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA NF-e CONSOLIDADA */}
      {aba === 'nfe' && (
        <div className="space-y-3">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Todas as NF-e desta OPT</h3>
            <div className="space-y-2">
              {[
                { titulo: 'NF-e de Remessa (CFOP 5901)', lista: nfeRemessa, cor: 'bg-blue-50 border-blue-200' },
                { titulo: 'NF-e de Retorno / Serviço', lista: nfeRetorno, cor: 'bg-green-50 border-green-200' },
              ].map((grupo) => (
                <div key={grupo.titulo} className={`border rounded-lg p-3 ${grupo.cor}`}>
                  <p className="text-xs font-semibold mb-2">{grupo.titulo}</p>
                  {grupo.lista.length === 0
                    ? <p className="text-xs text-muted-foreground">Nenhuma NF-e</p>
                    : grupo.lista.map((n) => (
                      <div key={n.id} className="flex items-center justify-between text-xs bg-white rounded p-2 mb-1">
                        <span className="font-mono font-semibold">{n.num}</span>
                        <span className="text-muted-foreground">{fmtD(n.data)}</span>
                        <span className="font-mono text-muted-foreground">{n.cfop}</span>
                        <span className="font-medium">{fmtBRL(n.valor)}</span>
                        <StatusNFe status={n.status} />
                        <button type="button" onClick={() => toast.info('Baixando XML...')} className="text-primary hover:underline">XML</button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA FINANCEIRO */}
      {aba === 'financeiro' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Custo Mat. Remetidos', value: fmtBRL(opt.custo_materiais) },
              { label: 'Custo Serviço Terceiro', value: fmtBRL(opt.valor_servico) },
              { label: 'Custo Total OPT', value: fmtBRL(custoTotal), bold: true },
            ].map((k) => (
              <div key={k.label} className="erp-card p-3">
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className={`text-base font-bold ${k.bold ? 'text-primary' : ''}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2 bg-muted/20 border-b border-border text-xs font-semibold">Contas a Pagar geradas</div>
            <table className="erp-table w-full">
              <thead><tr><th>Descrição</th><th>Vencimento</th><th className="text-right">Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {contasPagar.map((c) => (
                  <tr key={c.id}>
                    <td className="text-xs">{c.descricao}</td>
                    <td>{fmtD(c.vencimento)}</td>
                    <td className="text-right font-medium">{fmtBRL(c.valor)}</td>
                    <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                    <td>
                      {c.status === 'Pendente' && <button type="button" onClick={() => { setContasPagar(contasPagar.map((cp) => cp.id === c.id ? { ...cp, status: 'Pago' } : cp)); toast.success('Conta baixada!'); }} className="text-xs text-green-600 hover:underline">Baixar</button>}
                    </td>
                  </tr>
                ))}
                {!contasPagar.length && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma conta gerada</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal NF-e Remessa */}
      {showRemessa && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Gerar NF-e de Remessa</h2>
              <button type="button" onClick={() => setShowRemessa(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="erp-label">Nº NF-e</label><input className="erp-input w-full font-mono" value={formRem.num} onChange={(e) => setFormRem({ ...formRem, num: e.target.value })} /></div>
              <div><label className="erp-label">Série</label><input className="erp-input w-full" value={formRem.serie} onChange={(e) => setFormRem({ ...formRem, serie: e.target.value })} /></div>
              <div><label className="erp-label">Data de Emissão</label><input type="date" className="erp-input w-full" value={formRem.data} onChange={(e) => setFormRem({ ...formRem, data: e.target.value })} /></div>
              <div><label className="erp-label">CFOP</label>
                <select className="erp-input w-full" value={formRem.cfop} onChange={(e) => setFormRem({ ...formRem, cfop: e.target.value })}>
                  <option value="5901">5901 — Remessa (dentro estado)</option>
                  <option value="6901">6901 — Remessa (outro estado)</option>
                </select>
              </div>
              <div className="col-span-2"><label className="erp-label">Observação</label><textarea className="erp-input w-full" rows={2} value={formRem.obs} onChange={(e) => setFormRem({ ...formRem, obs: e.target.value })} /></div>
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded p-2 text-xs text-blue-700">
                Materiais incluídos: {materiais.map((m) => `${m.codigo} (${m.qtd_remetida} ${m.unidade})`).join(', ')}
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRemessa(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={gerarRemessa} className="erp-btn-primary text-xs flex items-center gap-1.5"><Truck size={12} /> Emitir NF-e de Remessa</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reporte Produção */}
      {showReporte && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Registrar Produção do Terceiro</h2>
              <button type="button" onClick={() => setShowReporte(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={formRep.data} onChange={(e) => setFormRep({ ...formRep, data: e.target.value })} /></div>
                <div><label className="erp-label">Qtd Produzida *</label><input type="number" min="0" className="erp-input w-full font-bold" value={formRep.qtd} onChange={(e) => setFormRep({ ...formRep, qtd: Number(e.target.value) })} /></div>
                <div className="col-span-2"><label className="erp-label">Lote de Rastreabilidade</label><input className="erp-input w-full font-mono" placeholder="Ex: LT-FORN-001" value={formRep.lote} onChange={(e) => setFormRep({ ...formRep, lote: e.target.value })} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Materiais Consumidos pelo Terceiro</p>
                {materiais.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs mb-2">
                    <span className="flex-1 font-mono">{m.codigo}</span>
                    <span className="text-muted-foreground">{m.descricao}</span>
                    <input type="number" step="0.001" min="0" placeholder="Qtd"
                      className="erp-input w-20 text-xs text-right"
                      value={matConsumido[i] || ''}
                      onChange={(e) => { const a = [...matConsumido]; a[i] = Number(e.target.value); setMatConsumido(a); }} />
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

      {/* Modal Retorno / Sobras */}
      {showDevolucao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Registrar {formDev.tipo}</h2>
              <button type="button" onClick={() => setShowDevolucao(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="erp-label">Nº NF-e Fornecedor</label><input className="erp-input w-full font-mono" value={formDev.num} onChange={(e) => setFormDev({ ...formDev, num: e.target.value })} /></div>
              <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={formDev.data} onChange={(e) => setFormDev({ ...formDev, data: e.target.value })} /></div>
              <div><label className="erp-label">CFOP</label>
                <select className="erp-input w-full" value={formDev.cfop} onChange={(e) => setFormDev({ ...formDev, cfop: e.target.value })}>
                  <option value="5902">5902 — Retorno produção (mesmo estado)</option>
                  <option value="6902">6902 — Retorno produção (outro estado)</option>
                  <option value="5903">5903 — Retorno de sobras</option>
                  <option value="1124">1124 — Industrialização por outra empresa</option>
                </select>
              </div>
              <div><label className="erp-label">Valor</label><input type="number" step="0.01" className="erp-input w-full" value={formDev.valor} onChange={(e) => setFormDev({ ...formDev, valor: Number(e.target.value) })} /></div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowDevolucao(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={registrarDevolucao} className="erp-btn-primary text-xs flex items-center gap-1.5"><Save size={12} /> Registrar Entrada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
