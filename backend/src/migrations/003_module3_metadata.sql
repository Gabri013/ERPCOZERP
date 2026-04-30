-- Módulo 3 - Metadados (Sistema NO-CODE)

-- ENTIDADES
CREATE TABLE IF NOT EXISTS entities (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'master',
  icon VARCHAR(100) NULL,
  layout JSON NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_entities_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entities_code (code),
  INDEX idx_entities_type (type),
  INDEX idx_entities_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CAMPOS DE ENTIDADES
CREATE TABLE IF NOT EXISTS entity_fields (
  id CHAR(36) PRIMARY KEY,
  entity_id CHAR(36) NOT NULL,
  code VARCHAR(150) NOT NULL,
  label VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  data_type_params JSON NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  unique_field BOOLEAN NOT NULL DEFAULT FALSE,
  readonly BOOLEAN NOT NULL DEFAULT FALSE,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  default_value VARCHAR(500) NULL,
  validation_rules JSON NULL,
  display_order INT NOT NULL DEFAULT 0,
  width VARCHAR(20) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_entity_fields_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  CONSTRAINT fk_entity_fields_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_entity_field_code (entity_id, code),
  INDEX idx_entity_fields_display_order (entity_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REGISTROS DINÂMICOS (dados de entidades)
CREATE TABLE IF NOT EXISTS entity_records (
  id CHAR(36) PRIMARY KEY,
  entity_id CHAR(36) NOT NULL,
  data LONGTEXT NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_entity_records_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  CONSTRAINT fk_entity_records_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_entity_records_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entity_records_entity (entity_id),
  INDEX idx_entity_records_created_by (created_by),
  INDEX idx_entity_records_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED: Criar entidades base do ERP

-- Entidade: Cliente
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'cliente',
  'Cliente',
  'Cadastro de clientes',
  'master',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'cliente');

-- Entidade: Fornecedor
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'fornecedor',
  'Fornecedor',
  'Cadastro de fornecedores',
  'master',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'fornecedor');

-- Entidade: Produto
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'produto',
  'Produto',
  'Cadastro de produtos',
  'master',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'produto');

-- Entidade: Orçamento
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'orcamento',
  'Orçamento',
  'Orçamentos de venda',
  'transaction',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'orcamento');

-- Entidade: Pedido
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'pedido_venda',
  'Pedido de Venda',
  'Pedidos de clientes',
  'transaction',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'pedido_venda');

-- Entidade: Ordem de Produção
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'ordem_producao',
  'Ordem de Produção',
  'Ordens de produção',
  'transaction',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'ordem_producao');

-- Criar campos da entidade "cliente"
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'codigo', 'Código', 'text', TRUE, 1
FROM entities e WHERE e.code = 'cliente'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'codigo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'razao_social', 'Razão Social', 'text', TRUE, 2
FROM entities e WHERE e.code = 'cliente'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'razao_social');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'cnpj_cpf', 'CNPJ/CPF', 'text', FALSE, 3
FROM entities e WHERE e.code = 'cliente'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'cnpj_cpf');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'email', 'Email', 'email', FALSE, 4
FROM entities e WHERE e.code = 'cliente'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'email');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'telefone', 'Telefone', 'text', FALSE, 5
FROM entities e WHERE e.code = 'cliente'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'telefone');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'status', 'Status', 'select', FALSE, 6
FROM entities e WHERE e.code = 'cliente'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'status');

-- Criar campos da entidade "produto"
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'codigo', 'Código', 'text', TRUE, 1
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'codigo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'descricao', 'Descrição', 'text', TRUE, 2
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'descricao');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'unidade', 'Unidade', 'select', FALSE, 3
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'unidade');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'preco_venda', 'Preço Venda', 'decimal', FALSE, 4
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'preco_venda');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'estoque_minimo', 'Estoque Mínimo', 'integer', FALSE, 5
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'estoque_minimo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'status', 'Status', 'select', FALSE, 6
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'status');

-- Entidade: Máquina
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'maquina',
  'Máquina',
  'Máquinas e equipamentos industriais',
  'master',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'maquina');

-- Criar campos da entidade "maquina"
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'codigo', 'Código', 'text', TRUE, 1
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'codigo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'descricao', 'Descrição', 'text', TRUE, 2
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'descricao');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'tipo', 'Tipo', 'text', FALSE, 3
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'tipo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'fabricante', 'Fabricante', 'text', FALSE, 4
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'fabricante');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'modelo', 'Modelo', 'text', FALSE, 5
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'modelo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'ano', 'Ano', 'integer', FALSE, 6
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'ano');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'setor', 'Setor', 'text', FALSE, 7
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'setor');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'status', 'Status', 'select', FALSE, 8
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'status');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'ultima_manutencao', 'Últ. Manutenção', 'date', FALSE, 9
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'ultima_manutencao');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'proxima_manutencao', 'Próx. Manutenção', 'date', FALSE, 10
FROM entities e WHERE e.code = 'maquina'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'proxima_manutencao');

-- Entidade: Apontamento (histórico de apontamentos)
INSERT IGNORE INTO entities (id, code, name, description, type, is_system)
SELECT 
  UUID(),
  'apontamento',
  'Apontamento',
  'Apontamentos de produção',
  'transaction',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'apontamento');

-- Criar campos da entidade "apontamento"
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'op_id', 'OP', 'relation', TRUE, 1
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'op_id');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'etapa', 'Etapa', 'text', TRUE, 2
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'etapa');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'setor', 'Setor', 'text', FALSE, 3
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'setor');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'operador', 'Operador', 'text', TRUE, 4
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'operador');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'quantidade', 'Quantidade', 'number', TRUE, 5
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'quantidade');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'refugo', 'Refugo', 'number', FALSE, 6
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'refugo');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'observacao', 'Observação', 'textarea', FALSE, 7
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'observacao');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'hora_inicio', 'Hora Início', 'datetime', FALSE, 8
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'hora_inicio');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'hora_fim', 'Hora Fim', 'datetime', FALSE, 9
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'hora_fim');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'status', 'Status', 'select', FALSE, 10
FROM entities e WHERE e.code = 'apontamento'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'status');
