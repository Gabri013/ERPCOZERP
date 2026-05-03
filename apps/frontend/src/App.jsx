import { Component, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { RealtimeProvider } from '@/lib/RealtimeContext';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import { PermissaoProvider } from '@/lib/PermissaoContext';
import PageNotFound from './lib/PageNotFound';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ERPLayout from '@/components/layout/ERPLayout';
import PermissaoRoute from '@/components/PermissaoRoute';
import RouteFallback from '@/components/common/RouteFallback';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

const Clientes = lazy(() => import('@/pages/vendas/Clientes'));
const PedidosVenda = lazy(() => import('@/pages/vendas/PedidosVenda'));
const Orcamentos = lazy(() => import('@/pages/vendas/Orcamentos'));
const TabelaPrecos = lazy(() => import('@/pages/vendas/TabelaPrecos'));
const RelatoriosVendas = lazy(() => import('@/pages/vendas/RelatoriosVendas'));
const SolicitacoesCotacao = lazy(() => import('@/pages/vendas/SolicitacoesCotacao'));
const ComissoesVendas = lazy(() => import('@/pages/vendas/Comissoes'));
const VendasPropostas = lazy(() => import('@/pages/vendas/QuotesPage'));
const VendasPropostaDetalhe = lazy(() => import('@/pages/vendas/QuoteDetailPage'));
const VendasOportunidades = lazy(() => import('@/pages/vendas/SalesOpportunitiesPage'));
const VendasOportunidadeDetalhe = lazy(() => import('@/pages/vendas/OpportunityDetailPage'));
const PaineisGestao = lazy(() => import('@/pages/dashboard/PaineisGestao'));
const ServicosOrcamentos = lazy(() => import('@/pages/servicos/ServicosOrcamentos'));
const ServicosPropostas = lazy(() => import('@/pages/servicos/ServicosPropostas'));
const ServicosPedidos = lazy(() => import('@/pages/servicos/ServicosPedidos'));
const NfseGestao = lazy(() => import('@/pages/servicos/NfseGestao'));
const ServicosRecorrentes = lazy(() => import('@/pages/servicos/ServicosRecorrentes'));
const TabelaPrecosServicos = lazy(() => import('@/pages/servicos/TabelaPrecosServicos'));
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'));
const ProductForm = lazy(() => import('@/pages/products/ProductForm'));
const StockMovementsPage = lazy(() => import('@/pages/products/StockMovementsPage'));
const InventoryPage = lazy(() => import('@/pages/products/InventoryPage'));
const InventoryCountDetail = lazy(() => import('@/pages/products/InventoryCountDetail'));
const LocationsPage = lazy(() => import('@/pages/products/LocationsPage'));
const OrdensProducao = lazy(() => import('@/pages/producao/OrdensProducao'));
const DetalheOP = lazy(() => import('@/pages/producao/DetalheOP'));
const ListaMateriais = lazy(() => import('@/pages/producao/ListaMateriais'));
const RequisicaoMateriais = lazy(() => import('@/pages/producao/RequisicaoMateriais'));
const ReporteProducao = lazy(() => import('@/pages/producao/ReporteProducao'));
const CusteioPadrao = lazy(() => import('@/pages/producao/CusteioPadrao'));
const CusteioReal = lazy(() => import('@/pages/producao/CusteioReal'));
const Contabilidade = lazy(() => import('@/pages/contabilidade/Contabilidade'));
const IntegracaoContabil = lazy(() => import('@/pages/contabilidade/IntegracaoContabil'));
const ControleQualidade = lazy(() => import('@/pages/qualidade/ControleQualidade'));
const GestaoDocumentos = lazy(() => import('@/pages/qualidade/GestaoDocumentos'));
const Databooks = lazy(() => import('@/pages/qualidade/Databooks'));
const ControleExpedicao = lazy(() => import('@/pages/expedicao/ControleExpedicao'));
const GestaoProjetos = lazy(() => import('@/pages/projetos/GestaoProjetos'));
const CRM = lazy(() => import('@/pages/crm/CRM'));
const BaseConhecimento = lazy(() => import('@/pages/conhecimento/BaseConhecimento'));
const SobreERP = lazy(() => import('@/pages/sobre/SobreERP'));
const ProgramacaoProducao = lazy(() => import('@/pages/producao/ProgramacaoProducao'));
const MonitoramentoTempoReal = lazy(() => import('@/pages/producao/MonitoramentoTempoReal'));
const AnaliseTempos = lazy(() => import('@/pages/producao/AnaliseTempos'));
const ApontamentoParadas = lazy(() => import('@/pages/producao/ApontamentoParadas'));
const PrevisaoVendas = lazy(() => import('@/pages/producao/PrevisaoVendas'));
const PlanoProducao = lazy(() => import('@/pages/producao/PlanoProducao'));
const MRP = lazy(() => import('@/pages/producao/MRP'));
const ProducaoTerceiros = lazy(() => import('@/pages/producao/ProducaoTerceiros'));
const DetalheOPT = lazy(() => import('@/pages/producao/DetalheOPT'));
const ProducaoParaTerceiros = lazy(() => import('@/pages/producao/ProducaoParaTerceiros'));
const DetalhePT = lazy(() => import('@/pages/producao/DetalhePT'));
const PCP = lazy(() => import('@/pages/producao/PCP'));
const KanbanProducao = lazy(() => import('@/pages/producao/KanbanProducao'));
const ChaoDeFabrica = lazy(() => import('@/pages/producao/ChaoDeFabrica'));
const Roteiros = lazy(() => import('@/pages/producao/Roteiros'));
const Maquinas = lazy(() => import('@/pages/producao/Maquinas'));
const Apontamento = lazy(() => import('@/pages/producao/Apontamento'));
const Pipeline = lazy(() => import('@/pages/crm/Pipeline'));
const Oportunidades = lazy(() => import('@/pages/crm/Oportunidades'));
const Leads = lazy(() => import('@/pages/crm/Leads'));
const Atividades = lazy(() => import('@/pages/crm/Atividades'));
const CrmDashboard = lazy(() => import('@/pages/crm/CrmDashboard'));
const CrmInbox = lazy(() => import('@/pages/crm/Inbox'));
const Funcionarios = lazy(() => import('@/pages/rh/Funcionarios'));
const Ponto = lazy(() => import('@/pages/rh/Ponto'));
const FolhaPagamento = lazy(() => import('@/pages/rh/FolhaPagamento'));
const Ferias = lazy(() => import('@/pages/rh/Ferias'));
const Fornecedores = lazy(() => import('@/pages/compras/Fornecedores'));
const OrdensCompra = lazy(() => import('@/pages/compras/OrdensCompra'));
const Cotacoes = lazy(() => import('@/pages/compras/Cotacoes'));
const Recebimentos = lazy(() => import('@/pages/compras/Recebimentos'));
const SolicitacoesCompra = lazy(() => import('@/pages/compras/SolicitacoesCompra'));
const CotacoesCompra = lazy(() => import('@/pages/compras/CotacoesCompra'));
const PedidosCompra = lazy(() => import('@/pages/compras/PedidosCompra'));
const DocumentoEntrada = lazy(() => import('@/pages/compras/DocumentoEntrada'));
const ImportacaoXML = lazy(() => import('@/pages/compras/ImportacaoXML'));
const ManifestacaoNfe = lazy(() => import('@/pages/compras/ManifestacaoNfe'));
const RegrasTributacao = lazy(() => import('@/pages/compras/RegrasTributacao'));
const ImportacaoProcessos = lazy(() => import('@/pages/importacao/ImportacaoProcessos'));
const ImportacaoDI = lazy(() => import('@/pages/importacao/ImportacaoDI'));
const ImportacaoXMLDI = lazy(() => import('@/pages/importacao/ImportacaoXMLDI'));
const NFe = lazy(() => import('@/pages/fiscal/NFe'));
const BlocoK = lazy(() => import('@/pages/fiscal/BlocoK'));
const NFeConsulta = lazy(() => import('@/pages/fiscal/NFeConsulta'));
const SPED = lazy(() => import('@/pages/fiscal/SPED'));
const Empresa = lazy(() => import('@/pages/configuracoes/Empresa'));
const Usuarios = lazy(() => import('@/pages/configuracoes/Usuarios'));
const Parametros = lazy(() => import('@/pages/configuracoes/Parametros'));
const ModeloOP = lazy(() => import('@/pages/configuracoes/ModeloOP'));
const MetadataStudio = lazy(() => import('@/pages/configuracoes/MetadataStudio'));
const WorkflowBuilder = lazy(() => import('@/pages/configuracoes/WorkflowBuilder'));
const FormBuilder = lazy(() => import('@/pages/configuracoes/FormBuilder'));
const FluxoPedido = lazy(() => import('@/pages/configuracoes/FluxoPedido'));
const EntityDynamicPage = lazy(() => import('@/pages/dinamico/EntityDynamicPage'));
const ContasReceber = lazy(() => import('@/pages/financeiro/ContasReceber'));
const ContasPagar = lazy(() => import('@/pages/financeiro/ContasPagar'));
const FluxoCaixa = lazy(() => import('@/pages/financeiro/FluxoCaixa'));
const DRE = lazy(() => import('@/pages/financeiro/DRE'));
const ConciliacaoBancaria = lazy(() => import('@/pages/financeiro/ConciliacaoBancaria'));
const RelatorioFinanceiro = lazy(() => import('@/pages/financeiro/RelatorioFinanceiro'));
const AprovacaoPedidos = lazy(() => import('@/pages/financeiro/AprovacaoPedidos'));
const PainelFinanceiro = lazy(() => import('@/pages/financeiro/PainelFinanceiro'));
const BoletoBancario = lazy(() => import('@/pages/financeiro/BoletoBancario'));
const TransferenciasBancarias = lazy(() => import('@/pages/financeiro/TransferenciasBancarias'));
const ReguaCobranca = lazy(() => import('@/pages/financeiro/ReguaCobranca'));
const CRMFinanceiro = lazy(() => import('@/pages/financeiro/CRMFinanceiro'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Ajuda = lazy(() => import('@/pages/Ajuda'));
const Engenharia = lazy(() => import('@/pages/engenharia/Engenharia'));
const PendentesBom = lazy(() => import('@/pages/engenharia/PendentesBom'));
const ProjetosEngenharia = lazy(() => import('@/pages/engenharia/ProjetosEngenharia'));
const ProdutoDetalhe = lazy(() => import('@/pages/estoque/ProdutoDetalhe'));
const EstoqueProjetado = lazy(() => import('@/pages/estoque/EstoqueProjetado'));
const LotesESeries = lazy(() => import('@/pages/estoque/LotesESeries'));
const RequisicaoConsumo = lazy(() => import('@/pages/estoque/RequisicaoConsumo'));
const TransferenciasEstoque = lazy(() => import('@/pages/estoque/TransferenciasEstoque'));

class AppRouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[AppRouteErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center">
          <p className="text-sm font-medium">Ocorreu um erro ao exibir esta tela.</p>
          <p className="text-xs text-muted-foreground max-w-sm">Tente o início, o login ou recarregar a página.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <a className="underline text-primary" href="/">Início</a>
            <a className="underline text-primary" href="/login">Login</a>
            <button type="button" className="underline text-primary" onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
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
    if (authError.type === 'auth_required') {
      if (location.pathname !== '/login') {
        return <Navigate to="/login" replace />;
      }
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<ERPLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ajuda" element={<Ajuda />} />

          <Route path="/entidades/:codigo" element={<EntityDynamicPage />} />
          <Route path="/relatorios" element={<PermissaoRoute acao="relatorios:view"><Relatorios /></PermissaoRoute>} />

          <Route path="/vendas/pedidos" element={<PermissaoRoute acao="ver_pedidos"><PedidosVenda /></PermissaoRoute>} />
          <Route path="/vendas/clientes" element={<PermissaoRoute acao="ver_clientes"><Clientes /></PermissaoRoute>} />
          <Route path="/vendas/orcamentos" element={<PermissaoRoute acao="ver_pedidos"><Orcamentos /></PermissaoRoute>} />
          <Route path="/vendas/propostas" element={<PermissaoRoute acao="ver_pedidos"><VendasPropostas /></PermissaoRoute>} />
          <Route path="/vendas/propostas/:id" element={<PermissaoRoute acao="ver_pedidos"><VendasPropostaDetalhe /></PermissaoRoute>} />
          <Route path="/vendas/oportunidades" element={<PermissaoRoute acao="ver_pedidos"><VendasOportunidades /></PermissaoRoute>} />
          <Route path="/vendas/oportunidades/:id" element={<PermissaoRoute acao="ver_pedidos"><VendasOportunidadeDetalhe /></PermissaoRoute>} />
          <Route path="/vendas/tabela-precos" element={<PermissaoRoute acao="ver_pedidos"><TabelaPrecos /></PermissaoRoute>} />
          <Route path="/vendas/relatorios" element={<PermissaoRoute acao="relatorios:view"><RelatoriosVendas /></PermissaoRoute>} />
          <Route path="/vendas/solicitacoes-cotacao" element={<PermissaoRoute acao="ver_pedidos"><SolicitacoesCotacao /></PermissaoRoute>} />
          <Route path="/vendas/comissoes" element={<PermissaoRoute acao="ver_pedidos"><ComissoesVendas /></PermissaoRoute>} />
          <Route path="/paineis-gestao" element={<PermissaoRoute acao="relatorios:view"><PaineisGestao /></PermissaoRoute>} />
          <Route path="/servicos/solicitacoes" element={<PermissaoRoute acao="ver_servicos"><ServicosOrcamentos /></PermissaoRoute>} />
          <Route path="/servicos/propostas" element={<PermissaoRoute acao="ver_servicos"><ServicosPropostas /></PermissaoRoute>} />
          <Route path="/servicos/pedidos" element={<PermissaoRoute acao="ver_servicos"><ServicosPedidos /></PermissaoRoute>} />
          <Route path="/servicos/nfse" element={<PermissaoRoute acao="ver_servicos"><NfseGestao /></PermissaoRoute>} />
          <Route path="/servicos/recorrentes" element={<PermissaoRoute acao="ver_servicos"><ServicosRecorrentes /></PermissaoRoute>} />
          <Route path="/servicos/tabela-precos" element={<PermissaoRoute acao="ver_servicos"><TabelaPrecosServicos /></PermissaoRoute>} />
          <Route
            path="/estoque/produtos/bom/:id"
            element={(
              <PermissaoRoute acao="ver_estoque">
                <ProdutoDetalhe />
              </PermissaoRoute>
            )}
          />
          <Route path="/estoque/produtos/novo" element={<PermissaoRoute anyOf={['produto.create', 'editar_produtos']}><ProductForm /></PermissaoRoute>} />
          <Route path="/estoque/produtos/:id" element={<PermissaoRoute anyOf={['ver_estoque', 'produto.view', 'produto.update']}><ProductForm /></PermissaoRoute>} />
          <Route path="/estoque/produtos" element={<PermissaoRoute anyOf={['ver_estoque', 'produto.view']}><ProductsPage /></PermissaoRoute>} />
          <Route path="/estoque/movimentacoes" element={<PermissaoRoute acao="ver_estoque"><StockMovementsPage /></PermissaoRoute>} />
          <Route path="/estoque/inventario" element={<PermissaoRoute acao="ver_estoque"><InventoryPage /></PermissaoRoute>} />
          <Route path="/estoque/inventario/:id" element={<PermissaoRoute acao="ver_estoque"><InventoryCountDetail /></PermissaoRoute>} />
          <Route path="/estoque/enderecamento" element={<PermissaoRoute acao="ver_estoque"><LocationsPage /></PermissaoRoute>} />
          <Route path="/estoque/projetado" element={<PermissaoRoute acao="ver_estoque"><EstoqueProjetado /></PermissaoRoute>} />
          <Route path="/estoque/lotes-series" element={<PermissaoRoute acao="ver_estoque"><LotesESeries /></PermissaoRoute>} />
          <Route path="/estoque/requisicao-consumo" element={<PermissaoRoute acao="ver_estoque"><RequisicaoConsumo /></PermissaoRoute>} />
          <Route path="/estoque/transferencias" element={<PermissaoRoute acao="ver_estoque"><TransferenciasEstoque /></PermissaoRoute>} />
          <Route path="/producao/ordens" element={<PermissaoRoute acao="ver_op"><OrdensProducao /></PermissaoRoute>} />
          <Route path="/producao/pcp" element={<PermissaoRoute acao="ver_pcp"><PCP /></PermissaoRoute>} />
          <Route path="/producao/custeio-padrao" element={<PermissaoRoute acao="ver_pcp"><CusteioPadrao /></PermissaoRoute>} />
          <Route path="/producao/custeio-real" element={<PermissaoRoute acao="ver_pcp"><CusteioReal /></PermissaoRoute>} />
          <Route path="/producao/programacao" element={<PermissaoRoute acao="ver_pcp"><ProgramacaoProducao /></PermissaoRoute>} />
          <Route path="/producao/monitoramento" element={<PermissaoRoute acao="ver_chao_fabrica"><MonitoramentoTempoReal /></PermissaoRoute>} />
          <Route path="/producao/analise-tempos" element={<PermissaoRoute acao="ver_chao_fabrica"><AnaliseTempos /></PermissaoRoute>} />
          <Route path="/producao/paradas" element={<PermissaoRoute acao="apontar"><ApontamentoParadas /></PermissaoRoute>} />
          <Route path="/producao/previsao-vendas" element={<PermissaoRoute acao="ver_pcp"><PrevisaoVendas /></PermissaoRoute>} />
          <Route path="/producao/plano-producao" element={<PermissaoRoute acao="ver_pcp"><PlanoProducao /></PermissaoRoute>} />
          <Route path="/producao/mrp" element={<PermissaoRoute acao="ver_pcp"><MRP /></PermissaoRoute>} />
          <Route path="/producao/kanban" element={<PermissaoRoute acao="ver_kanban"><KanbanProducao /></PermissaoRoute>} />
          <Route path="/producao/chao-fabrica" element={<PermissaoRoute acao="ver_chao_fabrica"><ChaoDeFabrica /></PermissaoRoute>} />
          <Route path="/producao/roteiros" element={<PermissaoRoute acao="ver_roteiros"><Roteiros /></PermissaoRoute>} />
          <Route
            path="/engenharia"
            element={(
              <PermissaoRoute anyOf={['ver_roteiros', 'editar_produtos', 'ver_estoque']}>
                <Engenharia />
              </PermissaoRoute>
            )}
          />
          <Route path="/engenharia/pendentes-bom" element={<PermissaoRoute acao="ver_roteiros"><PendentesBom /></PermissaoRoute>} />
          <Route
            path="/engenharia/projetos"
            element={(
              <PermissaoRoute anyOf={['ver_roteiros', 'editar_produtos', 'ver_estoque']}>
                <ProjetosEngenharia />
              </PermissaoRoute>
            )}
          />
          <Route path="/producao/maquinas" element={<PermissaoRoute acao="ver_maquinas"><Maquinas /></PermissaoRoute>} />
          <Route path="/producao/ordens/:id" element={<PermissaoRoute acao="ver_op"><DetalheOP /></PermissaoRoute>} />
          <Route path="/producao/apontamento/:opId?" element={<PermissaoRoute acao="apontar"><Apontamento /></PermissaoRoute>} />
          <Route path="/producao/lista-materiais" element={<PermissaoRoute acao="ver_op"><ListaMateriais /></PermissaoRoute>} />
          <Route path="/producao/requisicao" element={<PermissaoRoute acao="ver_op"><RequisicaoMateriais /></PermissaoRoute>} />
          <Route path="/producao/reporte" element={<PermissaoRoute acao="ver_op"><ReporteProducao /></PermissaoRoute>} />
          <Route path="/producao/terceiros" element={<PermissaoRoute acao="ver_op"><ProducaoTerceiros /></PermissaoRoute>} />
          <Route path="/producao/terceiros/:id" element={<PermissaoRoute acao="ver_op"><DetalheOPT /></PermissaoRoute>} />
          <Route path="/producao/para-terceiros" element={<PermissaoRoute acao="ver_op"><ProducaoParaTerceiros /></PermissaoRoute>} />
          <Route path="/producao/para-terceiros/:id" element={<PermissaoRoute acao="ver_op"><DetalhePT /></PermissaoRoute>} />
          <Route path="/crm/pipeline" element={<PermissaoRoute acao="ver_crm"><Pipeline /></PermissaoRoute>} />
          <Route path="/crm/oportunidades" element={<PermissaoRoute acao="ver_crm"><Oportunidades /></PermissaoRoute>} />
          <Route path="/crm/leads" element={<PermissaoRoute acao="ver_crm"><Leads /></PermissaoRoute>} />
          <Route path="/crm/atividades" element={<PermissaoRoute acao="ver_crm"><Atividades /></PermissaoRoute>} />
          <Route path="/crm/dashboard" element={<PermissaoRoute acao="ver_crm"><CrmDashboard /></PermissaoRoute>} />
          <Route path="/crm/inbox" element={<PermissaoRoute acao="ver_crm"><CrmInbox /></PermissaoRoute>} />
          <Route path="/rh/funcionarios" element={<PermissaoRoute acao="ver_rh"><Funcionarios /></PermissaoRoute>} />
          <Route path="/rh/ponto" element={<PermissaoRoute acao="ver_rh"><Ponto /></PermissaoRoute>} />
          <Route path="/rh/folha-pagamento" element={<PermissaoRoute acao="ver_folha"><FolhaPagamento /></PermissaoRoute>} />
          <Route path="/rh/ferias" element={<PermissaoRoute acao="ver_rh"><Ferias /></PermissaoRoute>} />
          <Route path="/compras/fornecedores" element={<PermissaoRoute acao="ver_compras"><Fornecedores /></PermissaoRoute>} />
          <Route path="/compras/ordens-compra" element={<PermissaoRoute acao="ver_compras"><OrdensCompra /></PermissaoRoute>} />
          <Route path="/compras/cotacoes" element={<PermissaoRoute acao="ver_compras"><Cotacoes /></PermissaoRoute>} />
          <Route path="/compras/recebimentos" element={<PermissaoRoute acao="ver_compras"><Recebimentos /></PermissaoRoute>} />
          <Route path="/compras/solicitacoes" element={<PermissaoRoute acao="ver_compras"><SolicitacoesCompra /></PermissaoRoute>} />
          <Route path="/compras/cotacoes-compra" element={<PermissaoRoute acao="ver_compras"><CotacoesCompra /></PermissaoRoute>} />
          <Route path="/compras/pedidos" element={<PermissaoRoute acao="ver_compras"><PedidosCompra /></PermissaoRoute>} />
          <Route path="/compras/documento-entrada" element={<PermissaoRoute acao="ver_compras"><DocumentoEntrada /></PermissaoRoute>} />
          <Route path="/compras/importacao-xml" element={<PermissaoRoute acao="ver_compras"><ImportacaoXML /></PermissaoRoute>} />
          <Route path="/compras/manifestacao-nfe" element={<PermissaoRoute acao="ver_compras"><ManifestacaoNfe /></PermissaoRoute>} />
          <Route path="/compras/regras-tributacao" element={<PermissaoRoute acao="ver_compras"><RegrasTributacao /></PermissaoRoute>} />
          {/* Importação de Produtos */}
          <Route path="/importacao" element={<PermissaoRoute acao="ver_compras"><ImportacaoProcessos /></PermissaoRoute>} />
          <Route path="/importacao/di/:id" element={<PermissaoRoute acao="ver_compras"><ImportacaoDI /></PermissaoRoute>} />
          <Route path="/importacao/xml-di" element={<PermissaoRoute acao="ver_compras"><ImportacaoXMLDI /></PermissaoRoute>} />
          <Route path="/fiscal/nfe" element={<PermissaoRoute acao="ver_fiscal"><NFe /></PermissaoRoute>} />
          <Route path="/fiscal/nfe-consulta" element={<PermissaoRoute acao="ver_fiscal"><NFeConsulta /></PermissaoRoute>} />
          <Route path="/fiscal/sped" element={<PermissaoRoute acao="ver_fiscal"><SPED /></PermissaoRoute>} />
          <Route path="/fiscal/bloco-k" element={<PermissaoRoute acao="ver_fiscal"><BlocoK /></PermissaoRoute>} />
          <Route path="/financeiro/receber" element={<PermissaoRoute acao="ver_financeiro"><ContasReceber /></PermissaoRoute>} />
          <Route path="/financeiro/pagar" element={<PermissaoRoute acao="ver_financeiro"><ContasPagar /></PermissaoRoute>} />
          <Route path="/financeiro/fluxo-caixa" element={<PermissaoRoute acao="ver_financeiro"><FluxoCaixa /></PermissaoRoute>} />
          <Route path="/financeiro/dre" element={<PermissaoRoute acao="ver_financeiro"><DRE /></PermissaoRoute>} />
          <Route path="/financeiro/conciliacao-bancaria" element={<PermissaoRoute acao="ver_financeiro"><ConciliacaoBancaria /></PermissaoRoute>} />
          <Route path="/financeiro/relatorio" element={<PermissaoRoute acao="ver_financeiro"><RelatorioFinanceiro /></PermissaoRoute>} />
          <Route path="/financeiro/aprovacao-pedidos" element={<PermissaoRoute acao="aprovar_financeiro"><AprovacaoPedidos /></PermissaoRoute>} />
          <Route path="/financeiro/painel" element={<PermissaoRoute acao="ver_financeiro"><PainelFinanceiro /></PermissaoRoute>} />
          <Route path="/financeiro/boletos" element={<PermissaoRoute acao="ver_financeiro"><BoletoBancario /></PermissaoRoute>} />
          <Route path="/financeiro/transferencias" element={<PermissaoRoute acao="ver_financeiro"><TransferenciasBancarias /></PermissaoRoute>} />
          <Route path="/financeiro/regua-cobranca" element={<PermissaoRoute acao="ver_financeiro"><ReguaCobranca /></PermissaoRoute>} />
          <Route path="/financeiro/crm" element={<PermissaoRoute acao="ver_financeiro"><CRMFinanceiro /></PermissaoRoute>} />
          <Route path="/contabilidade" element={<PermissaoRoute acao="ver_financeiro"><Contabilidade /></PermissaoRoute>} />
          <Route path="/contabilidade/integracao" element={<PermissaoRoute acao="ver_financeiro"><IntegracaoContabil /></PermissaoRoute>} />
          <Route path="/qualidade" element={<PermissaoRoute acao="ver_producao"><ControleQualidade /></PermissaoRoute>} />
          <Route path="/qualidade/documentos" element={<PermissaoRoute acao="ver_producao"><GestaoDocumentos /></PermissaoRoute>} />
          <Route path="/qualidade/databooks" element={<PermissaoRoute acao="ver_producao"><Databooks /></PermissaoRoute>} />
          <Route path="/expedicao" element={<PermissaoRoute acao="ver_vendas"><ControleExpedicao /></PermissaoRoute>} />
          <Route path="/projetos" element={<PermissaoRoute acao="ver_vendas"><GestaoProjetos /></PermissaoRoute>} />
          <Route path="/crm" element={<PermissaoRoute acao="ver_vendas"><CRM /></PermissaoRoute>} />
          <Route path="/conhecimento" element={<PermissaoRoute acao="ver_vendas"><BaseConhecimento /></PermissaoRoute>} />
          <Route path="/sobre" element={<SobreERP />} />

          <Route path="/configuracoes/empresa" element={<PermissaoRoute acao="editar_config"><Empresa /></PermissaoRoute>} />
          <Route path="/configuracoes/usuarios" element={<PermissaoRoute acao="gerenciar_usuarios"><Usuarios /></PermissaoRoute>} />
          <Route path="/configuracoes/parametros" element={<PermissaoRoute acao="editar_config"><Parametros /></PermissaoRoute>} />
          <Route path="/configuracoes/modelo-op" element={<PermissaoRoute acao="editar_config"><ModeloOP /></PermissaoRoute>} />
          <Route path="/configuracoes/metadata-studio" element={<PermissaoRoute acao="editar_config"><MetadataStudio /></PermissaoRoute>} />
          <Route path="/configuracoes/form-builder" element={<PermissaoRoute acao="editar_config"><FormBuilder /></PermissaoRoute>} />
          <Route path="/configuracoes/workflows" element={<PermissaoRoute acao="editar_config"><WorkflowBuilder /></PermissaoRoute>} />
          <Route path="/configuracoes/fluxo-pedido" element={<FluxoPedido />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <ImpersonationProvider>
          <PermissaoProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
                <AppRouteErrorBoundary>
                  <AuthenticatedApp />
                </AppRouteErrorBoundary>
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
