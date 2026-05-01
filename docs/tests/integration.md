# Testes de integração

Testes de integração (API ou banco) devem residir em **`tests/integration/`** (ou em suites dedicadas no CI).

O backend legado MySQL foi removido; smoke rápido da API Postgres/Prisma:

```bash
npm run test:smoke
```
