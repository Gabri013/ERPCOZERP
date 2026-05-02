import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Truck, Factory,
  DollarSign, ChevronDown, ChevronRight,
  FileText, Boxes, Database, Users, X, Wrench,
} from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';
import { useMetadataStore } from '@/stores/metadataStore';

const staticMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', alwaysShow: true },
  {
    label: 'Vendas', icon: ShoppingCart, children: [
      { label: 'Pedidos de Venda', path: '/vendas/pedidos', required: 'ver_pedidos' },
      { label: 'Clientes', path: '/vendas/clientes', required: 'ver_clientes' },
      { label: 'Orcamentos', path: '/vendas/orcamentos', required: 'ver_pedidos' },
      { label: 'Tabela de Precos', path: '/vendas/tabela-precos', required: 'ver_pedidos' },
      { label: 'Relatorios', path: '/vendas/relatorios', required: 'relatorios:view' },
    ]
  },
  {
    label: 'Compras', icon: Truck, children: [
      { label: 'Fornecedores', path: '/compras/fornecedores', required: 'ver_compras' },
      { label: 'Ordens de Compra', path: '/compras/ordens-compra', required: 'ver_compras' },
      { label: 'Cotacoes', path: '/compras/cotacoes', required: 'ver_compras' },
      { label: 'Recebimentos', path: '/compras/recebimentos', required: 'ver_compras' },
    ]
  },
  {
    label: 'Estoque', icon: Boxes, children: [
      { label: 'Produtos', path: '/estoque/produtos', required: 'ver_estoque' },
      { label: 'Movimentacoes', path: '/estoque/movimentacoes', required: 'ver_estoque' },
      { label: 'Inventario', path: '/estoque/inventario', required: 'ver_estoque' },
      { label: 'Enderecamento', path: '/estoque/enderecamento', required: 'ver_estoque' },
    ]
  },
  {
    label: 'Produção', icon: Factory, children: [
      { label: 'Ordens de Produção', path: '/producao/ordens', required: 'ver_op' },
      { label: 'PCP', path: '/producao/pcp', required: 'ver_pcp' },
      { label: 'Kanban', path: '/producao/kanban', required: 'ver_kanban' },
      { label: 'Chao de Fabrica', path: '/producao/chao-fabrica', required: 'ver_chao_fabrica' },
      { label: 'Roteiros', path: '/producao/roteiros', required: 'ver_roteiros' },
      { label: 'Maquinas', path: '/producao/maquinas', required: 'ver_maquinas' },
    ]
  },
  {
    label: 'Engenharia', icon: Wrench, children: [
      { label: 'BOM e 3D', path: '/engenharia', required: ['ver_roteiros', 'editar_produtos', 'ver_estoque'] },
      { label: 'Pendentes BOM', path: '/engenharia/pendentes-bom', required: 'ver_roteiros' },
    ]
  },
  {
    label: 'CRM', icon: Users, children: [
      { label: 'Leads', path: '/crm/leads', required: 'ver_crm' },
      { label: 'Oportunidades', path: '/crm/oportunidades', required: 'ver_crm' },
      { label: 'Pipeline', path: '/crm/pipeline', required: 'ver_crm' },
      { label: 'Atividades', path: '/crm/atividades', required: 'ver_crm' },
    ]
  },
  {
    label: 'RH', icon: Users, children: [
      { label: 'Funcionarios', path: '/rh/funcionarios', required: 'ver_rh' },
      { label: 'Ponto', path: '/rh/ponto', required: 'ver_rh' },
      { label: 'Folha de Pagamento', path: '/rh/folha-pagamento', required: 'ver_folha' },
      { label: 'Ferias', path: '/rh/ferias', required: 'ver_rh' },
    ]
  },
  {
    label: 'Fiscal', icon: FileText, children: [
      { label: 'NFe', path: '/fiscal/nfe', required: 'ver_fiscal' },
      { label: 'Consulta NFe', path: '/fiscal/nfe-consulta', required: 'ver_fiscal' },
      { label: 'SPED', path: '/fiscal/sped', required: 'ver_fiscal' },
    ]
  },
  {
    label: 'Financeiro', icon: DollarSign, children: [
      { label: 'Contas a Receber', path: '/financeiro/receber', required: 'ver_financeiro' },
      { label: 'Contas a Pagar', path: '/financeiro/pagar', required: 'ver_financeiro' },
      { label: 'Fluxo de Caixa', path: '/financeiro/fluxo-caixa', required: 'ver_financeiro' },
      { label: 'DRE', path: '/financeiro/dre', required: 'ver_financeiro' },
      { label: 'Conciliacao Bancaria', path: '/financeiro/conciliacao-bancaria', required: 'ver_financeiro' },
      { label: 'Relatorio Financeiro', path: '/financeiro/relatorio', required: 'ver_financeiro' },
      { label: 'Aprovacao de Pedidos', path: '/financeiro/aprovacao-pedidos', required: 'aprovar_financeiro' },
    ]
  },
  { label: 'Relatorios', icon: FileText, path: '/relatorios', required: 'relatorios:view' },
  {
    label: 'Configuracoes', icon: Database, children: [
      { label: 'Empresa', path: '/configuracoes/empresa', required: 'editar_config' },
      { label: 'Usuarios', path: '/configuracoes/usuarios', required: 'gerenciar_usuarios' },
      { label: 'Parametros', path: '/configuracoes/parametros', required: 'editar_config' },
      { label: 'Modelo OP', path: '/configuracoes/modelo-op', required: 'editar_config' },
      { label: 'Metadata Studio', path: '/configuracoes/metadata-studio', required: 'editar_config' },
      { label: 'Workflows', path: '/configuracoes/workflows', required: 'editar_config' },
    ]
  },
];

export default function Sidebar({ collapsed, onToggle, onNavigate, mobileDrawer }) {
  const location = useLocation();
  const { pode } = usePermissao();
  const { entities, loadEntities } = useMetadataStore();
  const [dynamicEntities, setDynamicEntities] = useState([]);

  // Carrega entidades (apenas customizadas)
  useEffect(() => {
    const load = async () => {
      // Só faz fetch de /api/entities se o usuário puder ver/gerenciar no-code.
      // Isso evita 403 no network/console para perfis operacionais.
      if (!pode('record.manage') && !pode('entity.manage')) {
        setDynamicEntities([]);
        return;
      }

      await loadEntities();
      // Filtra apenas entidades customizadas (não sistema)
      const custom = (entities || []).filter((e) => !e.is_system);
      setDynamicEntities(custom);
    };
    load();
  }, [pode]);

  const canSee = (item) => {
    if (item.alwaysShow) return true;
    if (!item.required) return true;
    return Array.isArray(item.required) ? item.required.some(pode) : pode(item.required);
  };

  const renderMenuItem = (item, isChild = false) => {
    if (!canSee(item)) return null;

    if (!item.children) {
      const isActive = location.pathname === item.path;
      return (
        <Link
          key={item.path || item.label}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md mx-2 my-0.5 transition-all duration-150 sidebar-text text-sm
            ${isActive ? 'sidebar-active font-medium' : 'sidebar-hover'}`}
        >
          <item.icon size={15} className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      );
    }

    const childrenVisible = item.children.filter(canSee);
    if (childrenVisible.length === 0) return null;

    const hasActiveChild = childrenVisible.some(child => location.pathname.startsWith(child.path));
    
    return (
      <div key={item.label}>
        <button
          onClick={() => {/* toggle interno */}}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md mx-2 my-0.5 transition-all duration-150 sidebar-text text-sm
            ${hasActiveChild ? 'font-medium' : ''} sidebar-hover`}
        >
          <item.icon size={15} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate flex-1 text-left">{item.label}</span>
              <ChevronRight size={13} />
            </>
          )}
        </button>
        {!collapsed && (
          <div className="ml-6 border-l border-white/10 pl-1 mb-1">
            {childrenVisible.map((child) => {
              const childActive = location.pathname === child.path;
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md mx-1 my-0.5 transition-all duration-150 sidebar-text text-xs
                    ${childActive ? 'sidebar-active font-medium' : 'sidebar-hover'}`}
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

  // Seção de entidades dinâmicas
  const renderDynamicSection = () => {
    // Entidades dinâmicas são "no-code" e exigem permissão de CRUD genérica
    if (collapsed || dynamicEntities.length === 0) return null;
    if (!pode('record.manage')) return null;

    return (
      <div className="mt-4 border-t border-white/10 pt-2">
        <div className="px-3 py-1 sidebar-text-muted text-[10px] uppercase font-semibold">
          Entidades Personalizadas
        </div>
        {dynamicEntities.map(ent => {
          const isActive = location.pathname === `/entidades/${ent.code}`;
          const icons = {
            produto: Boxes,
            cliente: ShoppingCart,
            fornecedor: Truck,
            ordem_producao: Factory,
            pedido_venda: FileText,
          };
          const Icon = icons[ent.code] || Database;

          return (
            <Link
              key={ent.id}
              to={`/entidades/${ent.code}`}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md mx-2 my-0.5 transition-all duration-150 sidebar-text text-sm
                ${isActive ? 'sidebar-active font-medium' : 'sidebar-hover'}`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{ent.name}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`sidebar-bg flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-14' : 'w-56'}`}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 gap-2">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 cozinha-blue-bg rounded flex items-center justify-center shrink-0">
              <Factory size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-tight truncate">COZINHA</div>
              <div className="sidebar-text-muted text-[10px]">ERP Industrial</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 cozinha-blue-bg rounded flex items-center justify-center mx-auto">
            <Factory size={14} className="text-white" />
          </div>
        )}
        {mobileDrawer && (
          <button
            type="button"
            onClick={onToggle}
            className="sidebar-text-muted hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 shrink-0"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        )}
        {!mobileDrawer && !collapsed && (
          <button type="button" onClick={onToggle} className="sidebar-text-muted hover:text-white transition-colors shrink-0">
            <ChevronDown size={14} className="rotate-180" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {staticMenuItems.map((item) => (
          <div key={item.path || item.label}>
            {renderMenuItem(item)}
          </div>
        ))}
        {renderDynamicSection()}
      </div>

      <div className="border-t border-white/10 px-3 py-2">
        {!collapsed ? (
          <div className="sidebar-text-muted text-[10px]">v2.6.0 | © Cozinha ERP</div>
        ) : (
          <button onClick={onToggle} className="sidebar-text-muted hover:text-white transition-colors w-full flex justify-center">
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
