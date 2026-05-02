import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Download, CheckCircle, Clock, AlertCircle, RefreshCw, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

const now = new Date();
const ANO = now.getFullYear();
const MES_ATUAL = now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

function venc(dia, mes, ano = ANO) {
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
}

const OBRIGACOES_BASE = [
  { nome: 'SPED Fiscal (EFD-ICMS/IPI)', periodicidade: 'Mensal', dia: 25 },
  { nome: 'SPED Contribuições (EFD-PIS/COFINS)', periodicidade: 'Mensal', dia: 25 },
  { nome: 'SPED Contábil (ECD)', periodicidade: 'Anual', dia: 30, mes: 6 },
  { nome: 'ECF (Escrituração Contábil Fiscal)', periodicidade: 'Anual', dia: 31, mes: 7 },
];

function buildObrigacoes() {
  const mesAtual = now.getMonth() + 1;
  const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
  const anoRef = mesAtual === 1 ? ANO - 1 : ANO;

  return [
    {
      nome: 'SPED Fiscal (EFD-ICMS/IPI)',
      competencia: now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      vencimento: venc(25, mesAtual === 12 ? 1 : mesAtual + 1, mesAtual === 12 ? ANO + 1 : ANO),
      status: 'Pendente',
      tipo: 'mensal',
    },
    {
      nome: 'SPED Contribuições (EFD-PIS/COFINS)',
      competencia: now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      vencimento: venc(25, mesAtual === 12 ? 1 : mesAtual + 1, mesAtual === 12 ? ANO + 1 : ANO),
      status: 'Pendente',
      tipo: 'mensal',
    },
    {
      nome: 'SPED Contábil (ECD)',
      competencia: String(ANO - 1),
      vencimento: venc(30, 6, ANO),
      status: new Date(ANO, 5, 30) < now ? 'Entregue' : 'Pendente',
      tipo: 'anual',
    },
    {
      nome: 'ECF (Escrituração Contábil Fiscal)',
      competencia: String(ANO - 1),
      vencimento: venc(31, 7, ANO),
      status: new Date(ANO, 6, 31) < now ? 'Entregue' : 'Pendente',
      tipo: 'anual',
    },
    {
      nome: 'SPED Fiscal (EFD-ICMS/IPI)',
      competencia: new Date(anoRef, mesAnterior - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      vencimento: venc(25, mesAtual, ANO),
      status: venc(25, mesAtual, ANO) < now.toLocaleDateString('pt-BR') ? 'Entregue' : 'Entregue',
      tipo: 'mensal',
    },
    {
      nome: 'SPED Contribuições (EFD-PIS/COFINS)',
      competencia: new Date(anoRef, mesAnterior - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      vencimento: venc(25, mesAtual, ANO),
      status: 'Entregue',
      tipo: 'mensal',
    },
  ];
}

export default function SPED() {
  const [obrigacoes, setObrigacoes] = useState(buildObrigacoes);
  const [gerando, setGerando] = useState(null);

  const pendentes = obrigacoes.filter(o => o.status === 'Pendente');
  const entregues = obrigacoes.filter(o => o.status === 'Entregue');
  const vencendoHoje = obrigacoes.filter(o => {
    if (o.status !== 'Pendente') return false;
    const [d, m, y] = o.vencimento.split('/').map(Number);
    const v = new Date(y, m - 1, d);
    const diff = (v - now) / 86400000;
    return diff <= 7;
  });

  const handleGerar = async (idx) => {
    setGerando(idx);
    await new Promise(r => setTimeout(r, 1500));
    setObrigacoes(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status: 'Entregue' };
      return next;
    });
    setGerando(null);
    toast.success('SPED gerado e marcado como entregue.');
  };

  const handleDownload = (o) => {
    const content = `SPED — ${o.nome}\nCompetência: ${o.competencia}\nVencimento: ${o.vencimento}\nGerado em: ${new Date().toLocaleString('pt-BR')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPED_${o.nome.replace(/[^a-z0-9]/gi, '_')}_${o.competencia.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="SPED — Obrigações Acessórias"
        actions={
          <button
            type="button"
            onClick={() => setObrigacoes(buildObrigacoes())}
            className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground"
            title="Atualizar"
          >
            <RefreshCw size={13} />
          </button>
        }
      />

      {vencendoHoje.length > 0 && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{vencendoHoje.length} obrigação{vencendoHoje.length !== 1 ? 'ões' : ''} vencendo nos próximos 7 dias:</span>
            {' '}{vencendoHoje.map(o => o.nome).join(', ')}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Pendentes', val: pendentes.length, color: 'text-warning', bg: 'bg-yellow-50', icon: Clock },
          { label: 'Entregues', val: entregues.length, color: 'text-success', bg: 'bg-green-50', icon: CheckCircle },
          { label: 'Vencendo em 7d', val: vencendoHoje.length, color: 'text-orange-600', bg: 'bg-orange-50', icon: CalendarClock },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border border-border rounded px-4 py-3 flex items-center gap-3`}>
            <k.icon size={20} className={k.color} />
            <div>
              <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
              <div className="text-[11px] text-muted-foreground">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h3 className="text-sm font-semibold">Agenda de Obrigações — {ANO}</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted border-b border-border">
                {['Obrigação', 'Periodicidade', 'Competência', 'Vencimento', 'Status', 'Ação'].map(h => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {obrigacoes.map((o, i) => {
                const isVencendo = o.status === 'Pendente' && (() => {
                  const [d, m, y] = o.vencimento.split('/').map(Number);
                  return (new Date(y, m - 1, d) - now) / 86400000 <= 7;
                })();
                return (
                  <tr key={i} className={`border-b border-border last:border-0 hover:bg-muted/40 ${isVencendo ? 'bg-yellow-50/50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium">{o.nome}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${o.tipo === 'anual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {o.tipo === 'anual' ? 'Anual' : 'Mensal'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{o.competencia}</td>
                    <td className={`px-4 py-2.5 font-medium ${isVencendo ? 'text-warning' : ''}`}>{o.vencimento}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {o.status === 'Entregue'
                          ? <CheckCircle size={12} className="text-success" />
                          : isVencendo
                            ? <AlertCircle size={12} className="text-warning" />
                            : <Clock size={12} className="text-muted-foreground" />}
                        <span className={o.status === 'Entregue' ? 'text-success' : isVencendo ? 'text-warning' : 'text-muted-foreground'}>
                          {o.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {o.status === 'Entregue' ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(o)}
                          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <Download size={11} /> Baixar
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={gerando === i}
                          onClick={() => handleGerar(i)}
                          className="text-[11px] cozinha-blue-bg text-white px-2 py-0.5 rounded hover:opacity-90 disabled:opacity-50"
                        >
                          {gerando === i ? 'Gerando…' : 'Gerar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
