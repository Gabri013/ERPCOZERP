import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, BookOpen, ShoppingCart, DollarSign, Package, Factory,
  BarChart2, Globe, Truck, FolderKanban, Users, ClipboardCheck,
  FileText, Boxes, Settings, ChevronRight, CheckCircle, Star,
  Play, Code2, Puzzle, TrendingUp, Shield, Clock, Wrench,
  PhoneCall, ArrowRight, ExternalLink, ChevronDown,
} from 'lucide-react';

const MODULOS = [
  {
    id: 'paineis',        icone: '📊', icon: BarChart2,     cor: 'from-purple-500 to-purple-700',   bg: 'bg-purple-50 border-purple-200',  txt: 'text-purple-700',
    titulo: 'Painéis de Gestão',          subtitulo: 'Dashboards',
    rota: '/dashboard',
    descricao: 'Dashboards interativos com KPIs em tempo real, gráficos personalizáveis e visão gerencial por setor.',
    beneficios: ['Widgets por perfil de acesso', 'Metas e linhas de referência', 'Exportação em PDF, CSV e imagem', 'Modo TV para exibição em tela'],
    tags: ['BI', 'KPIs', 'Relatórios'],
  },
  {
    id: 'vendas',         icone: '🛒', icon: ShoppingCart,  cor: 'from-green-500 to-green-700',     bg: 'bg-green-50 border-green-200',    txt: 'text-green-700',
    titulo: 'Vendas e Faturamento',        subtitulo: 'Módulo Comercial',
    rota: '/vendas/pedidos',
    descricao: 'Cotações, propostas, pedidos de venda, NF-e, comissões, tabelas de preço e kits.',
    beneficios: ['Solicitações de cotação', 'Emissão de NF-e', 'Comissões de vendedores', 'NF-e de devolução'],
    tags: ['NF-e', 'Cotação', 'Pedidos'],
  },
  {
    id: 'servicos',       icone: '🔧', icon: Wrench,        cor: 'from-cyan-500 to-cyan-700',       bg: 'bg-cyan-50 border-cyan-200',      txt: 'text-cyan-700',
    titulo: 'Prestação de Serviços',       subtitulo: 'NFS-e e Recorrências',
    rota: '/servicos/pedidos',
    descricao: 'Cotações de serviços, ordens de serviço, NFS-e, contratos recorrentes e tabela de preços.',
    beneficios: ['Emissão de NFS-e', 'Serviços recorrentes', 'Propostas de serviço', 'Integração financeiro'],
    tags: ['NFS-e', 'Recorrência', 'Contratos'],
  },
  {
    id: 'financeiro',     icone: '💰', icon: DollarSign,    cor: 'from-yellow-500 to-yellow-600',   bg: 'bg-yellow-50 border-yellow-200',  txt: 'text-yellow-700',
    titulo: 'Gestão Financeira',           subtitulo: 'Contas a Pagar e Receber',
    rota: '/financeiro/painel',
    descricao: 'Contas a pagar e receber, conciliação bancária, fluxo de caixa, boletos e DRE gerencial.',
    beneficios: ['Conciliação bancária OFX', 'Fluxo de caixa projetado', 'Boletos bancários', 'Régua de cobrança'],
    tags: ['DRE', 'Fluxo de Caixa', 'Boleto'],
  },
  {
    id: 'compras',        icone: '📦', icon: Package,       cor: 'from-orange-500 to-orange-700',   bg: 'bg-orange-50 border-orange-200',  txt: 'text-orange-700',
    titulo: 'Compras e Recebimento',       subtitulo: 'Suprimentos',
    rota: '/compras/pedidos',
    descricao: 'Solicitações de compra, cotações, pedidos, entrada de notas, XML NF-e e manifestação.',
    beneficios: ['Importação de XML NF-e', 'Manifestação de destinatário', 'Mapa de cotações', 'Regras de tributação'],
    tags: ['Suprimentos', 'XML', 'Tributação'],
  },
  {
    id: 'importacao',     icone: '🌐', icon: Globe,         cor: 'from-indigo-500 to-indigo-700',   bg: 'bg-indigo-50 border-indigo-200',  txt: 'text-indigo-700',
    titulo: 'NF-e de Importação',          subtitulo: 'Controle de Importados',
    rota: '/importacao',
    descricao: 'Controle de custos de importação, rateio de despesas aduaneiras e emissão de NF-e de importação.',
    beneficios: ['Rateio de impostos e frete', 'Importação de DI em XML', 'NF-e de entrada de importação', 'Custo total desembaraçado'],
    tags: ['Importação', 'DI', 'Aduaneiro'],
  },
  {
    id: 'producao',       icone: '⚙️', icon: Factory,       cor: 'from-blue-500 to-blue-700',       bg: 'bg-blue-50 border-blue-200',      txt: 'text-blue-700',
    titulo: 'Controle da Produção',        subtitulo: 'Ordens de Fabricação',
    rota: '/producao/ordens',
    descricao: 'BOMs, ordens de produção, requisições de materiais, apontamentos, rastreabilidade e transferências.',
    beneficios: ['Estrutura de produto (BOM)', 'Roteiros de fabricação', 'Requisição de materiais', 'Rastreabilidade por lote'],
    tags: ['BOM', 'Roteiro', 'OP'],
  },
  {
    id: 'terceiros-out',  icone: '🏭', icon: Factory,       cor: 'from-teal-500 to-teal-700',       bg: 'bg-teal-50 border-teal-200',      txt: 'text-teal-700',
    titulo: 'Produção em Terceiros',       subtitulo: 'Beneficiamento',
    rota: '/producao/terceiros-saida',
    descricao: 'Controle de materiais enviados para beneficiamento externo, remessa fiscal e retorno.',
    beneficios: ['NF-e de remessa', 'Estoque em terceiros', 'Retorno com NF-e', 'Custos de beneficiamento'],
    tags: ['Remessa', 'Beneficiamento', 'Retorno'],
  },
  {
    id: 'terceiros-in',   icone: '🔩', icon: Wrench,        cor: 'from-rose-500 to-rose-700',       bg: 'bg-rose-50 border-rose-200',      txt: 'text-rose-700',
    titulo: 'Produção para Terceiros',     subtitulo: 'Industrialização',
    rota: '/producao/terceiros-entrada',
    descricao: 'Gestão da produção realizada para clientes, recepção de materiais e retorno do produto acabado.',
    beneficios: ['Recepção de material de cliente', 'OP vinculada ao cliente', 'NF-e de retorno', 'Rastreabilidade do beneficiamento'],
    tags: ['Industrialização', 'Retorno', 'Cliente'],
  },
  {
    id: 'estoque',        icone: '🗃️', icon: Boxes,         cor: 'from-amber-500 to-amber-700',     bg: 'bg-amber-50 border-amber-200',    txt: 'text-amber-700',
    titulo: 'Controle de Estoque',         subtitulo: 'Gestão de Materiais',
    rota: '/estoque',
    descricao: 'Requisições, transferências, rastreabilidade por lote/série, estoque projetado e reclassificação.',
    beneficios: ['Rastreabilidade lote/série', 'Estoque projetado', 'Inventário', 'Múltiplos armazéns'],
    tags: ['Lote', 'Série', 'Inventário'],
  },
  {
    id: 'blocok',         icone: '📋', icon: FileText,      cor: 'from-slate-500 to-slate-700',     bg: 'bg-slate-50 border-slate-200',    txt: 'text-slate-700',
    titulo: 'Bloco K',                    subtitulo: 'SPED Fiscal',
    rota: '/fiscal/bloco-k',
    descricao: 'Geração do Livro de Controle de Produção e Estoque (Bloco K) integrado com produção e estoque.',
    beneficios: ['Registros K200, K220, K230, K235', 'Bloco H (inventário)', 'Validação automática', 'Exportação do arquivo SPED'],
    tags: ['SPED', 'Fiscal', 'Obrigação'],
  },
  {
    id: 'mrp',            icone: '📅', icon: BarChart2,     cor: 'from-violet-500 to-violet-700',   bg: 'bg-violet-50 border-violet-200',  txt: 'text-violet-700',
    titulo: 'Plano de Produção e MRP',    subtitulo: 'Planejamento',
    rota: '/producao/plano',
    descricao: 'Previsão de vendas, plano de produção, MRP para materiais e CRP para capacidade produtiva.',
    beneficios: ['Previsão de demanda', 'Geração automática de OPs', 'MRP de materiais', 'CRP — gargalos de capacidade'],
    tags: ['MRP', 'CRP', 'Planejamento'],
  },
  {
    id: 'chao-fabrica',   icone: '🏗️', icon: Factory,      cor: 'from-red-500 to-red-700',         bg: 'bg-red-50 border-red-200',        txt: 'text-red-700',
    titulo: 'Controle do Chão de Fábrica', subtitulo: 'Shop Floor',
    rota: '/producao/chao-fabrica',
    descricao: 'Monitoramento em tempo real de máquinas, operadores e ordens; apontamentos, paradas e produtividade.',
    beneficios: ['Monitoramento em tempo real', 'Apontamento por código de barras', 'Registro de paradas', 'OEE e produtividade'],
    tags: ['OEE', 'Apontamento', 'Tempo Real'],
  },
  {
    id: 'programacao',    icone: '📆', icon: BarChart2,     cor: 'from-pink-500 to-pink-700',       bg: 'bg-pink-50 border-pink-200',      txt: 'text-pink-700',
    titulo: 'Programação da Produção',    subtitulo: 'Sequenciamento',
    rota: '/producao/programacao',
    descricao: 'Sequenciamento finito por máquina com Gantt interativo, análise de prazo e gargalos.',
    beneficios: ['Gantt interativo', 'Capacidade finita', 'Análise de prazo de entrega', 'Identificação de gargalos'],
    tags: ['Gantt', 'Sequenciamento', 'Capacidade'],
  },
  {
    id: 'custeio-padrao', icone: '🎯', icon: TrendingUp,    cor: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50 border-emerald-200',txt: 'text-emerald-700',
    titulo: 'Custeio Padrão',             subtitulo: 'Custos Orçados',
    rota: '/producao/custeio-padrao',
    descricao: 'Cálculo do custo padrão por produto, formação de preço de venda, custeio alvo e simulações.',
    beneficios: ['Custo padrão por produto', 'Formação de preço', 'Custeio alvo', 'Simulação de preços'],
    tags: ['Custo', 'Margem', 'Precificação'],
  },
  {
    id: 'custeio-real',   icone: '📈', icon: TrendingUp,    cor: 'from-lime-500 to-lime-700',       bg: 'bg-lime-50 border-lime-200',      txt: 'text-lime-700',
    titulo: 'Custeio Real',               subtitulo: 'Custos Realizados',
    rota: '/producao/custeio-real',
    descricao: 'Custo real por OP, comparativo com padrão, lucratividade por produto e cliente, CPV contábil.',
    beneficios: ['Custo médio e reposição', 'Taxa hora real', 'Lucratividade por produto', 'Exportação CPV'],
    tags: ['CPV', 'Lucratividade', 'Real'],
  },
  {
    id: 'contabilidade',  icone: '📒', icon: BookOpen,      cor: 'from-stone-500 to-stone-700',     bg: 'bg-stone-50 border-stone-200',    txt: 'text-stone-700',
    titulo: 'Contabilidade',              subtitulo: 'Escrituração',
    rota: '/contabilidade',
    descricao: 'Plano de contas, lançamentos automáticos, DRE gerencial em tempo real e reprocessamento.',
    beneficios: ['Plano de contas hierárquico', 'DRE gerencial', 'DRE por projeto', 'Reprocessamento histórico'],
    tags: ['DRE', 'Lançamentos', 'SPED Contábil'],
  },
  {
    id: 'integ-contabil', icone: '🔗', icon: Puzzle,        cor: 'from-neutral-500 to-neutral-700', bg: 'bg-neutral-50 border-neutral-200',txt: 'text-neutral-700',
    titulo: 'Integração Contábil e Fiscal', subtitulo: 'Exportações',
    rota: '/contabilidade/integracao',
    descricao: 'Exportação de NF-es, SPED Contribuições, SPED Contábil, ECF e e-Social para sistemas contábeis.',
    beneficios: ['Mapeamento de contas', 'SPED Contribuições', 'SPED Contábil / ECF', 'e-Social (DP)'],
    tags: ['SPED', 'ECF', 'e-Social'],
  },
  {
    id: 'ecommerce',      icone: '🛍️', icon: ShoppingCart,  cor: 'from-sky-500 to-sky-700',         bg: 'bg-sky-50 border-sky-200',        txt: 'text-sky-700',
    titulo: 'E-commerce e Marketplaces',  subtitulo: 'Integração Digital',
    rota: '/vendas/pedidos',
    descricao: 'Sincronização de produtos, estoque e pedidos com plataformas de e-commerce e marketplaces.',
    beneficios: ['Sincronização de estoque', 'Importação de pedidos', 'Precificação automática', 'Tracking de entregas'],
    tags: ['Marketplace', 'API', 'Omnichannel'],
  },
  {
    id: 'qualidade',      icone: '🏆', icon: ClipboardCheck, cor: 'from-teal-500 to-teal-600',       bg: 'bg-teal-50 border-teal-200',      txt: 'text-teal-700',
    titulo: 'Controle da Qualidade',      subtitulo: 'Total Quality',
    rota: '/qualidade',
    descricao: 'Planos de inspeção, inspeções por etapa, não conformidades, calibração de instrumentos e indicadores.',
    beneficios: ['Planos de inspeção', 'Certificados de qualidade', 'NC com causa raiz', 'Calibração (MSA)'],
    tags: ['ISO', 'Inspeção', 'NC'],
  },
  {
    id: 'documentos',     icone: '📄', icon: FileText,      cor: 'from-blue-400 to-blue-600',       bg: 'bg-blue-50 border-blue-200',      txt: 'text-blue-700',
    titulo: 'Gestão de Documentos',       subtitulo: 'Documentação Eletrônica',
    rota: '/qualidade/documentos',
    descricao: 'Relatórios de inspeção, ensaios NDT, assinatura digital e requisitos de documentação por produto.',
    beneficios: ['Assinatura digital', 'PDFs personalizados', 'Requisitos por produto', 'Histórico de revisões'],
    tags: ['Assinatura', 'PDF', 'NDT'],
  },
  {
    id: 'databooks',      icone: '📚', icon: BookOpen,      cor: 'from-purple-400 to-purple-600',   bg: 'bg-purple-50 border-purple-200',  txt: 'text-purple-700',
    titulo: 'Databooks',                  subtitulo: 'Dossiê de Produto',
    rota: '/qualidade/databooks',
    descricao: 'Templates de databook, geração eletrônica, vinculação por lote/série e PDF completo do dossiê.',
    beneficios: ['Templates configuráveis', 'Vinculação lote/série', 'Digitalização de docs externos', 'PDF completo'],
    tags: ['Dossiê', 'Rastreabilidade', 'PDF'],
  },
  {
    id: 'expedicao',      icone: '🚚', icon: Truck,         cor: 'from-orange-400 to-orange-600',   bg: 'bg-orange-50 border-orange-200',  txt: 'text-orange-700',
    titulo: 'Controle da Expedição',      subtitulo: 'Shipping',
    rota: '/expedicao',
    descricao: 'Separação com código de barras, formação de cargas, romaneios e app mobile para conferência.',
    beneficios: ['Separação por código de barras', 'Formação de pallets', 'Romaneio eletrônico', 'App mobile'],
    tags: ['Barcode', 'Romaneio', 'Pallets'],
  },
  {
    id: 'projetos',       icone: '📁', icon: FolderKanban,  cor: 'from-green-400 to-green-600',     bg: 'bg-green-50 border-green-200',    txt: 'text-green-700',
    titulo: 'Gestão de Projetos',         subtitulo: 'Project Management',
    rota: '/projetos',
    descricao: 'EAP, Gantt, apontamentos de horas, custo orçado vs. real, painel financeiro e comunicação.',
    beneficios: ['EAP + Gantt interativo', 'Custeio orçado vs. real', 'Apontamento de horas', 'Painel financeiro'],
    tags: ['EAP', 'Gantt', 'PMO'],
  },
  {
    id: 'crm',            icone: '🤝', icon: Users,         cor: 'from-rose-400 to-rose-600',       bg: 'bg-rose-50 border-rose-200',      txt: 'text-rose-700',
    titulo: 'CRM',                        subtitulo: 'Gestão de Processos',
    rota: '/crm',
    descricao: 'Negociações de venda, suporte ao cliente e assistência técnica com Kanban, comunicação e integração com vendas.',
    beneficios: ['Funil de vendas (Kanban)', 'Campos personalizados', 'Histórico de interações', 'Geração de PV direto do CRM'],
    tags: ['Pipeline', 'Leads', 'Kanban'],
  },
  {
    id: 'conhecimento',   icone: '📖', icon: BookOpen,      cor: 'from-indigo-400 to-indigo-600',   bg: 'bg-indigo-50 border-indigo-200',  txt: 'text-indigo-700',
    titulo: 'Base de Conhecimento',       subtitulo: 'Procedimentos Internos',
    rota: '/conhecimento',
    descricao: 'Categorias, artigos com Markdown, pesquisa avançada, controle de versões e histórico de alterações.',
    beneficios: ['Pesquisa avançada', 'Markdown com imagens', 'Controle de versões', 'Acesso por perfil'],
    tags: ['Wiki', 'Procedimentos', 'Versões'],
  },
];

const ETAPAS_IMPLANTACAO = [
  { n: '01', titulo: 'Diagnóstico', desc: 'Levantamento dos processos, fluxos e necessidades da empresa. Definição do escopo e cronograma de implantação.', dias: '1–2 semanas', icon: '🔍' },
  { n: '02', titulo: 'Configuração', desc: 'Parametrização do sistema: usuários, perfis, tributação, plano de contas e dados mestres.', dias: '2–4 semanas', icon: '⚙️' },
  { n: '03', titulo: 'Migração de Dados', desc: 'Importação de cadastros, histórico financeiro, produtos, BOM e clientes/fornecedores.', dias: '1–2 semanas', icon: '📂' },
  { n: '04', titulo: 'Treinamento', desc: 'Capacitação dos usuários por módulo, com material de apoio e base de conhecimento interna.', dias: '2–3 semanas', icon: '🎓' },
  { n: '05', titulo: 'Go-live Assistido', desc: 'Entrada em produção com suporte intensivo da equipe. Monitoramento dos primeiros lançamentos.', dias: '1–2 semanas', icon: '🚀' },
  { n: '06', titulo: 'Suporte Contínuo', desc: 'Acompanhamento pós-implantação, atualizações automáticas e suporte via chat, e-mail e telefone.', dias: 'Contínuo', icon: '🛟' },
];

const RECURSOS_API = [
  { titulo: 'REST API completa', desc: 'Todos os módulos expostos via endpoints REST documentados com Swagger/OpenAPI.', icon: '🔌' },
  { titulo: 'Webhooks em tempo real', desc: 'Notificações automáticas para sistemas externos quando eventos ocorrem no ERP.', icon: '⚡' },
  { titulo: 'Autenticação OAuth 2.0', desc: 'Integração segura com tokens JWT e controle de permissões por endpoint.', icon: '🔐' },
  { titulo: 'SDK JavaScript / Python', desc: 'Bibliotecas prontas para integração com e-commerce, automações e sistemas legados.', icon: '📦' },
  { titulo: 'Importação em lote (CSV / XML)', desc: 'Upload em massa de produtos, clientes, pedidos e documentos fiscais.', icon: '📊' },
  { titulo: 'Sandbox de testes', desc: 'Ambiente separado para homologação de integrações sem afetar dados de produção.', icon: '🧪' },
];

export default function SobreERP() {
  const navigate = useNavigate();
  const [secaoExp, setSecaoExp] = useState({ modulos: true, implantacao: false, api: false, reforma: false });
  const [buscaMod, setBuscaMod] = useState('');
  const [filtroMod, setFiltroMod] = useState('todos');
  const toggle = (k) => setSecaoExp((p) => ({ ...p, [k]: !p[k] }));

  const AREAS = [
    { id: 'todos',       label: 'Todos' },
    { id: 'comercial',   label: 'Comercial',   ids: ['paineis','vendas','servicos','crm','ecommerce'] },
    { id: 'financeiro',  label: 'Financeiro',  ids: ['financeiro','contabilidade','integ-contabil'] },
    { id: 'suprimentos', label: 'Suprimentos', ids: ['compras','importacao','estoque'] },
    { id: 'producao',    label: 'Produção',    ids: ['producao','terceiros-out','terceiros-in','blocok','mrp','chao-fabrica','programacao','custeio-padrao','custeio-real','expedicao'] },
    { id: 'qualidade',   label: 'Qualidade',   ids: ['qualidade','documentos','databooks','conhecimento'] },
    { id: 'gestao',      label: 'Gestão',      ids: ['projetos','crm','conhecimento'] },
  ];

  const modulosFiltrados = MODULOS.filter((m) => {
    const areaOk = filtroMod === 'todos' || (AREAS.find((a) => a.id === filtroMod)?.ids || []).includes(m.id);
    const buscaOk = !buscaMod || m.titulo.toLowerCase().includes(buscaMod.toLowerCase()) || m.tags.some((t) => t.toLowerCase().includes(buscaMod.toLowerCase()));
    return areaOk && buscaOk;
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="erp-card p-8 bg-gradient-to-br from-primary/10 via-blue-50 to-purple-50 border-primary/20 text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary">
          <Zap size={12} />ERP Industrial — Indústria de Equipamentos em Aço Inoxidável
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Como funciona o ERP?</h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Um sistema ERP completo, integrado e desenvolvido para a realidade da indústria de fabricação de equipamentos.
          Desde a cotação do cliente até a entrega com databook — tudo em um único lugar.
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <div className="flex items-center gap-2 text-xs bg-white border border-border rounded-full px-4 py-2"><CheckCircle size={12} className="text-green-600" /><strong>{MODULOS.length}</strong> módulos implementados</div>
          <div className="flex items-center gap-2 text-xs bg-white border border-border rounded-full px-4 py-2"><CheckCircle size={12} className="text-green-600" />Integração total entre módulos</div>
          <div className="flex items-center gap-2 text-xs bg-white border border-border rounded-full px-4 py-2"><CheckCircle size={12} className="text-green-600" />API REST documentada</div>
          <div className="flex items-center gap-2 text-xs bg-white border border-border rounded-full px-4 py-2"><CheckCircle size={12} className="text-green-600" />Reforma Tributária 2026 pronto</div>
        </div>
      </div>

      {/* ── MÓDULOS ──────────────────────────────────────────────── */}
      <div className="erp-card overflow-hidden">
        <button type="button" onClick={() => toggle('modulos')} className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3"><span className="text-xl">🧩</span><div className="text-left"><p className="font-bold">Módulos do Sistema</p><p className="text-xs text-muted-foreground">{MODULOS.length} módulos disponíveis — clique para explorar</p></div></div>
          <ChevronDown size={16} className={`transition-transform ${secaoExp.modulos ? 'rotate-180' : ''}`} />
        </button>
        {secaoExp.modulos && (
          <div className="p-5 space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-40 max-w-xs">
                <input className="erp-input pl-3 w-full text-xs" placeholder="Buscar módulo..." value={buscaMod} onChange={(e) => setBuscaMod(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AREAS.map((a) => (
                  <button key={a.id} type="button" onClick={() => setFiltroMod(a.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filtroMod === a.id ? 'bg-primary text-white border-primary' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted/20'}`}>{a.label}</button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{modulosFiltrados.length} módulo(s)</p>

            {/* Grade de módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {modulosFiltrados.map((mod) => (
                <div key={mod.id} className={`border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer group ${mod.bg}`}
                  onClick={() => navigate(mod.rota)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{mod.icone}</span>
                      <div>
                        <p className={`font-bold text-sm ${mod.txt}`}>{mod.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{mod.subtitulo}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className={`${mod.txt} opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0`} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mod.descricao}</p>
                  <ul className="space-y-1">
                    {mod.beneficios.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-[10px]"><CheckCircle size={9} className="text-green-600 shrink-0" />{b}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-black/5">
                    {mod.tags.map((t) => <span key={t} className={`${mod.txt} bg-white/60 text-[9px] px-2 py-0.5 rounded-full font-medium`}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── REFORMA TRIBUTÁRIA ─────────────────────────────────── */}
      <div className="erp-card overflow-hidden">
        <button type="button" onClick={() => toggle('reforma')} className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3"><span className="text-xl">⚖️</span><div className="text-left"><p className="font-bold">Reforma Tributária 2026</p><p className="text-xs text-muted-foreground">CBS, IBS, Imposto Seletivo e NF-e Dual — preparado para a transição</p></div></div>
          <ChevronDown size={16} className={`transition-transform ${secaoExp.reforma ? 'rotate-180' : ''}`} />
        </button>
        {secaoExp.reforma && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { titulo: 'CBS — Contribuição sobre Bens e Serviços', desc: 'Substitui PIS e COFINS. O sistema calcula e destaca a CBS em todas as NF-es de entrada e saída, com regras de crédito configuráveis.', status: 'preparado', icon: '💼' },
                { titulo: 'IBS — Imposto sobre Bens e Serviços', desc: 'Substitui ICMS e ISS. Alíquotas estaduais e municipais configuradas por produto e operação, com apuração separada.', status: 'preparado', icon: '🗺️' },
                { titulo: 'Imposto Seletivo (IS)', desc: 'Incide sobre produtos prejudiciais à saúde ou meio ambiente. Campo específico na NF-e e apuração automática.', status: 'preparado', icon: '🌱' },
                { titulo: 'NF-e Dual (período de transição)', desc: 'Emissão simultânea das notas antigas (ICMS/IPI) e novas (CBS/IBS) durante o período de coexistência 2026–2032.', status: 'em_dev', icon: '📝' },
                { titulo: 'Aproveitamento de Créditos', desc: 'Motor de cálculo de créditos tributários de CBS e IBS na entrada de notas, com estorno automático quando necessário.', status: 'preparado', icon: '♻️' },
                { titulo: 'Split Payment', desc: 'Recolhimento automático do IBS/CBS diretamente na transação (split payment), com conciliação bancária integrada.', status: 'em_dev', icon: '🔀' },
              ].map((item) => (
                <div key={item.titulo} className={`p-4 rounded-xl border space-y-2 ${item.status === 'preparado' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="text-lg">{item.icon}</span><p className="font-semibold text-xs">{item.titulo}</p></div>
                    <span className={`erp-badge text-[8px] ${item.status === 'preparado' ? 'erp-badge-success' : 'erp-badge-warning'}`}>{item.status === 'preparado' ? '✓ Pronto' : 'Em Desenvolvimento'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs">
              <p className="font-bold text-blue-800 mb-1">📅 Cronograma de Transição — PLP 68/2024</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                {[['2026', 'Início gradual CBS/IBS (0,1%)'], ['2027–2028', 'Alíquotas crescentes (fase 1)'], ['2029–2032', 'Coexistência ICMS + IBS'], ['2033', 'Sistema tributário pleno novo']].map(([ano, desc]) => (
                  <div key={ano} className="text-center bg-white rounded-lg p-2 border border-blue-100"><p className="font-bold text-blue-700">{ano}</p><p className="text-muted-foreground mt-0.5">{desc}</p></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── IMPLANTAÇÃO ────────────────────────────────────────── */}
      <div className="erp-card overflow-hidden">
        <button type="button" onClick={() => toggle('implantacao')} className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3"><span className="text-xl">🚀</span><div className="text-left"><p className="font-bold">Implantação</p><p className="text-xs text-muted-foreground">6 etapas estruturadas para uma entrada em produção segura e eficaz</p></div></div>
          <ChevronDown size={16} className={`transition-transform ${secaoExp.implantacao ? 'rotate-180' : ''}`} />
        </button>
        {secaoExp.implantacao && (
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
              <div className="space-y-4">
                {ETAPAS_IMPLANTACAO.map((e, i) => (
                  <div key={e.n} className="flex gap-4 relative">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex flex-col items-center justify-center shrink-0 z-10 shadow-md">
                      <span className="text-lg leading-none">{e.icon}</span>
                    </div>
                    <div className={`flex-1 erp-card p-4 ${i === 0 ? 'border-primary/40 bg-primary/5' : ''}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{e.n}</span><p className="font-bold text-sm">{e.titulo}</p></div>
                        <span className="text-[10px] bg-muted/20 border border-border rounded-full px-2 py-0.5 flex items-center gap-1"><Clock size={9} />{e.dias}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[['📞', 'Suporte', 'Chat, e-mail e telefone em horário comercial'],['🎓', 'Treinamento', 'Videos, manuais e base de conhecimento integrada'],['🔄', 'Atualizações', 'Novas versões automáticas sem custo adicional']].map(([ic, t, d]) => (
                <div key={t} className="erp-card p-3 space-y-1"><span className="text-xl">{ic}</span><p className="font-semibold text-xs">{t}</p><p className="text-[10px] text-muted-foreground">{d}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── API DE INTEGRAÇÃO ──────────────────────────────────── */}
      <div className="erp-card overflow-hidden">
        <button type="button" onClick={() => toggle('api')} className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3"><span className="text-xl">🔌</span><div className="text-left"><p className="font-bold">API de Integração</p><p className="text-xs text-muted-foreground">REST API, webhooks, OAuth 2.0 e SDK para integrar com qualquer sistema</p></div></div>
          <ChevronDown size={16} className={`transition-transform ${secaoExp.api ? 'rotate-180' : ''}`} />
        </button>
        {secaoExp.api && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECURSOS_API.map((r) => (
                <div key={r.titulo} className="erp-card p-4 space-y-2 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2"><span className="text-xl">{r.icon}</span><p className="font-semibold text-xs">{r.titulo}</p></div>
                  <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 rounded-xl p-5 text-green-400 font-mono text-xs space-y-1 overflow-x-auto">
              <p className="text-gray-500 mb-2"># Exemplo de requisição à API</p>
              <p><span className="text-blue-400">GET</span> /api/v1/pedidos-venda?status=aprovado&limit=10</p>
              <p><span className="text-gray-500">Authorization:</span> Bearer {'<token>'}</p>
              <p className="mt-2 text-gray-500">// Resposta</p>
              <p>{'{'}</p>
              <p className="pl-4">"data": [{'{'} "id": "PV-2026-0091", "cliente": "Alimentos SA", "valor": 92000 {'}'}],</p>
              <p className="pl-4">"total": 47, "page": 1, "limit": 10</p>
              <p>{'}'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2"><CheckCircle size={11} className="text-green-600" />Swagger UI disponível em /api/docs</div>
              <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"><Code2 size={11} className="text-blue-600" />Postman Collection exportável</div>
              <div className="flex items-center gap-2 text-xs bg-purple-50 border border-purple-200 rounded-lg px-3 py-2"><Shield size={11} className="text-purple-600" />Rate limit: 1.000 req/min</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="erp-card p-6 bg-gradient-to-r from-primary to-blue-700 text-white text-center space-y-3 border-0">
        <p className="text-lg font-bold">Pronto para começar?</p>
        <p className="text-sm opacity-80">Acesse qualquer módulo pelo menu lateral ou comece pelo Dashboard para ter uma visão completa do negócio.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => navigate('/')} className="bg-white text-primary text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"><BarChart2 size={13} />Ir para o Dashboard</button>
          <button type="button" onClick={() => navigate('/conhecimento')} className="bg-white/20 border border-white/40 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-white/30 transition-colors flex items-center gap-2"><BookOpen size={13} />Base de Conhecimento</button>
        </div>
      </div>
    </div>
  );
}
