import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Truck, Factory,
  DollarSign, ChevronDown, ChevronRight,
  FileText, Boxes, Database
} from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';
import { useMetadataStore } from '@/stores/metadataStore';

const staticMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', alwaysShow: true },
  {
    label: 'Vendas', icon: ShoppingCart, children: [
      { label: 'Pedidos de Venda', path: '/vendas/pedidos', required: 'ver_pedidos' },
      { label: 'Clientes', path: '/vendas/clientes', required: 'ver_clientes' },
    ]
  },
  {
    label: 'Estoque', icon: Boxes, children: [
      { label: 'Produtos', path: '/entidades/produto', required: 'ver_estoque' },
    ]
  },
  {
    label: 'Produção', icon: Factory, children: [
      { label: 'Ordens de Produção', path: '/producao/ordens', required: 'ver_op' },
    ]
  },
  {
    label: 'Financeiro', icon: DollarSign, children: [
      { label: 'Contas a Receber', path: '/financeiro/receber', required: 'ver_financeiro' },
    ]
  },
];

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const location = useLocation();
  const { pode } = usePermissao();
  const { entities, loadEntities } = useMetadataStore();
  const [dynamicEntities, setDynamicEntities] = useState([]);

  // Carrega entidades (apenas customizadas)
  useEffect(() => {
    const load = async () => {
      await loadEntities();
      // Filtra apenas entidades customizadas (não sistema)
      const custom = entities.filter(e => !e.is_system);
      setDynamicEntities(custom);
    };
    load();
  }, []);

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
    if (collapsed || dynamicEntities.length === 0) return null;

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
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 cozinha-blue-bg rounded flex items-center justify-center">
              <Factory size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">COZINHA</div>
              <div className="sidebar-text-muted text-[10px]">ERP Industrial</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 cozinha-blue-bg rounded flex items-center justify-center mx-auto">
            <Factory size={14} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="sidebar-text-muted hover:text-white transition-colors">
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
