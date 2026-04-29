-- Seed de dados iniciais — apenas inserts não conflictivos
-- Execute após schema.sql

-- 1. Criar entidade "Ordem de Compra" se não existir
INSERT IGNORE INTO entities (id, code, name, description, type, icon, layout, is_system)
SELECT UUID(), 'ordem_compra', 'Ordem de Compra', 'Ordens de compra de fornecedores', 'transaction', 'FileText', '{"columns":["numero","fornecedor","valor_total","status","data_emissao"]}', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'ordem_compra');

-- 2. Criar entidade "Movimento de Estoque" se não existir
INSERT IGNORE INTO entities (id, code, name, description, type, icon, layout, is_system)
SELECT UUID(), 'movimento_estoque', 'Movimento de Estoque', 'Todas as movimentações', 'transaction', 'ArrowUpDown', '{"columns":["tipo","produto","quantidade","data","responsavel"]}', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'movimento_estoque');

-- 3. Criar entidade "Conta a Receber" se não existir
INSERT IGNORE INTO entities (id, code, name, description, type, icon, layout, is_system)
SELECT UUID(), 'conta_receber', 'Conta a Receber', 'Contas a receber de clientes', 'transaction', 'CreditCard', '{"columns":["cliente","valor","data_vencimento","status","forma_pagamento"]}', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'conta_receber');

-- 4. Criar entidade "Conta a Pagar" se não existir
INSERT IGNORE INTO entities (id, code, name, description, type, icon, layout, is_system)
SELECT UUID(), 'conta_pagar', 'Conta a Pagar', 'Contas a pagar a fornecedores', 'transaction', 'CreditCard', '{"columns":["fornecedor","valor","data_vencimento","status"]}', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'conta_pagar');

-- 5. Criar entidade "Apontamento" se não existir
INSERT IGNORE INTO entities (id, code, name, description, type, icon, layout, is_system)
SELECT UUID(), 'apontamento', 'Apontamento de Produção', 'Apontamentos de OP', 'transaction', 'Clipboard', '{"columns":["op_numero","etapa","quantidade","refugo","data_apontamento"]}', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entities WHERE code = 'apontamento');

-- 6. Criar campos da entidade "ordem_compra"
-- (Se entidade existe)
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, required, display_order)
SELECT UUID(), e.id, 'numero', 'Número', 'text', TRUE, 1
FROM entities e WHERE e.code = 'ordem_compra'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'numero');

INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, data_type_params, required, display_order)
SELECT UUID(), e.id, 'fornecedor_id', 'Fornecedor', 'reference', JSON_OBJECT('entity', 'fornecedor'), TRUE, 2
FROM entities e WHERE e.code = 'ordem_compra'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'fornecedor_id');

-- 7. Adicionar campo "localizacao" para produto se não existir
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, display_order)
SELECT UUID(), e.id, 'localizacao', 'Localização', 'text', 10
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'localizacao');

-- 8. Adicionar campo "ncm" se não existir
INSERT IGNORE INTO entity_fields (id, entity_id, code, label, data_type, display_order)
SELECT UUID(), e.id, 'ncm', 'NCM', 'text', 11
FROM entities e WHERE e.code = 'produto'
  AND NOT EXISTS (SELECT 1 FROM entity_fields WHERE entity_id = e.id AND code = 'ncm');

-- FIM DO SEED
