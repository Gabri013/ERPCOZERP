import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { RealtimeProvider } from '@/lib/RealtimeContext'
import { ImpersonationProvider } from '@/contexts/ImpersonationContext'
import { PermissaoProvider } from '@/lib/PermissaoContext'
import PageNotFound from './lib/PageNotFound'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import ERPLayout from '@/components/layout/ERPLayout'
import PermissaoRoute from '@/components/PermissaoRoute'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Clientes from '@/pages/vendas/Clientes'
import PedidosVenda from '@/pages/vendas/PedidosVenda'
import Orcamentos from '@/pages/vendas/Orcamentos'
import TabelaPrecos from '@/pages/vendas/TabelaPrecos'
import RelatoriosVendas from '@/pages/vendas/RelatoriosVendas'
import Produtos from '@/pages/estoque/Produtos'
import Movimentacoes from '@/pages/estoque/Movimentacoes'
import Inventario from '@/pages/estoque/Inventario'
import Enderecamento from '@/pages/estoque/Enderecamento'
import OrdensProducao from '@/pages/producao/OrdensProducao'
import DetalheOP from '@/pages/producao/DetalheOP'
import PCP from '@/pages/producao/PCP'
import KanbanProducao from '@/pages/producao/KanbanProducao'
import ChaoDeFabrica from '@/pages/producao/ChaoDeFabrica'
import Roteiros from '@/pages/producao/Roteiros'
import Maquinas from '@/pages/producao/Maquinas'
import Apontamento from '@/pages/producao/Apontamento'
import Pipeline from '@/pages/crm/Pipeline'
import Oportunidades from '@/pages/crm/Oportunidades'
import Leads from '@/pages/crm/Leads'
import Atividades from '@/pages/crm/Atividades'
import Funcionarios from '@/pages/rh/Funcionarios'
import Ponto from '@/pages/rh/Ponto'
import FolhaPagamento from '@/pages/rh/FolhaPagamento'
import Ferias from '@/pages/rh/Ferias'
import Fornecedores from '@/pages/compras/Fornecedores'
import OrdensCompra from '@/pages/compras/OrdensCompra'
import Cotacoes from '@/pages/compras/Cotacoes'
import Recebimentos from '@/pages/compras/Recebimentos'
import NFe from '@/pages/fiscal/NFe'
import NFeConsulta from '@/pages/fiscal/NFeConsulta'
import SPED from '@/pages/fiscal/SPED'
import Empresa from '@/pages/configuracoes/Empresa'
import Usuarios from '@/pages/configuracoes/Usuarios'
import Parametros from '@/pages/configuracoes/Parametros'
import ModeloOP from '@/pages/configuracoes/ModeloOP'
import MetadataStudio from '@/pages/configuracoes/MetadataStudio'
import WorkflowBuilder from '@/pages/configuracoes/WorkflowBuilder'
import EntityDynamicPage from '@/pages/dinamico/EntityDynamicPage'
import ContasReceber from '@/pages/financeiro/ContasReceber'
import ContasPagar from '@/pages/financeiro/ContasPagar'
import FluxoCaixa from '@/pages/financeiro/FluxoCaixa'
import DRE from '@/pages/financeiro/DRE'
import ConciliacaoBancaria from '@/pages/financeiro/ConciliacaoBancaria'
import RelatorioFinanceiro from '@/pages/financeiro/RelatorioFinanceiro'
import AprovacaoPedidos from '@/pages/financeiro/AprovacaoPedidos'
import Relatorios from '@/pages/Relatorios'
import Ajuda from '@/pages/Ajuda'

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<ERPLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ajuda" element={<Ajuda />} />

        {/* === ROTAS DINÂMICAS (substituem páginas estáticas) === */}
        <Route path="/entidades/:codigo" element={<EntityDynamicPage />} />
        <Route path="/relatorios" element={<PermissaoRoute acao="relatorios:view"><Relatorios /></PermissaoRoute>} />

        {/* === Módulos legados — manter até migrar completamente === */}
        <Route path="/vendas/pedidos" element={<PermissaoRoute acao="ver_pedidos"><PedidosVenda /></PermissaoRoute>} />
        <Route path="/vendas/clientes" element={<PermissaoRoute acao="ver_clientes"><Clientes /></PermissaoRoute>} />
        <Route path="/vendas/orcamentos" element={<PermissaoRoute acao="ver_pedidos"><Orcamentos /></PermissaoRoute>} />
        <Route path="/vendas/tabela-precos" element={<PermissaoRoute acao="ver_pedidos"><TabelaPrecos /></PermissaoRoute>} />
        <Route path="/vendas/relatorios" element={<PermissaoRoute acao="relatorios:view"><RelatoriosVendas /></PermissaoRoute>} />
        <Route path="/estoque/produtos" element={<PermissaoRoute acao="ver_estoque"><Produtos /></PermissaoRoute>} />
        <Route path="/estoque/movimentacoes" element={<PermissaoRoute acao="ver_estoque"><Movimentacoes /></PermissaoRoute>} />
        <Route path="/estoque/inventario" element={<PermissaoRoute acao="ver_estoque"><Inventario /></PermissaoRoute>} />
        <Route path="/estoque/enderecamento" element={<PermissaoRoute acao="ver_estoque"><Enderecamento /></PermissaoRoute>} />
        <Route path="/producao/ordens" element={<PermissaoRoute acao="ver_op"><OrdensProducao /></PermissaoRoute>} />
        <Route path="/producao/pcp" element={<PermissaoRoute acao="ver_pcp"><PCP /></PermissaoRoute>} />
        <Route path="/producao/kanban" element={<PermissaoRoute acao="ver_kanban"><KanbanProducao /></PermissaoRoute>} />
        <Route path="/producao/chao-fabrica" element={<PermissaoRoute acao="ver_chao_fabrica"><ChaoDeFabrica /></PermissaoRoute>} />
        <Route path="/producao/roteiros" element={<PermissaoRoute acao="ver_roteiros"><Roteiros /></PermissaoRoute>} />
        <Route path="/producao/maquinas" element={<PermissaoRoute acao="ver_maquinas"><Maquinas /></PermissaoRoute>} />
        <Route path="/producao/ordens/:id" element={<PermissaoRoute acao="ver_op"><DetalheOP /></PermissaoRoute>} />
        <Route path="/producao/apontamento/:opId?" element={<PermissaoRoute acao="apontar"><Apontamento /></PermissaoRoute>} />
        <Route path="/crm/pipeline" element={<PermissaoRoute acao="ver_crm"><Pipeline /></PermissaoRoute>} />
        <Route path="/crm/oportunidades" element={<PermissaoRoute acao="ver_crm"><Oportunidades /></PermissaoRoute>} />
        <Route path="/crm/leads" element={<PermissaoRoute acao="ver_crm"><Leads /></PermissaoRoute>} />
        <Route path="/crm/atividades" element={<PermissaoRoute acao="ver_crm"><Atividades /></PermissaoRoute>} />
        <Route path="/rh/funcionarios" element={<PermissaoRoute acao="ver_rh"><Funcionarios /></PermissaoRoute>} />
        <Route path="/rh/ponto" element={<PermissaoRoute acao="ver_rh"><Ponto /></PermissaoRoute>} />
        <Route path="/rh/folha-pagamento" element={<PermissaoRoute acao="ver_folha"><FolhaPagamento /></PermissaoRoute>} />
        <Route path="/rh/ferias" element={<PermissaoRoute acao="ver_rh"><Ferias /></PermissaoRoute>} />
        <Route path="/compras/fornecedores" element={<PermissaoRoute acao="ver_compras"><Fornecedores /></PermissaoRoute>} />
        <Route path="/compras/ordens-compra" element={<PermissaoRoute acao="ver_compras"><OrdensCompra /></PermissaoRoute>} />
        <Route path="/compras/cotacoes" element={<PermissaoRoute acao="ver_compras"><Cotacoes /></PermissaoRoute>} />
        <Route path="/compras/recebimentos" element={<PermissaoRoute acao="ver_compras"><Recebimentos /></PermissaoRoute>} />
        <Route path="/fiscal/nfe" element={<PermissaoRoute acao="ver_fiscal"><NFe /></PermissaoRoute>} />
        <Route path="/fiscal/nfe-consulta" element={<PermissaoRoute acao="ver_fiscal"><NFeConsulta /></PermissaoRoute>} />
        <Route path="/fiscal/sped" element={<PermissaoRoute acao="ver_fiscal"><SPED /></PermissaoRoute>} />
        <Route path="/financeiro/receber" element={<PermissaoRoute acao="ver_financeiro"><ContasReceber /></PermissaoRoute>} />
        <Route path="/financeiro/pagar" element={<PermissaoRoute acao="ver_financeiro"><ContasPagar /></PermissaoRoute>} />
        <Route path="/financeiro/fluxo-caixa" element={<PermissaoRoute acao="ver_financeiro"><FluxoCaixa /></PermissaoRoute>} />
        <Route path="/financeiro/dre" element={<PermissaoRoute acao="ver_financeiro"><DRE /></PermissaoRoute>} />
        <Route path="/financeiro/conciliacao-bancaria" element={<PermissaoRoute acao="ver_financeiro"><ConciliacaoBancaria /></PermissaoRoute>} />
        <Route path="/financeiro/relatorio" element={<PermissaoRoute acao="ver_financeiro"><RelatorioFinanceiro /></PermissaoRoute>} />
        <Route path="/financeiro/aprovacao-pedidos" element={<PermissaoRoute acao="aprovar_financeiro"><AprovacaoPedidos /></PermissaoRoute>} />

        {/* === Configurações === */}
        <Route path="/configuracoes/empresa" element={<PermissaoRoute acao="editar_config"><Empresa /></PermissaoRoute>} />
        <Route path="/configuracoes/usuarios" element={<PermissaoRoute acao="gerenciar_usuarios"><Usuarios /></PermissaoRoute>} />
        <Route path="/configuracoes/parametros" element={<PermissaoRoute acao="editar_config"><Parametros /></PermissaoRoute>} />
        <Route path="/configuracoes/modelo-op" element={<PermissaoRoute acao="editar_config"><ModeloOP /></PermissaoRoute>} />
        <Route path="/configuracoes/metadata-studio" element={<PermissaoRoute acao="editar_config"><MetadataStudio /></PermissaoRoute>} />
        <Route path="/configuracoes/workflows" element={<PermissaoRoute acao="editar_config"><WorkflowBuilder /></PermissaoRoute>} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <ImpersonationProvider>
          <PermissaoProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthenticatedApp />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </PermissaoProvider>
        </ImpersonationProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
