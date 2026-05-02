import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Send, XCircle, CheckCircle, Clock, AlertCircle, Download, FileText, RotateCcw, Ban, Eye, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const STATUS_CFG = {
  Autorizada:         { color: 'bg-green-100 text-green-700',    icon: CheckCircle },
  'Aguardando autorização': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  Rejeitada:          { color: 'bg-red-100 text-red-700',         icon: XCircle },
  Cancelada:          { color: 'bg-gray-100 text-gray-500',       icon: Ban },
  Substituída:        { color: 'bg-blue-100 text-blue-700',       icon: RotateCcw },
};

const MUNICIPIOS = ['Rio de Janeiro', 'São Paulo', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza'];

export default function NfseGestao() {
  const [dados, setDados] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('Todos');
  const [detalhe, setDetalhe] = useState(null);
  const [showCancelar, setShowCancelar] = useState(null);
  const [showSubstituir, setShowSubstituir] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/nfse');
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setDados(list);
    } catch {
      toast.error('Erro ao carregar NFS-es');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lista = useMemo(() => {
    let d = dados;
    if (filtroStatus !== 'Todos') d = d.filter((r) => r.status === filtroStatus);
    if (filtroMunicipio !== 'Todos') d = d.filter((r) => r.municipio === filtroMunicipio);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.pessoa.toLowerCase().includes(q) || (r.numero_nfs || '').includes(q) || r.lote.toLowerCase().includes(q)); }
    return d;
  }, [dados, filtroStatus, filtroMunicipio, busca]);

  const kpis = useMemo(() => ({
    total: dados.length,
    autorizadas: dados.filter((d) => d.status === 'Autorizada').length,
    aguardando: dados.filter((d) => d.status === 'Aguardando autorização').length,
    canceladas: dados.filter((d) => d.status === 'Cancelada').length,
    rejeitadas: dados.filter((d) => d.status === 'Rejeitada').length,
    valor_total: dados.filter((d) => d.status === 'Autorizada').reduce((s, d) => s + d.valor, 0),
  }), [dados]);

  const cancelar = async (item, mot) => {
    setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, status: 'Cancelada', motivo_cancelamento: mot } : d));
    setShowCancelar(null); setMotivo('');
    toast.success('NFS-e cancelada. Motivo registrado.');
    try {
      await api.put(`/api/sales/nfse/${item.id}`, { status: 'Cancelada', motivo_cancelamento: mot });
    } catch {
      toast.error('Erro ao cancelar NFS-e');
      load();
    }
  };

  const substituir = async (item) => {
    setShowSubstituir(null);
    toast.success('NFS-e substituída com sucesso!');
    try {
      await api.post(`/api/sales/nfse/${item.id}/substituir`, { motivo });
      await load();
    } catch {
      toast.error('Erro ao substituir NFS-e');
      load();
    }
  };

  const reenviarEmail = (item) => {
    toast.success(`NFS-e ${item.numero_nfs} reenviada por e-mail para ${item.pessoa}`);
    setShowActionsMenu(null);
  };

  const Chip = ({ status }) => {
    const c = STATUS_CFG[status] || STATUS_CFG['Aguardando autorização'];
    const Icon = c.icon;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}><Icon size={10} />{status}</span>;
  };

  const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Painel de NFS-e</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Nota Fiscal de Serviço Eletrônica — emissão, cancelamento e substituição</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => toast.info('Atualizando status das NFS-es...')} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
            <RefreshCw size={13} /> Atualizar
          </button>
          <button type="button" onClick={() => toast.info('Módulo de lote — emita múltiplas NFS-es')} className="erp-btn-primary flex items-center gap-1.5">
            <FileText size={14} /> Emitir NFS-e
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: kpis.total },
          { label: 'Autorizadas', value: kpis.autorizadas, color: 'text-green-600' },
          { label: 'Aguardando', value: kpis.aguardando, color: 'text-yellow-600' },
          { label: 'Canceladas', value: kpis.canceladas, color: 'text-gray-500' },
          { label: 'Rejeitadas', value: kpis.rejeitadas, color: 'text-red-600' },
          { label: 'Valor Autorizado', value: fmtBRL(kpis.valor_total), color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar prestador, número NFS-e..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="erp-input text-xs" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option>Todos</option>
          {Object.keys(STATUS_CFG).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="erp-input text-xs" value={filtroMunicipio} onChange={(e) => setFiltroMunicipio(e.target.value)}>
          <option>Todos</option>
          {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Tabela principal — igual à screenshot do Nomus */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs">
          <thead>
            <tr>
              <th>Lote</th><th>Empresa</th><th>Situação</th><th>Pessoa</th>
              <th>Tipo de movimentação</th><th>Valor total</th><th>Status</th>
              <th>Nº da NFS</th><th>Data da NFS</th><th>Data prev. saída</th><th>Doc. saída</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetalhe(r)}>
                <td className="font-mono font-medium text-primary">{r.lote}</td>
                <td>{r.empresa}</td>
                <td>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.situacao === 'Concluído' ? 'bg-green-50 text-green-700' : r.situacao === 'Processando' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    {r.situacao}
                  </span>
                </td>
                <td className="font-medium">{r.pessoa}</td>
                <td className="text-muted-foreground">{r.tipo_mov}</td>
                <td className="font-medium">{fmtBRL(r.valor)}</td>
                <td><Chip status={r.status} /></td>
                <td className="font-mono">{r.numero_nfs || '—'}</td>
                <td className="text-muted-foreground">{r.data_nfs || '—'}</td>
                <td className="text-muted-foreground">{r.data_prevista_saida}</td>
                <td className="text-primary">{r.doc_saida}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button type="button" onClick={() => setShowActionsMenu(showActionsMenu === r.id ? null : r.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-xs">
                      Ações <ChevronDown size={11} />
                    </button>
                    {showActionsMenu === r.id && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-48">
                        <button type="button" onClick={() => { setDetalhe(r); setShowActionsMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted"><Eye size={11} /> Ver detalhes</button>
                        {r.status === 'Autorizada' && (
                          <>
                            <button type="button" onClick={() => reenviarEmail(r)} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted"><Send size={11} /> Enviar por e-mail</button>
                            <button type="button" onClick={() => toast.info('Download do DANFE/XML')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted"><Download size={11} /> Baixar XML/DANFE</button>
                            <button type="button" onClick={() => { setShowCancelar(r); setShowActionsMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-red-50 text-red-600"><Ban size={11} /> Cancelar NFS-e</button>
                            <button type="button" onClick={() => { setShowSubstituir(r); setShowActionsMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-blue-50 text-blue-600"><RotateCcw size={11} /> Substituir NFS-e</button>
                          </>
                        )}
                        {r.status === 'Rejeitada' && (
                          <button type="button" onClick={() => toast.info('Reenviando NFS-e...')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-yellow-50 text-yellow-600"><RefreshCw size={11} /> Reenviar</button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={12} className="text-center py-8 text-muted-foreground">Nenhuma NFS-e encontrada</td></tr>
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
                <h2 className="font-semibold">NFS-e {detalhe.numero_nfs ? `nº ${detalhe.numero_nfs}` : '(aguardando número)'}</h2>
                <div className="mt-1"><Chip status={detalhe.status} /></div>
              </div>
              <button type="button" onClick={() => setDetalhe(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-muted-foreground">Empresa</span><p className="font-medium">{detalhe.empresa}</p></div>
                <div><span className="text-xs text-muted-foreground">Tomador</span><p className="font-medium">{detalhe.pessoa}</p></div>
                <div><span className="text-xs text-muted-foreground">Município</span><p>{detalhe.municipio}</p></div>
                <div><span className="text-xs text-muted-foreground">Tipo de serviço</span><p>{detalhe.tipo_mov}</p></div>
                <div><span className="text-xs text-muted-foreground">Valor total</span><p className="font-bold text-primary">{fmtBRL(detalhe.valor)}</p></div>
                <div><span className="text-xs text-muted-foreground">Doc. de saída</span><p className="text-primary">{detalhe.doc_saida}</p></div>
                {detalhe.data_nfs && <div><span className="text-xs text-muted-foreground">Data da NFS</span><p>{detalhe.data_nfs}</p></div>}
              </div>
              {detalhe.motivo_cancelamento && (
                <div className="bg-red-50 rounded p-3"><span className="text-xs text-red-700 font-semibold">Motivo do cancelamento:</span><p className="text-sm text-red-600">{detalhe.motivo_cancelamento}</p></div>
              )}
              {detalhe.motivo_rejeicao && (
                <div className="bg-red-50 rounded p-3"><span className="text-xs text-red-700 font-semibold">Motivo da rejeição:</span><p className="text-sm text-red-600">{detalhe.motivo_rejeicao}</p></div>
              )}
              {/* Log de automação */}
              {detalhe.status === 'Autorizada' && detalhe.automacao_log?.length > 0 && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs font-semibold mb-2">Log de automação</p>
                  {detalhe.automacao_log.map((l, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-1">
                      <CheckCircle size={10} className="text-green-500 mt-0.5 shrink-0" />{l}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex flex-wrap gap-2 justify-end">
              {detalhe.status === 'Autorizada' && (
                <>
                  <button type="button" onClick={() => reenviarEmail(detalhe)} className="erp-btn-ghost flex items-center gap-1"><Send size={13} /> Enviar e-mail</button>
                  <button type="button" onClick={() => toast.info('Baixando XML...')} className="erp-btn-ghost flex items-center gap-1"><Download size={13} /> XML/DANFE</button>
                  <button type="button" onClick={() => { setShowCancelar(detalhe); setDetalhe(null); }} className="erp-btn-ghost text-red-600 flex items-center gap-1"><Ban size={13} /> Cancelar</button>
                </>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelar */}
      {showCancelar && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-red-600 flex items-center gap-2"><Ban size={16} /> Cancelar NFS-e</h3>
              <p className="text-xs text-muted-foreground mt-0.5">NFS-e nº {showCancelar.numero_nfs}</p>
            </div>
            <div className="p-4">
              <label className="erp-label">Motivo do cancelamento *</label>
              <textarea className="erp-input w-full h-24 resize-none mt-1" placeholder="Informe o motivo do cancelamento..." value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowCancelar(null); setMotivo(''); }} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={() => cancelar(showCancelar, motivo || 'Não especificado')} className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 flex items-center gap-1">
                <Ban size={13} /> Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal substituir */}
      {showSubstituir && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2"><RotateCcw size={16} /> Substituir NFS-e</h3>
              <p className="text-xs text-muted-foreground mt-0.5">A nota atual será cancelada e uma nova será gerada</p>
            </div>
            <div className="p-4">
              <label className="erp-label">Motivo da substituição</label>
              <textarea className="erp-input w-full h-20 resize-none mt-1" placeholder="Descreva o motivo..." value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowSubstituir(null); setMotivo(''); }} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={() => substituir(showSubstituir)} className="erp-btn-primary flex items-center gap-1"><RotateCcw size={13} /> Substituir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
