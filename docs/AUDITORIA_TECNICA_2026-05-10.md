# Auditoria Técnica Enterprise — ERPCOZERP

Data: 2026-05-10

## 1) Relatório Executivo

### Estado atual e maturidade
- **Maturidade geral: intermediária (M2/M3)**. O projeto possui amplitude funcional alta (ERP completo), mas com sinais fortes de crescimento orgânico sem governança arquitetural equivalente.
- **Ponto forte**: cobertura funcional ampla, modularização por domínio no backend e lazy loading no frontend.
- **Ponto crítico**: backend é **Express modular**, não NestJS (divergência com a stack desejada), sem DI estruturada, sem camadas de domínio/repositório consistentes.
- **Risco sistêmico**: multi-tenant baseado em middleware + extensão Prisma com brechas operacionais em operações não cobertas e validações redundantes/inconsistentes.

### Principais riscos
1. **Vazamento inter-tenant (alto impacto legal/financeiro)** por depender de injeção automática de `companyId` em middleware Prisma, com cobertura parcial de operações e bypass possível em SQL cru/transações mal modeladas.
2. **Autenticação/autorização inconsistentes**: duplicidade entre `authenticate` e `tenantMiddleware`, fallback inseguro de segredo JWT, e validação de tenant que falha “aberta” em trecho do auth.
3. **Escalabilidade funcional prejudicada**: `App.jsx` e `app.ts` centralizam alta complexidade (god files), elevando custo de manutenção e risco de regressão.
4. **Observabilidade e hardening insuficientes**: logs sem correlação completa (request-id/tenant-id em toda cadeia), sem rate limit global robusto visível.

### O que corrigir primeiro
- Corrigir políticas de segurança multi-tenant/JWT (P0).
- Introduzir governança de dados transacionais críticos (estoque/financeiro) com locking e idempotência (P0).
- Reduzir complexidade estrutural (frontend/backbone de rotas) e padronizar arquitetura (P1).
- Fortalecer DevSecOps (CI com gates de segurança/perf, migração, rollback) (P1).

---

## 2) Lista de Problemas (priorizada)

| Gravidade | Arquivo | Problema | Impacto em produção | Solução recomendada |
|---|---|---|---|---|
| **Crítica** | `apps/backend/src/middleware/auth.ts` | `JWT_SECRET` com fallback `dev_change_me` e validação de company que pode não bloquear em erro | Aceitação indevida de tokens em cenários mal configurados; risco de acesso indevido | Remover fallback; falhar startup sem segredo forte; validação tenant fail-closed |
| **Crítica** | `apps/backend/src/infra/prisma.middleware.ts` | Tenant enforcement por middleware não cobre todos os padrões de acesso e depende de heurística por `companyId` | Risco de vazamento entre empresas via operação não coberta/raw query | Implementar RLS no PostgreSQL + policy por tenant + proibir raw sem wrapper seguro |
| **Alta** | `apps/backend/src/app.ts` | Registro manual massivo de módulos e middlewares em arquivo único | Alto acoplamento, regressões em deploy, difícil observabilidade de pipeline | Composition root por domínio + autoload controlado + testes de wiring |
| **Alta** | `apps/frontend/src/App.jsx` | Arquivo monolítico com dezenas de imports lazy e rotas | Build/merge conflituoso, baixa legibilidade, onboarding lento | Split por bounded context (sales, stock etc.) + route manifests |
| **Alta** | `apps/backend/prisma/schema.prisma` | Alto volume de modelos sem convenções unificadas de auditoria/soft delete por tabela | Inconsistência de rastreabilidade e compliance | Padronizar colunas `created_by/updated_by/deleted_at/company_id` com mixins/generator |
| **Alta** | `apps/backend/src/middleware/tenant.ts` | Revalida token, duplicando auth e acoplando persistência na middleware | Overhead por request, inconsistência de regras, bugs de contexto | Unificar pipeline auth+tenant context em único middleware canônico |
| **Média** | `apps/frontend/src/services/api.ts` | Cliente fetch sem retry/backoff/circuit breaker e sem timeout explícito | UX instável em latência/instabilidade de rede; explosão de erro cascata | Adotar wrapper com AbortController, retry exponencial e classificação de erro |
| **Média** | `apps/backend/src/infra/prisma.ts` | Prisma log apenas `error`; pouca telemetria de query lenta | Gargalos silenciosos e troubleshooting lento | Habilitar eventos de query lenta + OpenTelemetry + sampling |
| **Média** | `apps/backend/src/app.ts` | HTTP logger com payload limitado (sem request-id/tenant-id/user-id padronizados) | Baixa rastreabilidade de incidentes | Propagar correlation-id + tenant/user em MDC structured logging |
| **Média** | `apps/frontend/src/main.jsx` | Render root sem `StrictMode` e sem boundary global de runtime/perf | Menor detecção precoce de efeitos colaterais em dev | Habilitar StrictMode (com mitigação onde necessário) |

---

## 3) Arquitetura Geral — Diagnóstico profundo

### Estrutura de pastas e modularização
- Há separação por módulos no backend (`modules/*`) e por páginas/serviços no frontend, mas coexistem sinais de crescimento não curado: duplicidade semântica (ex.: `financeiro` e `financial`, `estoque` e `stock`) e múltiplos contextos com responsabilidades cruzadas.
- O bootstrap da API concentra decisões de segurança, eventos e registro de todos os módulos em `app.ts`, criando ponto único de falha arquitetural.

### DDD / Clean / SOLID
- **DDD parcial**: nomes de domínio existem, porém sem “camada de domínio” explícita; regras convivem em rotas/services e acesso direto ao Prisma.
- **SRP violado** em arquivos agregadores (app e rotas centrais frontend).
- **DIP fraco**: ausência de contracts/repositories abstratos dificulta testes isolados e substituição de infraestrutura.

### Multi-tenant isolation
- O isolamento depende de:
  1) `tenantMiddleware` para carregar contexto.
  2) extensão Prisma que injeta `companyId` se o model possuir a coluna.
- Isso é **bom como defesa em profundidade inicial**, porém insuficiente como barreira final sem RLS no banco.

### Anti-patterns encontrados
- “God files” (App/router/bootstrap).
- Validação de segurança redundante em dois middlewares distintos.
- Estratégia de autorização com consultas repetitivas por request sem cache local curto por token/session.

---

## 4) Backend (Express/Prisma) — Achados

### Segurança e autenticação
- `authenticate` aceita segredo padrão (`dev_change_me`) quando variável não existe: configuração insegura por design.
- Há trecho que captura erro ao validar empresa e **não bloqueia totalmente** (comentário de migração), reduzindo postura fail-safe.
- `tenantMiddleware` repete parsing/verificação de JWT, elevando custo e divergência de regras.

### Queries, transações e concorrência
- Mecanismo de tenant injection cobre operações comuns, mas não é prova formal de isolamento em todo acesso.
- Não há evidência clara (nos arquivos auditados) de padrão uniforme de transações para operações críticas de estoque/financeiro (ex.: baixa de saldo + lançamento contábil + auditoria atômicos).

### Observabilidade
- Logging HTTP básico com método, URL, status, duração; faltam correlation ids, tenant tags e orquestração com traces.

### Organização de módulos
- Número alto de módulos sem convenção de camadas por módulo (controller/service/repository/use-case) sugere risco de erosão arquitetural.

---

## 5) Banco de Dados (Prisma/PostgreSQL)

### Modelagem
- Schema extenso e rico, com índices pontuais relevantes; porém a estratégia de multi-tenant aparenta ser **app-level first** em vez de **db-enforced first**.
- Relações e índices existem em múltiplas entidades, mas falta padrão transversal de soft delete/auditoria em todas as tabelas de negócio.

### Integridade e segurança de dados
- Para ERP financeiro/estoque, recomenda-se:
  - constraints de unicidade funcionais por tenant,
  - chaves naturais complementares,
  - trilha de auditoria imutável (append-only) para eventos críticos.

---

## 6) Frontend (React/Vite)

### Organização e componentização
- `App.jsx` muito extenso, rotas e importações em massa.
- Sinais de duplicidade de contexto/auth (`AuthContext` e `AuthContext_new`) sugerem dívida ativa.

### Performance
- Lazy loading está presente, porém sem chunk strategy por domínio explicitamente versionada.
- Potencial de re-render desnecessário por múltiplos providers globais no topo da árvore.

### Segurança e UX
- Cliente API sem timeout/retry/circuit breaker; tratamento de erro é funcional, mas pouco resiliente para cenários de degradação.

---

## 7) DevOps / Operação

- Projeto possui Docker/compose, scripts e testes, mas faltam evidências (nesta auditoria local) de:
  - pipeline CI com SAST/DAST,
  - migração com canary/blue-green,
  - estratégia formal de rollback e disaster recovery testado,
  - SLO/SLA instrumentado.

---

## 8) Performance

Principais gargalos potenciais:
- Consulta de permissões recalculada por request em pontos críticos.
- Inicialização e roteamento com alto acoplamento estrutural.
- Falta de telemetria de query lenta para atacar p95/p99 com precisão.

---

## 9) ERP específico (estoque/financeiro/fiscal)

Riscos de negócio:
- Concorrência de estoque sem lock transacional consistente pode gerar saldo negativo/inconsistente.
- Falta de trilha imutável para eventos financeiros críticos dificulta auditoria e fechamento.
- Integrações fiscais simuladas/mock devem ser isoladas explicitamente por ambiente para evitar confusão operacional.

---

## 10) Escalabilidade SaaS

Estado atual: **preparação parcial**.

Para escalar com segurança:
1. RLS obrigatório no PostgreSQL.
2. Cache distribuído por tenant (chaves namespaced + invalidation strategy).
3. Filas para workloads assíncronos (webhooks, reconciliações, geração de PDF, analytics).
4. Particionamento lógico (tenant-aware) e plano de sharding futuro.

---

## 11) Roadmap de melhorias

### Curto prazo (0–30 dias)
- Remover fallback de JWT secret e bloquear startup sem segredo forte.
- Unificar autenticação + tenant context em um pipeline.
- Implementar rate limit global + por rota sensível.
- Adicionar request-id/tenant-id/user-id em todos os logs.
- Extrair rotas frontend por domínio e reduzir `App.jsx`.

### Médio prazo (30–90 dias)
- Adotar arquitetura por casos de uso (application layer) com repositórios.
- RLS no PostgreSQL com políticas por tenant e testes de isolamento.
- Introduzir filas (BullMQ/Redis streams) para processamento assíncrono.
- Observabilidade completa (OpenTelemetry + traces + métricas RED/USE).

### Longo prazo (90+ dias)
- Evoluir para arquitetura orientada a eventos (event backbone).
- CQRS seletivo para domínios de leitura pesada (dashboards/analytics).
- Estratégia multi-região/DR e governança de custo/performance.

---

## 12) Score técnico (0-10)

| Dimensão | Nota |
|---|---:|
| Arquitetura | 5.5 |
| Segurança | 4.8 |
| Performance | 5.6 |
| Escalabilidade | 5.2 |
| Organização | 5.4 |
| Backend | 5.7 |
| Frontend | 5.8 |
| Banco de dados | 6.1 |
| DevOps | 5.0 |
| Qualidade de código | 5.3 |

---

## 13) Prioridades objetivas

### Pode quebrar produção
- Falhas de autenticação/tenant validation inconsistentes.
- Operações críticas sem transação/lock robusto.

### Risco financeiro
- Inconsistência de estoque/financeiro sob concorrência.
- Falta de trilha de auditoria imutável para ajustes.

### Pode vazar dados
- Isolamento multi-tenant não imposto no banco (RLS ausente).

### Prejudica escalabilidade
- Arquivos monolíticos e alto acoplamento de bootstrap/rotas.
- Falta de filas e cache distribuído com estratégia de invalidação.

### Corrigir imediatamente
- JWT secret/fail-closed auth.
- Tenant isolation em nível de banco.
- Rate limiting + hardening de endpoints críticos.

---

## 14) Melhorias avançadas (enterprise)

- **Arquitetura**: módulo por bounded context com application services + domain services + repositories.
- **Segurança**: RLS + secrets manager + rotação de chaves + auditoria assinada.
- **Observabilidade**: logs estruturados, traces distribuídos, painéis SLO por tenant.
- **Event-driven**: outbox pattern + consumers idempotentes.
- **CQRS**: projeções de leitura para dashboards ERP.
- **Cache**: Redis namespaced por tenant com TTL por tipo de dado.
- **Testes**: pirâmide completa (unitário, integração, contrato, carga, chaos).

---

## 15) Dívida técnica

- Crescimento funcional acima da governança arquitetural.
- Acúmulo de módulos e rotas sem padronização estrita de camada.
- Estratégia de segurança multi-tenant ainda centrada na aplicação.

---

## 16) Exemplos concretos de código problemático

### Exemplo A — fallback inseguro de JWT secret
```ts
const secret = process.env.JWT_SECRET || 'dev_change_me';
```
**Problema**: permite configuração fraca em produção por erro operacional.

### Exemplo B — validação de company com tratamento permissivo
```ts
} catch (e) {
  console.error('[authenticate] Erro validando company:', ...);
  // Não bloqueia completamente, pode estar durante migração
}
```
**Problema**: em erro de infraestrutura, caminho de autorização pode seguir.

### Exemplo C — acoplamento de bootstrap
`app.ts` registra dezenas de módulos manualmente, elevando custo de mudança e risco de regressão.

---

## 17) Checklist de ação

- [ ] Remover fallback de segredo JWT.
- [ ] Fail-closed em qualquer erro de validação de tenant.
- [ ] Implementar RLS e testes de isolamento multi-tenant.
- [ ] Revisar transações estoque/financeiro com locking explícito.
- [ ] Quebrar `App.jsx` em roteadores por domínio.
- [ ] Inserir observabilidade ponta-a-ponta com correlação.
- [ ] Definir padrões mandatórios de módulo/camadas.
