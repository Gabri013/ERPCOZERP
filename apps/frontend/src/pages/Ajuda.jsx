import { Link } from 'react-router-dom';
import { Keyboard, Bell, Search, Settings, Users, LayoutDashboard, Package, Factory, DollarSign, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

const ATALHOS = [
  { teclas: ['Ctrl', 'K'], desc: 'Busca global — procurar pedidos, produtos, clientes, OPs' },
  { teclas: ['G', 'D'], desc: 'Ir para Dashboard' },
  { teclas: ['G', 'P'], desc: 'Ir para Produtos' },
  { teclas: ['G', 'C'], desc: 'Ir para Clientes' },
  { teclas: ['G', 'O'], desc: 'Ir para Ordens de Compra' },
  { teclas: ['G', 'R'], desc: 'Ir para Ordens de Produção' },
  { teclas: ['G', 'A'], desc: 'Ir para Apontamento de Produção' },
  { teclas: ['G', 'U'], desc: 'Ir para Usuários (gerentes)' },
  { teclas: ['G', 'H'], desc: 'Ir para Ajuda' },
];

const MODULOS = [
  {
    icon: LayoutDashboard, label: 'Dashboard', cor: 'text-blue-600',
    desc: 'Visão consolidada de KPIs, gráficos e alertas. Clique em "Configurar" para personalizar os widgets exibidos de acordo com o seu perfil.',
  },
  {
    icon: Package, label: 'Estoque', cor: 'text-green-600',
    desc: 'Gerencie produtos, movimentações de entrada e saída, inventários e endereçamento de prateleiras.',
  },
  {
    icon: Factory, label: 'Produção', cor: 'text-orange-600',
    desc: 'Crie e acompanhe Ordens de Produção, visualize o Kanban, acesse o PCP com Gantt da semana e registre apontamentos no chão de fábrica.',
  },
  {
    icon: DollarSign, label: 'Financeiro', cor: 'text-purple-600',
    desc: 'Contas a pagar e a receber, fluxo de caixa projetado, DRE gerencial e conciliação bancária.',
  },
  {
    icon: FileText, label: 'Fiscal', cor: 'text-red-600',
    desc: 'Emissão e consulta de NF-e (mock), agenda de obrigações SPED com alertas de vencimento.',
  },
  {
    icon: Users, label: 'RH', cor: 'text-teal-600',
    desc: 'Cadastro de funcionários, controle de ponto, folha de pagamento e gestão de férias.',
  },
  {
    icon: Settings, label: 'Configurações', cor: 'text-gray-600',
    desc: 'Parâmetros da empresa, gestão de usuários e permissões, modelo de impressão de OP, metadata studio e workflows.',
  },
];

const DICAS = [
  'Use o menu lateral para navegar entre módulos — clique nos grupos para expandir/recolher.',
  'O avatar no canto superior direito exibe seu perfil e dá acesso a Configurações e Sair.',
  'O sino de notificações mostra alertas do seu setor. Clique para marcar como lido.',
  'Administradores podem usar "Ver como" para navegar pelo sistema com outro perfil de usuário.',
  'Todas as tabelas suportam filtro por texto e ordenação por coluna.',
  'Formulários com "*" têm campos obrigatórios — os demais são opcionais.',
];

export default function Ajuda() {
  return (
    <div className="space-y-5">
      <PageHeader title="Ajuda e Documentação" />

      {/* Atalhos */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Keyboard size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Atalhos de Teclado</h2>
        </div>
        <div className="divide-y divide-border">
          {ATALHOS.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2.5">
              <div className="flex items-center gap-1 shrink-0">
                {a.teclas.map((t, j) => (
                  <span key={j} className="flex items-center gap-0.5">
                    {j > 0 && <span className="text-muted-foreground text-[10px]">+</span>}
                    <kbd className="bg-muted border border-border rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold">{t}</kbd>
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Módulos */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <HelpCircle size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Guia dos Módulos</h2>
        </div>
        <div className="divide-y divide-border">
          {MODULOS.map((m, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <m.icon size={16} className={`${m.cor} shrink-0 mt-0.5`} />
              <div>
                <div className="text-xs font-semibold">{m.label}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Busca Global */}
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Search size={15} className="text-primary" />
          <h2 className="text-sm font-semibold">Busca Global (Ctrl+K)</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Pressione <kbd className="bg-muted border border-border rounded px-1 py-0.5 text-[10px] font-mono">Ctrl+K</kbd> em qualquer tela para abrir a busca global.
          Você pode pesquisar por <strong>produtos</strong>, <strong>pedidos de venda</strong>, <strong>clientes</strong> e <strong>ordens de produção</strong>.
          Digite ao menos 2 caracteres para buscar nos dados reais. Sem nenhum texto, a busca exibe navegação rápida entre módulos.
        </p>
      </div>

      {/* Dicas */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Dicas Rápidas</h2>
        </div>
        <ul className="divide-y divide-border">
          {DICAS.map((d, i) => (
            <li key={i} className="flex items-start gap-2 px-4 py-2.5">
              <ChevronRight size={13} className="text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Links úteis */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 flex flex-wrap gap-4 text-xs">
        <Link to="/configuracoes/empresa" className="text-primary hover:underline flex items-center gap-1"><Settings size={12} /> Configurações da Empresa</Link>
        <Link to="/configuracoes/usuarios" className="text-primary hover:underline flex items-center gap-1"><Users size={12} /> Gerenciar Usuários</Link>
        <Link to="/" className="text-primary hover:underline flex items-center gap-1"><LayoutDashboard size={12} /> Ir para o Dashboard</Link>
      </div>
    </div>
  );
}
