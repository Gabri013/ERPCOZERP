# Base44 ERP — Backend API

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar banco
# 1. Criar banco MySQL
mysql -u root -p < schema.sql

# Copiar .env
cp .env.example .env
# Editar DATABASE_URL no .env

# Executar migrações
npm run migrate

# Iniciar em desenvolvimento
npm run dev
```

## 📁 Estrutura

```
backend/
├── src/
│   ├── config/           # Configurações (database, jwt, etc)
│   ├── middleware/       # Middlewares (auth, audit, errors)
│   ├── routes/           # Rotas da API (REST)
│   ├── services/         # Serviços de negócio
│   │   ├── authService.js
│   │   ├── permissionEngine.js
│   │   ├── ruleEngine.js
│   │   ├── workflowEngine.js
│   │   ├── auditLogger.js
│   │   └── cache.js
│   ├── utils/            # Utilitários (logger, validators)
│   └── index.js          # Entry point (Express)
├── logs/                 # Logs da aplicação
├── schema.sql            # Esquema do banco (MySQL 8.0+)
└── package.json
```

## 🔐 Autenticação & Autorização

- **JWT** com refresh token
- **RBAC** (Role-Based Access Control)
- **ABAC** (Attribute-Based — condições dinâmicas)
- **Workflow** integration (permissão por etapa)

### Roles padrão:

| Role | Descrição |
|------|-----------|
| `master` | Acesso total, único usuário |
| `admin` | Gestão completa |
| `supervisor` | Aprovação e supervisão |
| `operador` | Operação básica |
| `financeiro` | Acesso financeiro |
| `engenharia` | PCP e planejamento |

### Permissões granulares:

```
entity.{entity}.read        # Ler entidade
entity.{entity}.create      # Criar
entity.{entity}.update      # Alterar
entity.{entity}.delete      # Excluir
field.{field}.view          # Ver campo específico
workflow.approve            # Aprovar fluxo
system.config               # Configurar sistema
```

## 📊 API Endpoints

### Auth
- `POST   /api/auth/login`
- `POST   /api/auth/logout`
- `POST   /api/auth/refresh`
- `GET    /api/auth/me`
- `POST   /api/auth/change-password`

### Users
- `GET    /api/users` — lista usuários (filtros, paginação)
- `GET    /api/users/:id`
- `POST   /api/users` — criar usuário
- `PUT    /api/users/:id` — atualizar
- `DELETE /api/users/:id` — desativar
- `GET    /api/users/me/profile` — próprio perfil

### Entidades (Metadados)
- `GET    /api/entities` — lista entidades configuradas
- `GET    /api/entities/:code` — entidade + campos
- `POST   /api/entities` — criar nova entidade (master)
- `PUT    /api/entities/:id` — atualizar
- `DELETE /api/entities/:id` — deletar

### Registros (CRUD dinâmico)
- `GET    /api/records?entity=produto` — lista com filtros
- `GET    /api/records/:id`
- `POST   /api/records` — criar (valida metadados)
- `PUT    /api/records/:id` — atualizar
- `DELETE /api/records/:id` — soft delete

### Workflows
- `GET    /api/workflows` — workflows configurados
- `GET    /api/workflows/:id` — detalhado (+etapas/transições)
- `POST   /api/workflows` — criar workflow
- `POST   /api/workflows/:id/transition` — executar transição

### Regras de Negócio
- `GET    /api/rules` — lista regras
- `GET    /api/rules/:id`
- `POST   /api/rules` — criar regra
- `PUT    /api/rules/:id` — atualizar
- `DELETE /api/rules/:id`
- `POST   /api/rules/:id/execute` — executar manual

### Permissões
- `GET    /api/permissions/roles`
- `GET    /api/permissions/permissions`
- `PUT    /api/permissions/user/:userId/roles` — definir papéis
- `PUT    /api/permissions/role/:roleCode/permissions` — definir permissões do papel
- `POST   /api/permissions/check` — verificar permissão

### Auditoria
- `GET    /api/audit` — logs gerais
- `GET    /api/audit/record/:recordId` — histórico de registro
- `GET    /api/audit/user/:userId` — atividade do usuário
- `GET    /api/audit/access` — logs de acesso
- `GET    /api/audit/versions` — versões de configuração
- `POST   /api/audit/versions` — criar snapshot
- `POST   /api/audit/versions/:id/restore` — restaurar

### Configurações
- `GET    /api/config` — todas configs
- `GET    /api/config/:key`
- `PUT    /api/config/:key` — atualizar

### Produção Industrial
- `GET    /api/production/ops` — lista OPs
- `POST   /api/production/ops` — criar OP
- `PUT    /api/production/ops/:id` — editar OP
- `POST   /api/production/ops/:id/apontamento` — registrar apontamento
- `GET    /api/production/apontamentos/:opId` — lista apontamentos
- `POST   /api/production/consumo` — consumo de estoque

### Estoque
- `GET    /api/estoque` — lista produtos com estoque

### Financeiro
- `GET    /api/financeiro/contas-receber`
- `GET    /api/financeiro/fluxo-caixa?dias=30`

## 🗄️ Banco de Dados

Schema completo em `schema.sql`:

- `users` — usuários
- `roles` — papéis
- `permissions` — permissões
- `user_roles` — usuário x papel
- `role_permissions` — papel x permissão
- `entities` — metadados de entidades (NO-CODE)
- `entity_fields` — campos de cada entidade
- `entity_records` — dados reais (JSON)
- `workflows` — workflows
- `workflow_steps` — etapas
- `workflow_transitions` — transições
- `business_rules` — regras de negócio
- `rule_executions` — execuções (log)
- `audit_logs` — logs de auditoria
- `access_logs` — logs de acesso à API
- `config_versions` — versionamento
- `user_sessions` — sessões ativas

## 🔄 Workflow Engine

Fluxo configurável:

```
Criada → [Aprovção?] → Aprovada → Produção → Concluída
                ↑
          (Reprovada) → Cancelada
```

Transições controladas por `allowed_roles`:
```json
{
  "from_step_code": "criada",
  "to_step_code": "aprovada",
  "allowed_roles": ["supervisor", "gerente"]
}
```

## ⚙️ Rule Engine (IF/THEN)

```javascript
{
  "trigger_event": "on_update",
  "trigger_conditions": [
    { "field": "status", "operator": "==", "value": "aprovada" }
  ],
  "actions": [
    { "type": "send_notification", "message": "Pedido aprovado: {numero}" },
    { "type": "transition_workflow", "step": "producao" }
  ]
}
```

## 🛡️ Segurança

- Senhas com bcrypt (12 rounds)
- JWT com refresh token (7d / 30d)
- Rate limiting (100 req/15min)
- Helmet.js headers
- CORS configurado
- Auditoria completa
- Controle de acesso por papel E por condição (RBAC+ABAC)

## 🚦 Deploy Produção

```bash
# 1. Build
npm run build

# 2. Usar PM2
pm2 start ecosystem.config.js

# 3. Nginx proxy
# Ver config/nginx.conf
```

## 📝 TODO Futuro

- [ ] API de upload de arquivos
- [ ] Webhooks
- [ ] Integração email
- [ ] Dashboard BI
- [ ] API externa REST
- [ ] GraphQL endpoint
