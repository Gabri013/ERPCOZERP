# Sidebar + Fluxos (No‑Code)

Este documento descreve como o ERP organiza os módulos na Sidebar e **quais partes são “no‑code”** (configuráveis via UI/DB) sem precisar mexer no código.

## Como a Sidebar decide o que aparece

- A Sidebar é definida em `src/components/layout/Sidebar.jsx`.
- Cada item tem um `required` (permissão) e só aparece se o usuário tiver essa permissão (via `PermissaoContext`).
- O item **Dashboard** é sempre visível.

## Entidades “no‑code” (dinâmicas)

A Sidebar tem uma seção **“Entidades Personalizadas”** que aparece automaticamente quando existem entidades customizadas no banco.

- Fonte: `useMetadataStore()` (carrega do backend)
- Regra: exibe apenas entidades com `is_system = false`
- Links: `GET /entidades/:code` (CRUD dinâmico)

### Como criar entidades sem código

No menu **Configurações → Metadata Studio**, crie/edite entidades e campos (ex.: “Produto Padrão”, “Lista BOMM”, etc.).

## Workflows (No‑Code)

O menu **Configurações → Workflows** abre o “Workflow Builder” para configurar fluxos de aprovação/status.

Ideia: a operação do dia a dia (aprovar, movimentar, apontar, emitir) deve acontecer por telas e workflows — ajustes de regra/etapas devem ficar no builder, não no código.

## Regra de ouro (produção)

- **Operação diária**: 100% via telas/Workflows/Metadata Studio.
- **Código**: somente para design/programação (logo, favicon, cores, modelo de impressão, integrações).

## Checklist rápido de validação (por perfil)

- **Laser/Dobra/Solda/Montagem**: vê Produção (OP + Apontamento) e recebe notificações do setor.
- **Qualidade**: vê Produção/Qualidade (OP + inspeções) e recebe notificações do setor.
- **Expedição**: vê Expedição/Produção (OP + entrega) e recebe notificações do setor.
- **Vendas/Orçamentos**: vê Clientes/Pedidos/Orçamentos e recebe notificações do setor.
- **Engenharia/Projetos**: vê Produto/OP/roteiros e recebe notificações do setor.

