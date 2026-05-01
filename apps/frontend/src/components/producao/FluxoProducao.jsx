import { Link, useLocation } from 'react-router-dom';
import { Factory, ClipboardList, KanbanSquare, Settings2, MonitorCog } from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';

const ETAPAS = [
  {
    label: 'Ordens',
    descricao: 'Entrada e gestão das OPs',
    path: '/producao/ordens',
    acao: 'ver_op',
    icon: ClipboardList,
  },
  {
    label: 'PCP',
    descricao: 'Planejamento e carga',
    path: '/producao/pcp',
    acao: 'ver_pcp',
    icon: Settings2,
  },
  {
    label: 'Kanban',
    descricao: 'Movimentação do chão',
    path: '/producao/kanban',
    acao: 'ver_kanban',
    icon: KanbanSquare,
  },
  {
    label: 'Chão de Fábrica',
    descricao: 'Visão operacional da fábrica',
    path: '/producao/chao-fabrica',
    acao: 'ver_chao_fabrica',
    icon: MonitorCog,
  },
];

export default function FluxoProducao({ title = 'Fluxo de Produção' }) {
  const { pode } = usePermissao();
  const location = useLocation();

  return (
    <div className="bg-white border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded bg-nomus-blue-light text-primary flex items-center justify-center">
          <Factory size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-[11px] text-muted-foreground">Use este caminho para sair da abertura da OP até o controle do chão.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {ETAPAS.map((etapa) => {
          const ativo = location.pathname.startsWith(etapa.path);
          const permitido = pode(etapa.acao);
          const Icon = etapa.icon;

          const card = (
            <div className={`rounded-lg border px-3 py-2 transition-colors ${ativo ? 'border-primary bg-nomus-blue-light' : permitido ? 'border-border hover:border-primary/40 hover:bg-muted' : 'border-dashed border-border bg-muted/30 opacity-60'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded flex items-center justify-center ${ativo ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{etapa.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{etapa.descricao}</div>
                </div>
              </div>
            </div>
          );

          if (!permitido) return <div key={etapa.path}>{card}</div>;

          return (
            <Link key={etapa.path} to={etapa.path} className="block">
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
