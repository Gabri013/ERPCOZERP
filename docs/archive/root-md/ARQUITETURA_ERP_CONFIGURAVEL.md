# Arquitetura ERP Configurável

## Objetivo
Transformar o ERP em uma plataforma metadata-driven, onde entidades, campos, regras, workflows, telas e permissões são configurados pela interface, sem alteração de código nem acesso direto ao banco.

## Camadas

### 1. Metadados
Responsável por definir:
- entidades
- campos dinâmicos
- relacionamentos
- máscaras e validações
- regras de negócio
- workflows
- permissões por ação, campo e etapa
- versionamento e rollback

### 2. Motor de Execução
Executa os metadados em runtime:
- valida registros
- aplica regras IF/THEN
- calcula transições de workflow
- resolve permissões
- emite eventos de auditoria

### 3. API Genérica
Exponibiliza operações CRUD e ações de domínio por entidade configurada:
- listar
- detalhar
- criar
- editar
- excluir
- submeter para workflow
- aprovar/reprovar
- reverter versão

### 4. UI Dinâmica
Renderiza formulários, tabelas, detalhes e painéis com base no catálogo de metadados.

### 5. Auditoria e Segurança
Registra:
- quem alterou
- o que alterou
- quando alterou
- antes/depois
- versão do metadado usada

## Modelo de Dados Alvo

Entidades principais:
- `entities`
- `entity_fields`
- `entity_relations`
- `records`
- `field_values`
- `rules`
- `rule_conditions`
- `rule_actions`
- `workflows`
- `workflow_steps`
- `workflow_transitions`
- `permissions`
- `audit_logs`
- `config_versions`

## O que já foi implementado no front-end
- camada inicial de metadados com catálogo versionado
- motor básico de regras
- motor básico de workflow
- painel admin inicial para configurar entidades, campos, regras, fluxos e versões
- integração do painel no menu e nas rotas protegidas

## O que ainda falta para ficar produção-grade
- backend real com banco relacional
- API genérica persistida
- autenticação e autorização server-side
- auditoria imutável
- rollback transacional
- relações n:n e lookup dinâmico
- builder visual de telas
- testes automatizados
- fila para regras assíncronas e integrações

## Próximas Fases
1. Criar backend com schema relacional e API genérica.
2. Migrar persistência do front-end de localStorage para API.
3. Implementar editor visual de entidade/campo/regra/workflow.
4. Adicionar auditoria, versionamento e rollback.
5. Conectar produção, estoque, compras e financeiro ao motor de metadados.
