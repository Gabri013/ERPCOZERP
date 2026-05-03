import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Truck, Factory,
  DollarSign, ChevronDown, ChevronRight,
  FileText, Boxes, Database, Users, X, Wrench,
  PanelLeftClose, PanelLeftOpen, BarChart2, Settings, Briefcase, Globe, BookOpen, ClipboardCheck, FolderKanban,
} from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';
import { useMetadataStore } from '@/stores/metadataStore';

const MENU_BLACKLIST = new Set([
  'apontamento_producao','cliente','compras_recebimento','conta_pagar','conta_receber',
  'cotacao_compra','crm_atividade','crm_lead','crm_oportunidade','dashboard_layout',
  'estoque_inventario','fiscal_nfe','fornecedor','funcionario','historico_op','machine',
  'movimentacao_estoque','orcamento','ordem_compra','ordem_producao','producao_maquina',
  'produto','rh_ferias','rh_folha_pagamento','rh_funcionario','rh_ponto','roteiro',
  'tabela_preco','workflow','product','customer','supplier','purchase_order','sale_order',
  'work_order','stock_movement','inventory_count','location','employee','time_entry',
  'leave_request','payroll_run','fiscal_nfe_record',
  // Entidades de sistema adicionais
  'platform_settings','pedido_venda','fiscal_nfe_record',
]);

// Agrupamento por fluxo de trabalho: CRM → Vendas → Comercial → Serviços → Operacional ···
const MENU_SECTIONS = [
  {
    sectionLabel: null,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/', alwaysShow: true },
      { label: 'Painéis de Gestão', icon: BarChart2, path: '/paineis-gestao', required: 'relatorios:view' },
    ],
  },
  {
    sectionLabel: 'CRM',
    items: [
      {
        label: 'Qualificação',
        icon: Users,
        children: [
          { label: 'Dashboard', path: '/crm/dashboard', required: 'ver_crm' },
          { label: 'Inbox', path: '/crm/inbox', required: 'ver_crm' },
          { label: 'Leads', path: '/crm/leads', required: 'ver_crm' },
          { label: 'Oportunidades', path: '/crm/oportunidades', required: 'ver_crm' },
          { label: 'Pipeline', path: '/crm/pipeline', required: 'ver_crm' },
          { label: 'Atividades', path: '/crm/atividades', required: 'ver_crm' },
          { label: 'Gestão de processos', path: '/crm', required: 'ver_vendas' },
          { label: 'Funil pré-venda (ERP)', path: '/vendas/oportunidades', required: 'ver_pedidos' },
        ],
      },
    ],
  },
  {
    sectionLabel: 'Vendas',
    items: [
      {
        label: 'Principal',
        icon: ShoppingCart,
        children: [
          { label: 'Orçamentos', path: '/vendas/orcamentos', required: 'ver_pedidos' },
          { label: 'Propostas (ORC)', path: '/vendas/propostas', required: 'ver_pedidos' },
          { label: 'Pedidos de Venda', path: '/vendas/pedidos', required: 'ver_pedidos' },
          { label: 'Clientes', path: '/vendas/clientes', required: 'ver_clientes' },
          { label: 'Tabela de Preços', path: '/vendas/tabela-precos', required: 'ver_pedidos' },
          { label: 'Catálogo de produtos', path: '/estoque/produtos', required: 'produto.view' },
        ],
      },
    ],
  },
  {
    sectionLabel: 'Comercial',
    items: [
      {
        label: 'Apoio',
        icon: FileText,
        children: [
          { label: 'Solicitações de Cotação', path: '/vendas/solicitacoes-cotacao', required: 'ver_pedidos' },
          { label: 'Comissões', path: '/vendas/comissoes', required: 'ver_pedidos' },
          { label: 'Relatórios', path: '/vendas/relatorios', required: 'relatorios:view' },
        ],
      },
    ],
  },
  {
    sectionLabel: 'Serviços',
    items: [
      {
        label: 'Serviços',
        icon: Briefcase,
        children: [
          { label: 'Propostas Comerciais', path: '/servicos/propostas', required: 'ver_servicos' },
          { label: 'Pedidos de Serviço', path: '/servicos/pedidos', required: 'ver_servicos' },
        ],
      },
    ],
  },
  {
    sectionLabel: 'OPERACIONAL',
    items: [
      {
        label: 'Compras', icon: Truck, children: [
          { label: 'Fornecedores',       path: '/compras/fornecedores',        required: 'ver_compras' },
          { label: 'Solicitações',       path: '/compras/solicitacoes',        required: 'ver_compras' },
          { label: 'Cotações de Compra', path: '/compras/cotacoes-compra',     required: 'ver_compras' },
          { label: 'Pedidos de Compra',  path: '/compras/pedidos',             required: 'ver_compras' },
          { label: 'Documento de Entrada', path: '/compras/documento-entrada', required: 'ver_compras' },
          { label: 'Recebimentos',       path: '/compras/recebimentos',        required: 'ver_compras' },
          { label: 'Importação de XML',  path: '/compras/importacao-xml',      required: 'ver_compras' },
          { label: 'Manifestação NF-e',  path: '/compras/manifestacao-nfe',    required: 'ver_compras' },
          { label: 'Regras de Tributação', path: '/compras/regras-tributacao', required: 'ver_compras' },
        ],
      },
      {
        label: 'Expedição', icon: Truck, children: [
          { label: 'Controle da Expedição', path: '/expedicao', required: 'ver_vendas' },
        ],
      },
      {
        label: 'Projetos', icon: FolderKanban, children: [
          { label: 'Gestão de Projetos', path: '/projetos', required: 'ver_vendas' },
        ],
      },
      {
        label: 'Conhecimento', icon: BookOpen, children: [
          { label: 'Base de Conhecimento', path: '/conhecimento', required: 'ver_vendas' },
          { label: 'Como Funciona / Módulos', path: '/sobre',       required: 'ver_vendas' },
        ],
      },
      {
        label: 'Importação', icon: Globe, children: [
          { label: 'Processos de Importação', path: '/importacao',            required: 'ver_compras' },
          { label: 'Importar XML da DI',      path: '/importacao/xml-di',     required: 'ver_compras' },
        ],
      },
      {
        label: 'Estoque', icon: Boxes, children: [
          { label: 'Produtos',            path: '/estoque/produtos',            required: ['ver_estoque', 'produto.view'] },
          { label: 'Movimentações',       path: '/estoque/movimentacoes',       required: 'ver_estoque' },
          { label: 'Estoque Projetado',   path: '/estoque/projetado',           required: 'ver_estoque' },
          { label: 'Lotes e Séries',      path: '/estoque/lotes-series',        required: 'ver_estoque' },
          { label: 'Transferências',      path: '/estoque/transferencias',      required: 'ver_estoque' },
        ],
      },
      {
        label: 'Produção', icon: Factory, children: [
          { label: 'Ordens de Produção',  path: '/producao/ordens',          required: 'ver_op' },
          { label: 'Lista de Materiais',  path: '/producao/lista-materiais', required: 'ver_op' },
          { label: 'Requisição de Mat.',  path: '/producao/requisicao',      required: 'ver_op' },
          { label: 'Reporte de Produção', path: '/producao/reporte',         required: 'ver_op' },
          { label: 'Prod. em Terceiros',   path: '/producao/terceiros',       required: 'ver_op' },
          { label: 'Prod. para Terceiros', path: '/producao/para-terceiros',  required: 'ver_op' },
          { label: 'PCP',                 path: '/producao/pcp',             required: 'ver_pcp' },
          { label: 'Programação',        path: '/producao/programacao',     required: 'ver_pcp' },
          { label: 'Previsão de Vendas', path: '/producao/previsao-vendas', required: 'ver_pcp' },
          { label: 'Plano de Produção',  path: '/producao/plano-producao',  required: 'ver_pcp' },
          { label: 'MRP / CRP',          path: '/producao/mrp',             required: 'ver_pcp' },
          { label: 'Custeio Padrão',     path: '/producao/custeio-padrao',  required: 'ver_pcp' },
          { label: 'Custeio Real',       path: '/producao/custeio-real',    required: 'ver_pcp' },
          { label: 'Kanban',              path: '/producao/kanban',          required: 'ver_kanban' },
          { label: 'Chão de Fábrica',     path: '/producao/chao-fabrica',    required: 'ver_chao_fabrica' },
          { label: 'Monitoramento RT',    path: '/producao/monitoramento',   required: 'ver_chao_fabrica' },
          { label: 'Apontamento',         path: '/producao/apontamento',     required: 'apontar' },
          { label: 'Paradas e Esperas',   path: '/producao/paradas',         required: 'apontar' },
          { label: 'Análise de Tempos',   path: '/producao/analise-tempos',  required: 'ver_chao_fabrica' },
          { label: 'Roteiros',            path: '/producao/roteiros',        required: 'ver_roteiros' },
          { label: 'Máquinas',            path: '/producao/maquinas',        required: 'ver_maquinas' },
        ],
      },
      {
        label: 'Engenharia',
        icon: Wrench,
        children: [
          { label: 'Projetos', path: '/engenharia/projetos', required: ['ver_roteiros', 'editar_produtos'] },
          { label: 'BOM e 3D', path: '/engenharia', required: ['ver_roteiros', 'editar_produtos'] },
          { label: 'Pendentes BOM', path: '/engenharia/pendentes-bom', required: 'ver_roteiros' },
        ],
      },
    ],
  },
  {
    sectionLabel: 'GESTÃO',
    items: [
      {
        label: 'RH', icon: Users, children: [
          { label: 'Funcionários', path: '/rh/funcionarios', required: 'ver_rh' },
          { label: 'Ponto', path: '/rh/ponto', required: 'ver_rh' },
          { label: 'Folha de Pagamento', path: '/rh/folha-pagamento', required: 'ver_folha' },
          { label: 'Férias', path: '/rh/ferias', required: 'ver_rh' },
        ],
      },
      {
        label: 'Fiscal', icon: FileText, children: [
          { label: 'NF-e', path: '/fiscal/nfe', required: 'ver_fiscal' },
          { label: 'Consulta NF-e', path: '/fiscal/nfe-consulta', required: 'ver_fiscal' },
          { label: 'SPED', path: '/fiscal/sped', required: 'ver_fiscal' },
          { label: 'Bloco K', path: '/fiscal/bloco-k', required: 'ver_fiscal' },
        ],
      },
      {
        label: 'Qualidade', icon: ClipboardCheck, children: [
          { label: 'Controle de Qualidade', path: '/qualidade',            required: 'ver_producao' },
          { label: 'Gestão de Documentos',  path: '/qualidade/documentos', required: 'ver_producao' },
          { label: 'Databooks',             path: '/qualidade/databooks',  required: 'ver_producao' },
        ],
      },
      {
        label: 'Financeiro', icon: DollarSign, children: [
          { label: 'Contas a Receber',   path: '/financeiro/receber',        required: 'ver_financeiro' },
          { label: 'Contas a Pagar',     path: '/financeiro/pagar',          required: 'ver_financeiro' },
          { label: 'Boletos Bancários',  path: '/financeiro/boletos',        required: 'ver_financeiro' },
          { label: 'Transferências',     path: '/financeiro/transferencias',  required: 'ver_financeiro' },
          { label: 'Conciliação Bancária', path: '/financeiro/conciliacao-bancaria', required: 'ver_financeiro' },
          { label: 'Fluxo de Caixa',    path: '/financeiro/fluxo-caixa',    required: 'ver_financeiro' },
          { label: 'Painel Financeiro',  path: '/financeiro/painel',         required: 'ver_financeiro' },
          { label: 'CRM Financeiro',     path: '/financeiro/crm',            required: 'ver_financeiro' },
          { label: 'Régua de Cobrança',  path: '/financeiro/regua-cobranca', required: 'ver_financeiro' },
          { label: 'DRE',               path: '/financeiro/dre',            required: 'ver_financeiro' },
          { label: 'Aprovação de Pedidos', path: '/financeiro/aprovacao-pedidos', required: 'aprovar_financeiro' },
        ],
      },
      {
        label: 'Contabilidade', icon: BookOpen, children: [
          { label: 'Contabilidade',        path: '/contabilidade',             required: 'ver_financeiro' },
          { label: 'Integ. Contábil/Fiscal', path: '/contabilidade/integracao', required: 'ver_financeiro' },
        ],
      },
    ],
  },
  {
    sectionLabel: 'SISTEMA',
    items: [
      { label: 'Relatórios', icon: BarChart2, path: '/relatorios', required: 'relatorios:view' },
      {
        label: 'Configurações', icon: Settings, children: [
          { label: 'Empresa', path: '/configuracoes/empresa', required: 'editar_config' },
          { label: 'Usuários', path: '/configuracoes/usuarios', required: 'gerenciar_usuarios' },
          { label: 'Parâmetros', path: '/configuracoes/parametros', required: 'editar_config' },
          { label: 'Modelo OP', path: '/configuracoes/modelo-op', required: 'editar_config' },
          { label: 'Metadata Studio', path: '/configuracoes/metadata-studio', required: 'editar_config' },
          { label: 'Form Builder', path: '/configuracoes/form-builder', required: 'editar_config' },
          { label: 'Workflows', path: '/configuracoes/workflows', required: 'editar_config' },
          { label: 'Fluxo do Pedido', path: '/configuracoes/fluxo-pedido', required: ['ver_pedidos', 'editar_config'] },
        ],
      },
    ],
  },
];

// Lista plana para lookup
const staticMenuItems = MENU_SECTIONS.flatMap((s) => s.items);

function loadSavedGroups(location) {
  const autoOpen = new Set();
  staticMenuItems.forEach((item) => {
    if (item.children) {
      const hasActive = item.children.some(
        (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/'),
      );
      if (hasActive) autoOpen.add(item.label);
    }
  });
  try {
    const saved = JSON.parse(localStorage.getItem('erp-sidebar-open-groups') || '[]');
    saved.forEach((g) => autoOpen.add(g));
  } catch { /* ignore */ }
  return autoOpen;
}

export default function Sidebar({ isOpen, setIsOpen, onNavigate, mobileDrawer = false }) {
  const location = useLocation();
  const { pode } = usePermissao();
  const loadEntities = useMetadataStore((s) => s.loadEntities);
  const [dynamicEntities, setDynamicEntities] = useState([]);
  const [openGroups, setOpenGroups] = useState(() => loadSavedGroups(location));

  const expanded = mobileDrawer ? true : isOpen;

  // Abre o grupo do path ativo ao navegar
  useEffect(() => {
    staticMenuItems.forEach((item) => {
      if (item.children) {
        const hasActive = item.children.some(
          (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/'),
        );
        if (hasActive) {
          setOpenGroups((prev) => {
            if (prev.has(item.label)) return prev;
            const next = new Set(prev);
            next.add(item.label);
            return next;
          });
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (label) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      try { localStorage.setItem('erp-sidebar-open-groups', JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  };

  const loadCustomEntities = useCallback(async () => {
    const canSee = pode('record.manage') || pode('entity.manage') || pode('record.view');
    if (!canSee) { setDynamicEntities([]); return; }
    try {
      await loadEntities();
      const list = useMetadataStore.getState().entities || [];
      const custom = list.filter((e) => {
        if (e.is_system) return false;
        if (MENU_BLACKLIST.has(e.code)) return false;
        if (e.showInMenu === false) return false;
        return true;
      });
      setDynamicEntities(custom);
    } catch {
      setDynamicEntities([]);
    }
  }, [pode, loadEntities]);

  useEffect(() => { loadCustomEntities(); }, [loadCustomEntities]);

  const canSee = (item) => {
    if (item.alwaysShow) return true;
    if (!item.required) return true;
    return Array.isArray(item.required) ? item.required.some(pode) : pode(item.required);
  };

  /** Grupos sem `required` no pai passavam em canSee com 0 filhos visíveis — escondia itens mas mantinha o título da seção (ex.: GESTÃO). */
  const itemHasVisibleContent = (item) => {
    if (item.children?.length) {
      return item.children.filter(canSee).length > 0;
    }
    return canSee(item);
  };

  const handleClose = () => setIsOpen(false);
  const handleExpand = () => setIsOpen(true);

  // ─── Leaf link ────────────────────────────────────────────────────────────
  const renderLeaf = (item) => {
    if (!canSee(item)) return null;
    const active = location.pathname === item.path;
    if (!expanded) {
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          title={item.label}
          className={`flex items-center justify-center w-9 h-9 mx-auto my-0.5 rounded-md transition-colors duration-150 ${
            active ? 'sidebar-item-active' : 'sidebar-item-hover'
          }`}
        >
          <item.icon size={16} className="shrink-0" />
        </Link>
      );
    }
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 px-3 py-[7px] mx-1.5 my-[1px] rounded-md transition-colors duration-150 sidebar-text text-[13px] ${
          active ? 'sidebar-item-active font-medium' : 'sidebar-item-hover'
        }`}
      >
        <item.icon size={15} className="shrink-0 opacity-80" />
        <span className="truncate flex-1">{item.label}</span>
      </Link>
    );
  };

  // ─── Group ────────────────────────────────────────────────────────────────
  const renderGroup = (item) => {
    const visibleChildren = item.children.filter(canSee);
    if (visibleChildren.length === 0) return null;

    const hasActive = visibleChildren.some(
      (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/'),
    );
    const isGroupOpen = openGroups.has(item.label);

    // Collapsed mode — icon only, click navigates to first child
    if (!expanded) {
      return (
        <Link
          key={item.label}
          to={visibleChildren[0].path}
          onClick={onNavigate}
          title={item.label}
          className={`flex items-center justify-center w-9 h-9 mx-auto my-0.5 rounded-md transition-colors duration-150 ${
            hasActive ? 'sidebar-item-active' : 'sidebar-item-hover'
          }`}
        >
          <item.icon size={16} className="shrink-0" />
        </Link>
      );
    }

    // Expanded mode — accordion
    return (
      <div key={item.label}>
        <button
          type="button"
          onClick={() => toggleGroup(item.label)}
          className={`w-full flex items-center gap-2.5 px-3 py-[7px] mx-1.5 my-[1px] rounded-md transition-colors duration-150 sidebar-text text-[13px] cursor-pointer ${
            hasActive ? 'sidebar-group-active' : 'sidebar-item-hover'
          }`}
          style={{ width: 'calc(100% - 12px)' }}
        >
          <item.icon size={15} className="shrink-0 opacity-80" />
          <span className="truncate flex-1 text-left">{item.label}</span>
          <ChevronDown
            size={13}
            className={`shrink-0 opacity-60 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isGroupOpen && (
          <div className="ml-5 border-l border-white/10 pl-0.5 mb-0.5">
            {visibleChildren.map((child) => {
              const active = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-3 py-[6px] mx-1 my-[1px] rounded-md transition-colors duration-150 text-[12px] ${
                    active ? 'sidebar-child-active font-medium' : 'sidebar-child-hover'
                  }`}
                >
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMenuItem = (item) => {
    if (!canSee(item)) return null;
    if (item.children) return renderGroup(item);
    return renderLeaf(item);
  };

  const renderDynamicSection = () => {
    if (dynamicEntities.length === 0) return null;
    return (
      <div className="mt-3 pt-3 border-t border-white/10">
        {expanded && (
          <div className="px-3 pb-1 sidebar-text-muted text-[10px] uppercase font-semibold tracking-widest">
            Entidades
          </div>
        )}
        {dynamicEntities.map((ent) => {
          const active = location.pathname === `/entidades/${ent.code}`;
          if (!expanded) {
            return (
              <Link
                key={ent.id}
                to={`/entidades/${ent.code}`}
                onClick={onNavigate}
                title={ent.name}
                className={`flex items-center justify-center w-9 h-9 mx-auto my-0.5 rounded-md transition-colors ${active ? 'sidebar-item-active' : 'sidebar-item-hover'}`}
              >
                <Database size={16} />
              </Link>
            );
          }
          return (
            <Link
              key={ent.id}
              to={`/entidades/${ent.code}`}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-[7px] mx-1.5 my-[1px] rounded-md transition-colors text-[13px] sidebar-text ${active ? 'sidebar-item-active font-medium' : 'sidebar-item-hover'}`}
            >
              <Database size={15} className="shrink-0 opacity-80" />
              <span className="truncate flex-1">{ent.name}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  const shellWidth = mobileDrawer ? 'w-64' : expanded ? 'w-60' : 'w-[52px]';

  return (
    <div className={`sidebar-bg flex flex-col h-full transition-[width] duration-200 ease-out overflow-hidden ${shellWidth}`}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 py-3 border-b border-white/10 min-h-[52px] gap-1">
        {expanded ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 cozinha-blue-bg rounded-lg flex items-center justify-center shrink-0">
                <Factory size={14} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-[13px] leading-tight tracking-wide">COZINCA</div>
                <div className="sidebar-text-muted text-[10px] leading-tight">ERP Industrial</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="sidebar-text-muted hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 shrink-0"
              aria-label="Recolher menu"
            >
              <PanelLeftClose size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full py-0.5">
            <div className="w-7 h-7 cozinha-blue-bg rounded-lg flex items-center justify-center">
              <Factory size={14} className="text-white" />
            </div>
            <button
              type="button"
              onClick={handleExpand}
              className="sidebar-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              aria-label="Expandir menu"
              title="Expandir menu"
            >
              <PanelLeftOpen size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-thumb-white/10">
        {MENU_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter(itemHasVisibleContent);
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className={si > 0 ? 'mt-2 pt-2 border-t border-white/10' : ''}>
              {expanded && section.sectionLabel && (
                <div className="px-4 pb-1 pt-0.5 sidebar-text-muted text-[10px] uppercase font-semibold tracking-widest">
                  {section.sectionLabel}
                </div>
              )}
              {visibleItems.map((item) => (
                <div key={item.path || item.label}>{renderMenuItem(item)}</div>
              ))}
            </div>
          );
        })}

        {renderDynamicSection()}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-2 py-2 shrink-0">
        {expanded ? (
          <div className="sidebar-text-muted text-[10px] px-1">
            v2.6.0 · © Cozinca ERP
          </div>
        ) : (
          <div className="sidebar-text-muted text-[10px] text-center">v2.6</div>
        )}
      </div>
    </div>
  );
}
