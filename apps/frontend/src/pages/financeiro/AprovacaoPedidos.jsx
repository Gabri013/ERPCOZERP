import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import {
  CONFIG,
  aprovarPedidoGerencialApi,
  fetchPedidosAguardandoAp,
  rejeitarPedidoApi,
} from '@/services/businessLogicApi';
import { toast } from 'sonner';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtD = (v) => (v ? new Date(`${v}T00:00`).toLocaleDateString('pt-BR') : '—');

export default function AprovacaoPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [rejeitando, setRejeitando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPedidosAguardandoAp();
      setPedidos(rows);
    } catch (e) {
      toast.error(e?.message || 'Não foi possível carregar pedidos.');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleAprovar = async (id) => {
    try {
      await aprovarPedidoGerencialApi(id);
      toast.success('Pedido aprovado');
      await reload();
    } catch (e) {
      toast.error(e?.message || 'Falha na aprovação');
    }
  };

  const handleRejeitar = async () => {
    if (!rejeitando) return;
    try {
      await rejeitarPedidoApi(rejeitando, motivo);
      toast.success('Pedido rejeitado');
      setRejeitando(null);
      setMotivo('');
      await reload();
    } catch (e) {
      toast.error(e?.message || 'Falha ao rejeitar');
    }
  };

  if (loading && pedidos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Aprovação de Pedidos"
        subtitle={`Pedidos acima de ${fmtR(CONFIG.LIMITE_APROVACAO)} requerem aprovação gerencial`}
        breadcrumbs={['Início', 'Financeiro', 'Aprovação de Pedidos']}
      />

      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mb-4 text-xs text-yellow-800">
        <AlertTriangle size={13} className="shrink-0" />
        <span>
          Pedidos com valor acima de <strong>{fmtR(CONFIG.LIMITE_APROVACAO)}</strong> precisam de aprovação
          gerencial antes de seguir para produção.
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white border border-border rounded-lg px-4 py-12 text-center">
          <CheckCircle size={32} className="text-success mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Nenhum pedido aguardando aprovação</p>
          <p className="text-xs text-muted-foreground mt-1">
            Todos os pedidos estão dentro do limite automático ou já foram aprovados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white border border-orange-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{p.numero}</span>
                    <StatusBadge status="Aguardando Aprovação" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs mt-2">
                    {[
                      ['Cliente', p.cliente_nome],
                      ['Vendedor', p.vendedor || '—'],
                      ['Emissão', fmtD(p.data_emissao)],
                      ['Entrega', fmtD(p.data_entrega)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-muted-foreground">{k}</div>
                        <div className="font-medium">{v}</div>
                      </div>
                    ))}
                  </div>
                  {p.observacoes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted rounded px-2 py-1">
                      {p.observacoes}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-orange-600">{fmtR(p.valor_total)}</div>
                  <div className="text-[10px] text-muted-foreground">Valor do Pedido</div>
                  <div className="flex gap-2 mt-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setRejeitando(p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      <XCircle size={12} /> Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAprovar(p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-success text-success-foreground rounded hover:opacity-90"
                    >
                      <CheckCircle size={12} /> Aprovar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejeitando && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-border shadow-lg">
            <h3 className="text-sm font-semibold mb-2">Motivo da rejeição</h3>
            <textarea
              className="w-full border rounded p-2 text-xs min-h-[80px]"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Opcional…"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setRejeitando(null);
                  setMotivo('');
                }}
                className="px-3 py-1 text-xs border rounded"
              >
                Cancelar
              </button>
              <button type="button" onClick={handleRejeitar} className="px-3 py-1 text-xs bg-red-600 text-white rounded">
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
