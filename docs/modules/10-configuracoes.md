# Módulo 10 – Configurações e Ajustes Finais

## Objetivo
Empresa, parâmetros do sistema, template de OP, metadata studio, workflows, entidades personalizadas e dashboard configurável.

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/configuracoes/Empresa.jsx` | CRUD dados da empresa (razão social, CNPJ, logo) |
| `apps/frontend/src/pages/configuracoes/Parametros.jsx` | Chave/valor configurável (ex.: prazo_entrega_padrao) |
| `apps/frontend/src/pages/configuracoes/ModeloOP.jsx` | Editor HTML do template PDF da OP (React-Quill) |
| `apps/frontend/src/pages/configuracoes/MetadataStudio.jsx` | Criação de entidades customizadas + campos |
| `apps/frontend/src/pages/configuracoes/WorkflowBuilder.jsx` | Criação e edição de workflows visuais |
| `apps/frontend/src/pages/configuracoes/Usuarios.jsx` | Gestão de usuários, papéis e impersonação |
| `apps/frontend/src/components/dashboard/DashboardConfigurador.jsx` | Modal de personalização de dashboard por usuário |

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/platform/platform.module.ts` | Rotas de configurações globais |
| `apps/backend/src/modules/platform/platform.routes.ts` | Endpoints empresa, parâmetros |
| `apps/backend/src/modules/workflows/workflows.module.ts` | Rotas de workflows |
| `apps/backend/src/modules/roles/roles.module.ts` | Rotas de papéis e permissões |
| `apps/backend/src/modules/dashboard/dashboard.routes.ts` | Layout de dashboard por usuário |
| `apps/backend/src/lib/defaultDashboardLayout.ts` | Layouts padrão por perfil de usuário |

## Parâmetros Disponíveis

| Chave | Padrão | Descrição |
|-------|--------|-----------|
| `prazo_entrega_padrao` | `7` | Dias úteis para entrega padrão |
| `limite_credito_padrao` | `5000` | Limite de crédito para novos clientes |
| `fator_hora_extra` | `1.5` | Multiplicador para horas extras no RH |
| `email_notificacoes` | — | E-mail para alertas do sistema |
| `cnpj_empresa` | — | CNPJ da empresa emitente de NF-e |

## Dashboard Configurável

### Layouts Padrão por Perfil
- **Master/Admin** — todos os widgets (visão geral, KPIs, alertas, gráficos)
- **Gerente de Produção** — OPs abertas, Kanban, máquinas, apontamentos pendentes
- **Vendas** — pedidos em aberto, orçamentos, pipeline CRM, meta de vendas
- **Engenheiro** — BOMs pendentes, projetos em revisão, calculadora de peso
- **Operador de Produção** — apontamentos, OPs do dia, chão de fábrica
- **Financeiro** — fluxo de caixa, contas vencer, DRE resumida
- **RH** — funcionários ativos, ponto do dia, solicitações férias pendentes
- **Padrão (outros)** — notificações, tarefas pendentes, indicadores básicos

### Como Funciona
1. Na primeira vez, o backend retorna o layout padrão do perfil do usuário.
2. O usuário pode personalizar via **"Configurar Dashboard"** (ícone de ajuste).
3. Seleções são salvas por usuário no banco (`DashboardLayout`).
4. **"Restaurar padrão"** remove a personalização e volta ao layout do perfil.

## Metadata Studio

Permite criar entidades personalizadas além das nativas do ERP:
1. Acesse **Configurações → Metadata Studio**.
2. Clique em **Nova Entidade** e defina nome, ícone e seção do menu.
3. Adicione campos (texto, número, data, seleção, relacionamento).
4. A entidade aparece automaticamente na Sidebar em "Personalizados".
5. Use o CRUD genérico via `/api/records/:entity`.

## Workflow Builder

Cria fluxos de aprovação e automação:
1. Acesse **Configurações → Workflows**.
2. Crie um workflow para uma entidade (ex.: `pedido_venda`).
3. Defina etapas, condições e ações (notificar, mudar status, criar tarefa).
4. Ative o workflow — ele dispara automaticamente nos eventos configurados.

## Permissões

Gerenciadas em **Configurações → Usuários** por um usuário com perfil `master` ou `admin`.
Granularidade por módulo e ação (view, create, edit, delete, approve).

## Como Testar

1. Acesse **Configurações → Empresa** e preencha os dados da empresa.
2. Acesse **Parâmetros** e altere `prazo_entrega_padrao` para `10`.
3. Acesse **Metadata Studio**, crie uma entidade "Manutenção Preventiva" com campos data, máquina, responsável.
4. Verifique que aparece na Sidebar e que o CRUD funciona.
5. No Dashboard, clique em "Configurar", marque/desmarque widgets e salve.
6. Clique em "Restaurar padrão" — o modal fecha e o layout padrão retorna.
