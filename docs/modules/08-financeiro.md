# Módulo 8 – Financeiro

## Objetivo
Contas a pagar/receber, fluxo de caixa, DRE e conciliação bancária.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/financial/financial.module.ts` | Registra rotas |
| `apps/backend/src/modules/financial/financial.routes.ts` | Endpoints fluxo de caixa, DRE, conciliação |
| `apps/backend/src/modules/financial/financial.service.ts` | Agregações, projeções, baixas |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/financeiro/ContasReceber.jsx` | Baixas, juros, multa por parcela |
| `apps/frontend/src/pages/financeiro/ContasPagar.jsx` | Pagamentos e vencimentos |
| `apps/frontend/src/pages/financeiro/FluxoCaixa.jsx` | Gráfico de barras (previsto × realizado) |
| `apps/frontend/src/pages/financeiro/DRE.jsx` | Demonstrativo de Resultado do Exercício |
| `apps/frontend/src/pages/financeiro/ConciliacaoBancaria.jsx` | Conciliação por extrato |
| `apps/frontend/src/pages/financeiro/AprovacaoPedidos.jsx` | Aprovação financeira de pedidos |
| `apps/frontend/src/pages/financeiro/RelatorioFinanceiro.jsx` | Relatório consolidado |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/financial/cashflow` | Fluxo de caixa (previsto e realizado) |
| GET | `/api/financial/dre` | DRE agregada por categoria |
| GET | `/api/financial/conciliation` | Conciliação bancária |

## Contas a Pagar/Receber

Utiliza `EntityRecord` com as entidades `conta_receber` e `conta_pagar`, com campos:
- `status` — aberto, pago, vencido, cancelado
- `data_vencimento`, `data_pagamento`
- `valor`, `juros`, `multa`, `desconto`
- Referência ao pedido de venda ou ordem de compra

## DRE – Categorias

| Categoria | Origem |
|-----------|--------|
| Receita Bruta | Pedidos entregues (SaleOrder) |
| Custo dos Produtos | StockMovements tipo saída_producao |
| Despesas Operacionais | Contas a pagar (conta_pagar) |
| Resultado Líquido | Receita − Custos − Despesas |

## Permissões

`ver_financeiro`, `gerar_financeiro`

## Como Testar

1. Acesse **Financeiro → Contas a Receber** e registre uma baixa em uma parcela.
2. Acesse **Fluxo de Caixa** e veja o gráfico por mês.
3. Acesse **DRE** e selecione o período.
4. Acesse **Conciliação Bancária** e importe um extrato (CSV).
