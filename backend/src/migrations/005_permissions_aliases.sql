-- Alias de permissões legadas usadas pelo frontend e pelas rotas atuais.
-- Mantém compatibilidade com os nomes antigos sem quebrar o catálogo base.

INSERT IGNORE INTO permissions (id, code, name, category, description, type) VALUES
  (UUID(), 'ver_dashboard', 'Ver dashboard', 'dashboard', 'Acessar o dashboard', 'action'),
  (UUID(), 'ver_clientes', 'Ver clientes', 'vendas', 'Acessar clientes', 'action'),
  (UUID(), 'ver_pedidos', 'Ver pedidos', 'vendas', 'Acessar pedidos de venda', 'action'),
  (UUID(), 'ver_estoque', 'Ver estoque', 'estoque', 'Acessar estoque', 'action'),
  (UUID(), 'ver_op', 'Ver ordens de produção', 'producao', 'Acessar ordens de produção', 'action'),
  (UUID(), 'criar_op', 'Criar ordens de produção', 'producao', 'Criar ordens de produção', 'action'),
  (UUID(), 'editar_op', 'Editar ordens de produção', 'producao', 'Editar ordens de produção', 'action'),
  (UUID(), 'apontar', 'Apontar produção', 'producao', 'Registrar apontamentos', 'action'),
  (UUID(), 'ver_pcp', 'Ver PCP', 'producao', 'Acessar PCP', 'action'),
  (UUID(), 'ver_kanban', 'Ver kanban', 'producao', 'Acessar kanban de produção', 'action'),
  (UUID(), 'ver_chao_fabrica', 'Ver chão de fábrica', 'producao', 'Acessar chão de fábrica', 'action'),
  (UUID(), 'ver_roteiros', 'Ver roteiros', 'producao', 'Acessar roteiros', 'action'),
  (UUID(), 'ver_maquinas', 'Ver máquinas', 'producao', 'Acessar máquinas', 'action'),
  (UUID(), 'ver_compras', 'Ver compras', 'compras', 'Acessar compras', 'action'),
  (UUID(), 'criar_oc', 'Criar ordem de compra', 'compras', 'Criar ordens de compra', 'action'),
  (UUID(), 'aprovar_compra', 'Aprovar compra', 'compras', 'Aprovar ordens de compra', 'action'),
  (UUID(), 'ver_rh', 'Ver RH', 'rh', 'Acessar recursos humanos', 'action'),
  (UUID(), 'cadastrar_funcionario', 'Cadastrar funcionário', 'rh', 'Cadastrar funcionários', 'action'),
  (UUID(), 'registrar_ponto', 'Registrar ponto', 'rh', 'Lançar ponto', 'action'),
  (UUID(), 'ver_folha', 'Ver folha', 'rh', 'Acessar folha de pagamento', 'action'),
  (UUID(), 'ver_crm', 'Ver CRM', 'crm', 'Acessar CRM', 'action'),
  (UUID(), 'editar_config', 'Editar configurações', 'config', 'Acessar configurações do sistema', 'action'),
  (UUID(), 'gerenciar_usuarios', 'Gerenciar usuários', 'user', 'Administrar usuários', 'action'),
  (UUID(), 'impersonate', 'Impersonar usuário', 'admin', 'Acessar modo ver como', 'action'),
  (UUID(), 'aprovar_financeiro', 'Aprovar financeiro', 'financeiro', 'Aprovar pedidos financeiros', 'action'),
  (UUID(), 'ver_fiscal', 'Ver fiscal', 'fiscal', 'Acessar fiscal', 'action'),
  (UUID(), 'emitir_nfe', 'Emitir NFe', 'fiscal', 'Emitir notas fiscais', 'action'),
  (UUID(), 'cancelar_nfe', 'Cancelar NFe', 'fiscal', 'Cancelar notas fiscais', 'action'),
  (UUID(), 'relatorios:view', 'Ver relatórios', 'relatorios', 'Acessar relatórios', 'action');

INSERT IGNORE INTO role_permissions (id, role_id, permission_id, granted)
SELECT UUID(), r.id, p.id, TRUE
FROM roles r
JOIN permissions p
WHERE r.code IN ('master', 'admin')
  AND p.code IN (
    'ver_dashboard', 'ver_clientes', 'ver_pedidos', 'ver_estoque',
    'ver_op', 'criar_op', 'editar_op', 'apontar', 'ver_pcp', 'ver_kanban', 'ver_chao_fabrica', 'ver_roteiros', 'ver_maquinas',
    'ver_compras', 'criar_oc', 'aprovar_compra',
    'ver_rh', 'cadastrar_funcionario', 'registrar_ponto', 'ver_folha',
    'ver_crm', 'editar_config', 'gerenciar_usuarios', 'impersonate',
    'aprovar_financeiro', 'ver_fiscal', 'emitir_nfe', 'cancelar_nfe',
    'relatorios:view'
  );

INSERT IGNORE INTO role_permissions (id, role_id, permission_id, granted)
SELECT UUID(), r.id, p.id, TRUE
FROM roles r
JOIN permissions p
WHERE r.code IN ('operador', 'vendedor')
  AND p.code IN (
    'ver_dashboard', 'ver_clientes', 'ver_pedidos', 'ver_estoque',
    'ver_op', 'ver_pcp', 'ver_kanban', 'ver_chao_fabrica', 'ver_roteiros', 'ver_maquinas',
    'ver_crm', 'relatorios:view'
  );
