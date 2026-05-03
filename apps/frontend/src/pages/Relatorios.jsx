import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { ShoppingCart, Package, Factory, DollarSign, ArrowRight, Users, FileText } from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';

/** `required`: uma permissão; `requiredAny`: qualquer uma da lista (produção / times diferentes). */
const RELATORIOS = [
  {
    categoria: 'Vendas',
    icone: ShoppingCart,
    cor: 'bg-blue-100 text-blue-700',
    required: 'ver_pedidos',
    items: [
      { nome: 'Faturamento por Período', desc: 'Resumo de vendas com comparativo mensal', path: '/vendas/relatorios' },
      { nome: 'Pedidos de Venda', desc: 'Lista de pedidos e status de aprovação', path: '/vendas/pedidos' },
      { nome: 'Clientes', desc: 'Base de clientes e histórico', path: '/vendas/clientes' },
      { nome: 'Orçamentos em Aberto', desc: 'Propostas aguardando aprovação', path: '/vendas/orcamentos' },
    ],
  },
  {
    categoria: 'Estoque',
    icone: Package,
    cor: 'bg-green-100 text-green-700',
    required: 'ver_estoque',
    items: [
      { nome: 'Posição de Estoque', desc: 'Saldo atual por produto e localização', path: '/estoque/produtos' },
      { nome: 'Movimentações', desc: 'Entradas e saídas do período', path: '/estoque/movimentacoes' },
      { nome: 'Inventário', desc: 'Contagens e ajustes de inventário', path: '/estoque/inventario' },
      { nome: 'Endereçamento', desc: 'Mapa de localizações do estoque', path: '/estoque/enderecamento' },
    ],
  },
  {
    categoria: 'Produção',
    icone: Factory,
    cor: 'bg-orange-100 text-orange-700',
    requiredAny: ['ver_op', 'ver_pcp', 'ver_kanban', 'apontar'],
    items: [
      { nome: 'Ordens de Produção', desc: 'Acompanhamento das OPs por status', path: '/producao/ordens' },
      { nome: 'PCP — Gantt da Semana', desc: 'Planejamento e controle visual', path: '/producao/pcp' },
      { nome: 'Kanban de Produção', desc: 'Visão Kanban do fluxo de OPs', path: '/producao/kanban' },
      { nome: 'Apontamento', desc: 'Horas apontadas por operador', path: '/producao/apontamento' },
    ],
  },
  {
    categoria: 'Financeiro',
    icone: DollarSign,
    cor: 'bg-purple-100 text-purple-700',
    required: 'ver_financeiro',
    items: [
      { nome: 'DRE Gerencial', desc: 'Demonstração de resultado simplificada', path: '/financeiro/dre' },
      { nome: 'Fluxo de Caixa', desc: 'Previsão de entradas e saídas', path: '/financeiro/fluxo-caixa' },
      { nome: 'Contas a Receber', desc: 'Títulos abertos e vencimentos', path: '/financeiro/receber' },
      { nome: 'Contas a Pagar', desc: 'Agenda de pagamentos', path: '/financeiro/pagar' },
    ],
  },
  {
    categoria: 'RH',
    icone: Users,
    cor: 'bg-teal-100 text-teal-700',
    required: 'ver_rh',
    items: [
      { nome: 'Funcionários', desc: 'Cadastro e situação dos colaboradores', path: '/rh/funcionarios' },
      { nome: 'Ponto', desc: 'Registros de frequência e horas', path: '/rh/ponto' },
      { nome: 'Folha de Pagamento', desc: 'Demonstrativo do período', path: '/rh/folha-pagamento' },
      { nome: 'Férias', desc: 'Controle de períodos de férias', path: '/rh/ferias' },
    ],
  },
  {
    categoria: 'Fiscal',
    icone: FileText,
    cor: 'bg-red-100 text-red-700',
    required: 'ver_fiscal',
    items: [
      { nome: 'Emissão de NF-e', desc: 'Notas fiscais emitidas e pendentes', path: '/fiscal/nfe' },
      { nome: 'Consulta NF-e', desc: 'Pesquisar notas por chave ou período', path: '/fiscal/nfe-consulta' },
      { nome: 'SPED', desc: 'Obrigações acessórias e prazos', path: '/fiscal/sped' },
    ],
  },
];

function categoriaVisivel(cat, pode) {
  if (cat.requiredAny?.length) return cat.requiredAny.some((p) => pode(p));
  if (cat.required) return pode(cat.required);
  return true;
}

export default function Relatorios() {
  const navigate = useNavigate();
  const { pode } = usePermissao();

  const categorias = useMemo(
    () => RELATORIOS.filter((cat) => categoriaVisivel(cat, pode)),
    [pode],
  );

  return (
    <div>
      <PageHeader title="Central de Relatórios" />
      {categorias.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma categoria de relatório disponível para o seu perfil. Solicite permissões ao administrador.
        </p>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {categorias.map(cat => (
          <div key={cat.categoria} className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <div className={`w-7 h-7 rounded flex items-center justify-center ${cat.cor}`}>
                <cat.icone size={14} />
              </div>
              <h3 className="text-sm font-semibold">{cat.categoria}</h3>
              <span className="ml-auto text-[10px] text-muted-foreground">{cat.items.length} relatórios</span>
            </div>
            <div className="divide-y divide-border">
              {cat.items.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(r.path)}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{r.nome}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.desc}</div>
                  </div>
                  <ArrowRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
