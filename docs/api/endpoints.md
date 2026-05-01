# API — endpoints principais

Base URL (dev Docker host): `http://localhost:3001`

## Autenticação

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/api/auth/login` | Body: `{ email, password }` → JWT |
| GET | `/api/auth/me` | Usuário atual (Bearer) |

## Saúde

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/health`, `/api/health` | Checagem leve |
| GET | `/health/ready`, `/api/health/ready` | Postgres + migrações; Redis se `REDIS_URL` definido |

## Metadados / CRUD dinâmico

| Método | Caminho | Notas |
|--------|---------|-------|
| GET/POST | `/api/entities` | Gestão de entidades (permissão `entity.manage`) |
| GET | `/api/entities/:code` | Metadados + `fields` |
| GET/POST | `/api/records` | Lista/cria por `entity` (query/body) |
| GET/PUT/DELETE | `/api/records/:id` | Por ID |

Permissões por entidade: `{code}.view|create|edit|delete` e fallback `record.manage` / códigos legados.

## Operação

| Área | Prefixo exemplo |
|------|-----------------|
| Usuários | `/api/users` |
| Permissões | `/api/permissions` |
| Dashboard | `/api/dashboard` |
| Notificações | `/api/notifications`, `/api/notifications/me` |
| Compras | `/api/compras/*` |
| Vendas / clientes | `/api/vendas/*` |
| Financeiro | `/api/financeiro/*` |
| Workflows | `/api/workflows` |

## Tempo real

- WebSocket: **`/socket.io`** (mesmo host que a API em dev com proxy, ou nginx → backend em Docker).

Para contrato completo futuro, recomenda-se gerar OpenAPI a partir dos routers Express (pendência opcional).
