# Fluxo Cozinca

## Objetivo
Documentar ajustes específicos para o workflow Cozinca Inox, incluindo permissões de cargos, fluxo de aprovação de orçamentos e pedidos, filtragem do kanban de produção por setor e automação de eventos de estoque/produção.

## Principais mudanças aplicadas

- Backend
  - Adicionado evento `PRODUTO_BOM_COMPLETO` em `apps/backend/src/lib/events.ts`.
  - Evento disparado quando um produto atinge BOM completo em `apps/backend/src/modules/products/products.service.ts`.
  - Handler registrado em `apps/backend/src/modules/production/production.events.ts` para notificar usuários com papel `gerente_producao` quando a BOM do produto estiver completa.
  - Endpoint de aprovação de orçamentos implementado em `apps/backend/src/modules/sales/sales.routes.ts` e `apps/backend/src/modules/sales/sales.service.ts`.
  - Filtro de setor adicionado ao endpoint de listagem de ordens de produção em `apps/backend/src/modules/production/production.service.ts`.
  - API de setores de máquinas exposta em `apps/backend/src/modules/production/production.routes.ts`.

- Frontend
  - `apps/frontend/src/pages/producao/KanbanProducao.jsx` atualizado para buscar setores e filtrar o kanban por setor.
  - `apps/frontend/src/services/opService.ts` ajustado para enviar `limit` e `sector` como query params.
  - Menu lateral em `apps/frontend/src/components/layout/Sidebar.jsx` ajustado para usar permissões mais específicas em vez de `ver_vendas` e `ver_producao`.

## Permissões ajustadas

- `ver_crm` para CRM e gestão de processos.
- `ver_expedicao` para expedição.
- `ver_projetos` para projetos.
- `ver_conhecimento` para base de conhecimento.
- `ver_qualidade` para páginas de qualidade.

## Próximos passos

- Revisar `apps/backend/prisma/seed.ts` para alinhar os cinco papéis de usuário Cozinca com as permissões corretas.
- Validar o fluxo de aprovação de cotação e o comportamento de menu no frontend.
- Executar testes de API e UI para confirmar as notificações e filtros de setor.

## Papéis principais Cozinca

- `gerente` — Gerência geral / aprovações transversais
- `gerente_producao` — PCP e chão de fábrica
- `orcamentista_vendas` — Comercial e orçamentos
- `projetista` — Engenharia, BOM e roteiros
- `compras` — Suprimentos e ordens de compra

> Os papéis acima são os principais perfis Cozinca a serem verificados no seed e mapeados corretamente para o frontend.
