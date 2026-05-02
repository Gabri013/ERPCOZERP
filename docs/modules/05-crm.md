# Módulo 5 – CRM

## Objetivo
Gerenciar leads, oportunidades, pipeline de vendas e atividades comerciais.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/crm/crm.module.ts` | Registra rotas |
| `apps/backend/src/modules/crm/crm.routes.ts` | Endpoints leads, oportunidades, pipeline, atividades |
| `apps/backend/src/modules/crm/crm.service.ts` | Lógica de negócio CRM |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/crm/CrmDashboard.jsx` | Dashboard com KPIs de pipeline |
| `apps/frontend/src/pages/crm/Leads.jsx` | Listagem e CRUD de leads |
| `apps/frontend/src/pages/crm/Oportunidades.jsx` | CRUD de oportunidades com valor e estágio |
| `apps/frontend/src/pages/crm/Pipeline.jsx` | Visualização Kanban dos estágios |
| `apps/frontend/src/pages/crm/Atividades.jsx` | Lista de atividades vinculadas a leads/oportunidades |

## Estágios do Pipeline

1. **Lead** — Primeiro contato
2. **Qualificação** — Validação da necessidade
3. **Proposta** — Orçamento enviado
4. **Negociação** — Em discussão comercial
5. **Fechado (ganho/perdido)** — Resultado final

## Modelos de Dados

Utiliza `Entity` + `EntityRecord` (modelo genérico) com as entidades:
- `crm_lead` — nome, email, telefone, origem, responsável
- `crm_oportunidade` — valor estimado, estágio, lead_id, data prevista fechamento
- `crm_atividade` — tipo, data, descrição, resultado, vínculo com lead/oportunidade

## Permissões

`ver_crm`, `criar_crm`, `editar_crm`, `deletar_crm`

## Como Testar

1. Acesse **CRM → Leads** e cadastre um novo lead.
2. Converta em **Oportunidade** e defina o valor estimado.
3. Visualize o **Pipeline** e arraste a oportunidade para "Proposta".
4. Registre uma **Atividade** (ex.: ligação de follow-up).
