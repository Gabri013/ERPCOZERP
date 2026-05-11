# Plano de padronização TypeScript (Frontend + Backend)

## Objetivo
Migrar o projeto para padrão TypeScript consistente, removendo gradualmente arquivos `.jsx` e regras ambíguas de tipagem.

## Escopo atual
- Backend já é majoritariamente TypeScript (`.ts`).
- Frontend ainda possui parte relevante em `.jsx`.

## Estratégia em 4 fases

### Fase 1 — Base (1-2 dias)
- Habilitar `checkJs` e `allowJs` no frontend com warnings.
- Definir `strict: true` em etapas (não tudo de uma vez).
- Adotar aliases e tipos compartilhados para API.

### Fase 2 — Núcleo (3-5 dias)
- ✅ Migrar `src/main.jsx` → `main.tsx` (concluído).
- ✅ Migrar `src/App.jsx` → `App.tsx` (concluído; tipagem fina pendente por domínio).
- Migrar contexts críticos: Auth, Permissões, Realtime.

### Fase 3 — Domínios (1-2 semanas)
- Migrar por módulo: Vendas, Compras, Estoque, Produção, Financeiro.
- Cada módulo só fecha quando:
  - build ok,
  - lint ok,
  - smoke/e2e do módulo ok.

### Fase 4 — Hardening
- Remover `allowJs`.
- Bloquear PR com `tsc --noEmit` no CI.
- Estabelecer contratos DTO tipados end-to-end.

## Critérios de pronto
- 0 arquivos `.jsx` em `apps/frontend/src`.
- `npm run lint` e `npm run build` verdes.
- smoke + e2e críticos verdes.

## Risco e mitigação
- **Risco:** quebra de fluxo em páginas extensas.
- **Mitigação:** migração incremental por domínio com feature flags e testes por rota.
