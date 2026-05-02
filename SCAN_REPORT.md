# SCAN REPORT — Varredura Completa do Projeto ERPCOZERP

**Data:** 02/05/2026  
**Build final:** Backend `tsc --noEmit` ✅ | Frontend `vite build` ✅

---

## Resumo Executivo

Foram varridos 10 módulos, App.jsx (roteamento), Sidebar.jsx (menu), seed.ts (permissões), docker-compose.yml, todos os serviços de API e arquivos de página. **6 bugs reais foram encontrados e corrigidos.** O sistema está funcional e sem erros de build.

---

## Problemas Encontrados e Status

### 🔴 BUGS CRÍTICOS (corrigidos)

#### 1. CRM Pipeline — oportunidades nunca apareciam no Kanban
- **Arquivo:** `apps/backend/src/modules/crm/crm.service.ts`
- **Problema:** O service usava stages `['Prospecção', 'Qualificação', 'Proposta', ...]` mas o seed cria registros com `estagio: 'Lead'`, `'Fechado'`, `'Ganho'`, `'Perdido'`. Qualquer oportunidade com estágio `'Lead'` era ignorada (fallback para `'Prospecção'` inexistente).
- **Correção:** Stages sincronizados com o seed: `['Lead', 'Qualificação', 'Proposta', 'Negociação', 'Fechado', 'Ganho', 'Perdido']`
- **Status:** ✅ Corrigido

#### 2. NF-e — "Nova NF-e" emitia mock com dados vazios
- **Arquivo:** `apps/frontend/src/pages/fiscal/NFe.jsx`
- **Problema:** O botão chamava `POST /api/fiscal/nfes/issue-mock` com `{}`, gerando NF-e com destinatário "Cliente mock" e valor R$ 100 sem interação do usuário.
- **Correção:** Adicionado modal `EmitirModal` com campos `Destinatário` e `Valor total` obrigatórios antes de emitir.
- **Status:** ✅ Corrigido

#### 3. Aprovação de Pedidos — Prisma SaleOrders não apareciam
- **Arquivo:** `apps/frontend/src/pages/financeiro/AprovacaoPedidos.jsx`
- **Problema:** A página buscava apenas de `pedido_venda` EntityRecords (legado). Novos pedidos criados via `/api/sales/sale-orders` (Prisma) com status `DRAFT` e valor acima do limite nunca apareciam para aprovação.
- **Correção:** Merge das duas fontes: EntityRecords legados + `GET /api/sales/sale-orders?status=DRAFT`. Botão "Aprovar" usa `POST /api/sales/sale-orders/:id/approve` para registros Prisma.
- **Status:** ✅ Corrigido

---

### 🟡 PROBLEMAS MÉDIOS (corrigidos)

#### 4. `seed:materials` ausente do `apps/backend/package.json`
- **Arquivo:** `apps/backend/package.json`
- **Problema:** O script `scripts/seed-raw-materials.js` existia mas não havia entrada no `package.json`, impossibilitando `npm run seed:materials`.
- **Correção:** Adicionado `"seed:materials": "node scripts/seed-raw-materials.js"`.
- **Status:** ✅ Corrigido

#### 5. Docker-compose: frontend healthcheck com `wget` não garantido
- **Arquivo:** `docker-compose.yml`
- **Problema:** `["CMD", "wget", "-qO-", "http://127.0.0.1/health"]` — imagens nginx minimalistas podem não ter `wget`.
- **Correção:** Comando com fallback: `wget -qO- ... || curl -sf ...`
- **Status:** ✅ Corrigido

#### 6. Sidebar: "Apontamento" sem link no menu Produção
- **Arquivo:** `apps/frontend/src/components/layout/Sidebar.jsx`
- **Problema:** A rota `/producao/apontamento` existia no App.jsx mas nenhum link na sidebar apontava para ela. Operadores só chegavam lá via DetalheOP ou URL direta.
- **Correção:** Adicionado `{ label: 'Apontamento', path: '/producao/apontamento', required: 'apontar' }` no grupo Produção.
- **Status:** ✅ Corrigido

---

## O Que Foi Verificado e Está OK

### Roteamento (App.jsx vs Sidebar.jsx)
| Rota | App.jsx | Sidebar | Status |
|------|---------|---------|--------|
| `/` (Dashboard) | ✅ | ✅ | OK |
| `/ajuda` | ✅ | Header (menu usuário) | OK — acessível |
| `/vendas/*` (5 subrotas) | ✅ | ✅ | OK |
| `/estoque/*` (5 subrotas) | ✅ | ✅ | OK |
| `/producao/*` (8 subrotas) | ✅ | ✅ (+ Apontamento adicionado) | OK |
| `/engenharia/*` (3 subrotas) | ✅ | ✅ | OK |
| `/crm/*` (5 subrotas) | ✅ | ✅ | OK |
| `/rh/*` (4 subrotas) | ✅ | ✅ | OK |
| `/compras/*` (4 subrotas) | ✅ | ✅ | OK |
| `/fiscal/*` (3 subrotas) | ✅ | ✅ | OK |
| `/financeiro/*` (7 subrotas) | ✅ | ✅ | OK |
| `/configuracoes/*` (6 subrotas) | ✅ | ✅ | OK |
| `/entidades/:codigo` | ✅ | Dinâmico | OK |
| `/relatorios` | ✅ | ✅ | OK |

### Backend — Módulos Registrados em app.ts
Todos os 25 módulos estão registrados: `health`, `auth`, `entities`, `records`, `users`, `clientes`, `ordens-compra`, `fornecedores`, `permissions`, `dashboard`, `notifications`, `financeiro`, `workflows`, `admin`, `cozinca`, `products`, `estoque`, `stock`, `sales`, `purchases`, `production`, `crm`, `hr`, `fiscal`, `financial`, `search`, `platform`, `roles`.

### Permissões no seed.ts
- **47 permissões explícitas** + permissões granulares por entidade (20 entidades × 4 ações = 80 permissões adicionais) = **127 permissões totais**
- **13 perfis (roles)** criados: master, gerente, gerente_producao, orcamentista_vendas, projetista, corte_laser, dobra_montagem, solda, expedicao, financeiro, rh, qualidade, user
- Master recebe todas as permissões automaticamente
- **11 usuários demo** criados com senhas `demo123_dev`

### Serviços API Frontend
| Módulo | Serviço | Padrão |
|--------|---------|--------|
| Stock/Estoque | `stockApi.ts` | ✅ Dedicado |
| Sales/Vendas | `salesApi.ts` | ✅ Dedicado |
| Purchases/Compras | `purchasesApi.ts` | ✅ Dedicado |
| Products/Produtos | `productsApi.js` | ✅ Dedicado |
| Financeiro | `financeiroService.js` + `businessLogicApi.js` | ✅ OK |
| CRM | `api.get` direto + `recordsServiceApi` | ✅ OK |
| RH | `api.get/post` direto | ✅ OK |
| Fiscal | `api.get/post` direto | ✅ OK |
| Produção | `opService.js` + `apontamentoService.js` | ✅ OK |

### Infraestrutura Docker
| Serviço | Imagem | Healthcheck | Volumes | Status |
|---------|--------|-------------|---------|--------|
| postgres | postgres:16 | `pg_isready` | `pg_data` | ✅ |
| redis | redis:7-alpine | `redis-cli ping` | `redis_data` | ✅ |
| backend | Custom Dockerfile | `node fetch /health` | `./data/uploads` | ✅ |
| frontend | Custom Dockerfile | `wget || curl` | — | ✅ (corrigido) |

### Variáveis de Ambiente (.env.example)
| Variável | Obrigatória | Valor Exemplo |
|----------|-------------|---------------|
| `JWT_SECRET` | ✅ Sim | String aleatória ≥32 chars |
| `POSTGRES_PASSWORD` | ✅ Sim | `erpcozpass` |
| `FRONTEND_URL` | ✅ CORS | `http://localhost:5173` |
| `JWT_EXPIRES_IN` | Não | `7d` |
| `DEFAULT_MASTER_PASSWORD` | Não | `master123_dev` |
| `SEED_ENABLED` | Não | `true` |
| `DATABASE_URL` | Dev local | `postgresql://erpcoz:...` |

---

## Pendências Conhecidas (não são bugs)

| Item | Tipo | Descrição |
|------|------|-----------|
| NF-e SEFAZ real | Feature | Integração com SEFAZ requer certificado A1/A3 e provedor certificado |
| Envio de e-mail | Feature | Cotações/notificações usam mock; configurar SMTP antes de go-live |
| Relatório de Vendas | UX | `SalesReportPage.tsx` — gráfico de barras pode precisar de mais filtros |
| `FRONTEND_URL` produção | Config | Em produção, alterar para o domínio real no `.env` |
| Rate limiting | Segurança | helmet está ativo mas não há rate limiting explícito por endpoint |
| SSL/TLS | Infra | Nginx sem certificado TLS — configurar Let's Encrypt antes de go-live |

---

## Arquivos Modificados Nesta Varredura

| Arquivo | Alteração |
|---------|-----------|
| `apps/backend/src/modules/crm/crm.service.ts` | Stages do pipeline sincronizados com seed |
| `apps/frontend/src/pages/fiscal/NFe.jsx` | Modal EmitirModal com campos cliente/valor |
| `apps/frontend/src/pages/financeiro/AprovacaoPedidos.jsx` | Merge EntityRecords + Prisma SaleOrders |
| `apps/backend/package.json` | Adicionado script `seed:materials` |
| `docker-compose.yml` | Healthcheck frontend com fallback curl |
| `apps/frontend/src/components/layout/Sidebar.jsx` | Link "Apontamento" no menu Produção |

---

*Gerado pela varredura completa em 02/05/2026. Build: backend tsc 0 erros, frontend Vite 0 erros.*
