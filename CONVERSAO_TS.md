# Conversao TypeScript

## Lote 1

- `apps/backend/scripts/migrate-entities-to-prisma.js` → `apps/backend/scripts/migrate-entities-to-prisma.ts`
- `tests/smoke/api-smoke.cjs` → `tests/smoke/api-smoke.ts`
- `package.json` atualizado para executar o smoke com `tsx`

## Observacoes

- A lógica do script de migração legado foi preservada; a conversão foi focada na extensão e na execução via TypeScript.
- O smoke test da raiz passou a usar o binário `tsx` do backend para evitar dependência duplicada na raiz.