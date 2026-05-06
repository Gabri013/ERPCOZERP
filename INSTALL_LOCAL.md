# PROJECT_CONTEXT.md
# Mapa completo do ERPCOZERP — para desenvolvedores e IAs

Gerado em: 06/05/2026
Repositório: https://github.com/Gabri013/ERPCOZERP
Deploy: https://erpcozerp.vercel.app

---

## 1. VISÃO GERAL

O ERPCOZERP é um sistema ERP (Enterprise Resource Planning) industrial completo desenvolvido
para a **Cozinca Inox**, empresa brasileira fabricante de equipamentos em aço inox. O sistema
resolve o problema de gestão integrada de uma indústria de manufatura: desde o orçamento
comercial até a emissão de nota fiscal, passando por planejamento de produção, controle de
estoque, gestão financeira e recursos humanos. É um monorepo enterprise com frontend React
e backend Node.js, com 83 páginas, ~180 endpoints REST e 41 models no banco de dados.

---

## 2. STACK TECNOLÓGICA

**Frontend** — `apps/frontend`
- React 18 com Vite 6 como bundler (desenvolvimento rápido com HMR)
- Tailwind CSS para estilização utilitária
- shadcn/ui como biblioteca de componentes (baseada em Radix UI)
- Zustand para gerenciamento de estado global
- React Router para roteamento SPA
- Socket.IO client para comunicação em tempo real
- Three.js para visualizador 3D de modelos STL/glTF/OBJ
- Recharts para gráficos e dashboards

**Backend** — `apps/backend`
- Node.js 18+ com Express como framework HTTP
- TypeScript estrito em todo o backend
- Prisma ORM para comunicação com o banco de dados
- PostgreSQL 15+ como banco de dados principal
- Redis 7+ para cache e filas (opcional em desenvolvimento)
- Socket.IO para WebSockets em tempo real
- JWT para autenticação stateless
- tsx watch para hot reload em desenvolvimento

**Infraestrutura**
- Docker + Docker Compose para stack containerizada (opcional)
- nginx como proxy reverso em produção (assets + proxy /api e /socket.io)
- Railway e Render como plataformas de deploy (ambas com configuração pronta)
- Vercel para o frontend (vercel.json na raiz)
- GitHub Actions para CI/CD (.github/workflows/)
- Playwright para testes E2E

---

## 3. ARQUITETURA DO SISTEMA

O sistema é um **monorepo** com dois aplicativos independentes que se comunicam via HTTP e WebSocket.

O fluxo de uma requisição funciona assim: o usuário interage com a SPA React rodando em `localhost:5173`
(desenvolvimento) ou no domínio Vercel (produção). O Vite tem um proxy configurado que redireciona
todas as chamadas `/api/*` e `/socket.io` para `localhost:3001`, onde o backend Express está rodando.
O backend autentica a requisição via JWT no header Authorization, aplica o middleware de RBAC para
verificar permissões, executa a lógica de negócio no service correspondente, e usa o Prisma para
ler ou escrever no PostgreSQL. Respostas em tempo real (notificações, atualizações de OP) são
enviadas via Socket.IO diretamente para os clientes conectados.

O Redis é usado para cache de queries pesadas e para filas de jobs assíncronos. Quando não está
disponível (desenvolvimento sem Redis), o sistema sobe normalmente mas sem cache nem filas.

A autenticação usa JWT de curta duração. O token é armazenado no localStorage do frontend e
enviado em todas as requisições no header `Authorization: Bearer {token}`.

---

## 4. MÓDULOS DO BACKEND

Cada módulo fica em `apps/backend/src/modules/` e segue o padrão: `routes.ts` → `controller.ts`
→ `service.ts`, com o Prisma sendo chamado apenas nos services.

**auth** — Autenticação e sessões. Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`,
`GET /api/auth/me`, `POST /api/auth/refresh`. Usa o model User e UserSession do Prisma.
Rate limiting aplicado no login (10 tentativas por IP a cada 15 minutos).

**users** — Gestão de usuários e papéis. Endpoints: `GET/POST /api/users`,
`PUT /api/users/:id`, `DELETE /api/users/:id`, `PUT /api/users/:id/roles`.
Requer permissões `user.manage` ou `gerenciar_usuarios`.

**customers** — Clientes e fornecedores. Endpoints sob `/api/customers` e `/api/suppliers`.
Cadastro com CNPJ, endereço, contatos, histórico de pedidos.

**sales** — Pedidos de venda e orçamentos com workflow de aprovação (Kanban).
Endpoints sob `/api/sales/*`. Inclui tabela de preços, aprovação de orçamentos,
geração de pedidos, baixa de estoque ao confirmar.

**purchases** — Ordens de compra, cotações e recebimentos.
Endpoints sob `/api/purchases/*`. Fluxo: cotação → OC → recebimento → entrada em estoque.

**stock** — Produtos, movimentações de estoque, inventário e endereçamento físico.
Endpoints sob `/api/stock/*`. BOM (Bill of Materials) com importação de planilhas SolidWorks.

**production** — Ordens de produção (OP), PCP, Kanban de produção, roteiros,
apontamentos do chão de fábrica. Endpoints: `/api/work-orders`, `/api/production/*`.
Inclui painel do operador em tempo real via Socket.IO.

**crm** — Pipeline comercial, leads, oportunidades e atividades.
Endpoints sob `/api/crm/*`. Dashboard CRM com funil de vendas.

**hr** — Recursos humanos: funcionários, ponto eletrônico, férias, folha de pagamento.
Endpoints sob `/api/hr/*`. Tabelas INSS/IRRF 2025 implementadas como funções puras.

**financial** — Contas a receber, contas a pagar, fluxo de caixa, DRE, conciliação bancária,
centro de custo. Endpoints sob `/api/financial/*`. DRE calculada sobre lançamentos reais.

**fiscal** — NF-e (integrada com Focus NFe API em homologação), SPED fiscal.
Endpoints sob `/api/fiscal/*`. XMLs armazenados em `./storage/nfe/{ano}/{mes}/`.

**platform** — Configurações da empresa, Metadata Studio (campos dinâmicos),
workflows configuráveis, webhooks de saída, API Keys públicas.
Endpoints sob `/api/platform/*` e `/api/records` (registros dinâmicos).

---

## 5. PÁGINAS DO FRONTEND

Todas as páginas ficam em `apps/frontend/src/pages/`. O roteamento é feito com React Router,
com layout principal em `App.tsx` e proteção de rotas por autenticação e permissão.

O sistema tem **83 páginas** distribuídas por módulo. Os grupos principais são:

**Autenticação:** Login (`/login`).

**Dashboard:** Dashboard principal configurável por perfil (`/`), Dashboard Executivo (`/dashboard-executivo`),
Dashboard de BI (`/bi`).

**Vendas (5 páginas):** Lista de orçamentos, Detalhe do orçamento, Lista de pedidos,
Detalhe do pedido, Kanban de pedidos.

**Compras (4 páginas):** Lista de OCs, Detalhe da OC, Cotações, Recebimentos.

**Estoque (5 páginas):** Lista de produtos, Detalhe/BOM do produto, Movimentações,
Inventário, Endereçamento.

**Produção (8 páginas):** Lista de OPs, Detalhe da OP, PCP, Kanban de produção,
Roteiros, Apontamentos, Chão de Fábrica (operador), Máquinas.

**CRM (5 páginas):** Pipeline, Lista de leads, Detalhe do lead, Oportunidades, Atividades.

**RH (4 páginas):** Funcionários, Ponto eletrônico, Férias/Faltas, Folha de pagamento.

**Financeiro (7 páginas):** Contas a receber, Contas a pagar, Fluxo de caixa,
DRE, Conciliação bancária, Centro de custo, Lançamentos.

**Fiscal (3 páginas):** NF-e, SPED, Configurações fiscais.

**Engenharia (6 páginas):** BOM/SolidWorks, Visualizador 3D, Arquivos técnicos,
Especificações, Revisões, Documentos.

**Configurações (6 páginas):** Empresa, Parâmetros, Metadata Studio,
Workflows, Usuários, Papéis e permissões.

**Novas (Fases 5-7):** Reposição automática (`/estoque/reposicao`), Regras de negócio
(`/configuracoes/regras`), Aprovações (`/aprovacoes`), Assistente BI (componente flutuante).

---

## 6. MODELS DO BANCO DE DADOS

O schema Prisma tem **41 models** em `apps/backend/prisma/schema.prisma`. Os principais são:

**User** — Usuário do sistema. Campos: id, email, name, password (hash bcrypt), ativo,
companyId (multi-tenant). Relacionamentos: roles (N:M via UserRole), sessions, auditLogs.

**Company** — Empresa/tenant. Campos: id, cnpj, razaoSocial, fantasia, ativo.
Relacionamentos: todos os dados do ERP são filtrados por companyId.

**Customer / Supplier** — Clientes e fornecedores. CNPJ, endereço, contatos, companyId.

**Product** — Produtos/materiais. Campos: codigo, nome, unidade, custoUnitario,
precoVenda, estoqueAtual, estoqueMinimo, ncm, companyId.
Relacionamentos: BillOfMaterial (BOM), StockMovement, SaleOrderItem.

**SaleOrder** — Pedido de venda. Status: RASCUNHO → ORCAMENTO → APROVADO →
EM_PRODUCAO → EXPEDIDO → ENTREGUE → CANCELADO.
Relacionamentos: customer, items (SaleOrderItem), workOrders.

**WorkOrder (OP)** — Ordem de produção. Status: ABERTA → EM_ANDAMENTO →
PAUSADA → CONCLUIDA → CANCELADA. Campos: deadline, saleOrderId, productId, companyId.
Relacionamentos: appointments (apontamentos), BOM.

**FinancialEntry** — Lançamento financeiro. type: RECEITA | DESPESA.
status: PENDENTE | PAGO | CANCELADO. Campos: valor, dueDate, costCenterId.

**CostCenter** — Centro de custo. Campos: codigo, nome, descricao, ativo, companyId.

**FiscalNfe** — Nota fiscal eletrônica. Campos: referencia (Focus NFe),
chaveAcesso, xmlPath, focusStatus, serie, numero.

**Employee** — Funcionário. Campos: nome, cpf, cargo, salarioBase, valorHora,
dataAdmissao, companyId.

**Notification** — Notificação em tempo real. Campos: userId, tipo, titulo,
mensagem, lida, link, companyId.

**BusinessRule** — Regra de negócio configurável. Campos: gatilho, condicoes (JSON),
acoes (JSON), ativo, totalExec.

**ApprovalRequest** — Solicitação de aprovação multi-etapa. Campos: workflowId,
modulo, referenciaId, status, etapaAtual, historico (JSON).

**CustomerHealthScore** — Score de saúde do cliente (0-100). Calculado semanalmente.

**AuditLog** — Log de auditoria de todas as ações críticas. Campos: userId,
action, entity, entityId, details (JSON), ip.

---

## 7. AUTENTICAÇÃO E AUTORIZAÇÃO

O sistema usa JWT (JSON Web Token) com autenticação stateless. O token é gerado no login,
armazenado no localStorage do frontend, e enviado em todas as requisições no header
`Authorization: Bearer {token}`. A expiração é configurada via `JWT_EXPIRES_IN` (padrão: 8h).

O RBAC (Role-Based Access Control) é **granular**: cada usuário tem um ou mais papéis (roles),
e cada papel tem um conjunto de permissões específicas. As permissões são verificadas
no middleware `authMiddleware` do backend antes de qualquer handler de rota.

Os papéis existentes no seed de demonstração são: Master/Admin (acesso total),
Gerente de Produção, Vendas/Comercial, Projetista/Engenharia, Operador (Corte/Dobra/Montagem),
Qualidade, Expedição, RH, Financeiro e Compras. Cada papel tem permissões específicas
como `user.manage`, `gerenciar_usuarios`, `editar_config`, etc.

O endpoint `GET /api/permissions/me` retorna todas as permissões efetivas do usuário logado.
O frontend usa esse mapa para mostrar ou esconder elementos da interface.

---

## 8. VARIÁVEIS DE AMBIENTE

Configuradas em `apps/backend/.env` (backend) e `.env` na raiz (scripts).

`DATABASE_URL` (obrigatória) — String de conexão PostgreSQL.
Exemplo: `postgresql://erpcoz:erpcozpass@127.0.0.1:5432/erpcoz`

`JWT_SECRET` (obrigatória) — String aleatória longa (mínimo 32 caracteres) para assinar tokens JWT.

`JWT_EXPIRES_IN` (opcional, padrão: 8h) — Duração do token. Exemplo: `8h`, `24h`.

`REDIS_URL` (opcional em dev) — URL do Redis. Exemplo: `redis://127.0.0.1:6379`.
Sem ela o sistema sobe, mas cache e filas não funcionam.

`NODE_ENV` (opcional, padrão: development) — `development` ou `production`.
Em produção ativa logs JSON estruturados via winston.

`PORT` (opcional, padrão: 3001) — Porta do servidor Express.

`FRONTEND_URL` (obrigatória em produção) — URL do frontend para configuração de CORS.
Exemplo: `https://erpcozerp.vercel.app`

`SEED_ENABLED` (opcional, padrão: false) — Se `true`, o seed roda automaticamente.

`DEFAULT_MASTER_PASSWORD` (opcional) — Senha do usuário master no seed.
Padrão: `master123_dev`. Nunca use esse padrão em produção.

`FOCUS_NFE_TOKEN` (opcional) — Token da API Focus NFe para emissão de NF-e.
Vazio = modo homologação (sem emissão real).

`FOCUS_NFE_ENV` (opcional) — `homologacao` ou `producao`.

---

## 9. SCRIPTS DISPONÍVEIS

Na raiz do monorepo os scripts mais importantes são:

`npm run dev` — Sobe frontend (porta 5173) e backend (porta 3001) em paralelo com `concurrently`.
É o comando do dia a dia de desenvolvimento.

`npm run build` — Builda frontend (Vite) e backend (TypeScript) para produção.

`npm run lint` — ESLint no frontend + `tsc --noEmit` no backend. Verifica tipos sem gerar arquivos.

`npm run smoke` — Typecheck do backend + build do frontend. Rápido, sem precisar de API rodando.
Use antes de cada commit.

`npm run test` — Smoke HTTP contra a API em `http://localhost:3001`. Requer o backend rodando.

`npm run test:e2e` — Testes Playwright end-to-end. Requer stack completa rodando.

`npm run migrate:legacy` — Importa dump SQL legado (MySQL/MariaDB) para o PostgreSQL atual.

`npm run docker:up / docker:down / docker:logs` — Gerencia a stack Docker opcional.

`npm run prisma:seed --prefix apps/backend` — Popula o banco com dados de demonstração.

---

## 10. FLUXOS DE NEGÓCIO PRINCIPAIS

**Fluxo 1: Venda completa**
O vendedor cria um orçamento em `apps/frontend/src/pages/sales/Orcamentos.jsx`,
que chama `POST /api/sales/quotes`. O gerente aprova via Kanban (PATCH status → APROVADO),
o que aciona a geração automática de uma WorkOrder (OP) no módulo de produção.
Após entrega, o financeiro cria a conta a receber em `/api/financial/entries` e
o fiscal emite a NF-e via `POST /api/fiscal/nfe` (integrado com Focus NFe API).

**Fluxo 2: Produção**
Com a OP criada (WorkOrder status ABERTA), o gerente de produção aloca no PCP.
O operador abre o Chão de Fábrica (`/producao/chao-de-fabrica`) via Socket.IO em tempo real,
registra apontamentos (horas, quantidade produzida, refugo) via `POST /api/production/appointments`.
Ao concluir, a OP muda para CONCLUIDA e o estoque do produto acabado é incrementado.

**Fluxo 3: Compra**
O comprador identifica necessidade (manualmente ou via sugestão automática de reposição),
cria uma OC em `POST /api/purchases/orders`. Ao receber a mercadoria,
registra o recebimento que automaticamente gera uma StockMovement de entrada
e cria uma conta a pagar no módulo financeiro.

**Fluxo 4: Financeiro**
Vendas aprovadas geram contas a receber (FinancialEntry type=RECEITA, status=PENDENTE).
Compras recebidas geram contas a pagar (type=DESPESA). O financeiro dá baixa via
`PATCH /api/financial/entries/:id` (status → PAGO). A conciliação bancária importa
extratos CSV/CNAB e cruza com os lançamentos. A DRE é calculada dinamicamente
sobre os lançamentos pagos por período, segmentada por centro de custo.

**Fluxo 5: RH**
Funcionários são cadastrados em `POST /api/hr/employees`. O ponto é registrado diariamente.
No fechamento do mês, a folha é calculada em `POST /api/hr/payroll/calculate`,
aplicando as tabelas INSS 2025 (7,5% a 14% progressivo) e IRRF 2025
(isento a 27,5% com deduções). O resultado gera automaticamente
uma conta a pagar no módulo financeiro.

---

## 11. STATUS DE IMPLEMENTAÇÃO (Fases concluídas)

Com base no histórico de desenvolvimento do projeto:

**Fase 1 — Crítico (implementado):** Rate limiting no auth (10 tentativas/15min),
tabelas INSS/IRRF 2025 como funções puras testáveis, health check em `GET /api/health`,
centro de custo no módulo financeiro.

**Fase 2 — Importante (implementado):** Retry automático na geração de OP,
margem estimada por OP (card na tela de detalhe), projeção de fluxo de caixa
com pedidos abertos e OCs pendentes.

**Fase 3 — Fiscal Real (implementado):** Integração com Focus NFe API em homologação,
cálculo de impostos por regime tributário (Simples/Lucro Presumido), armazenamento
de XMLs em `./storage/nfe/`, SPED Fiscal com registros C100/C170 reais.

**Fase 4 — Produção (implementado):** Dashboard Executivo com KPIs financeiros/produção/estoque/CRM,
logs estruturados via winston, script de backup PostgreSQL, CI/CD com GitHub Actions.

**Fase 5 — Segurança e Qualidade (implementado):** Helmet + CORS + CSP, express-validator,
proteção contra SQL Injection em raw queries, cache Redis nas rotas pesadas,
índices de performance no banco, paginação em todas as listagens,
testes unitários (vitest) para tabelas fiscais e cache, ErrorBoundary, loading states,
responsividade mobile em páginas críticas.

**Fase 6 — Enterprise (implementado):** Multi-tenant por companyId, relatórios PDF
(DRE, Aging de recebíveis, Produtividade por operador) via Puppeteer,
notificações em tempo real via Socket.IO com sino no header,
PWA instalável com modo offline para o Chão de Fábrica (IndexedDB),
webhooks de saída e API pública com API Keys.

**Fase 7 — BI e IA (implementado):** Views materializadas PostgreSQL (mv_faturamento_diario,
mv_custo_op, mv_margem_produto), dashboard de BI com Recharts, previsão de demanda
com regressão linear (sem API externa), detecção de anomalias financeiras com Z-Score,
sugestão automática de reposição de estoque com ponto de reposição calculado,
Customer Health Score (0-100) calculado semanalmente, motor de regras de negócio
configurável pelo usuário, workflow de aprovações multi-etapa, assistente de BI
por linguagem natural com mapeamento de intenções local (sem API externa).

---

## 12. O QUE ESTÁ FALTANDO OU INCOMPLETO

Com base na análise dos documentos do repositório (`FUNCTIONALITY_REPORT.md`, `SCAN_REPORT.md`):

**Fiscal em produção real:** A integração com Focus NFe está em homologação. Para produção
real é necessário configurar `FOCUS_NFE_TOKEN` e `FOCUS_NFE_ENV=producao`, além de garantir
que `./storage/nfe/` seja um volume persistente (ou migrar para S3/R2).

**Storage de XMLs em produção:** A pasta `./storage/nfe/` é local. Em servidores efêmeros
(Railway, Render) os arquivos se perdem a cada deploy. Migração para S3/R2 está documentada
como pendente no PROGRESS.md.

**Testes E2E:** Os testes Playwright (`tests/e2e/`) existem mas a cobertura é parcial.
Módulos como Fiscal e RH não têm testes E2E completos.

**Backup automático:** O script `scripts/backup.sh` existe mas o cron job no Railway/Render
precisa ser configurado manualmente. Não há verificação automática de backup recente.

**Certificado digital A1:** Para emissão de NF-e em produção é necessário um certificado
digital A1 (.pfx) instalado no servidor. Isso não pode ser automatizado via código.

**Multi-tenant parcial:** O companyId foi adicionado aos models principais, mas alguns
módulos mais antigos podem ainda não filtrar consistentemente por companyId em todas
as queries. Verificação manual recomendada em módulos de engenharia e fiscal.

---

## 13. COMO RODAR O PROJETO

**Pré-requisitos:** Node.js 18+, PostgreSQL 15+, Redis 7+ (opcional), Git.

No Windows, instale o PostgreSQL via installer EDB (https://www.postgresql.org/download/windows/).
Anote a porta (padrão 5432) e a senha do superusuário.

**Passo 1 — Clone e instale:**
```
git clone https://github.com/Gabri013/ERPCOZERP.git
cd ERPCOZERP
npm install
npm install --prefix apps/frontend
npm install --prefix apps/backend
```

**Passo 2 — Configure o banco:**
```sql
CREATE USER erpcoz WITH PASSWORD 'erpcozpass';
CREATE DATABASE erpcoz OWNER erpcoz;
```

**Passo 3 — Configure variáveis de ambiente:**
```
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```
Edite `apps/backend/.env` e defina `DATABASE_URL`, `JWT_SECRET` e opcionalmente `REDIS_URL`.

**Passo 4 — Migrations e seed:**
```
cd apps/backend
npx prisma migrate dev
npx tsx prisma/seed.ts
cd ../..
```

**Passo 5 — Suba o projeto:**
```
npm run dev
```
Frontend em `http://localhost:5173`, backend em `http://localhost:3001`.

**Login de acesso:** `master@Cozinha.com` / `master123_dev`

---

## 14. CONVENÇÕES DO PROJETO

**Estrutura de módulos backend:** Cada módulo em `apps/backend/src/modules/{nome}/` tem
os arquivos `{nome}.routes.ts`, `{nome}.controller.ts` e `{nome}.service.ts`.
O controller só faz parsing de request/response. A lógica fica no service. O Prisma
só é chamado nos services, nunca nos controllers.

**Nomenclatura:** Arquivos em `kebab-case`. Classes e interfaces em `PascalCase`.
Funções e variáveis em `camelCase`. Constantes em `UPPER_SNAKE_CASE`.

**Tratamento de erros:** O backend usa um middleware global de erro que captura exceções
não tratadas e retorna `{ error: string, details?: any }` com o HTTP status apropriado.
Erros do Prisma (P2002 = unique constraint, P2025 = not found) são mapeados para 409 e 404.

**Formato de resposta das APIs:** Listagens retornam `{ data: [], pagination: { page, limit, total, totalPages } }`.
Recursos únicos retornam o objeto diretamente. Erros retornam `{ error: string }`.

**Commits:** Conventional Commits — `feat(módulo): descrição`, `fix(módulo): descrição`,
`refactor(módulo): descrição`. Rode `npm run smoke` antes de cada commit.

**Logs:** Nunca use `console.log` no backend. Use o `logger` de `apps/backend/src/lib/logger.ts`
(winston). Em desenvolvimento: colorido no console. Em produção: JSON estruturado.

---

## 15. CONTEXTO PARA A PRÓXIMA IA

Se você é uma IA ou desenvolvedor que vai continuar este projeto, leia com atenção:

**O que funciona e pode ser confiado:** Todo o core do ERP (Vendas, Compras, Estoque,
Produção, CRM, RH, Financeiro básico, Configurações) está sólido e testado. O RBAC é
robusto e granular. A autenticação JWT com rate limiting está funcionando. O seed de
demonstração cria um ambiente completo com 11 usuários e dados realistas.

**O que é frágil e precisa de cuidado:** O módulo fiscal está integrado com Focus NFe
em homologação — qualquer mudança no payload de NF-e precisa ser testada contra a API
antes de ir para produção. O storage de XMLs em disco (`./storage/nfe/`) se perde em
deploys em servidores efêmeros. O multi-tenant (companyId) foi adicionado em fases
— verifique se o módulo que você está alterando filtra corretamente por companyId
em todas as queries antes de assumir que está isolado.

**Onde estão as partes mais complexas:** O Metadata Studio em `apps/backend/src/modules/platform/`
implementa campos dinâmicos via `Entity/EntityRecord` — é o sistema mais sofisticado e
menos óbvio do projeto. O motor de regras de negócio (`rules.engine.ts`) avalia condições
JSON contra contextos de runtime — qualquer bug aqui pode disparar ações erradas silenciosamente.
As views materializadas do PostgreSQL precisam ser refreshadas — o job está em `daily.jobs.ts`.

**Decisões arquiteturais importantes:** O backend foi construído para ser stateless (JWT),
o que permite escalar horizontalmente. O Redis é opcional por design — o sistema degrada
graciosamente sem ele, mas perde cache e filas. O Prisma foi escolhido pela type-safety
e migrations automáticas. O monorepo foi escolhido para facilitar o compartilhamento
de tipos TypeScript entre frontend e backend no futuro.

**O que NÃO fazer para não quebrar o sistema:** Não altere o schema Prisma sem criar
uma migration (`npx prisma migrate dev`). Não remova permissões do seed sem verificar
se alguma rota as usa. Não altere o formato de resposta das APIs de listagem
(`{ data, pagination }`) sem atualizar o frontend. Não use `console.log` no backend —
o ESLint vai reclamar. Não faça queries sem filtrar por `companyId` nos módulos
multi-tenant ou um tenant verá dados de outro. Não esqueça de invalidar o cache Redis
ao mudar dados que são cacheados (produtos, dashboard, fluxo de caixa).

---

*Este documento foi gerado por análise direta do repositório GitHub em 06/05/2026.*
*Para manter atualizado: rode o prompt de geração novamente após cada fase implementada.*