# Testes Automatizados — COZINCA ERP

## Estrutura

```
apps/
  backend/
    vitest.config.ts
    src/__tests__/
      setup/
        globalSetup.ts        → Configura env vars para teste
        testServer.ts         → Instancia o app Express real (createApp)
        fixtures.ts           → Helpers: getAuthHeaders, generateTestToken
      unit/
        dashboardMigration.test.ts  → migrateLegacyLayout()
        roleOrder.test.ts           → sortRolesByPriority()
      integration/
        health.test.ts              → GET /health
        auth.api.test.ts            → Login, /me, JWT
        users.api.test.ts           → CRUD usuários, sem passwordHash exposto
        sales.api.test.ts           → Pedidos, clientes, orçamentos
        stock.api.test.ts           → Produtos, movimentações, inventário
        production.api.test.ts      → OPs, Kanban, roteiros, máquinas
        purchases.api.test.ts       → OCs, fornecedores
        financial.api.test.ts       → Payables, receivables, DRE
        dashboard.api.test.ts       → Layout, migração de IDs legados
        entities.api.test.ts        → CRUD entidades, is_system flag

  frontend/
    vitest.config.js
    src/__tests__/
      setup/
        setupTests.js               → @testing-library/jest-dom, mocks globais
        mocks/
          apiMock.js                → Mock de fetch para todos os endpoints
      components/
        layout/
          Sidebar.test.jsx          → Renderização, colapso, navegação por grupos
        ui/
          Button.test.jsx           → Click, disabled, variantes, tipos
      pages/
        (mais testes em desenvolvimento)

tests/
  e2e/
    fixtures/
      index.ts                      → Helpers de login (gerentePage, producaoPage)
    auth/
      login.spec.ts                 → Login, logout, token JWT, rota protegida
    navigation/
      sidebar.spec.ts               → Navegação por grupos, colapso, entidades sistema
      responsiveness.spec.ts        → Desktop (1440), Tablet (1024), Mobile (390)
    sales/
      sales-flow.spec.ts            → Pedidos, orçamentos, clientes
    production/
      production-flow.spec.ts       → Kanban, OPs, Chão de Fábrica
    stock/
      stock-flow.spec.ts            → Produtos, movimentações, busca
    financial/
      financial-flow.spec.ts        → Contas, DRE, Fluxo de Caixa
    crm/
      crm-flow.spec.ts              → CRM, Projetos, Expedição
    quality/
      quality-flow.spec.ts          → Inspeções, NCs, Documentos
    dashboard/
      dashboard.spec.ts             → KPIs, Painéis de Gestão, widgets
    performance/
      load-times.spec.ts            → Tempo de carregamento (< 5s), API (< 2s)

test-reports/                       → Relatórios gerados (gerados na execução)
```

---

## Como rodar

### Pré-requisitos

```bash
# 1. Backend rodando
cd apps/backend && npm run dev

# 2. Frontend rodando (porta 5173 ou 5174)
cd apps/frontend && npm run dev

# 3. Banco populado com dados demo
cd apps/backend && npx tsx prisma/seed.ts
```

---

### Testes de unidade e integração — Backend (61 testes)

```bash
cd apps/backend

npm test                   # Todos os testes (unit + integration)
npm run test:unit          # Apenas testes unitários
npm run test:integration   # Apenas testes de integração (Supertest)
npm run test:watch         # Modo watch (TDD)
npm run test:coverage      # Com relatório de cobertura HTML
```

Relatório de cobertura: `test-reports/backend-coverage/index.html`

---

### Testes de componentes — Frontend (25 testes)

```bash
cd apps/frontend

npm test                   # Todos os testes de componentes
npm run test:watch         # Modo watch
npm run test:coverage      # Com relatório de cobertura
npm run test:ui            # Interface gráfica Vitest UI
```

Relatório de cobertura: `test-reports/frontend-coverage/index.html`

---

### Testes E2E — Playwright

```bash
# A partir da raiz do projeto
npm run test:e2e               # Todos os projetos (Desktop, Tablet, Mobile)
npm run test:e2e:desktop       # Apenas Desktop Chrome (1440×900)
npm run test:e2e:tablet        # Apenas Tablet (1024×768)
npm run test:e2e:mobile        # Apenas Mobile Safari (390×844)
npm run test:e2e:headed        # Com browser visível
npm run test:e2e:debug         # Modo debug interativo
npm run test:e2e:ui            # Interface Playwright UI
npm run test:e2e:report        # Abre relatório HTML

# Filtros por área
npm run test:e2e:auth          # Apenas autenticação
npm run test:e2e:navigation    # Sidebar + responsividade
npm run test:e2e:sales         # Fluxo de vendas
npm run test:e2e:production    # Kanban + Ordens de Produção
npm run test:e2e:performance   # Tempos de carregamento

# Filtro manual (arquivo específico)
npx playwright test tests/e2e/sales/sales-flow.spec.ts
npx playwright test tests/e2e/auth --project="Desktop Chrome"
```

Relatório E2E: `test-reports/playwright/index.html`

---

### Todos os testes de uma vez

```bash
npm run test:all          # backend + frontend + e2e
npm run test              # apenas backend + frontend (sem E2E)
npm run test:coverage     # cobertura de backend + frontend
```

---

## Usuários de teste (senha: `demo123_dev`)

| Email | Papel |
|---|---|
| `gerente@cozinha.com` | Gerente Geral |
| `master@Cozinha.com` (senha `master123_dev`) | Master |
| `gerente.producao@cozinha.com` | Gerente Produção |
| `financeiro@cozinha.com` | Financeiro |
| `qualidade@cozinha.com` | Qualidade |
| `expedicao@cozinha.com` | Expedição |

---

## Cobertura atual

| Suite | Arquivos | Testes | Status |
|---|---|---|---|
| Backend Unit | 2 | 14 | ✅ Passando |
| Backend Integration | 10 | 47 | ✅ Passando |
| Frontend Components | 3 | 25 | ✅ Passando |
| E2E Playwright | 10 | ~90 | Requer app rodando |

**Total local: 86 testes automatizados passando**

---

## Stack

- **Backend**: [Vitest](https://vitest.dev/) + [Supertest](https://github.com/visionmedia/supertest)
- **Frontend**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **E2E**: [Playwright](https://playwright.dev/)
- **Cobertura**: v8 (nativo do Vitest)
