import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Send, Eye, Phone, Mail, AlertCircle, XCircle, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
export default function CRMFinanceiro() {
  const [pessoaBusca, setPessoaBusca] = useState('');
  const [pessoaSel, setPessoaSel] = useState(null);
  const [inadimplentes, setInadimplentes] = useState([]);
  const [contasAtraso, setContasAtraso] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/api/financial/crm');
      const body = res?.data?.data ?? res?.data ?? {};
      setInadimplentes(Array.isArray(body.inadimplentes) ? body.inadimplentes : []);
      setContasAtraso(Array.isArray(body.contas_atraso) ? body.contas_atraso : []);
    } catch {
      toast.error('Erro ao carregar CRM Financeiro');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const [aba, setAba] = useState('receber');

  const totalInadimplencia = inadimplentes.reduce((s, i) => s + (i.em_atraso || 0), 0);

  const gerarRelatorio = async () => {
    if (!pessoaBusca.trim()) return;
    const encontrado = inadimplentes.find((i) => i.cliente?.toLowerCase().includes(pessoaBusca.toLowerCase()));
    if (encontrado) {
      setPessoaSel(encontrado);
      toast.success('Relatório gerado!');
    } else {
      try {
        const res = await api.get(`/api/financial/crm?pessoa=${encodeURIComponent(pessoaBusca)}`);
        const body = res?.data?.data ?? res?.data ?? {};
        if (body.pessoa) {
          setPessoaSel(body.pessoa);
          setContasAtraso(Array.isArray(body.contas_atraso) ? body.contas_atraso : []);
          toast.success('Relatório gerado!');
        } else {
          toast.error('Pessoa não encontrada');
        }
      } catch {
        toast.error('Pessoa não encontrada');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Relatório CRM Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cobrança de clientes e acompanhamento de inadimplência</p>
        </div>
      </div>

      {/* KPIs de inadimplência */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Inadimplentes', value: inadimplentes.length, color: 'text-red-600', icon: AlertCircle },
          { label: 'Total em atraso', value: fmtBRL(totalInadimplencia), color: 'text-red-600', icon: TrendingDown },
          { label: 'Maior devedor', value: fmtBRL(inadimplentes.length ? Math.max(...inadimplentes.map((i) => i.em_atraso || 0)) : 0), color: 'text-orange-600' },
          { label: 'Maior atraso (dias)', value: inadimplentes.length ? Math.max(...inadimplentes.map((i) => i.dias_atraso || 0)) : 0, color: 'text-red-700' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Busca de pessoa */}
      <div className="erp-card p-4">
        <h3 className="text-sm font-semibold mb-3">Informações gerais</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div>
            <label className="erp-label">Pessoa</label>
            <input className="erp-input w-60" placeholder="Nome do cliente..." value={pessoaBusca} onChange={(e) => setPessoaBusca(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={gerarRelatorio} className="erp-btn-primary">Gerar relatório</button>
          </div>
        </div>
        {pessoaBusca && !pessoaSel && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            Procurando por Pessoa "{pessoaBusca}"
          </div>
        )}
      </div>

      {/* Relatório individual do cliente */}
      {pessoaSel && (
        <div className="erp-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{pessoaSel.cliente}</h3>
            <button type="button" onClick={() => setPessoaSel(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={16} /></button>
          </div>
          {/* Abas */}
          <div className="border-b border-border flex gap-1 mb-4">
            {[{ id: 'receber', label: 'Contas a receber e rece...' }, { id: 'pagar', label: 'Contas a pagar e pagame...' }].map((t) => (
              <button key={t.id} type="button" onClick={() => setAba(t.id)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{t.label}</button>
            ))}
          </div>

          {aba === 'receber' && (
            <>
              <h4 className="text-sm font-semibold mb-3">Indicadores de desempenho</h4>
              <div className="overflow-x-auto mb-4">
                <table className="erp-table w-full text-xs">
                  <thead>
                    <tr>
                      <th>Classificação</th>
                      <th>Total C.R.</th><th>Em atraso</th><th>Em dia</th>
                      <th>Receb. 30d</th><th>Receb. 90d</th><th>Último ano</th><th>Total histórico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { classif: 'Receita com produto', ...pessoaSel },
                    ].map((r) => (
                      <tr key={r.classif}>
                        <td className="font-medium">{r.classif}</td>
                        <td>{fmtBRL(r.total_receber)}</td>
                        <td className={r.em_atraso > 0 ? 'text-red-600 font-bold' : ''}>{fmtBRL(r.em_atraso)}</td>
                        <td>{fmtBRL(r.em_dia)}</td>
                        <td>{fmtBRL(r.receb_30)}</td>
                        <td>{fmtBRL(r.receb_90)}</td>
                        <td>{fmtBRL(r.receb_ano)}</td>
                        <td className="font-medium">{fmtBRL(r.total_hist)}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary text-white font-bold">
                      <td>Total</td>
                      <td>{fmtBRL(pessoaSel.total_receber)}</td>
                      <td>{fmtBRL(pessoaSel.em_atraso)}</td>
                      <td>{fmtBRL(pessoaSel.em_dia)}</td>
                      <td>R$ 0,00</td>
                      <td>{fmtBRL(pessoaSel.receb_90)}</td>
                      <td>{fmtBRL(pessoaSel.receb_ano)}</td>
                      <td>{fmtBRL(pessoaSel.total_hist)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-semibold mb-3">Contas a receber em atraso</h4>
              <div className="overflow-x-auto">
                <table className="erp-table w-full text-xs">
                  <thead>
                    <tr className="bg-red-600 text-white">
                      <th>Cód. conta</th><th>Data de vencimento</th><th>Agendamento</th>
                      <th>Classificação</th><th>Empresa</th><th>Conta bancária</th>
                      <th>Forma pagamento</th><th>Pessoa</th><th>Descrição</th><th>NF-e</th><th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contasAtraso.map((c) => (
                      <tr key={c.id} className="bg-red-50/40 hover:bg-red-50">
                        <td className="font-medium text-primary">{c.id}</td>
                        <td className="font-bold text-red-600">{fmtD(c.vencimento)}</td>
                        <td className="text-muted-foreground">{fmtD(c.agendamento)}</td>
                        <td>{c.classificacao}</td>
                        <td className="text-[10px]">{c.empresa}</td>
                        <td>{c.banco}</td>
                        <td>{c.forma_pag}</td>
                        <td className="font-medium">{c.pessoa}</td>
                        <td className="text-muted-foreground text-[10px] max-w-[140px] truncate">{c.descricao}</td>
                        <td>{c.nfe}</td>
                        <td className="font-medium">{fmtBRL(c.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => toast.success('E-mail de cobrança enviado!')} className="erp-btn-primary flex items-center gap-1.5 text-xs">
                  <Mail size={13} /> Enviar Cobrança por E-mail
                </button>
                <button type="button" onClick={() => toast.info('Registrando contato telefônico...')} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                  <Phone size={13} /> Registrar Contato Telefônico
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lista de inadimplentes */}
      <div className="erp-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Clientes Inadimplentes</h3>
          <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle size={12} />{inadimplentes.length} clientes</span>
        </div>
        <table className="erp-table w-full text-xs">
          <thead>
            <tr>
              <th>Cliente</th><th>Total a receber</th><th>Em atraso</th>
              <th>Dias atraso</th><th>Limite crédito</th><th>Histórico total</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {inadimplentes.map((i) => (
              <tr key={i.id} className="hover:bg-red-50/40">
                <td className="font-medium">{i.cliente}</td>
                <td>{fmtBRL(i.total_receber)}</td>
                <td className="font-bold text-red-600">{fmtBRL(i.em_atraso)}</td>
                <td>
                  <span className={`px-1.5 py-0.5 rounded font-medium ${i.dias_atraso > 60 ? 'bg-red-100 text-red-700' : i.dias_atraso > 30 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {i.dias_atraso}d
                  </span>
                </td>
                <td>{fmtBRL(i.limite_credito)}</td>
                <td className="text-muted-foreground">{fmtBRL(i.total_hist)}</td>
                <td>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setPessoaBusca(i.cliente); setPessoaSel(i); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                    <button type="button" onClick={() => toast.success(`E-mail de cobrança enviado para ${i.cliente}!`)} className="p-1 rounded hover:bg-blue-50 text-blue-600"><Mail size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
