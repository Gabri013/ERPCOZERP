// Perfis de acesso do sistema e suas permissões padrão
// Para integrar com backend: mapeie user.role → perfil abaixo

export const PERFIS_LABELS = {
  dono: 'Dono / Admin',
  gerente_geral: 'Gerente Geral',
  gerente_vendas: 'Gerente de Vendas',
  gerente_producao: 'Gerente de Produção',
  vendas: 'Vendas / Orçamentista',
  compras: 'Compras',
  financeiro: 'Financeiro',
  pcp: 'PCP',
  engenharia: 'Engenharia',
  producao: 'Produção (Operador)',
  qualidade: 'Qualidade',
  rh: 'RH',
  visualizador: 'Visualizador',
};

// Todas as permissões disponíveis no sistema
export const TODAS_PERMISSOES = [
  // Vendas
  { key: 'ver_pedidos', label: 'Ver Pedidos de Venda', modulo: 'Vendas' },
  { key: 'criar_pedidos', label: 'Criar Pedidos', modulo: 'Vendas' },
  { key: 'editar_pedidos', label: 'Editar Pedidos', modulo: 'Vendas' },
  { key: 'aprovar_pedidos', label: 'Aprovar Pedidos', modulo: 'Vendas' },
  { key: 'ver_clientes', label: 'Ver Clientes', modulo: 'Vendas' },
  { key: 'editar_clientes', label: 'Criar/Editar Clientes', modulo: 'Vendas' },
  { key: 'ver_orcamentos', label: 'Ver Orçamentos', modulo: 'Vendas' },
  { key: 'criar_orcamentos', label: 'Criar Orçamentos', modulo: 'Vendas' },
  // Estoque
  { key: 'ver_estoque', label: 'Ver Estoque', modulo: 'Estoque' },
  { key: 'movimentar_estoque', label: 'Movimentar Estoque', modulo: 'Estoque' },
  { key: 'editar_produtos', label: 'Criar/Editar Produtos', modulo: 'Estoque' },
  // Compras
  { key: 'ver_compras', label: 'Ver Compras', modulo: 'Compras' },
  { key: 'criar_oc', label: 'Criar Ordens de Compra', modulo: 'Compras' },
  { key: 'editar_fornecedores', label: 'Editar Fornecedores', modulo: 'Compras' },
  // Produção
  { key: 'ver_op', label: 'Ver Ordens de Produção', modulo: 'Produção' },
  { key: 'criar_op', label: 'Criar OPs', modulo: 'Produção' },
  { key: 'editar_op', label: 'Editar OPs', modulo: 'Produção' },
  { key: 'apontar', label: 'Apontar Produção', modulo: 'Produção' },
  { key: 'ver_kanban', label: 'Ver Kanban', modulo: 'Produção' },
  { key: 'ver_pcp', label: 'Ver PCP', modulo: 'Produção' },
  { key: 'ver_roteiros', label: 'Ver Roteiros', modulo: 'Produção' },
  { key: 'ver_maquinas', label: 'Ver Máquinas', modulo: 'Produção' },
  { key: 'ver_chao_fabrica', label: 'Ver Chão de Fábrica', modulo: 'Produção' },
  // Financeiro
  { key: 'ver_financeiro', label: 'Ver Financeiro', modulo: 'Financeiro' },
  { key: 'editar_financeiro', label: 'Criar/Editar Lançamentos', modulo: 'Financeiro' },
  { key: 'aprovar_financeiro', label: 'Aprovar Pedidos (Gerencial)', modulo: 'Financeiro' },
  { key: 'ver_relatorio_financeiro', label: 'Relatório Financeiro', modulo: 'Financeiro' },
  // RH
  { key: 'ver_rh', label: 'Ver RH', modulo: 'RH' },
  { key: 'editar_funcionarios', label: 'Criar/Editar Funcionários', modulo: 'RH' },
  // Config
  { key: 'ver_relatorios', label: 'Ver Relatórios', modulo: 'Relatórios' },
  { key: 'editar_config', label: 'Configurações do Sistema', modulo: 'Config' },
  { key: 'gerenciar_usuarios', label: 'Gerenciar Usuários', modulo: 'Config' },
  { key: 'impersonate', label: 'Ver como outro usuário', modulo: 'Config' },
];

// Permissões padrão por perfil
export const PERMISSOES_PERFIL = {
  dono: TODAS_PERMISSOES.map(p => p.key), // tudo
  gerente_geral: ['ver_pedidos','criar_pedidos','editar_pedidos','aprovar_pedidos','ver_clientes','editar_clientes','ver_orcamentos','criar_orcamentos','ver_estoque','ver_compras','criar_oc','ver_op','criar_op','editar_op','apontar','ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica','ver_financeiro','editar_financeiro','aprovar_financeiro','ver_relatorio_financeiro','ver_rh','ver_relatorios'],
  gerente_vendas: ['ver_pedidos','criar_pedidos','editar_pedidos','aprovar_pedidos','ver_clientes','editar_clientes','ver_orcamentos','criar_orcamentos','ver_relatorios'],
  gerente_producao: ['ver_op','criar_op','editar_op','apontar','ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica','ver_estoque','ver_relatorios'],
  vendas: ['ver_pedidos','criar_pedidos','ver_clientes','ver_orcamentos','criar_orcamentos'],
  compras: ['ver_compras','criar_oc','editar_fornecedores','ver_estoque'],
  financeiro: ['ver_financeiro','editar_financeiro','ver_relatorio_financeiro','ver_relatorios'],
  pcp: ['ver_op','criar_op','editar_op','ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica','ver_estoque','ver_relatorios'],
  engenharia: ['ver_op','ver_kanban','ver_pcp','ver_roteiros','ver_relatorios'],
  producao: ['ver_op','apontar','ver_kanban','ver_chao_fabrica'],
  qualidade: ['ver_op','apontar','ver_kanban','ver_chao_fabrica','ver_relatorios'],
  rh: ['ver_rh','editar_funcionarios','ver_relatorios'],
  visualizador: ['ver_relatorios'],
};

export function getPermissoesPorPerfil(perfil) {
  return PERMISSOES_PERFIL[perfil] || PERMISSOES_PERFIL['visualizador'];
}