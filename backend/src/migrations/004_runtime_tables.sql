-- Tabelas operacionais usadas pelas rotas do ERP.

CREATE TABLE IF NOT EXISTS workflows (
  id CHAR(36) PRIMARY KEY,
  entity_id CHAR(36) NOT NULL,
  code VARCHAR(150) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  config JSON NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_workflow_entity_code (entity_id, code),
  CONSTRAINT fk_workflows_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  CONSTRAINT fk_workflows_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_steps (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  workflow_id CHAR(36) NOT NULL,
  code VARCHAR(150) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT NULL,
  color VARCHAR(50) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_initial BOOLEAN NOT NULL DEFAULT FALSE,
  is_final BOOLEAN NOT NULL DEFAULT FALSE,
  approver_roles JSON NULL,
  can_edit_fields JSON NULL,
  can_assign_to_roles JSON NULL,
  required_approval BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_workflow_step_code (workflow_id, code),
  CONSTRAINT fk_workflow_steps_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_transitions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  workflow_id CHAR(36) NOT NULL,
  from_step_code VARCHAR(150) NULL,
  to_step_code VARCHAR(150) NOT NULL,
  allowed_roles JSON NULL,
  condition_expression TEXT NULL,
  actions JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_workflow_transitions_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_history (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  workflow_id CHAR(36) NULL,
  record_id CHAR(36) NOT NULL,
  from_step_code VARCHAR(150) NULL,
  to_step_code VARCHAR(150) NOT NULL,
  changed_by CHAR(36) NULL,
  reason TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_workflow_history_record (record_id),
  CONSTRAINT fk_workflow_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_rules (
  id CHAR(36) PRIMARY KEY,
  entity_id CHAR(36) NOT NULL,
  code VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INT NOT NULL DEFAULT 100,
  trigger_event VARCHAR(100) NOT NULL,
  trigger_conditions JSON NULL,
  condition_expression TEXT NULL,
  actions JSON NOT NULL,
  stop_processing BOOLEAN NOT NULL DEFAULT FALSE,
  config JSON NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_business_rules_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  CONSTRAINT fk_business_rules_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rule_executions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  rule_id CHAR(36) NULL,
  record_id CHAR(36) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  result JSON NULL,
  error_message TEXT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rule_executions_rule FOREIGN KEY (rule_id) REFERENCES business_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_config (
  config_key VARCHAR(150) PRIMARY KEY,
  value JSON NOT NULL,
  description TEXT NULL,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_system_config_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS config_versions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  version_name VARCHAR(255) NULL,
  snapshot JSON NOT NULL,
  created_by CHAR(36) NULL,
  restored_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_versions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clientes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  codigo VARCHAR(50) NULL,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255) NULL,
  cnpj_cpf VARCHAR(30) NULL,
  inscricao_estadual VARCHAR(50) NULL,
  regime_tributario VARCHAR(100) NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contas_receber (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  cliente_id CHAR(36) NULL,
  descricao VARCHAR(255) NULL,
  valor DECIMAL(15,2) NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contas_pagar (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fornecedor_id CHAR(36) NULL,
  descricao VARCHAR(255) NULL,
  valor DECIMAL(15,2) NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nfe (
  id CHAR(36) PRIMARY KEY,
  numero VARCHAR(50) NOT NULL,
  serie VARCHAR(20) NULL,
  emitido_em DATETIME NOT NULL,
  cliente_id CHAR(36) NULL,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  tipo VARCHAR(50) NOT NULL DEFAULT 'saida',
  natureza_operacao VARCHAR(150) NULL,
  itens JSON NULL,
  data JSON NULL,
  entity_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nfe_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_nfe_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS apontamentos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  op_id CHAR(36) NULL,
  usuario_id CHAR(36) NULL,
  descricao TEXT NULL,
  quantidade DECIMAL(15,3) NOT NULL DEFAULT 0,
  refugo DECIMAL(15,3) NOT NULL DEFAULT 0,
  observacao TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  iniciado_em DATETIME NULL,
  finalizado_em DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimentos_estoque (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  produto_id CHAR(36) NULL,
  tipo VARCHAR(50) NOT NULL,
  quantidade DECIMAL(15,3) NOT NULL DEFAULT 0,
  produto_codigo VARCHAR(100) NULL,
  produto_descricao TEXT NULL,
  unidade VARCHAR(20) NULL,
  valor_unitario DECIMAL(15,2) DEFAULT 0,
  valor_total DECIMAL(15,2) DEFAULT 0,
  origem VARCHAR(100) NULL,
  origem_id CHAR(36) NULL,
  observacao TEXT NULL,
  criado_por CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS funcionarios (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(30) NULL,
  cargo VARCHAR(150) NULL,
  departamento VARCHAR(150) NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ponto_lancamentos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  funcionario_id CHAR(36) NOT NULL,
  data DATE NOT NULL,
  entrada TIME NULL,
  saida TIME NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  observacao TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ponto_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (id, code, name, category, description, type) VALUES
  (UUID(), 'entity.*.*', 'Acesso total a entidades', 'entity', 'Todas as acoes em todas as entidades', 'entity'),
  (UUID(), 'workflow.create', 'Criar workflows', 'workflow', 'Criar workflows', 'action'),
  (UUID(), 'workflow.execute', 'Executar workflows', 'workflow', 'Executar transicoes de workflow', 'action'),
  (UUID(), 'rule.manage', 'Gerenciar regras', 'rule', 'Criar e alterar regras de negocio', 'action'),
  (UUID(), 'system.config', 'Configurar sistema', 'system', 'Alterar configuracoes do sistema', 'action'),
  (UUID(), 'ver_financeiro', 'Ver financeiro', 'financeiro', 'Acessar financeiro', 'action'),
  (UUID(), 'ver_fiscal', 'Ver fiscal', 'fiscal', 'Acessar fiscal', 'action'),
  (UUID(), 'emitir_nfe', 'Emitir NFe', 'fiscal', 'Emitir notas fiscais', 'action'),
  (UUID(), 'cancelar_nfe', 'Cancelar NFe', 'fiscal', 'Cancelar notas fiscais', 'action');

INSERT IGNORE INTO role_permissions (id, role_id, permission_id, granted)
SELECT UUID(), r.id, p.id, TRUE
FROM roles r
JOIN permissions p
WHERE r.code IN ('master', 'admin');
