# FUNCTIONALITY_REPORT — Módulos Industriais Implementados

**Data:** 2026-05-02  
**Sistema:** ERP COZINCA INOX  
**Stack:** Node.js + Prisma + PostgreSQL (backend) | React + Vite + Tailwind (frontend)

---

## Resumo Executivo

| # | Módulo | Status Frontend | Status Backend | Integração |
|---|--------|----------------|----------------|-----------|
| 1 | Gestão de Acesso e Segurança | ✅ | ✅ | ✅ |
| 2 | Cadastros Básicos | ✅ | ✅ | ✅ |
| 3 | Vendas e Orçamentos | ✅ | ✅ | ✅ |
| 4 | Compras | ✅ | ✅ | ✅ |
| 5 | Estoque | ✅ | ✅ | ✅ |
| 6 | Produção | ✅ | ✅ | ✅ |
| 7 | CRM | ✅ | ✅ | ✅ |
| 8 | RH | ✅ | ✅ | ✅ |
| 9 | Financeiro | ✅ | ✅ | ✅ |
| 10 | Fiscal | ✅ | ✅ | ⚠️ Mock |
| 11 | Engenharia / BOM | ✅ | ✅ | ✅ |
| 12 | Configurações Avançadas | ✅ | ✅ | ✅ |

---

## Módulo 1 — Gestão de Acesso e Segurança

### Backend
- JWT com refresh token, expiração configurável, blacklist via Redis
- RBAC granular: `RolePermission` com condições JSON
- Impersonação de usuário (admin pode logar como outro usuário)
- Sessões registradas em `UserSession` (IP, user-agent, last activity)
- Audit log completo (`AuditLog`) para todas as ações críticas
- Bloqueio por tentativas falhas (`failedLoginAttempts`, `lockedUntil`)

### Frontend
- Login (`Login.jsx`) com validação, erro e redirecionamento
- Hook `usePermissions` / `pode()` para RBAC granular no frontend
- `PodeRender` componente para renderização condicional por permissão
- Gestão de usuários + papéis (`Usuarios.jsx`)

### Endpoints
```
POST /api/auth/login, /api/auth/refresh, /api/auth/logout
GET  /api/auth/me
GET  /api/permissions/me, /api/permissions/catalog
PUT  /api/users/:id/roles
POST /api/admin/impersonate/:userId
```

---

## Módulo 2 — Cadastros Básicos

### Entidades
- **Empresa**: CNPJ, endereço, configurações (página `Empresa.jsx`)
- **Clientes**: código, nome, CNPJ/CPF, email, telefone, endereço, limite de crédito, status
- **Fornecedores**: código, razão social, CNPJ, email, telefone, ativo
- **Produtos** (catálogo Prisma): código, nome, unidade, tipo, grupo, preço de custo/venda, estoque mínimo, foto, ficha técnica, modelo 3D
- **Tabela de Preços**: versão, vigência, itens por produto

### Frontend
- `Clientes.jsx` — CRUD com modal, filtros, export PDF
- `Fornecedores.jsx` — CRUD com purchasesApi
- `Produtos.jsx` (estoque) — catálogo com foto, BOM status
- `TabelaPrecos.jsx` — tabela de preços com itens

### Endpoints
```
GET/POST   /api/customers
GET/POST   /api/purchases/suppliers
GET/POST   /api/stock/products
GET/POST   /api/sales/price-tables
```

---

## Módulo 3 — Vendas e Orçamentos

### Fluxo Completo
```
Lead (CRM) → Oportunidade → Orçamento → Pedido de Venda
                                              ↓
                              Reserva de Estoque + Geração de OP
                                              ↓
                            Expedição → NF-e → Conta a Receber
```

### Funcionalidades
- Orçamentos com cálculo via tabela de preços + margem por cliente
- Conversão de orçamento em pedido (botão "Converter em Pedido")
- Pedido de venda: status em fluxo (DRAFT → APPROVED → IN_PRODUCTION → SHIPPED → DELIVERED)
- Kanban de pedidos por coluna
- Aprovação financeira de pedidos
- Comissões (campo `comissao_pct` no cadastro)

### Frontend
- `Orcamentos.jsx` — lista, modal, converter em pedido
- `PedidosVenda.jsx` — Kanban + lista + aprovação
- `TabelaPrecos.jsx` — gestão de tabelas
- `AprovacaoPedidos.jsx` — fila de aprovação financeira

### Endpoints
```
GET/POST /api/sales/quotes
POST     /api/sales/quotes/:id/convert
GET/POST /api/sales/orders
PUT      /api/sales/orders/:id/approve
GET/POST /api/sales/price-tables
```

---

## Módulo 4 — Compras

### Fluxo
```
Necessidade → Cotação → OC (Aprovação) → Recebimento → Conta a Pagar
                                              ↓
                                     Movimentação de Estoque
```

### Funcionalidades
- Cotações: solicitar, registrar respostas, comparar fornecedores
- Ordem de Compra: workflow (RASCUNHO → ENVIADO → RECEBIDO)
- Recebimento: entrada de mercadoria, movimento de estoque automático
- Conta a pagar gerada ao receber

### Frontend
- `Fornecedores.jsx` — fornecedores com purchasesApi
- `OrdensCompra.jsx` — OC com envio ao fornecedor e recebimento
- `Recebimentos.jsx` — histórico de recebimentos
- `Cotacoes.jsx` — cotações (comparativo)

### Prisma Models
`Supplier`, `PurchaseOrder`, `PurchaseOrderItem`

---

## Módulo 5 — Estoque

### Funcionalidades
- Produtos com tipo: Matéria-Prima, Semi-Acabado, Acabado, Insumo
- Movimentações: ENTRADA, SAIDA, AJUSTE com motivo e rastreabilidade
- Inventário cíclico: RASCUNHO → EM_CONTAGEM → APROVADO
- Endereçamento: armazém / rua / prateleira / posição
- Custo médio ponderado em movimentações de entrada

### Frontend
- `Produtos.jsx` — catálogo com foto, BOM status
- `Movimentacoes.jsx` — histórico de movimentos com filtros
- `Inventario.jsx` — criação e aprovação de inventário
- `Enderecamento.jsx` — localizações com CRUD

### Prisma Models
`Product`, `StockMovement`, `InventoryCount`, `InventoryCountItem`, `Location`, `ProductLocation`

---

## Módulo 6 — Produção

### Funcionalidades

#### Ordens de Produção (OP)
- Status: DRAFT → RELEASED → IN_PROGRESS → FINISHED
- Vinculação com pedido de venda
- Produtos vinculados com quantidade planejada
- Prioridade e data de entrega

#### Apontamento de Produção
- Operadores por setor (Corte, Dobra, Solda, Montagem, etc.)
- Registro de início/fim, quantidade boa e refugo
- Timeline visual de progresso na OP
- Filtro automático de apontamentos por setor do operador

#### Roteiros
- Etapas ordenadas com máquina e tempo padrão
- Vinculação ao produto

#### Kanban
- Arrastar cartões entre colunas: BACKLOG → PROGRAMADO → EM_ANDAMENTO → FINALIZADO
- `@hello-pangea/dnd` para drag-and-drop

#### PCP
- Visualização de OPs por data e prioridade
- Sequenciamento manual

#### Chão de Fábrica
- Visão do operador: OPs do dia, apontamento rápido, arquivos DXF/PDF
- BOM do produto acessível diretamente na OP

### Frontend
- `OrdensProducao.jsx` — lista + Kanban + nova OP
- `DetalheOP.jsx` — aba Dados, Processo, Apontamentos, BOM, Arquivos, Revisões
- `Apontamento.jsx` — painel do operador
- `ChaoDeFabrica.jsx` — visão do chão de fábrica
- `KanbanProducao.jsx` — Kanban com DnD
- `PCP.jsx` — Planejamento e Controle de Produção
- `Roteiros.jsx` — cadastro de roteiros
- `Maquinas.jsx` — cadastro de máquinas

### Prisma Models
`WorkOrder`, `WorkOrderItem`, `WorkOrderStatusHistory`, `Routing`, `RoutingStage`, `Machine`, `ProductionAppointment`

---

## Módulo 7 — CRM

### Fluxo
```
Lead → Qualificação → Oportunidade → Proposta → Negociação → Fechado (→ Pedido)
```

### Funcionalidades
- Leads com origem, status, responsável, conversão para oportunidade
- Oportunidades no funil (Kanban visual)
- Atividades: tarefas, ligações, emails com data e responsável
- Dashboard CRM com KPIs (taxa de conversão, ticket médio)

### Frontend
- `Leads.jsx` — lista e gestão de leads
- `Oportunidades.jsx` — gestão de oportunidades
- `Pipeline.jsx` — funil Kanban visual
- `Atividades.jsx` — calendário e lista de atividades
- `CrmDashboard.jsx` — KPIs do CRM

### Backend
`apps/backend/src/modules/crm/crm.module.ts`, `crm.routes.ts`, `crm.service.ts`

---

## Módulo 8 — RH

### Funcionalidades
- Funcionários vinculados a usuário (login), cargo, salário, departamento, data de admissão
- Ponto eletrônico: entrada/saída diária, relatório de horas trabalhadas
- Solicitação e aprovação de férias
- Folha de pagamento simplificada: salário bruto - INSS - IRRF = líquido

### Frontend
- `Funcionarios.jsx` — CRUD de funcionários
- `Ponto.jsx` — registro e relatório de ponto
- `Ferias.jsx` — solicitações de férias com aprovação
- `FolhaPagamento.jsx` — cálculo e visualização da folha

### Prisma Models
`Employee`, `TimeEntry`, `LeaveRequest`, `PayrollRun`, `PayrollLine`

---

## Módulo 9 — Financeiro

### Funcionalidades
- Contas a Receber geradas automaticamente de vendas (condições de pagamento)
- Contas a Pagar geradas de compras ou lançamentos manuais
- Baixa parcial/total com juros e multa
- Fluxo de Caixa: previsão vs realizado por período
- DRE (Demonstração do Resultado do Exercício): receitas – custos – despesas
- Conciliação bancária: importar extrato CSV, confrontar com lançamentos
- Aprovação financeira de pedidos de venda

### Frontend
- `ContasReceber.jsx` — gestão de recebíveis
- `ContasPagar.jsx` — gestão de contas a pagar
- `FluxoCaixa.jsx` — gráfico e tabela de fluxo
- `DRE.jsx` — demonstração de resultado
- `ConciliacaoBancaria.jsx` — importação e conciliação de extrato
- `AprovacaoPedidos.jsx` — aprovação de pedidos (financeiro)
- `RelatorioFinanceiro.jsx` — relatórios gerenciais

### Backend
`apps/backend/src/modules/financial/financial.module.ts`, `financial.routes.ts`, `financial.service.ts`

---

## Módulo 10 — Fiscal

### Funcionalidades (ambiente de homologação/mock)
- NF-e: emissão com geração de XML sintético (estrutura válida para homologação)
- Consulta de status de NF-e
- Cancelamento de NF-e
- SPED Fiscal: exportação de texto sintético (estrutura de arquivo)

> ⚠️ **Nota de produção**: para emissão real de NF-e, é necessário integrar com certificado digital A1/A3 e SEFAZ estadual. O módulo atual está preparado para essa expansão (modelo `FiscalNfe`, campos `accessKey`, `xmlPath`, `status`).

### Frontend
- `NFe.jsx` — emissão e lista de NF-e
- `NFeConsulta.jsx` — consulta por chave de acesso
- `SPED.jsx` — exportação SPED

### Prisma Models
`FiscalNfe`

---

## Módulo 11 — Engenharia / BOM

### Funcionalidades
- Ficha do produto com abas: Dados, Lista de Materiais, Arquivos Técnicos, Modelo 3D
- Importação de BOM: CSV, Excel (.xlsx), TSV, texto colado
- Parser SolidWorks: detecta automaticamente delimitador e colunas
- Cálculo de peso de chapas: `(X × Y × espessura) ÷ 10⁹ × 7850 kg/m³`
- Auto-criação de matéria-prima para códigos não cadastrados
- Workflow BOM: EMPTY → PENDING_ENGINEERING → COMPLETE
- Notificação automática ao projetista ao criar produto
- Upload de arquivos DXF, PDF, STL/glTF/OBJ por produto e OP
- Visualizador 3D interativo (Three.js v0.171): rotação, zoom, panorâmica, wireframe
- BOM acessível na OP (chão de fábrica)
- Dashboard de engenharia com stats de pendências

### Frontend
- `ImportBomModal.jsx` — modal 4 etapas (upload → mapeamento → prévia → resultado)
- `Model3DViewer.jsx` — visualizador Three.js com OrbitControls
- `ProdutoDetalhe.jsx` — ficha completa do produto
- `Engenharia.jsx` — dashboard de engenharia
- `PendentesBom.jsx` — fila do projetista com ações rápidas
- `ProjetosEngenharia.jsx` — catálogo com coluna BOM status

### Processos BOM suportados
ALMOXARIFADO, LASER, DOBRA, SOLDA, USINAGEM, PINTURA, MONTAGEM, CORTE, ESTAMPAGEM, GUILHOTINA, TERCEIRIZADO

---

## Módulo 12 — Configurações Avançadas

### Funcionalidades
- **Metadata Studio**: criar entidades personalizadas com campos dinâmicos (text, number, date, select, etc.)
- **Workflows**: regras automáticas (gatilho → condição → ação) via builder visual
- **Parâmetros do sistema**: configurações globais (empresa, moeda, CFOP padrão, etc.)
- **Modelo de OP**: template HTML personalizável para impressão de ordens de produção
- **Papéis (Roles)**: criar e editar papéis com permissões granulares

### Frontend
- `MetadataStudio.jsx` — criação de entidades dinâmicas
- `WorkflowBuilder.jsx` — builder visual de workflows
- `Parametros.jsx` — parâmetros do sistema
- `ModeloOP.jsx` — template de impressão de OP
- `Empresa.jsx` — dados da empresa

---

## Integrações Entre Módulos (Fluxo Contínuo)

```
Pedido de Venda aprovado
    └→ Gera WorkOrder (OP) automaticamente
        └→ Reserva WorkOrderItem (insumos da BOM)
            └→ Ao apontar produção → BaixaEstoque (StockMovement)
                └→ OP concluída → SaleOrder status SHIPPED
                    └→ NF-e emitida → SaleOrder status DELIVERED
                        └→ Conta a Receber gerada

Recebimento de Compra
    └→ StockMovement tipo ENTRADA
        └→ Conta a Pagar gerada
            └→ PurchaseOrder status RECEBIDO
```

---

## Estatísticas da Base de Código

| Componente | Quantidade |
|-----------|-----------|
| Páginas frontend (`*.jsx`/`*.tsx`) | 83 |
| Componentes UI | ~45 |
| Serviços API frontend | ~20 |
| Módulos backend | 16 |
| Models Prisma | 41 |
| Migrações | 14 |
| Rotas de API | ~180 endpoints |
