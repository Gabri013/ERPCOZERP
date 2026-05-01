# 🏭 BASE44 ERP INDUSTRIAL — SISTEMA NO-CODE COMPLETO

## 📋 SUMÁRIO

1. [Arquitetura](#arquitetura)
2. [Fases Implementadas](#fases-implementadas)
3. [Backend API](#backend-api)
4. [Frontend Dinâmico](#frontend-dinâmico)
5. [Security & RBAC](#security--rbac)
6. [Workflow Engine](#workflow-engine)
7. [Rule Engine](#rule-engine)
8. [Metadados](#metadados)
9. [Instalação](#instalação)
10. [Uso](#uso)
11. [Testes](#testes)
12. [Próximos Passos](#próximos-passos)

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ DynamicPage │  │   Builder   │  │     Reports/BI      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST/WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                  Node.js + Express API                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │   Auth   │  │ Permissions│ │   Rules  │  │ Workflow    │  │
│  │ Service  │  │  Engine   │  │ Engine   │  │  Engine     │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  MySQL 8.0+ Database                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  users | roles | permissions | entity_records     │    │
│  │  workflows | business_rules | audit_logs           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Padrões arquiteturais:**
- **RBAC + ABAC**: Permissões granulares com condições dinâmicas
- **CQRS**: Separação cladística
- **Metadados-Driven**: Tudo dinâmico via banco
- **Event-driven**: Workflow dispara eventos
- **Auditoria completa**: Log imutável

---

## ✅ FASES IMPLEMENTADAS

### FASE 1 — FUNDAÇÃO MySQL ✅

**Schema completo** (`backend/schema.sql`):

- `users` — Autenticação com bcrypt
- `roles` / `user_roles` — Perfis
- `permissions` / `role_permissions` — RBAC
- `entities` — Metadados de entidades
- `entity_fields` — Campos configuráveis
- `entity_records` — Dados dinâmicos (JSON)
- `workflows` / `workflow_steps` / `workflow_transitions` — Fluxos
- `business_rules` / `rule_executions` — Motor de regras
- `audit_logs` / `access_logs` — Auditoria
- `config_versions` — Versionamento
- `user_sessions` — Controle de sessão

**Características:**
- UUIDs como PK (distribuição-friendly)
- JSON columns para flexibilidade
- Índices otimizados
- Foreign keys com CASCADE
- Triggers para auditoria automática
- Views utilitárias

### FASE 2 — BACKEND DINÂMICO ✅

**Serviços implementados:**

| Serviço | Responsabilidade |
|---------|------------------|
| `authService.js` | Autenticação JWT + bcrypt |
| `permissionEngine.js` | Motor RBAC + ABAC |
| `ruleEngine.js` | Execução IF/THEN |
| `workflowEngine.js` | Transições controladas |
| `auditLogger.js` | Logs imutáveis |
| `cache.js` | Cache Redis (opcional) |

**Rotas implementadas** (`backend/src/routes/`):

- `auth.js` — Login/logout/refresh/me
- `users.js` — CRUD usuários + papéis
- `entities.js` — CRUD entidades + campos
- `records.js` — CRUD genérico (baseado em entidade)
- `workflows.js` — Configuração + transição
- `rules.js` — CRUD + execução regras
- `permissions.js` — Gestão de permissões
- `audit.js` — Logs + versionamento
- `config.js` — Configurações do sistema
- `production.js` — OP, apontamento, consumo
- `estoque.js` — Controle de estoque
- `financeiro.js` — Contas a receber/pagar

### FASE 3 — FRONTEND DINÂMICO ✅

**Componentes principais:**

| Componente | Função |
|------------|--------|
| `DynamicEntityPage.jsx` | Página completa gerada a partir de entidade |
| `DynamicFormModal.jsx` | Formulário dinâmico (CRUD) |
| `DynamicField.jsx` | Campo individual (type-aware rendering) |
| `MetadataStudio.jsx` | Painel master — cria entidades e campos |
| `WorkflowBuilder.jsx` | Configuração visual de fluxos |

**Tecnologias:**
- React Hook Form + Zod (validação dinâmica)
- Zustand (estado global)
- Tailwind CSS (estilo)
- Radix UI (componentes acessíveis)
- React Router (navegação)

### FASE 4 — SEGURANÇA ✅

**Implementado:**
- JWT com refresh token
- Bcrypt (12 rounds)
- Rate limiting (100 req / 15min)
- Helmet.js headers
- CORS configurado
- Auditoria de todas actions
- Logs de acesso
- Controle de sessão (user_sessions)
- Validação de propriedade (ownership)
- Workflow bloqueia transições ilegais

### FASE 5 — WORKFLOW ENGINE ✅

**Funcionalidades:**
- Transições controladas por papel (`allowed_roles`)
- Condições customizadas (`condition_expression`)
- Ações pós-transição (`post_transition_actions`)
- Histórico imutável (`workflow_history`)
- Notificações
- Integração com regras de negócio

**Exemplo de configuração:**
```json
{
  "entity_id": "ordem_producao",
  "is_active": true,
  "steps": [
    { "code": "aberta", "label": "Aberta", "is_initial": true, "approver_roles": ["pcp"] },
    { "code": "em_andamento", "label": "Produção", "approver_roles": ["producao"] },
    { "code": "concluida", "label": "Concluída", "is_final": true, "approver_roles": ["gerente"] }
  ],
  "transitions": [
    { "from": "aberta", "to": "em_andamento", "allowed_roles": ["pcp", "supervisor"] }
  ]
}
```

### FASE 6 — RULE ENGINE ✅

**Ações suportadas:**
- `set_field` — Define valor de campo
- `increment` / `decrement` — Contadores
- `send_notification` — Notificação
- `create_record` — Cria registro relacionado
- `update_related` — Atualiza relacionados
- `call_webhook` — HTTP callback
- `transition_workflow` — Avança workflow

**Exemplo:**
```json
{
  "entity_id": "produto",
  "trigger_event": "on_update",
  "trigger_conditions": [
    { "field": "estoque_atual", "operator": "<", "value": "{estoque_minimo}" }
  ],
  "actions": [
    { "type": "send_notification", "message": "Estoque crítico: {codigo}" }
  ]
}
```

---

## 🔐 SEGURANÇA & RBAC

### Modelo de Permissões

```
entity.{entity}.{action}     → Ler/Criar/Alterar/Excluir entidade
field.{field}.{action}        → Ver/Editar campo específico
workflow.{action}             → Aprovar/Reprovar fluxo
system.{action}               → Configurar sistema
user.{action}                 → Gerenciar usuários
```

**ABAC (Attribute-Based):**
```javascript
// Permissão com condição
{
  "code": "entity.pedido.update",
  "conditions": [
    { "field": "status", "operator": "==", "value": "rascunho" },
    { "field": "created_by", "operator": "==", "value": "{currentUserId}" }
  ]
}
// Apenas autoriza edição se:
// 1. Pedido está em rascunho
// 2. Usuário é o criador
```

### Middlewares

| Middleware | Uso |
|------------|-----|
| `authenticateToken` | Verifica JWT + sessão ativa |
| `requirePermission` | Verifica permissão (RBAC) |
| `requireMaster` | Apenas master |
| `requireEmailVerified` | Email verificado obrigatório |
| `auditMiddleware` | Loga todas requests |

---

## 📊 API ENDPOINTS

### Autenticação
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/change-password
```

### CRUD Genérico
```
GET    /api/records?entity=produto
GET    /api/records/:id
POST   /api/records          (entity_id + data)
PUT    /api/records/:id
DELETE /api/records/:id?force=false
```

### Metadados
```
GET    /api/entities              (lista todas entidades)
GET    /api/entities/:code        (uma entidade + campos)
POST   /api/entities              (criar entidade)
PUT    /api/entities/:id
DELETE /api/entities/:id
POST   /api/entities/:id/fields   (adicionar campo)
```

### Workflow
```
GET    /api/workflows
GET    /api/workflows/:id
POST   /api/workflows
POST   /api/workflows/:id/transition
```

### Regras
```
GET    /api/rules
POST   /api/rules
POST   /api/rules/:id/execute    (execução manual)
```

### Auditoria
```
GET    /api/audit
GET    /api/audit/record/:id
GET    /api/audit/user/:userId
GET    /api/audit/access
GET    /api/audit/versions
POST   /api/audit/versions
```

### Produção
```
GET    /api/production/ops
POST   /api/production/ops
PUT    /api/production/ops/:id
POST   /api/production/ops/:id/apontamento
POST   /api/production/consumo
```

---

## 🎨 FRONTEND — PÁGINAS DINÂMICAS

### Rota Universal

```
/entidades/:codigo   →  EntityDynamicPage
```

Exemplo:
```
/entidades/produto          → Lista produtos
/entidades/cliente          → Lista clientes
/entidades/ordem_producao   → Lista OPs
```

**Componentes:**
- `DynamicEntityPage.jsx` — Página principal
- `DynamicField.jsx` — Campo dinâmico
- `DynamicFormModal.jsx` — Modal CRUD
- `MetadataStudio.jsx` — Painel master
- `WorkflowBuilder.jsx` — Fluxos

---

## 🔄 WORKFLOW EM AÇÃO

**Exemplo: Ordem de Produção**

```
1. Criada por PCP
   ↓ Regra: "Se valor > R$ 50k" → status = "Aguardando Aprovação"
   
2. Aprovação por Gerente
   ↓ Workflow: transição "criada" → "aprovada"
   
3. Produção (Operador)
   ↓ Workflow: "aprovada" → "em_andamento"
   
4. Apontamentos (etapas)
   ↓ Cada etapa registra consumo de estoque
   
5. Conclusão
   ↓ Todas etapas concluídas → "concluida"
   ↓ Regra: "Se status == concluida" → baixa estoque final
```

**Auditoria:** Todas transições logadas em `workflow_history`

---

## ⚙️ REGRAS DE NEGÓCIO

### Estrutura de Regra

```javascript
{
  "entity_id": "...",
  "code": "rule_estoque_reabastecer",
  "name": "Reposição automática",
  "trigger_event": "on_update",      // on_create, on_update, on_delete
  "priority": 10,                     // menor = executa primeiro
  "trigger_conditions": [
    { "field": "estoque_atual", "operator": "<", "value": "{estoque_minimo}" }
  ],
  "actions": [
    {
      "type": "send_notification",
      "message": "Estoque baixo: {codigo}"
    },
    {
      "type": "create_record",
      "target": "ordem_compra",
      "data": {
        "produto_id": "{id}",
        "quantidade": "{estoque_minimo}",
        "tipo": "reposicao"
      }
    }
  ],
  "stop_processing": false
}
```

**Operadores suportados:**
- `==`, `===`, `!=`, `>`, `>=`, `<`, `<=`
- `contains`, `includes`, `empty`, `not_empty`
- `between` (min/max)
- `in` / `not_in`
- `regex`

---

## 🗃️ MODELO DE DADOS COMPLETO

### users
```
id (UUID PK)
email (UNIQUE)
password_hash (bcrypt)
full_name
active
email_verified
failed_login_attempts
locked_until
last_login_at
mfa_enabled
created_at
updated_at
```

### roles
```
id (UUID PK)
code (UNIQUE)    → 'master', 'admin', 'supervisor', 'operador'
name
description
is_system        → protege contra delete
```

### permissions
```
id (UUID PK)
code              → 'entity.produto.read'
name
category          → 'entity', 'field', 'action', 'workflow'
type              → 'read', 'create', 'update', 'delete', 'execute'
target_entity
target_field
scope             → 'global', 'own', 'team'
```

### entity_fields
```
id (UUID PK)
entity_id (FK)
code              → 'codigo', 'descricao', 'preco_custo'
label             → 'Código', 'Descrição', 'Preço de Custo'
data_type         → 'text', 'number', 'select', 'reference', 'date'
data_type_params  → JSON (options, reference)
required
unique_field
readonly
hidden
validation_rules → JSON (min, max, pattern, regex)
display_order
```

### entity_records
```
id (UUID PK)
entity_id (FK)
data              → JSON com todos os valores
created_by (FK)
created_at
updated_at
deleted_at        → soft delete
version
```

---

## 🚀 INSTALAÇÃO & EXECUÇÃO

### Backend

```bash
cd backend

# Instalar
npm install

# Configurar
cp .env.example .env
# Editar DATABASE_URL

# Criar banco
mysql -u root -p < schema.sql

# Seed dados iniciais
npm run seed

# Dev
npm run dev

# Production build
npm run build
pm2 start ecosystem.config.js
```

### Frontend

```bash
# Instalar
npm install

# Dev
npm run dev

# Build
npm run build
npx serve dist
```

### Docker (recomendado)

```bash
# Backend
docker-compose up -d mysql redis
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

---

## 🧪 TESTES

### Testes unitários (backend)

```bash
cd backend
npm test
```

### Validação manual

1. **Auth:**
   - Login com usuário master
   - Token JWT gerado
   - Refresh token funciona
   - Logout invalida sessão

2. **Metadados:**
   - Criar entidade "Teste"
   - Adicionar campos: text, number, select
   - Formulário dinâmico renderiza
   - Salvar dados funciona

3. **Permissões:**
   - User sem permissão não vê entidade
   - Não consegue criar/editar/deletar
   - Log de acesso negado registrado

4. **Workflow:**
   - Criar workflow com 3 etapas
   - Transição bloqueada se papel errado
   - Histórico registrado
   - Notificação disparada

5. **Rule Engine:**
   - Regra de estoque crítico
   - Ação executada (notificação, create)
   - Log de execução

6. **Auditoria:**
   - Toda alteração logada
   - Before/after preservado
   - Histórico recuperável

---

## 📱 EXEMPLOS DE USO

### 1. Criar Nova Entidade (Via UI)

**Metadata Studio → Nova Entidade**

| Campo | Valor |
|-------|-------|
| Código | `equipamento` |
| Nome | `Equipamento` |
| Tipo | `master` |
| Ícone | `Box` |

**Adicionar Campos:**

| Código | Label | Tipo | Obrigatório |
|--------|-------|------|-------------|
| `tag` | `Tag` | `text` | ✅ |
| `descricao` | `Descrição` | `textarea` | ✅ |
| `modelo` | `Modelo` | `text` | ❌ |
| `status` | `Status` | `select` | ✅ |
| opcoes | `Ativo, Inativo, Manutenção` |

**Resultado:**
- Nova tabela `entity_records` com dados de equipamentos
- Nova rota `/entidades/equipamento`
- Formulário dinâmico auto-gerado
- Tabela dinâmica com filtros

### 2. Criar Workflow (Via UI)

**Workflow Builder → Fluxo de OP**

Etapas:
1. `aberta` — PCP
2. `aprovada` — Gerente
3. `producao` — Operador
4. `concluida` — Quality

Transições:
- `aberta → aprovada` (apenas gerente)
- `aprovada → producao` (apenas pcp)
- `producao → concluida` (apenas qualidade)

### 3. Criar Regra (Via UI)

**Se estoque do produto baixo E tipo = "matéria-prima":**
```
IF:  estoque_atual < estoque_minimo
THEN: 
  - Notificar compras
  - Criar ordem de compra automática
```

---

## 🏆 DIFERENCIAIS DO SISTEMA

### 1. 100% Configurável
Nenhuma linha de código alterada para:
- Nova entidade
- Novo campo
- Novo workflow
- Nova regra

### 2. Segurança por Padrão
- RBAC + ABAC
- Auditoria completa
- Logs de acesso
- Sessões controladas
- Rate limiting

### 3. Escalável
- MySQL + índices otimizados
- Cache Redis
- Paginação nativa
- Busca full-text opcional
- Horizontal ready

### 4. Industrial Ready
- Controle de produção
- MRP (planejamento)
- Apontamento
- Rastreabilidade
- Consumo real vs previsto

### 5. No-Code Builder
- Metadata Studio
- Workflow visual drag-n-drop (futuro)
- Rule builder visual
- Dashboard customizável

---

## 🎯 PRÓXIMOS PASSOS

### Curto Prazo
- [ ] Drag-and-drop workflow builder
- [ ] Dashboard BI (gráficos customizáveis)
- [ ] API externa REST (webhooks outbound)
- [ ] MFA (2FA)
- [ ] Email/SMTP integrado
- [ ] Documentos (PDF, etiquetas)

### Médio Prazo
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)
- [ ] Integração bancária (PSP)
- [ ] Notificações push
- [ ] API GraphQL

### Longo Prazo
- [ ] AI/ML para previsão de demanda
- [ ] IoT — máquinas conectadas
- [ ] Reconhecimento óptico (OCR)
- [ ] Assinatura digital
- [ ] Multi-empresa (SaaS)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `backend/README.md` — Documentação API completa
- `backend/schema.sql` — Modelo de dados
- `src/components/metadata/` — Frontend dinâmico
- `src/lib/metadata/` — Serviços de metadados

## 🆘 SUPORTE

Para dúvidas, reportar issues no repositório do projeto.

---

**Versão:** 2.6.0  
**Última atualização:** Abril 2026  
**Autor:** Base44 Team  

📧 contato@base44.com.br | 🌐 base44.com.br
