# Relatório de testes finais — ERP Cozinha (core)

**Data:** 2026-05-01  
**Ambiente:** Docker Compose `docker-compose.yml` (Postgres, Redis, backend `:3001`, frontend `:5173`).

## Automatizado

| Suite | Resultado |
|-------|-----------|
| `node tests/smoke/test-all-endpoints.cjs` | **23/23** passando (login, entidades, records por domínio, compras, financeiro, workflows, users, dashboard, `GET /api/health/ready`) |
| `npm run lint` | **OK** (frontend `eslint` + backend `tsc --noEmit`) |

## Smoke manual (validação funcional)

Execução recomendada no ambiente Docker já em pé:

1. **Login** — `http://localhost:5173` com `master@Cozinha.com` / `master123_dev` (ou senha definida em `DEFAULT_MASTER_PASSWORD`).
2. **Clientes / pedidos** — listagens via API dinâmica; criar/editar se perfil tiver permissões granulares ou legadas equivalentes.
3. **Ordens de produção e apontamento** — fluxo em Produção: abrir OP, registrar apontamento; verificar Socket.IO (toast “Novo apontamento” / “Ordem de produção em atraso” quando aplicável).
4. **Usuários** — Configurações → Usuários: listagem via `/api/users`; criar usuário com senha ≥ 8 caracteres.
5. **Metadata Studio** — criar entidade de teste com campos (`text`, `number`, `date`, `select`, `json`); validar que JSON inválido bloqueia salvamento no modal dinâmico.

## Observações

- **403:** listagens via `recordsServiceApi.list` retornam lista vazia sem spam de toast (`silent403`); mutações continuam exibindo feedback quando aplicável.
- **Health:** `/api/health/ready` ignora Redis se `REDIS_URL` não estiver definido; com URL, falha com 503 se o ping Redis falhar.
