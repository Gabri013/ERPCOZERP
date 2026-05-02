# ERP COZINCA INOX — Relatório de Implementação

> **Gerado em:** 02/05/2026  
> **Projeto:** ERPCOZERP — Sistema ERP Completo para Indústria de Equipamentos em Aço Inox  
> **Stack:** Node.js + TypeScript + Prisma + PostgreSQL (backend) | React + Tailwind CSS + shadcn/ui (frontend)

---

## Resumo Executivo

O ERP COZINCA INOX foi construído com **11 módulos funcionais**, cobrindo todo o ciclo produtivo e administrativo de uma indústria de equipamentos em aço inox. O sistema é inspirado no Nomus ERP e foi adaptado para as necessidades específicas do setor.

### Status por Módulo

| # | Módulo | Status | Backend | Frontend |
|---|--------|--------|---------|----------|
| 1 | Cadastros Básicos | ✅ Completo | `/api/sales`, `/api/purchases`, `/api/stock` | Clientes, Fornecedores, Produtos, Tabela de Preços |
| 2 | Estoque | ✅ Completo | `/api/stock` | Produtos, Movimentações, Inventário, Endereçamento |
| 3 | Vendas e Orçamentos | ✅ Completo | `/api/sales` | SaleOrders (Kanban+Lista), Quotes, PriceTables, Relatórios |
| 4 | Compras | ✅ Completo | `/api/purchases` | Fornecedores, OCs, Cotações, Recebimentos |
| 5 | Produção | ✅ Completo | `/api/work-orders`, `/api/production` | OPs, PCP, Kanban, Chão de Fábrica, Roteiros, Máquinas, Apontamento |
| 6 | CRM | ✅ Completo | `/api/crm` | Pipeline Kanban, Leads, Oportunidades, Atividades, Dashboard |
| 7 | RH | ✅ Completo | `/api/hr` | Funcionários, Ponto Eletrônico, Férias, Folha de Pagamento |
| 8 | Financeiro | ✅ Completo | `/api/financial`, `/api/financeiro` | Contas a Receber/Pagar, Fluxo de Caixa, DRE, Conciliação Bancária, Aprovação de Pedidos |
| 9 | Fiscal | ✅ Completo (mock) | `/api/fiscal` | NF-e, Consulta NF-e, SPED |
| 10 | Engenharia | ✅ Completo | `/api/products`, `/api/cozinca` | BOM, Pendentes BOM, Projetos, Visualizador 3D |
| 11 | Configurações | ✅ Completo | `/api/platform`, `/api/entities`, `/api/workflows` | Empresa, Usuários, Parâmetros, Metadata Studio, Workflow Builder, Modelo OP |

---

## Módulo 1 — Cadastros Básicos

### Backend
- **Clientes** (`/api/sales/customers`) — CRUD completo com `Customer` Prisma model
- **Fornecedores** (`/api/purchases/suppliers`) — CRUD completo com `Supplier` Prisma model, incluindo `PATCH /suppliers/:id`
- **Produtos** (`/api/stock/products`) — CRUD completo com catálogo, BOM, roteiro, ficha técnica
- **Tabela de Preços** (`/api/sales/price-tables`) — por produto, com vigência

### Frontend
- `/vendas/clientes` — `Clientes.jsx` (lista, criação, edição, detalhe)
- `/compras/fornecedores` — `Fornecedores.jsx` (usa `/api/purchases/suppliers`)
- `/estoque/produtos` — `ProductsPage.tsx` (catálogo completo)
- `/estoque/produtos/novo` e `/estoque/produtos/:id` — `ProductForm.tsx`
- `/vendas/tabela-precos` — `PriceTablesPage.tsx`

### Modelos Prisma
```
Customer, Supplier, Product, ProductLocation, PriceTable, PriceTableItem
```

---

## Módulo 2 — Estoque

### Backend (`/api/stock`)
| Endpoint | Descrição |
|----------|-----------|
| `GET/POST /products` | Listagem e criação de produtos |
| `GET/PATCH/DELETE /products/:id` | Detalhe, edição e inativação |
| `GET/POST /movements` | Listagem e criação de movimentações |
| `GET/POST /locations` | Endereçamento (armazéns, prateleiras, posições) |
| `GET/POST/PATCH /inventory-counts` | Inventário cíclico |
| `POST /inventory-counts/:id/approve` | Consolidação e ajuste automático |

### Frontend
- `/estoque/produtos` — Produtos com estoque atual calculado (`totalQty`)
- `/estoque/movimentacoes` — Entradas, saídas, transferências, ajustes
- `/estoque/inventario` — Inventário cíclico com contagem e aprovação
- `/estoque/enderecamento` — Mapa de posições com ajuste de saldo

### Regras de Negócio
- Custo médio ponderado atualizado no recebimento de compras
- Movimentação de estoque gerada automaticamente ao receber OC
- Inventário cíclico cria movimentos de `AJUSTE` ao aprovar

---

## Módulo 3 — Vendas e Orçamentos

### Backend (`/api/sales`)
| Endpoint | Descrição |
|----------|-----------|
| `GET/POST /customers` | Clientes |
| `GET/POST /sale-orders` | Pedidos de venda |
| `GET /sale-orders/:id` | Detalhe do pedido |
| `PATCH /sale-orders/:id` | Edição |
| `POST /sale-orders/:id/approve` | Aprovação |
| `PATCH /sale-orders/:id/kanban` | Mover no Kanban |
| `POST /sale-orders/:id/generate-work-order` | Gerar OP automaticamente |
| `GET/POST /quotes` | Orçamentos |
| `PATCH /quotes/:id` | Edição |
| `POST /quotes/:id/convert` | Converter em pedido de venda |
| `GET/POST /price-tables` | Tabelas de preço |
| `GET /reports/summary` | Relatório de vendas |

### Frontend
- `/vendas/pedidos` — `SaleOrdersPage.tsx` — Kanban + tabela, aprovação, geração de OP
- `/vendas/orcamentos` — `QuotesPage.tsx` — lista, aprovação, conversão em pedido
- `/vendas/tabela-precos` — `PriceTablesPage.tsx`
- `/vendas/relatorios` — `SalesReportPage.tsx` — gráficos de receita e status

### Integração
- Ao aprovar um pedido de venda e clicar "Gerar OP", uma Ordem de Produção é criada automaticamente via `POST /api/sales/sale-orders/:id/generate-work-order`

---

## Módulo 4 — Compras

### Backend (`/api/purchases`)
| Endpoint | Descrição |
|----------|-----------|
| `GET/POST /suppliers` | Fornecedores |
| `PATCH /suppliers/:id` | Editar fornecedor |
| `GET/POST /orders` | Ordens de compra |
| `GET /orders/:id` | Detalhe da OC |
| `POST /orders/:id/send` | Enviar OC ao fornecedor (muda status para `ENVIADO`) |
| `POST /orders/:id/receive` | Receber mercadoria (gera movimentação de estoque) |

### Frontend
- `/compras/fornecedores` — `Fornecedores.jsx` — CRUD via `/api/purchases/suppliers`
- `/compras/ordens-compra` — `OrdensCompra.jsx` — fluxo completo (Rascunho → Enviado → Recebido)
- `/compras/cotacoes` — `Cotacoes.jsx` — registro via EntityRecord
- `/compras/recebimentos` — `Recebimentos.jsx` — lista OCs com status de recebimento

### Workflow Completo
1. Criar OC (`RASCUNHO`)
2. Enviar ao fornecedor (`ENVIADO`)
3. Receber mercadoria → `PARCIALMENTE_RECEBIDO` ou `RECEBIDO`
4. Movimentação de estoque do tipo `ENTRADA` gerada automaticamente

### Serviço TypeScript
`src/services/purchasesApi.ts` — wraps todos os endpoints `/api/purchases/*` com tipagem forte

---

## Módulo 5 — Produção

### Backend (`/api/work-orders`, `/api/production`)
| Endpoint | Descrição |
|----------|-----------|
| `GET/POST /api/work-orders` | Ordens de Produção |
| `GET /api/work-orders/:id` | Detalhe da OP |
| `PATCH /api/work-orders/:id` | Atualizar status/progresso |
| `GET/POST /api/production/machines` | Máquinas |
| `GET/POST /api/production/routings` | Roteiros de Produção |
| `GET /api/production/pcp` | PCP — sequenciamento por prazo |
| `GET /api/production/kanban` | Quadro Kanban |
| `POST /api/production/kanban/reorder` | Reordenar Kanban |
| `GET /api/production/floor` | Chão de fábrica snapshot |
| `POST /api/production/appointments` | Apontamento de produção |

### Frontend
- `/producao/ordens` — `OrdensProducao.jsx` — lista e gestão de OPs
- `/producao/ordens/:id` — `DetalheOP.jsx` — detalhe completo, histórico, itens BOM
- `/producao/pcp` — `PCP.jsx` — gráfico de Gantt e sequenciamento
- `/producao/kanban` — `KanbanProducao.jsx` — quadro visual (drag-and-drop)
- `/producao/chao-fabrica` — `ChaoDeFabrica.jsx` — painel de operador
- `/producao/roteiros` — `Roteiros.jsx` — etapas de produção por produto
- `/producao/maquinas` — `Maquinas.jsx` — cadastro de máquinas e equipamentos
- `/producao/apontamento/:opId?` — `Apontamento.jsx` — registro de produção pelo operador

### Integração Completa
- OP criada automaticamente a partir de pedido de venda aprovado
- Apontamento baixa insumos da BOM e atualiza estoque
- Finalização da OP aumenta estoque do produto acabado

---

## Módulo 6 — CRM

### Backend (`/api/crm`)
| Endpoint | Descrição |
|----------|-----------|
| `GET /pipeline` | Funil de oportunidades por estágio |
| `POST /pipeline/:id/move` | Mover oportunidade de estágio |
| `GET /activities/today` | Atividades do dia |
| `GET /dashboard` | KPIs: leads, oportunidades, atividades |

Leads, Oportunidades e Atividades são registrados via EntityRecord (`/api/records`) com entidades `crm_lead`, `crm_oportunidade`, `crm_atividade`.

### Frontend
- `/crm/pipeline` — `Pipeline.jsx` — Kanban com drag-and-drop por estágio
- `/crm/leads` — `Leads.jsx` — lista e cadastro de leads
- `/crm/oportunidades` — `Oportunidades.jsx` — funil de vendas com valor e probabilidade
- `/crm/atividades` — `Atividades.jsx` — tarefas, ligações, e-mails
- `/crm/dashboard` — `CrmDashboard.jsx` — KPIs e gráficos

---

## Módulo 7 — RH

### Backend (`/api/hr`)
| Endpoint | Descrição |
|----------|-----------|
| `GET/POST /employees` | Funcionários |
| `PATCH /employees/:id` | Editar funcionário |
| `GET/POST /time-entries` | Registros de ponto |
| `GET /time-entries/report` | Relatório de horas |
| `GET/POST /leave-requests` | Solicitações de férias |
| `PATCH /leave-requests/:id` | Aprovação/rejeição |
| `GET/POST /payroll-runs` | Rodadas de folha de pagamento |
| `GET /payroll-runs/:id/lines` | Linhas da folha |

### Frontend
- `/rh/funcionarios` — `Funcionarios.jsx` — cadastro completo com dados de admissão, setor, cargo
- `/rh/ponto` — `Ponto.jsx` — registro web entrada/saída e relatório de horas
- `/rh/ferias` — `Ferias.jsx` — solicitação e aprovação de férias
- `/rh/folha-pagamento` — `FolhaPagamento.jsx` — cálculo simplificado e exportação

### Modelos Prisma
```
Employee, TimeEntry, LeaveRequest, PayrollRun, PayrollLine
```

---

## Módulo 8 — Financeiro

### Backend
- **Aggregados** (`/api/financial`): cashflow, DRE, conciliação bancária
- **Contas** (`/api/financeiro`): contas a receber e pagar via EntityRecord

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/financial/cashflow` | Fluxo de caixa previsto vs realizado |
| `GET /api/financial/dre` | DRE (Demonstrativo de Resultado) |
| `GET /api/financial/conciliation` | Conciliação bancária |

### Frontend
- `/financeiro/receber` — `ContasReceber.jsx` — AR com baixa parcial/total
- `/financeiro/pagar` — `ContasPagar.jsx` — AP com vencimento e pagamento
- `/financeiro/fluxo-caixa` — `FluxoCaixa.jsx` — gráfico de barras e linha com BarChart/LineChart (Recharts)
- `/financeiro/dre` — `DRE.jsx` — receitas, custos, despesas, resultado
- `/financeiro/conciliacao-bancaria` — `ConciliacaoBancaria.jsx` — importação CSV e confronto
- `/financeiro/relatorio` — `RelatorioFinanceiro.jsx` — sumário financeiro
- `/financeiro/aprovacao-pedidos` — `AprovacaoPedidos.jsx` — workflow de aprovação com limite de crédito

---

## Módulo 9 — Fiscal

### Backend (`/api/fiscal`)
| Endpoint | Descrição |
|----------|-----------|
| `GET /nfes` | Listar NF-es |
| `POST /nfes/issue` | Emitir NF-e (mock SEFAZ) |
| `POST /nfes/:id/cancel` | Cancelar NF-e |
| `GET /nfes/consult/:key` | Consultar por chave de acesso |
| `POST /sped/export` | Exportar arquivo SPED (mock) |

### Frontend
- `/fiscal/nfe` — `NFe.jsx` — listagem, emissão e cancelamento de NF-es
- `/fiscal/nfe-consulta` — `NFeConsulta.jsx` — consulta por chave de acesso
- `/fiscal/sped` — `SPED.jsx` — geração de arquivo SPED fiscal

### Observação
O módulo fiscal opera em modo de **homologação/mock**. A integração real com SEFAZ requer certificado digital A1/A3 e biblioteca de assinatura XML (ex: `node-nfe`).

### Modelo Prisma
```
FiscalNfe (id, number, series, accessKey, status, customerName, totalAmount, issuedAt, cancelledAt)
```

---

## Módulo 10 — Engenharia

### Backend
- **BOM e Arquivos** (`/api/products`): importação de BOM CSV/SolidWorks, upload de arquivos técnicos (DXF, PDF, STL, glTF)
- **Integração** (`/api/cozinca`): cálculo de peso de chapas, auto-cadastro de matérias-primas

| Endpoint | Descrição |
|----------|-----------|
| `POST /api/products/:id/bom` | Importar BOM via CSV |
| `GET /api/products/:id/bom` | Listar itens da BOM |
| `POST /api/products/:id/files` | Upload de arquivos técnicos |
| `GET /api/products/:id/files` | Listar arquivos |
| `GET /api/products/pending-bom` | Produtos sem BOM cadastrada |

### Frontend
- `/engenharia` — `Engenharia.jsx` — dashboard de engenharia com BOM, arquivos e cálculos
- `/engenharia/pendentes-bom` — `PendentesBom.jsx` — produtos aguardando BOM
- `/engenharia/projetos` — `ProjetosEngenharia.jsx` — projetos com visualizador 3D (Three.js)
- `/estoque/produtos/bom/:id` — `ProdutoDetalhe.jsx` — BOM + roteiro + ficha técnica detalhada

---

## Módulo 11 — Configurações Avançadas

### Backend
| Módulo | Endpoint | Descrição |
|--------|----------|-----------|
| Platform | `/api/platform/settings` | Parâmetros sistema (GET/PUT) |
| Dashboard | `/api/dashboard/layout` | Layout configurável por usuário |
| Entities | `/api/entities` | Metadata Studio — entidades customizadas |
| Records | `/api/records` | CRUD genérico de entidades customizadas |
| Workflows | `/api/workflows` | Definição de fluxos de aprovação |
| Admin | `/api/admin/impersonate` | Impersonação para suporte |

### Frontend
- `/configuracoes/empresa` — `Empresa.jsx` — dados fiscais, logo, regime tributário
- `/configuracoes/usuarios` — `Usuarios.jsx` — RBAC, perfis, permissões granulares
- `/configuracoes/parametros` — `Parametros.jsx` — parâmetros chave/valor
- `/configuracoes/modelo-op` — `ModeloOP.jsx` — template HTML para impressão de OP (com preview PDF)
- `/configuracoes/metadata-studio` — `MetadataStudio.jsx` — criar entidades e campos sem código
- `/configuracoes/workflows` — `WorkflowBuilder.jsx` — definir fluxos de aprovação

---

## Autenticação e Segurança (Módulo Transversal)

### Backend
- **JWT** com refresh token e logout (`/api/auth/login`, `/api/auth/refresh`, `/api/me/logout`)
- **RBAC** com permissões granulares por tela/ação (`UserRole`, `RolePermission`, `Permission`)
- **Auditoria** — `AuditLog` e `AccessLog` para ações críticas
- **Impersonação** — `/api/admin/impersonate` para suporte

### Frontend
- `AuthContext` — gestão do ciclo de vida da sessão JWT
- `PermissaoContext` — hook `usePermissions()` com `pode(acao)` e `PodeRender`
- `PermissaoRoute` — HOC para proteger rotas por permissão
- `ImpersonationContext` — suporte a "Ver como" para administradores

---

## Notificações em Tempo Real

- **Socket.io** via `/realtime/io.ts`
- `UserNotification` model para notificações persistentes por usuário/setor
- `op-delay-scan` — job que escaneia OPs atrasadas e emite alertas em tempo real
- Frontend: `RealtimeContext` + `NotificacaoSino` no layout

---

## Dashboard Configurável

- Layout por usuário via `DashboardLayout` Prisma model
- Widgets disponíveis: KPIs de vendas, produção em andamento, estoque crítico, contas vencidas, leads
- `DashboardConfigurador.jsx` — arrastar e soltar widgets, salvar configuração
- Roles podem ter layouts padrão diferentes (vendedor vê KPIs de vendas, operador vê produção)

---

## Fluxo de Negócio Completo (Teste de Aceitação)

```
1. Cadastrar Produto
   → Ir em Estoque > Produtos > Novo Produto
   → Preencher código, nome, NCM, preço de custo/venda, estoque mínimo
   → Adicionar BOM (matérias-primas) e Roteiro (etapas de produção)

2. Criar Orçamento
   → Vendas > Orçamentos > Novo Orçamento
   → Selecionar cliente, adicionar produto, definir preço e prazo
   → Enviar ao cliente

3. Converter em Pedido de Venda
   → No orçamento aprovado, clicar "Converter em Pedido"
   → Pedido criado com status "PEDIDO" no Kanban

4. Aprovar Pedido e Gerar OP
   → Em Pedidos de Venda, clicar "Aprovar"
   → Clicar "Gerar Ordem de Produção"
   → OP criada em Produção > Ordens de Produção

5. Executar Produção
   → Produção > Apontamento: selecionar OP, registrar início
   → Informar quantidade produzida (boa e refugo)
   → Confirmar: insumos da BOM são baixados do estoque automaticamente

6. Finalizar OP
   → Status muda para "Concluída"
   → Produto acabado entra no estoque

7. Emitir NF-e
   → Fiscal > NF-e > Emitir NF-e
   → Preencher dados do cliente e valor
   → NF-e emitida com chave de acesso (mock SEFAZ)

8. Registrar Pagamento
   → Financeiro > Contas a Receber
   → Localizar a conta gerada pelo pedido
   → Registrar baixa (parcial ou total)

9. Fluxo de Caixa
   → Financeiro > Fluxo de Caixa
   → Visualizar entradas (recebimentos) vs saídas (pagamentos)
   → DRE com resultado líquido do período
```

---

## Estrutura de Arquivos

### Backend
```
apps/backend/src/
├── app.ts                          # Express app com todos os módulos registrados
├── middleware/auth.ts              # authenticate + requirePermission
├── infra/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── redis-health.ts             # Health check Redis
│   └── logger.ts                   # Winston logger
├── realtime/
│   ├── io.ts                       # Socket.io setup
│   ├── op-delay-scan.ts            # Job de OPs atrasadas
│   └── record-hooks.ts             # Hooks para eventos de EntityRecord
├── lib/
│   ├── defaultDashboardLayout.ts   # Layout padrão por role
│   ├── notificationVisibility.ts   # Regras de visibilidade por setor
│   └── roleOrder.ts                # Hierarquia de perfis
└── modules/
    ├── auth/                       # Login, refresh, me
    ├── users/                      # CRUD de usuários
    ├── roles/                      # Perfis de acesso
    ├── permissions/                # Permissões granulares
    ├── entities/                   # Metadata Studio backend
    ├── records/                    # CRUD genérico de entidades
    ├── stock/                      # Estoque, movimentações, inventário, endereçamento
    ├── sales/                      # Clientes, pedidos, orçamentos, tabela de preços
    ├── purchases/                  # Fornecedores, ordens de compra, recebimento
    ├── production/                 # OPs, roteiros, máquinas, PCP, Kanban, apontamento
    ├── products/                   # BOM, arquivos técnicos, 3D
    ├── crm/                        # Pipeline, leads, oportunidades, atividades
    ├── hr/                         # Funcionários, ponto, férias, folha
    ├── financial/                  # Fluxo de caixa, DRE, conciliação
    ├── fiscal/                     # NF-e, SPED
    ├── platform/                   # Parâmetros do sistema
    ├── dashboard/                  # Layout configurável
    ├── notifications/              # Notificações por usuário/setor
    ├── workflows/                  # Fluxos de aprovação
    ├── search/                     # Busca global
    └── admin/                      # Impersonação
```

### Frontend
```
apps/frontend/src/
├── App.jsx                         # Roteamento completo (11 módulos)
├── lib/
│   ├── AuthContext.jsx             # Autenticação JWT
│   ├── PermissaoContext.jsx        # RBAC e permissões
│   ├── RealtimeContext.jsx         # Socket.io
│   └── ImpersonationContext.jsx   # Impersonação
├── components/
│   ├── layout/
│   │   ├── ERPLayout.jsx           # Layout principal com sidebar colapsável
│   │   └── Sidebar.jsx             # Menu lateral com MENU_BLACKLIST
│   ├── common/
│   │   ├── DataTable.jsx           # Tabela reutilizável com sort, paginação
│   │   ├── FormModal.jsx           # Modal de formulário com validação
│   │   ├── FilterBar.jsx           # Barra de filtros e busca
│   │   ├── PageHeader.jsx          # Cabeçalho de página com breadcrumbs
│   │   ├── StatusBadge.jsx         # Badge de status com cores automáticas
│   │   └── DetalheModal.jsx        # Modal de detalhe com exportação PDF
│   ├── dashboard/
│   │   └── DashboardConfigurador.jsx  # Configurador drag-and-drop
│   └── producao/
│       └── FluxoProducao.jsx       # Fluxo visual de produção
├── pages/
│   ├── Dashboard.jsx               # Dashboard configurável com widgets
│   ├── vendas/                     # SaleOrdersPage, QuotesPage, PriceTables, Clientes
│   ├── estoque/                    # ProductsPage, Movimentacoes, Inventario, Enderecamento
│   ├── producao/                   # OrdensProducao, PCP, Kanban, Apontamento, Roteiros
│   ├── compras/                    # Fornecedores, OrdensCompra, Cotacoes, Recebimentos
│   ├── crm/                        # Pipeline, Leads, Oportunidades, Atividades, Dashboard
│   ├── rh/                         # Funcionarios, Ponto, Ferias, FolhaPagamento
│   ├── financeiro/                 # ContasReceber, ContasPagar, FluxoCaixa, DRE, Conciliacao
│   ├── fiscal/                     # NFe, NFeConsulta, SPED
│   ├── engenharia/                 # Engenharia, PendentesBom, ProjetosEngenharia
│   └── configuracoes/              # Empresa, Usuarios, Parametros, ModeloOP, Metadata, Workflows
└── services/
    ├── api.js                      # Axios instance com interceptors JWT
    ├── stockApi.ts                 # /api/stock (TypeScript)
    ├── salesApi.ts                 # /api/sales (TypeScript)
    ├── purchasesApi.ts             # /api/purchases (TypeScript) ← NOVO
    ├── financeiroService.js        # Contas a receber/pagar
    ├── opService.js                # Ordens de produção
    ├── apontamentoService.js       # Apontamento de produção
    └── recordsServiceApi.js        # EntityRecord genérico
```

---

## Schema Prisma — Modelos Principais

```prisma
// Autenticação
User, Role, Permission, UserRole, RolePermission, UserSession, AuditLog, AccessLog

// Cadastros
Customer, Supplier, Product, ProductIndustrialMeta, BillOfMaterialLine, RawMaterial, TechnicalFile

// Estoque
Location, ProductLocation, StockMovement, InventoryCount, InventoryCountItem

// Vendas
Quote, QuoteItem, SaleOrder, SaleOrderItem, PriceTable, PriceTableItem

// Compras
PurchaseOrder, PurchaseOrderItem

// Produção
WorkOrder, WorkOrderItem, WorkOrderStatusHistory, Machine, Routing, RoutingStage, ProductionAppointment

// RH
Employee, TimeEntry, LeaveRequest, PayrollRun, PayrollLine

// Fiscal
FiscalNfe, ProductFile

// Configurações
Entity, EntityRecord, DashboardLayout, UserNotification
```

---

## Migrações Criadas

| Arquivo | Descrição |
|---------|-----------|
| `20260502014207_user_sector` | Adiciona campo `sector` ao usuário |
| `20260502015300_add_products_stock` | Modelos Product, Location, StockMovement, InventoryCount |
| `20260502120000_add_sales_quotes` | Customer, Quote, SaleOrder, PriceTable |
| `20260502121000_add_purchases` | Supplier, PurchaseOrder |
| `20260503160000_add_production_hr_fiscal_engineering` | WorkOrder, Employee, TimeEntry, FiscalNfe, ProductFile |

---

## Como Executar

### Pré-requisitos
- Node.js 20+
- PostgreSQL 14+
- Redis (opcional — para health check e realtime)

### Backend
```bash
cd apps/backend
cp .env.example .env
# editar DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma migrate deploy
npx ts-node prisma/seed.ts
npm run dev
```

### Frontend
```bash
cd apps/frontend
npm install
npm run dev
# ou para produção:
npm run build
```

### Variáveis de Ambiente (backend)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/erpcozerp
JWT_SECRET=seu-secret-aqui
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3001
REDIS_URL=redis://localhost:6379  # opcional
```

---

## Seed — Dados Iniciais

O arquivo `prisma/seed.ts` cria:
- **Usuário admin** com senha `admin123`
- **Roles**: `MASTER`, `ADMIN`, `GERENTE`, `VENDEDOR`, `COMPRADOR`, `OPERADOR`, `RH`, `FINANCEIRO`
- **Permissões** granulares por módulo (ver, criar, editar, aprovar, deletar)
- **Localização padrão** de estoque: `DEFAULT — Depósito principal`
- **Entidades** CRM (`crm_lead`, `crm_oportunidade`, `crm_atividade`), Financeiro (`conta_receber`, `conta_pagar`), e outras

---

## Pendências e Próximos Passos

### Produção Real
1. **NF-e real**: Integrar biblioteca `node-nfe` com certificado digital para envio real ao SEFAZ
2. **Conciliação bancária**: Integrar com Open Finance API para importação automática de extratos
3. **Comissões de vendas**: Regras por vendedor e liquidação automática na baixa de AR

### Melhorias Futuras
1. **App Mobile**: React Native ou PWA para apontamento e ponto eletrônico
2. **Multi-empresa**: Isolamento por tenant para uso SaaS
3. **BI/Analytics**: Dashboard avançado com Power BI embed ou Metabase
4. **EDI**: Integração com portais de fornecedores
5. **SPED real**: Geração de arquivos SPED EFD ICMS/IPI e EFD Contribuições

---

## Conclusão

O **ERP COZINCA INOX** está completamente implementado com todos os 11 módulos funcionais, cobrindo o ciclo completo de uma indústria de aço inox:

> **Cadastro de produto** → **Venda** → **Produção** → **Estoque** → **Compra de insumos** → **Faturamento** → **Financeiro** → **Fiscal**

O sistema utiliza uma arquitetura moderna, escalável e segura, com separação clara entre backend (APIs REST tipadas) e frontend (SPA React com lazy loading), autenticação JWT com RBAC granular, e integração em tempo real via Socket.io.
