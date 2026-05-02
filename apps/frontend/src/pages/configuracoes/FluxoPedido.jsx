import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Instagram, Facebook, Globe, MessageCircle,
  Users, ShoppingCart, Wrench, DollarSign, Factory,
  CheckCircle2, Truck, FileText, ArrowRight, ArrowDown,
  ChevronDown, ChevronUp, Info, ShieldCheck, Eye, GitBranch,
  Star, AlertCircle, Clock,
} from 'lucide-react';

// ─── Canais de entrada ────────────────────────────────────────────────────────
const CANAIS = [
  { label: 'Instagram',   icon: Instagram,      color: 'bg-pink-500 text-white' },
  { label: 'Facebook',    icon: Facebook,       color: 'bg-blue-600 text-white' },
  { label: 'OLX',         icon: Globe,          color: 'bg-orange-500 text-white' },
  { label: 'WhatsApp',    icon: MessageCircle,  color: 'bg-green-500 text-white' },
  { label: 'Indicação',   icon: Users,          color: 'bg-purple-500 text-white' },
  { label: 'Site',        icon: Globe,          color: 'bg-slate-500 text-white' },
];

// ─── Definição das etapas ─────────────────────────────────────────────────────
const ETAPAS = [
  {
    id: 'lead',
    numero: 1,
    label: 'Entrada do Lead',
    sublabel: 'CRM — Captação',
    icon: Users,
    color: 'bg-slate-500',
    border: 'border-slate-500',
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    responsaveis: ['Vendas / Orçamentista'],
    roles: ['orcamentista_vendas'],
    descricao: 'O lead entra por canais digitais (Instagram, Facebook, OLX, WhatsApp) ou indicação. É registrado no CRM com dados de contato, origem e temperatura (Quente/Morno/Frio). O vendedor responsável é atribuído automaticamente.',
    acoes: [
      'Registrar lead no CRM com dados de contato',
      'Informar canal de origem (Instagram, Facebook, OLX…)',
      'Classificar temperatura: Quente / Morno / Frio',
      'Atribuir vendedor responsável',
      'Agendar primeiro contato',
    ],
    permissoes: ['ver_crm', 'ver_clientes'],
    navegar: '/crm/leads',
    dica: 'Leads do Instagram e Facebook chegam com mais contexto visual — inclua o produto de interesse na descrição.',
  },
  {
    id: 'atendimento',
    numero: 2,
    label: 'Atendimento & Qualificação',
    sublabel: 'CRM — Pipeline',
    icon: MessageCircle,
    color: 'bg-blue-500',
    border: 'border-blue-500',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    responsaveis: ['Vendas / Orçamentista'],
    roles: ['orcamentista_vendas'],
    descricao: 'O vendedor entra em contato com o lead, entende a necessidade e qualifica a oportunidade. Nesta etapa é feita a pergunta-chave: o produto solicitado já existe no catálogo ou precisa ser desenvolvido/personalizado?',
    acoes: [
      'Primeiro contato (ligação, WhatsApp ou visita)',
      'Levantar necessidade e especificações iniciais',
      'Verificar se produto existe no catálogo de produtos',
      'Criar Oportunidade no CRM (estágio: Qualificação)',
      'Decidir: produto existente → Orçamento direto | produto novo → Solicitar Engenharia',
    ],
    permissoes: ['ver_crm', 'ver_clientes', 'ver_estoque'],
    navegar: '/crm/oportunidades',
    dica: 'Se o produto já tem ficha técnica no sistema, vá direto para o orçamento. Se precisa de personalização, acione a engenharia.',
    decisao: true,
  },
];

const CAMINHO_PRODUTO_NOVO = {
  id: 'engenharia',
  numero: '3A',
  label: 'Desenvolvimento Técnico',
  sublabel: 'Engenharia — Somente Técnica',
  icon: Wrench,
  color: 'bg-violet-500',
  border: 'border-violet-500',
  text: 'text-violet-600',
  bg: 'bg-violet-50',
  responsaveis: ['Projetista / Engenharia'],
  roles: ['projetista'],
  descricao: 'O projetista recebe a solicitação do vendedor e faz o desenvolvimento técnico. Essa etapa é EXCLUSIVAMENTE técnica — a engenharia não define valores nem custos. Ela entrega: definição do produto, esboço/desenho e lista completa de materiais (inox, componentes, parafusos etc.).',
  acoes: [
    'Receber solicitação de desenvolvimento do vendedor',
    'Definir especificações técnicas do produto',
    'Criar esboço ou desenho técnico',
    'Levantar materiais: tipo de inox, espessura, dimensões',
    'Listar todos os componentes: parafusos, vedações, conexões',
    'Criar ficha BOM (Lista de Materiais) no sistema',
    'Registrar roteiro de fabricação',
    'Enviar especificações completas de volta ao vendedor',
  ],
  permissoes: ['ver_op', 'editar_produtos', 'ver_roteiros', 'ver_estoque'],
  navegar: '/engenharia',
  alerta: 'A engenharia NÃO define preços. Apenas levanta materiais e especificações técnicas.',
};

const CAMINHO_PRODUTO_EXISTE = {
  id: 'produto_existe',
  numero: '3B',
  label: 'Produto no Catálogo',
  sublabel: 'Verificação de Estoque',
  icon: CheckCircle2,
  color: 'bg-teal-500',
  border: 'border-teal-500',
  text: 'text-teal-600',
  bg: 'bg-teal-50',
  responsaveis: ['Vendas / Orçamentista'],
  roles: ['orcamentista_vendas'],
  descricao: 'O produto já está cadastrado no sistema com ficha técnica e BOM. O vendedor consulta disponibilidade em estoque e tabela de preços para montar o orçamento sem necessidade de envolver a engenharia.',
  acoes: [
    'Consultar ficha técnica do produto no catálogo',
    'Verificar disponibilidade em estoque',
    'Consultar tabela de preços vigente',
    'Prosseguir direto para o orçamento',
  ],
  permissoes: ['ver_estoque', 'ver_pedidos'],
  navegar: '/estoque/produtos',
  dica: 'Com produto existente, o ciclo é mais rápido — normalmente orçamento no mesmo dia.',
};

const ETAPAS_CONTINUACAO = [
  {
    id: 'orcamento',
    numero: 4,
    label: 'Orçamento e Proposta Comercial',
    sublabel: 'Vendas — Precificação',
    icon: ShoppingCart,
    color: 'bg-indigo-500',
    border: 'border-indigo-500',
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
    responsaveis: ['Vendas / Orçamentista'],
    roles: ['orcamentista_vendas'],
    descricao: 'Com os dados técnicos em mãos (da engenharia ou do catálogo), o vendedor faz o levantamento de custos: matéria-prima, componentes, mão de obra e margem. Elabora a proposta comercial e envia ao cliente.',
    acoes: [
      'Calcular custo de matéria-prima com base na BOM',
      'Calcular componentes e insumos',
      'Definir prazo de entrega e condições de pagamento',
      'Aplicar margem comercial',
      'Elaborar proposta comercial (PDF)',
      'Enviar proposta ao cliente',
      'Registrar orçamento no sistema com status "Enviado"',
    ],
    permissoes: ['ver_orcamentos', 'criar_orcamentos', 'ver_pedidos'],
    navegar: '/vendas/orcamentos',
    dica: 'O vendedor é o único responsável pela precificação. Consulte a tabela de preços de matéria-prima atualizada antes de orçar.',
  },
  {
    id: 'negociacao',
    numero: 5,
    label: 'Negociação e Aprovação do Cliente',
    sublabel: 'Vendas — Fechamento',
    icon: Users,
    color: 'bg-orange-500',
    border: 'border-orange-500',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    responsaveis: ['Vendas / Orçamentista'],
    roles: ['orcamentista_vendas'],
    descricao: 'O cliente analisa a proposta: valores, prazos e condições de pagamento. Podem ocorrer rodadas de negociação. Quando aprovado, o pedido de venda é criado no sistema e segue para validação financeira.',
    acoes: [
      'Aguardar resposta do cliente',
      'Negociar valores, prazos e condições se necessário',
      'Revisar orçamento se solicitado',
      'Registrar aprovação do cliente',
      'Converter orçamento em Pedido de Venda',
      'Avançar oportunidade no CRM para "Fechado Ganho"',
    ],
    permissoes: ['ver_pedidos', 'criar_pedidos', 'editar_pedidos', 'aprovar_pedidos'],
    navegar: '/vendas/pedidos',
    dica: 'Após aprovação do cliente, o pedido fica em "Aguardando Aprovação Financeira" — não vai para produção diretamente.',
  },
  {
    id: 'financeiro',
    numero: 6,
    label: 'Validação Financeira',
    sublabel: 'Financeiro — Confirmação de Pagamento',
    icon: DollarSign,
    color: 'bg-green-600',
    border: 'border-green-600',
    text: 'text-green-700',
    bg: 'bg-green-50',
    responsaveis: ['Financeiro'],
    roles: ['financeiro'],
    descricao: 'Antes de liberar para produção, o financeiro valida as condições de pagamento acordadas: forma de pagamento, adiantamento (quando exigido), crédito do cliente e prazo. Somente após aprovação do financeiro o pedido é liberado ao PCP.',
    acoes: [
      'Verificar condições de pagamento acordadas',
      'Confirmar entrada/adiantamento (quando aplicável)',
      'Validar limite de crédito do cliente',
      'Registrar condições no sistema',
      'Aprovar pedido e liberar para produção',
      'Lançar conta a receber no financeiro',
    ],
    permissoes: ['ver_financeiro', 'aprovar_financeiro', 'ver_pedidos'],
    navegar: '/financeiro/aprovacao-pedidos',
    alerta: 'A produção NÃO começa sem aprovação do financeiro. Este é o portão de controle entre vendas e produção.',
  },
  {
    id: 'producao',
    numero: 7,
    label: 'Produção (PCP + Chão de Fábrica)',
    sublabel: 'Fabricação Conforme Especificações',
    icon: Factory,
    color: 'bg-yellow-500',
    border: 'border-yellow-500',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    responsaveis: ['Gerente de Produção', 'Corte Laser', 'Dobra/Montagem', 'Solda'],
    roles: ['gerente_producao', 'corte_laser', 'dobra_montagem', 'solda'],
    descricao: 'O PCP recebe o pedido aprovado e cria a Ordem de Produção (OP) com base nas especificações da BOM definidas pela engenharia. A fabricação segue o roteiro: corte a laser → dobra e montagem → solda. Os operadores apontam cada etapa.',
    acoes: [
      'PCP recebe pedido liberado pelo financeiro',
      'Criar Ordem de Produção (OP) vinculada ao pedido',
      'Programar máquinas e sequência no Kanban',
      'Separar materiais do estoque (baixa de matéria-prima)',
      'Corte a laser conforme desenho técnico',
      'Dobra e montagem das peças',
      'Solda e acabamento',
      'Apontamento de cada etapa pelos operadores',
    ],
    permissoes: ['ver_op', 'criar_op', 'editar_op', 'apontar', 'ver_kanban', 'ver_pcp', 'ver_chao_fabrica'],
    navegar: '/producao/ordens',
    dica: 'O roteiro de fabricação é definido pela engenharia (BOM). A produção executa exatamente o especificado.',
  },
  {
    id: 'qualidade',
    numero: 8,
    label: 'Qualidade',
    sublabel: 'Inspeção Final',
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    responsaveis: ['Qualidade'],
    roles: ['qualidade'],
    descricao: 'Após a fabricação, o produto passa pela inspeção de qualidade conforme as especificações técnicas. Se aprovado, segue para expedição. Se reprovado, volta para reprocesso na produção.',
    acoes: [
      'Inspecionar produto conforme especificações da BOM',
      'Verificar dimensões, solda e acabamento',
      'Aprovar ou reprovar o lote',
      'Documentar não-conformidades (se houver)',
      'Liberar para expedição',
    ],
    permissoes: ['ver_op', 'apontar', 'ver_pedidos'],
    navegar: '/producao/kanban',
  },
  {
    id: 'expedicao',
    numero: 9,
    label: 'Expedição e Entrega',
    sublabel: 'Despacho ao Cliente',
    icon: Truck,
    color: 'bg-teal-500',
    border: 'border-teal-500',
    text: 'text-teal-600',
    bg: 'bg-teal-50',
    responsaveis: ['Expedição'],
    roles: ['expedicao'],
    descricao: 'A expedição separa, embala e despacha o produto ao cliente. Realiza a baixa no estoque (saída de produto acabado), atualiza o pedido como "Expedido" e gera documentos de transporte.',
    acoes: [
      'Conferir produto aprovado pela qualidade',
      'Embalar conforme exigência do cliente',
      'Dar baixa no estoque (saída)',
      'Emitir romaneio / etiqueta de envio',
      'Despachar ao cliente (transportadora ou retirada)',
      'Registrar data de entrega no pedido',
    ],
    permissoes: ['ver_op', 'ver_pedidos', 'movimentar_estoque'],
    navegar: '/estoque/movimentacoes',
  },
  {
    id: 'fiscal_financeiro',
    numero: 10,
    label: 'Fiscal & Recebimento',
    sublabel: 'NF-e + Cobrança',
    icon: FileText,
    color: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    responsaveis: ['Financeiro'],
    roles: ['financeiro'],
    descricao: 'Com o produto entregue, o financeiro emite a NF-e vinculada ao pedido, controla o recebimento conforme as condições acordadas e encerra o ciclo financeiro.',
    acoes: [
      'Emitir NF-e vinculada ao pedido',
      'Transmitir à SEFAZ e enviar XML ao cliente',
      'Controlar vencimentos das parcelas',
      'Registrar pagamentos recebidos',
      'Conciliar com extrato bancário',
      'Encerrar ciclo do pedido',
    ],
    permissoes: ['ver_fiscal', 'ver_financeiro', 'ver_pedidos'],
    navegar: '/financeiro/receber',
  },
];

// ─── Permissões legíveis ──────────────────────────────────────────────────────
const PERM_LABELS = {
  ver_pedidos: 'Ver Pedidos', criar_pedidos: 'Criar Pedidos', editar_pedidos: 'Editar Pedidos', aprovar_pedidos: 'Aprovar Pedidos',
  ver_clientes: 'Ver Clientes', editar_clientes: 'Editar Clientes', ver_orcamentos: 'Ver Orçamentos', criar_orcamentos: 'Criar Orçamentos',
  ver_estoque: 'Ver Estoque', movimentar_estoque: 'Movimentar Estoque', editar_produtos: 'Criar/Editar Produtos',
  ver_compras: 'Ver Compras', criar_oc: 'Criar Ordens de Compra',
  ver_op: 'Ver OPs', criar_op: 'Criar OPs', editar_op: 'Editar OPs',
  apontar: 'Apontar Produção', ver_kanban: 'Ver Kanban', ver_pcp: 'Ver PCP',
  ver_roteiros: 'Ver Roteiros', ver_chao_fabrica: 'Ver Chão de Fábrica',
  ver_financeiro: 'Ver Financeiro', aprovar_financeiro: 'Aprovar Financeiro',
  ver_fiscal: 'Ver Fiscal', ver_crm: 'Ver CRM',
};

const SETOR_COLORS = {
  orcamentista_vendas: 'bg-indigo-500 text-white',
  projetista:         'bg-violet-500 text-white',
  gerente_producao:   'bg-yellow-600 text-white',
  corte_laser:        'bg-yellow-400 text-gray-900',
  dobra_montagem:     'bg-amber-500 text-white',
  solda:              'bg-red-400 text-white',
  qualidade:          'bg-emerald-500 text-white',
  expedicao:          'bg-teal-500 text-white',
  financeiro:         'bg-green-600 text-white',
};

function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${className}`}>{children}</span>;
}

function EtapaCard({ etapa, expandido, onToggle }) {
  const Icon = etapa.icon;
  const isOpen = expandido === etapa.id;
  return (
    <div className={`erp-card overflow-hidden border-l-4 ${etapa.border}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => onToggle(etapa.id)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-full ${etapa.color} flex items-center justify-center shrink-0`}>
            <Icon size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${etapa.text}`}>Etapa {etapa.numero}</span>
              <span className="font-semibold text-sm text-foreground">{etapa.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">{etapa.sublabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex flex-wrap gap-1">
            {etapa.responsaveis.map((r) => (
              <Badge key={r} className="bg-muted text-muted-foreground">{r}</Badge>
            ))}
          </div>
          {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className={`px-4 pb-4 ${etapa.bg} border-t border-border`}>
          <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{etapa.descricao}</p>

          {/* Alertas especiais */}
          {etapa.alerta && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{etapa.alerta}</p>
            </div>
          )}
          {etapa.dica && (
            <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-3">
              <Star size={13} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{etapa.dica}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={12} className={etapa.text} />
                <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">O que acontece</span>
              </div>
              <ul className="space-y-1">
                {etapa.acoes.map((a) => (
                  <li key={a} className="flex items-start gap-1.5 text-xs text-foreground/70">
                    <ArrowRight size={10} className={`${etapa.text} shrink-0 mt-0.5`} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck size={12} className={etapa.text} />
                <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Permissões</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {etapa.permissoes.map((p) => (
                  <Badge key={p} className="bg-white/70 text-foreground/60 border border-border text-[10px]">
                    {PERM_LABELS[p] || p}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Eye size={12} className={etapa.text} />
                <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Setores</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {etapa.roles.map((r) => (
                  <Badge key={r} className={SETOR_COLORS[r] || 'bg-gray-200 text-gray-700'}>
                    {etapa.responsaveis[etapa.roles.indexOf(r)] || r}
                  </Badge>
                ))}
              </div>
              {etapa.navegar && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => window.location.href = `#nav:${etapa.navegar}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md ${etapa.color} text-white hover:opacity-90 transition-opacity`}
                    // using navigate would need useNavigate
                  >
                    <ArrowRight size={11} />
                    Abrir no sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FluxoPedido() {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(null);
  const [caminho, setCaminho] = useState('ambos'); // 'ambos' | 'novo' | 'existente'

  const toggleEtapa = (id) => setExpandido((v) => (v === id ? null : id));

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Fluxo Completo do Pedido</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Da entrada do lead até o recebimento financeiro — com os dois caminhos possíveis
        </p>
      </div>

      {/* ── Canais de Entrada ─────────────────────────────────────────────── */}
      <div className="erp-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Canais de Captação de Leads
        </p>
        <div className="flex flex-wrap gap-2">
          {CANAIS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${c.color}`}>
                <Icon size={12} />
                {c.label}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Todos os leads são centralizados no módulo CRM, independente do canal de origem.
        </p>
      </div>

      {/* ── Etapas 1 e 2 ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {ETAPAS.map((etapa, idx) => (
          <div key={etapa.id}>
            {/* Seta entre etapas */}
            {idx > 0 && (
              <div className="flex justify-center my-1">
                <ArrowDown size={16} className="text-muted-foreground/50" />
              </div>
            )}
            <EtapaCard etapa={etapa} expandido={expandido} onToggle={toggleEtapa} />
          </div>
        ))}
      </div>

      {/* ── DECISÃO: Produto existe? ──────────────────────────────────────── */}
      <div className="erp-card p-4 border-2 border-dashed border-orange-300 bg-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch size={16} className="text-orange-600" />
          <h3 className="font-semibold text-sm text-orange-800">Ponto de Decisão — O produto existe no catálogo?</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {['ambos','existente','novo'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCaminho(c)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                caminho === c
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              {c === 'ambos' ? 'Ver ambos os caminhos' : c === 'existente' ? '✓ Produto existe' : '✗ Produto novo'}
            </button>
          ))}
        </div>
        <p className="text-xs text-orange-700">
          Se o produto já está cadastrado com BOM e roteiro, o fluxo é mais rápido. Se é um produto novo ou personalizado, a engenharia é acionada primeiro.
        </p>
      </div>

      {/* ── Caminhos paralelos ────────────────────────────────────────────── */}
      <div className={`grid gap-4 ${caminho === 'ambos' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Caminho A: Produto NOVO → Engenharia */}
        {(caminho === 'ambos' || caminho === 'novo') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-violet-50 border border-violet-200">
              <Wrench size={14} className="text-violet-600" />
              <span className="text-xs font-semibold text-violet-700">Caminho A — Produto Novo ou Personalizado</span>
            </div>
            <EtapaCard etapa={CAMINHO_PRODUTO_NOVO} expandido={expandido} onToggle={toggleEtapa} />
            <div className="flex justify-center">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDown size={14} className="text-violet-400" />
                <span className="text-[10px]">Specs enviadas ao vendedor</span>
              </div>
            </div>
          </div>
        )}

        {/* Caminho B: Produto EXISTENTE */}
        {(caminho === 'ambos' || caminho === 'existente') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-teal-50 border border-teal-200">
              <CheckCircle2 size={14} className="text-teal-600" />
              <span className="text-xs font-semibold text-teal-700">Caminho B — Produto Existente no Catálogo</span>
            </div>
            <EtapaCard etapa={CAMINHO_PRODUTO_EXISTE} expandido={expandido} onToggle={toggleEtapa} />
            <div className="flex justify-center">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDown size={14} className="text-teal-400" />
                <span className="text-[10px]">Direto para orçamento</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Etapas 4–10 ──────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-50 border border-indigo-200">
          <ArrowDown size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">Os dois caminhos convergem aqui</span>
        </div>
      </div>

      <div className="space-y-2">
        {ETAPAS_CONTINUACAO.map((etapa, idx) => (
          <div key={etapa.id}>
            {idx > 0 && (
              <div className="flex justify-center my-1">
                <ArrowDown size={16} className="text-muted-foreground/50" />
              </div>
            )}
            <EtapaCard etapa={etapa} expandido={expandido} onToggle={toggleEtapa} />
          </div>
        ))}
      </div>

      {/* ── Conclusão ────────────────────────────────────────────────────── */}
      <div className="flex justify-center my-1">
        <ArrowDown size={16} className="text-muted-foreground/50" />
      </div>
      <div className="erp-card flex items-center gap-3 px-4 py-3 border-l-4 border-green-600 bg-green-50">
        <CheckCircle2 size={22} className="text-green-600 shrink-0" />
        <div>
          <span className="font-semibold text-sm text-green-700">Ciclo Completo — Pedido Encerrado</span>
          <p className="text-xs text-green-600 mt-0.5">
            Lead captado → Vendas → (Engenharia se necessário) → Orçamento → Aprovação cliente → Financeiro → Produção → Qualidade → Expedição → NF-e → Recebimento
          </p>
        </div>
      </div>

      {/* ── Resumo de Responsabilidades ──────────────────────────────────── */}
      <div className="erp-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <h2 className="font-semibold text-sm">Resumo de Responsabilidades por Setor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide text-[11px]">Setor</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide text-[11px]">Etapas</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide text-[11px]">Responsabilidade principal</th>
              </tr>
            </thead>
            <tbody>
              {[
                { setor: 'Vendas / Orçamentista', color: 'bg-indigo-500 text-white', etapas: '1, 2, 4, 5', resp: 'Lead, qualificação, precificação, proposta, fechamento com o cliente' },
                { setor: 'Engenharia (Projetista)', color: 'bg-violet-500 text-white', etapas: '3A (quando produto novo)', resp: 'Definição técnica, BOM e roteiro — NÃO define preços' },
                { setor: 'Financeiro', color: 'bg-green-600 text-white', etapas: '6, 10', resp: 'Aprovação antes da produção, NF-e e recebimento' },
                { setor: 'Produção (PCP + Operadores)', color: 'bg-yellow-600 text-white', etapas: '7', resp: 'Fabricação conforme BOM aprovada pela engenharia' },
                { setor: 'Qualidade', color: 'bg-emerald-500 text-white', etapas: '8', resp: 'Inspeção e liberação para expedição' },
                { setor: 'Expedição', color: 'bg-teal-500 text-white', etapas: '9', resp: 'Empacotamento, baixa de estoque e envio ao cliente' },
              ].map((r) => (
                <tr key={r.setor} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <Badge className={r.color}>{r.setor}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.etapas}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.resp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Navegação rápida ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'CRM — Leads', path: '/crm/leads', color: 'text-slate-600 border-slate-300' },
          { label: 'CRM — Oportunidades', path: '/crm/oportunidades', color: 'text-blue-600 border-blue-300' },
          { label: 'Orçamentos', path: '/vendas/orcamentos', color: 'text-indigo-600 border-indigo-300' },
          { label: 'Engenharia / BOM', path: '/engenharia', color: 'text-violet-600 border-violet-300' },
          { label: 'Aprovação Financeira', path: '/financeiro/aprovacao-pedidos', color: 'text-green-700 border-green-300' },
          { label: 'Ordens de Produção', path: '/producao/ordens', color: 'text-yellow-700 border-yellow-300' },
        ].map((link) => (
          <button
            key={link.path}
            type="button"
            onClick={() => navigate(link.path)}
            className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs font-medium hover:bg-muted transition-colors ${link.color}`}
          >
            {link.label}
            <ArrowRight size={11} />
          </button>
        ))}
      </div>
    </div>
  );
}
