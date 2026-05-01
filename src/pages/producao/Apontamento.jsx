import PageHeader from '@/components/common/PageHeader';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ApontamentoModal from '@/components/producao/ApontamentoModal';
import { useAuth } from '@/lib/AuthContext';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const ROLE_TO_SETOR = {
  corte_laser: 'Laser',
  dobra_montagem: 'Dobra',
  solda: 'Solda',
  expedicao: 'Expedição',
  qualidade: 'Qualidade',
  gerente_producao: 'Programação',
};

export default function Apontamento() {
  const { opId } = useParams();
  const navigate = useNavigate();
  const [op, setOp] = useState(null);
  const [apontamentos, setApontamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [setorFiltro, setSetorFiltro] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!opId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [opId]);

  useEffect(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const roleMatch = roles.find((r) => ROLE_TO_SETOR[r]) || roles[0];
    const defaultSetor = ROLE_TO_SETOR[roleMatch] || '';
    setSetorFiltro((prev) => prev || defaultSetor);
  }, [user?.roles]);

  async function loadData() {
    if (!opId) return;
    try {
      const [ops, apts] = await Promise.all([
        recordsServiceApi.list('ordem_producao'),
        recordsServiceApi.list('apontamento_producao'),
      ]);
      const found = ops.find((o) => o.id === opId) || ops.find((o) => o.numero === opId) || null;
      setOp(found);
      setApontamentos(apts.filter((a) => String(a.opId) === String(found?.numero || opId) || String(a.opId) === String(opId)));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveApontamento(data) {
    try {
      await recordsServiceApi.create('apontamento_producao', { ...data, opId: op?.numero || String(opId) });
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

  const setoresUnicos = Array.from(
    new Set((apontamentos || []).map((a) => a.setor).filter(Boolean))
  );

  const apontamentosFiltrados = (apontamentos || []).filter((a) => {
    if (!setorFiltro) return true;
    return String(a.setor || '').toLowerCase() === String(setorFiltro).toLowerCase();
  });

  return (
    <div>
      <PageHeader 
        title={`Apontamento - OP ${op.numero}`}
        breadcrumbs={['Início','Produção','Ordens',op.numero,'Apontamento']}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground hidden sm:block">Setor</label>
              <select
                className="border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary"
                value={setorFiltro}
                onChange={(e) => setSetorFiltro(e.target.value)}
                aria-label="Filtrar por setor"
              >
                <option value="">Todos</option>
                {setoresUnicos.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
              onClick={() => setModalOpen(true)}
            >
              + Novo Apontamento
            </button>
          </div>
        }
      />

      <div className="bg-white border border-border rounded-lg overflow-x-auto">
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
            {apontamentosFiltrados.map(a => (
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
            {apontamentosFiltrados.length === 0 && (
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
          defaultSetor={setorFiltro}
        />
      )}
    </div>
  );
}
