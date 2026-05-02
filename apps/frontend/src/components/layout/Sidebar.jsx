import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Truck, Factory,
  DollarSign, ChevronRight,
  FileText, Boxes, Database, Users, X, Wrench,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';
import { useMetadataStore } from '@/stores/metadataStore';

/**
 * Entidades que já têm itens fixos no menu — não repetir em "Entidades Personalizadas".
 * Adicione aqui o `code` de qualquer entity que tenha rota própria.
 */
const MENU_BLACKLIST = new Set([
  'apontamento_producao',
  'cliente',
  'compras_recebimento',
  'conta_pagar',
  'conta_receber',
  'cotacao_compra',
  'crm_atividade',
  'crm_lead',
  'crm_oportunidade',
  'dashboard_layout',
  'estoque_inventario',
  'fiscal_nfe',
  'fornecedor',
  'funcionario',
  'historico_op',
  'machine',
  'movimentacao_estoque',
  'orcamento',
  'ordem_compra',
  'ordem_producao',
  'pedido_venda',
  'producao_maquina',
  'produto',
  'rh_ferias',
  'rh_folha_pagamento',
  'rh_funcionario',
  'rh_ponto',
  'roteiro',
  'tabela_preco',
  'workflow',
  // códigos Prisma-style que o seed pode criar
  'product',
  'customer',
  'supplier',
  'purchase_order',
  'sale_order',
  'work_order',
  'stock_movement',
  'inventory_count',
  'location',
  'employee',
  'time_entry',
  'leave_request',
  'payroll_run',
  'fiscal_nfe_record',
]);

const staticMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', alwaysShow: true },
  {
    label: 'Vendas', icon: ShoppingCart, children: [
      { label: 'Pedidos de Venda', path: '/vendas/pedidos', required: 'ver_pedidos' },
      { label: 'Clientes', path: '/vendas/clientes', required: 'ver_clientes' },
      { label: 'Orçamentos', path: '/vendas/orcamentos', required: 'ver_pedidos' },
      { label: 'Tabela de Preços', path: '/vendas/tabela-precos', required: 'ver_pedidos' },
      { label: 'Relatórios', path: '/vendas/relatorios', required: 'relatorios:view' },
    ],
  },
  {
    label: 'Compras', icon: Truck, children: [
      { label: 'Fornecedores', path: '/compras/fornecedores', required: 'ver_compras' },
      { label: 'Ordens de Compra', path: '/compras/ordens-compra', required: 'ver_compras' },
      { label: 'Cotações', path: '/compras/cotacoes', required: 'ver_compras' },
      { label: 'Recebimentos', path: '/compras/recebimentos', required: 'ver_compras' },
    ],
  },
  {
    label: 'Estoque', icon: Boxes, children: [
      { label: 'Produtos', path: '/estoque/produtos', required: 'ver_estoque' },
      { label: 'Movimentações', path: '/estoque/movimentacoes', required: 'ver_estoque' },
      { label: 'Inventário', path: '/estoque/inventario', required: 'ver_estoque' },
      { label: 'Endereçamento', path: '/estoque/enderecamento', required: 'ver_estoque' },
    ],
  },
  {
    label: 'Produção', icon: Factory, children: [
      { label: 'Ordens de Produção', path: '/producao/ordens', required: 'ver_op' },
      { label: 'PCP', path: '/producao/pcp', required: 'ver_pcp' },
      { label: 'Kanban', path: '/producao/kanban', required: 'ver_kanban' },
      { label: 'Chão de Fábrica', path: '/producao/chao-fabrica', required: 'ver_chao_fabrica' },
      { label: 'Roteiros', path: '/producao/roteiros', required: 'ver_roteiros' },
      { label: 'Máquinas', path: '/producao/maquinas', required: 'ver_maquinas' },
      { label: 'Apontamento', path: '/producao/apontamento', required: 'apontar' },
    ],
  },
  {
    label: 'Engenharia', icon: Wrench, children: [
      { label: 'Projetos', path: '/engenharia/projetos', required: ['ver_roteiros', 'editar_produtos', 'ver_estoque'] },
      { label: 'BOM e 3D', path: '/engenharia', required: ['ver_roteiros', 'editar_produtos', 'ver_estoque'] },
      { label: 'Pendentes BOM', path: '/engenharia/pendentes-bom', required: 'ver_roteiros' },
    ],
  },
  {
    label: 'CRM', icon: Users, children: [
      { label: 'Dashboard', path: '/crm/dashboard', required: 'ver_crm' },
      { label: 'Leads', path: '/crm/leads', required: 'ver_crm' },
      { label: 'Oportunidades', path: '/crm/oportunidades', required: 'ver_crm' },
      { label: 'Pipeline', path: '/crm/pipeline', required: 'ver_crm' },
      { label: 'Atividades', path: '/crm/atividades', required: 'ver_crm' },
    ],
  },
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
    ],
  },
  {
    label: 'Financeiro', icon: DollarSign, children: [
      { label: 'Contas a Receber', path: '/financeiro/receber', required: 'ver_financeiro' },
      { label: 'Contas a Pagar', path: '/financeiro/pagar', required: 'ver_financeiro' },
      { label: 'Fluxo de Caixa', path: '/financeiro/fluxo-caixa', required: 'ver_financeiro' },
      { label: 'DRE', path: '/financeiro/dre', required: 'ver_financeiro' },
      { label: 'Conciliação Bancária', path: '/financeiro/conciliacao-bancaria', required: 'ver_financeiro' },
      { label: 'Relatório Financeiro', path: '/financeiro/relatorio', required: 'ver_financeiro' },
      { label: 'Aprovação de Pedidos', path: '/financeiro/aprovacao-pedidos', required: 'aprovar_financeiro' },
    ],
  },
  { label: 'Relatórios', icon: FileText, path: '/relatorios', required: 'relatorios:view' },
  {
    label: 'Configurações', icon: Database, children: [
      { label: 'Empresa', path: '/configuracoes/empresa', required: 'editar_config' },
      { label: 'Usuários', path: '/configuracoes/usuarios', required: 'gerenciar_usuarios' },
      { label: 'Parâmetros', path: '/configuracoes/parametros', required: 'editar_config' },
      { label: 'Modelo OP', path: '/configuracoes/modelo-op', required: 'editar_config' },
      { label: 'Metadata Studio', path: '/configuracoes/metadata-studio', required: 'editar_config' },
      { label: 'Workflows', path: '/configuracoes/workflows', required: 'editar_config' },
    ],
  },
];

export default function Sidebar({ isOpen, setIsOpen, onNavigate, mobileDrawer = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { pode } = usePermissao();
  const loadEntities = useMetadataStore((s) => s.loadEntities);
  const [dynamicEntities, setDynamicEntities] = useState([]);

  // No mobile drawer, sidebar is always fully expanded
  const expanded = mobileDrawer ? true : isOpen;

  // Load custom (non-blacklisted, non-system) entities for "Entidades Personalizadas"
  const loadCustomEntities = useCallback(async () => {
    const canSeeEntities = pode('record.manage') || pode('entity.manage') || pode('record.view');
    if (!canSeeEntities) {
      setDynamicEntities([]);
      return;
    }
    try {
      await loadEntities();
      const list = useMetadataStore.getState().entities || [];
      const custom = list.filter((e) => {
        // Skip system-flagged entities
        if (e.is_system) return false;
        // Skip entities in the static menu blacklist
        if (MENU_BLACKLIST.has(e.code)) return false;
        // Only show if explicitly marked showInMenu=true (or field doesn't exist — legacy behaviour)
        if (e.showInMenu === false) return false;
        return true;
      });
      setDynamicEntities(custom);
    } catch {
      setDynamicEntities([]);
    }
  }, [pode, loadEntities]);

  useEffect(() => {
    loadCustomEntities();
  }, [loadCustomEntities]);

  // ─── Permission helper ────────────────────────────────────────────────────
  const canSee = (item) => {
    if (item.alwaysShow) return true;
    if (!item.required) return true;
    return Array.isArray(item.required)
      ? item.required.some(pode)
      : pode(item.required);
  };

  // ─── CSS helpers ─────────────────────────────────────────────────────────
  const linkCls = (active, extra = '') =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md mx-2 my-0.5 transition-colors duration-150 sidebar-text text-sm ${extra} ${
      active ? 'sidebar-active font-medium' : 'sidebar-hover'
    }`;

  // ─── Close / expand handlers ──────────────────────────────────────────────
  const handleClose = () => setIsOpen(false);
  const handleExpand = () => setIsOpen(true);

  // ─── Render a single nav item or group ───────────────────────────────────
  const renderMenuItem = (item) => {
    if (!canSee(item)) return null;

    // Leaf node — direct link
    if (!item.children) {
      const active = location.pathname === item.path;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          title={!expanded ? item.label : undefined}
          className={linkCls(active, expanded ? '' : 'justify-center px-0')}
        >
          <item.icon size={15} className="shrink-0" />
          <span className={expanded ? 'truncate' : 'sr-only'}>{item.label}</span>
        </Link>
      );
    }

    // Group node
    const visibleChildren = item.children.filter(canSee);
    if (visibleChildren.length === 0) return null;

    const hasActive = visibleChildren.some((c) => location.pathname.startsWith(c.path));
    const firstPath = visibleChildren[0].path;

    // Collapsed — show only icon, clicking navigates to first child
    if (!expanded) {
      return (
        <Link
          key={item.label}
          to={firstPath}
          onClick={onNavigate}
          title={item.label}
          className={linkCls(hasActive, 'justify-center px-0')}
        >
          <item.icon size={15} className="shrink-0" />
          <span className="sr-only">{item.label}</span>
        </Link>
      );
    }

    // Expanded — show group header + children
    return (
      <div key={item.label}>
        {/* Group header — keyboard-accessible, navigates to first child */}
        <div
          role="button"
          tabIndex={0}
          title={item.label}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md mx-2 my-0.5 transition-colors duration-150 sidebar-text text-sm cursor-default sidebar-hover${hasActive ? ' font-medium' : ''}`}
          onClick={() => { navigate(firstPath); onNavigate?.(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(firstPath);
              onNavigate?.();
            }
          }}
        >
          <item.icon size={15} className="shrink-0" />
          <span className="truncate flex-1 text-left">{item.label}</span>
          <ChevronRight size={13} className="opacity-60 shrink-0" aria-hidden />
        </div>
        {/* Children */}
        <div className="ml-6 border-l border-white/10 pl-1 mb-1">
          {visibleChildren.map((child) => {
            const active = location.pathname === child.path;
            return (
              <Link
                key={child.path}
                to={child.path}
                onClick={onNavigate}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md mx-1 my-0.5 transition-colors duration-150 sidebar-text text-xs ${
                  active ? 'sidebar-active font-medium' : 'sidebar-hover'
                }`}
              >
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── "Entidades Personalizadas" section ───────────────────────────────────
  const renderDynamicSection = () => {
    if (dynamicEntities.length === 0) return null;

    return (
      <div className="mt-4 border-t border-white/10 pt-2">
        {expanded && (
          <div className="px-3 py-1 sidebar-text-muted text-[10px] uppercase font-semibold tracking-wide">
            Entidades Personalizadas
          </div>
        )}
        {dynamicEntities.map((ent) => {
          const active = location.pathname === `/entidades/${ent.code}`;
          return (
            <Link
              key={ent.id}
              to={`/entidades/${ent.code}`}
              onClick={onNavigate}
              title={!expanded ? ent.name : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md mx-2 my-0.5 transition-colors duration-150 sidebar-text text-sm ${
                expanded ? '' : 'justify-center px-0'
              } ${active ? 'sidebar-active font-medium' : 'sidebar-hover'}`}
            >
              <Database size={15} className="shrink-0" />
              <span className={expanded ? 'truncate' : 'sr-only'}>{ent.name}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  // ─── Shell width ──────────────────────────────────────────────────────────
  const shellWidth = mobileDrawer ? 'w-64' : expanded ? 'w-64' : 'w-14';

  return (
    <div
      className={`sidebar-bg flex flex-col h-full transition-[width] duration-300 ease-out overflow-hidden ${shellWidth}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-2 py-3 border-b border-white/10 gap-1 min-h-[52px]">
        {expanded ? (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className="w-7 h-7 cozinha-blue-bg rounded flex items-center justify-center shrink-0">
                <Factory size={14} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-sm leading-tight truncate">COZINHA</div>
                <div className="sidebar-text-muted text-[10px]">ERP Industrial</div>
              </div>
            </div>

            {/* Close button — collapses sidebar or closes mobile drawer */}
            <button
              type="button"
              onClick={handleClose}
              className="sidebar-text-muted hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 shrink-0"
              aria-label={mobileDrawer ? 'Fechar menu' : 'Recolher menu lateral'}
              title={mobileDrawer ? 'Fechar menu' : 'Recolher menu lateral'}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          /* Collapsed header — logo icon + expand button stacked */
          <div className="flex flex-col items-center gap-2 w-full py-0.5">
            <div className="w-7 h-7 cozinha-blue-bg rounded flex items-center justify-center">
              <Factory size={14} className="text-white" />
            </div>
            <button
              type="button"
              onClick={handleExpand}
              className="sidebar-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              aria-label="Expandir menu lateral"
              title="Expandir menu lateral"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-thumb-white/10">
        {staticMenuItems.map((item) => (
          <div key={item.path || item.label}>{renderMenuItem(item)}</div>
        ))}
        {renderDynamicSection()}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-white/10 px-2 py-2 shrink-0">
        {expanded ? (
          <div className="sidebar-text-muted text-[10px] px-1 flex items-center justify-between">
            <span>v2.6.0 · © Cozinha ERP</span>
            <button
              type="button"
              onClick={handleClose}
              title="Recolher menu"
              className="sidebar-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            >
              <PanelLeftClose size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleExpand}
            className="sidebar-text-muted hover:text-white transition-colors w-full flex justify-center p-2 rounded-md hover:bg-white/10"
            aria-label="Expandir menu lateral"
            title="Expandir menu lateral"
          >
            <PanelLeftOpen size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
