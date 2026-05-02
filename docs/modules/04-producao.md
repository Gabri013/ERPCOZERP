# Módulo 4 – Produção

## Objetivo
Ordens de Produção (OP), PCP, Kanban, chão de fábrica, roteiros e máquinas.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/production/production.module.ts` | Registra rotas |
| `apps/backend/src/modules/production/production.routes.ts` | Endpoints OPs, máquinas, roteiros, PCP |
| `apps/backend/src/modules/production/production.service.ts` | Lógica: apontamento, finalização, movimentação de produto acabado |
| `apps/backend/src/modules/production/production.schemas.ts` | Validações Zod |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/producao/OrdensProducao.jsx` | Listagem de OPs com filtros e detalhes |
| `apps/frontend/src/pages/producao/DetalheOP.jsx` | Detalhe da OP: etapas, BOM, apontamentos |
| `apps/frontend/src/pages/producao/Apontamento.jsx` | Tela de apontamento (operador) |
| `apps/frontend/src/pages/producao/KanbanProducao.jsx` | Kanban drag-and-drop por status |
| `apps/frontend/src/pages/producao/PCP.jsx` | Sequenciamento por prioridade/data |
| `apps/frontend/src/pages/producao/ChaoDeFabrica.jsx` | Visão do dia por máquina |
| `apps/frontend/src/pages/producao/Maquinas.jsx` | CRUD de máquinas e centros de trabalho |
| `apps/frontend/src/pages/producao/Roteiros.jsx` | CRUD de roteiros (sequência de etapas) |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/production/work-orders` | CRUD ordens de produção |
| GET | `/api/production/work-orders/:id` | Detalhe da OP |
| PATCH | `/api/production/work-orders/:id` | Atualizar OP |
| POST | `/api/production/work-orders/:id/finish` | Finalizar OP → movimenta estoque |
| GET/POST | `/api/production/machines` | CRUD máquinas |
| GET/POST | `/api/production/routings` | CRUD roteiros |
| GET | `/api/production/pcp` | Sequenciamento PCP |
| GET | `/api/production/floor` | Visão chão de fábrica |
| POST | `/api/production/kanban/reorder` | Reordenar Kanban |

## Modelos Prisma

- `WorkOrder` — produto, quantidade, status (criada → fila → em_producao → finalizada), data prevista
- `WorkOrderStatusHistory` — histórico de mudanças de status
- `Machine` — nome, centro de trabalho, capacidade/hora
- `Routing` / `RoutingStep` — sequência de etapas (Corte, Dobra, Solda, Acabamento, Montagem, QC)

## Etapas Padrão (Indústria de Aço Inox)

1. **Corte** (plasma, laser, guilhotina)
2. **Dobra** (prensa dobradeira)
3. **Solda** (MIG, TIG, ponto)
4. **Acabamento** (lixamento, polimento, decapagem)
5. **Montagem** (pré-montagem, montagem final)
6. **QC** (controle de qualidade, inspeção)

## Permissões

`ver_op`, `criar_op`, `editar_op`, `apontar_op`, `ver_kanban`, `ver_pcp`,
`ver_chao_fabrica`, `ver_maquinas`, `ver_roteiros`

## Como Testar

1. Acesse **Produção → Ordens de Produção** e crie uma OP para um produto.
2. Mude o status para "Em produção" via **Kanban** ou diretamente.
3. Faça um **apontamento** em **Chão de Fábrica**.
4. Finalize a OP — verifique que o estoque do produto acabado foi incrementado.
5. Acesse **PCP** para ver o sequenciamento.
