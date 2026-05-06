# PROGRESS.md - Implementações Fase 1

## 1.1 Rate limiting no auth
- ✅ Implementado em `apps/backend/src/modules/auth/auth.routes.ts`
- Instalado `express-rate-limit`
- Limite: 10 tentativas por IP a cada 15 minutos
- Retorno 429 com mensagem "Muitas tentativas. Tente novamente em 15 minutos."
- Middleware ativo na rota POST /api/auth/login
- Testado: smoke test passou
- Data: 2026-05-05

## 1.2 Tabelas INSS/IRRF 2025 reais
- ✅ Substituído hardcoded em `apps/backend/src/modules/hr/hr.service.ts`
- Funções puras: `calcularINSS(salario)` e `calcularIRRF(base)`
- INSS 2025: até 1.518=7,5%, até 2.793,88=9%, até 4.190,83=12%, até 8.157,41=14%
- IRRF 2025: até 2.428,80=isento, até 3.751,05=7,5%-182,16, até 4.664,68=15%-394,45, até 6.101,06=22,5%-744,80, acima=27,5%-1.049,72
- Testado: smoke test passou
- Data: 2026-05-05

## 1.3 Health check endpoint
- ✅ Ajustado GET /api/health em `apps/backend/src/modules/health/health.routes.ts`
- Retorna JSON: { status, timestamp, database, redis, uptime }
- database: teste com prisma.$queryRaw`SELECT 1`
- redis: teste com client.ping() — se não configurado, "disabled"
- Status HTTP: 200 se tudo OK, 503 se DB falhar
- Testado: smoke test passou
- Data: 2026-05-05

## 1.4 Centro de custo no módulo financeiro
- ✅ Adicionado model CostCenter em `apps/backend/prisma/schema.prisma`
- Relacionado opcionalmente com lançamentos financeiros via costCenterId
- Criada migration Prisma
- Adicionados endpoints GET/POST /api/financial/cost-centers em `apps/backend/src/modules/financial/financial.routes.ts` e service
- Ajustado payload no frontend `apps/frontend/src/services/financeiroService.js` para incluir costCenterId
- Adicionado service costCenterService no frontend
- Testado: smoke test passou
- Data: 2026-05-05

## 3.1 Integração NF-e real com Focus NFe
- ✅ Implementado emissão real via Focus NFe API
- Criado `apps/backend/src/modules/fiscal/nfe.service.ts` com funções emitirNFe, consultarNFe, cancelarNFe, downloadXML
- Adicionado cálculo automático de impostos em `tax.service.ts` com Simples Nacional e Lucro Presumido
- Atualizado frontend `apps/frontend/src/pages/fiscal/NFe.jsx` para payload real, chave de acesso, status SEFAZ, download XML
- Adicionado campos CNPJ, justificativa de cancelamento
- Testado: integração com API externa
- Data: 2026-05-06

## 3.2 Cálculo de impostos
- ✅ Implementado `calcularImpostos(item, uf_destino, regime)` em `apps/backend/src/modules/fiscal/tax.service.ts`
- Suporte a Simples Nacional (alíquotas ICMS por UF, PIS/COFINS 0.65% cada)
- Suporte a Lucro Presumido (alíquotas ICMS por UF, PIS/COFINS 1.65% e 7.6%)
- Integração automática no `nfe.service.ts` para cálculo antes da emissão
- IPI para produtos industrializados (simplificado)
- Data: 2026-05-06

## 3.3 Armazenamento de XMLs
- ✅ Criado `xml.storage.ts` com `salvarXML` e `recuperarXML` usando sistema de arquivos
- Diretório `storage/nfe/` adicionado ao `.gitignore`
- Cache local de XMLs baixados da API Focus NFe
- Integração no `nfe.service.ts` para salvar/recuperar XMLs automaticamente
- Data: 2026-05-06

## 3.4 SPED Fiscal
- ✅ Implementado `gerarSPED(ano, mes)` em `sped.service.ts` com registros |0000| a |9999|
- Blocos 0 (cadastros), C (NF-es), D (CT-es), encerramentos
- Rota `/api/fiscal/sped/export?ano=2026&mes=5` para download do arquivo SPED
- Layout EFD ICMS/IPI completo e válido
- Data: 2026-05-06

## 4.1 Dashboard Executivo
- ✅ Adicionado rota `/api/dashboard/executivo` em `dashboard.routes.ts`
- KPIs: receita total, total clientes, produtos, funcionários, NF-es do mês
- Status produção: em andamento, concluídas, atrasadas
- Receita mensal (últimos 12 meses)
- Top 10 produtos mais vendidos
- Dados agregados do banco de dados
- Data: 2026-05-06

## 4.2 Logs com Winston
- ✅ Implementado logging estruturado em `apps/backend/src/infra/logger.ts`
- Winston com níveis info, error, debug
- Arquivos: combined.log, error.log, audit.log, http.log
- Middleware HTTP logging em `app.ts`
- Logs de auditoria com `logAudit()`
- Diretório `logs/` no `.gitignore`
- Data: 2026-05-06

## 4.3 Backup script
- ✅ Criado `scripts/backup.js` para backup automatizado
- Backup PostgreSQL com pg_dump
- Backup de arquivos (storage/nfe, logs, uploads) com tar
- Limpeza automática de backups antigos (mantém 30 mais recentes)
- Logs estruturados durante execução
- Data: 2026-05-06

## 4.4 CI/CD com GitHub Actions
- ✅ Criado `.github/workflows/ci.yml`
- Pipeline: lint, build, test (backend + frontend)
- Deploy automático para Railway na branch main
- Backup agendado semanalmente
- Testes com PostgreSQL e Redis em containers
- Data: 2026-05-06

## 6.1 Multi-tenant schema e middleware
- ✅ Adicionado model Company em `apps/backend/prisma/schema.prisma`
- ✅ Adicionado companyId String em todos os models principais: User, Customer, Supplier, Product, SaleOrder, PurchaseOrder, WorkOrder, FinancialEntry, FiscalNfe, Employee, Lead
- ✅ Criadas relations company em todos os models
- ✅ Atualizado Company model com todas as relations
- ✅ Criado middleware tenant em `apps/backend/src/middleware/tenant.ts` para validar companyId e empresa ativa
- ✅ Atualizado JWT payload para incluir companyId
- ✅ Atualizado middleware auth para incluir companyId no req.user
- ✅ Aplicado tenantMiddleware globalmente após auth em `app.ts`
- ✅ Atualizado services (ex: listSaleOrders, getSaleOrder) para filtrar por companyId
- ✅ Criado admin panel para gerenciar empresas em `/api/admin/companies`
- ✅ Testado: schema válido, middleware ativo
- Data: 2026-05-06

## 6.2 PDF Reports
- ✅ Instalado puppeteer-core para geração de PDFs
- ✅ Criado `apps/backend/src/modules/reports/pdf.service.ts` com funções generatePDF, generateSaleOrderHTML, generatePurchaseOrderHTML
- ✅ Criado módulo reports com rotas `/api/reports/sale-orders/:id/pdf` e `/api/reports/purchase-orders/:id/pdf`
- ✅ Registrado reports module em `app.ts`
- ✅ Testado: geração de PDFs funcionais
- Data: 2026-05-06

## 6.3 Real-time Notifications
- ✅ Instalado Socket.IO para notificações em tempo real
- ✅ Atualizado `apps/backend/src/realtime/io.ts` para incluir companyId e validação de empresa ativa
- ✅ Criado `apps/backend/src/services/socket.service.ts` com funções notifyCompany, notifyUser, notifyNewSaleOrder, etc.
- ✅ Integrado notificações em tempo real nos services (ex: createSaleOrder notifica criação)
- ✅ Testado: conexões Socket.IO funcionais com autenticação
- Data: 2026-05-06

## 6.4 PWA
- ✅ Instalado vite-plugin-pwa no frontend
- ✅ Atualizado `apps/frontend/vite.config.js` com VitePWA plugin e configuração de manifest
- ✅ Configurado service worker para cache e offline
- ✅ Adicionados ícones PWA no manifest
- ✅ Testado: app instalável como PWA
- Data: 2026-05-06

## 6.5 External Integrations
- ✅ Adicionado models ApiKey e Webhook em `schema.prisma`
- ✅ Criado `apps/backend/src/modules/webhooks/webhook.service.ts` com funções triggerWebhooks, validateApiKey, generateApiKey
- ✅ Criado rotas para gerenciar API keys e webhooks em `/api/webhooks/integrations`
- ✅ Integrado webhooks nos services (ex: sale_order.created dispara webhooks)
- ✅ Adicionado middleware apiKeyAuth para autenticação via API key
- ✅ Testado: webhooks disparados e API keys validadas
- Data: 2026-05-06