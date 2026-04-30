import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { ImpersonationProvider } from '@/contexts/ImpersonationContext'
import { PermissaoProvider } from '@/lib/PermissaoContext'
import PageNotFound from './lib/PageNotFound'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import ERPLayout from '@/components/layout/ERPLayout'
import PermissaoRoute from '@/components/PermissaoRoute'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Clientes from '@/pages/vendas/Clientes'
import Produtos from '@/pages/estoque/Produtos'
import OrdensProducao from '@/pages/producao/OrdensProducao'
import DetalheOP from '@/pages/producao/DetalheOP'
import Empresa from '@/pages/configuracoes/Empresa'
import Usuarios from '@/pages/configuracoes/Usuarios'
import Parametros from '@/pages/configuracoes/Parametros'
import MetadataStudio from '@/pages/configuracoes/MetadataStudio'
import WorkflowBuilder from '@/pages/configuracoes/WorkflowBuilder'
import EntityDynamicPage from '@/pages/dinamico/EntityDynamicPage'

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

        {/* === ROTAS DINÂMICAS (substituem páginas estáticas) === */}
        <Route path="/entidades/:codigo" element={<EntityDynamicPage />} />

        {/* === Módulos legados — manter até migrar completamente === */}
        <Route path="/vendas/clientes" element={<PermissaoRoute acao="ver_clientes"><Clientes /></PermissaoRoute>} />
        <Route path="/estoque/produtos" element={<PermissaoRoute acao="ver_estoque"><Produtos /></PermissaoRoute>} />
        <Route path="/producao/ordens" element={<PermissaoRoute acao="ver_op"><OrdensProducao /></PermissaoRoute>} />
        <Route path="/producao/ordens/:id" element={<PermissaoRoute acao="ver_op"><DetalheOP /></PermissaoRoute>} />

        {/* === Configurações === */}
        <Route path="/configuracoes/empresa" element={<PermissaoRoute acao="editar_config"><Empresa /></PermissaoRoute>} />
        <Route path="/configuracoes/usuarios" element={<PermissaoRoute acao="gerenciar_usuarios"><Usuarios /></PermissaoRoute>} />
        <Route path="/configuracoes/parametros" element={<PermissaoRoute acao="editar_config"><Parametros /></PermissaoRoute>} />
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
    </AuthProvider>
  );
}

export default App;
