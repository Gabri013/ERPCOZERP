import PageHeader from '@/components/common/PageHeader';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import ApontamentoModal from '@/components/producao/ApontamentoModal';

export default function Apontamento() {
  const { opId } = useParams();
  const navigate = useNavigate();
  const [op, setOp] = useState(null);
  const [apontamentos, setApontamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!opId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [opId]);

  async function loadData() {
    if (!opId) return;
    try {
      const opRes = await api.get(`/api/production/ops/${opId}`);
      setOp(opRes.data);
      const aptRes = await api.get(`/api/production/apontamentos/${opId}`);
      setApontamentos(aptRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveApontamento(data) {
    try {
      await api.post(`/api/production/ops/${opId}/apontamento`, data);
      setModalOpen(false);
      loadData(); // recarrega
    } catch (err) {
      alert('Erro ao registrar apontamento: ' + err.message);
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  
  if (!opId) {
    return (
      <div className="p-8">
        <PageHeader 
          title="Apontamentos"
          breadcrumbs={['Início','Produção','Apontamentos']}
        />
        <div className="bg-white border border-border rounded-lg p-8 text-center text-muted-foreground">
          Selecione uma Ordem de Produção para registrar apontamentos.
        </div>
      </div>
    );
  }

  if (!op) return <div className="p-8 text-center text-red-600">OP não encontrada</div>;

  return (
    <div>
      <PageHeader 
        title={`Apontamento - OP ${op.numero}`}
        breadcrumbs={['Início','Produção','Ordens',op.numero,'Apontamento']}
        actions={
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            onClick={() => setModalOpen(true)}
          >
            + Novo Apontamento
          </button>
        }
      />

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Etapa</th>
              <th className="px-3 py-2 text-left">Setor</th>
              <th className="px-3 py-2 text-left">Operador</th>
              <th className="px-3 py-2 text-center">Quantidade</th>
              <th className="px-3 py-2 text-center">Refugo</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Início</th>
              <th className="px-3 py-2 text-left">Fim</th>
            </tr>
          </thead>
          <tbody>
            {apontamentos.map(a => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-3 py-2">{a.etapa || a.descricao}</td>
                <td className="px-3 py-2">{a.setor || '-'}</td>
                <td className="px-3 py-2">{a.operador || a.apontado_por_nome || '-'}</td>
                <td className="px-3 py-2 text-center">{a.quantidade}</td>
                <td className="px-3 py-2 text-center">{a.refugo}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    a.status === 'Finalizado' ? 'bg-green-100 text-green-700' :
                    a.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-[11px]">
                  {a.horaInicio || a.iniciado_em ? new Date(a.horaInicio || a.iniciado_em).toLocaleString('pt-BR') : '-'}
                </td>
                <td className="px-3 py-2 text-[11px]">
                  {a.horaFim || a.finalizado_em ? new Date(a.horaFim || a.finalizado_em).toLocaleString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
            {apontamentos.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-muted-foreground">
                Nenhum apontamento registrado
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Apontamento */}
      {modalOpen && (
        <ApontamentoModal 
          op={op}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveApontamento}
        />
      )}
    </div>
  );
}
