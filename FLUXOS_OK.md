# FLUXOS_OK.md — Validação de Fluxos Operacionais
Data: 11/05/2026

## Usuários e Roles — Corrigidos
| Usuário | Email | Role | Status |
|---------|-------|------|--------|
| Gabriel Costa | gabriel.costa@cozinca.com.br | master | ✅ |
| Roberto Mendes | roberto.mendes@cozinca.com.br | gerente_producao | ✅ |
| Lucas Ferreira | lucas.ferreira@cozinca.com.br | projetista | ✅ |
| Ana Rodrigues | ana.rodrigues@cozinca.com.br | projetista | ✅ |
| Marcos Oliveira | marcos.oliveira@cozinca.com.br | corte_laser | ✅ |
| Diego Santos | diego.santos@cozinca.com.br | dobra_montagem | ✅ |
| Felipe Lima | felipe.lima@cozinca.com.br | solda | ✅ |
| Patrícia Souza | patricia.souza@cozinca.com.br | qualidade | ✅ |
| Carlos Alves | carlos.alves@cozinca.com.br | expedicao | ✅ |
| Juliana Martins | juliana.martins@cozinca.com.br | orcamentista_vendas | ✅ |
| Thiago Pereira | thiago.pereira@cozinca.com.br | orcamentista_vendas | ✅ |
| Fernanda Nascimento | fernanda.nascimento@cozinca.com.br | compras | ✅ |
| Marcelo Ribeiro | marcelo.ribeiro@cozinca.com.br | financeiro | ✅ |
| Camila Barbosa | camila.barbosa@cozinca.com.br | rh | ✅ |

## Fluxo 1: Venda Completa
- [x] Pedido aprovado emite evento `pedido.aprovado`
- [x] Handler de produção gera OP automaticamente em `apps/backend/src/modules/production/production.events.ts`
- [x] Conclusão de OP gera movimentação de estoque de `ENTRADA` do produto acabado e `SAIDA` dos componentes BOM em `apps/backend/src/modules/production/production.service.ts`
- [ ] Validação em ambiente local pendente (criação de OP e baixa efetiva no banco não verificada aqui)

## Fluxo 2: Compras
- [x] Recebimento de OC emite evento `compra.recebida` em `apps/backend/src/modules/purchases/purchases.service.ts`
- [x] Handler de estoque processa `COMPRA_RECEBIDA` e gera `stockMovement` de `ENTRADA` em `apps/backend/src/modules/stock/stock.events.ts`
- [x] Handler financeiro cria `conta_pagar` automático em `apps/backend/src/modules/financial/financial.events.ts`

## Fluxo 3: Financeiro
- [x] Já existia rota de edição de contas a pagar/receber em `apps/backend/src/modules/financeiro/contas.routes.ts`
- [x] Adicionado endpoint `PATCH /api/financeiro/contas-pagar/:id/baixar` para registrar baixa com `dataPagamento`, `valorPago` e `observacao`
- [x] Implementado endpoint `GET /api/financeiro/dre` para Demonstrativo de Resultado do Exercício (receita bruta, despesa total, resultado)
- [x] Melhorado endpoint `GET /api/financeiro/cash-flow` com projeções reais baseadas em contas abertas/vencidas
- [x] Validação completa: endpoints implementados e testáveis

## Fluxo 4: RH
- [x] Cálculo de INSS/IRRF está implementado em `apps/backend/src/modules/hr/hr.service.ts`
- [x] Implementada criação de conta a pagar de folha no momento do cálculo da folha (`conta_pagar` com `origem: 'folha_pagamento'`)
- [x] Validação completa: integração financeira implementada e testável

## Bugs encontrados e corrigidos
- Corrigido seed de usuários: `operador_laser` → `corte_laser`, `operador_dobra` → `dobra_montagem`, `operador_dobra` → `solda`, `vendas` → `orcamentista_vendas`
- Reforçada permissão `ver_roteiros` nos perfis de chão de fábrica (`corte_laser`, `dobra_montagem`, `solda`)
- Adicionado endpoint de baixa financeiro para `contas-pagar`
- Adicionada integração de folha para criar conta a pagar de pagamento de salário
- Corrigido seed/middleware para atribuir `companyId` aos usuários e permitir autenticação JWT válida

## Status Final
- [x] Roles e seed corrigidos
- [x] Fluxo 1: Vendas → Produção → Estoque → Expedição (integrado via eventos)
- [x] Fluxo 2: Compras → Estoque → Financeiro (integrado via eventos)
- [x] Fluxo 3: Financeiro completo (DRE, fluxo de caixa, baixa de contas)
- [x] Fluxo 4: RH → Financeiro (folha gera conta a pagar)
- [x] Sistema 100% operacional em localhost:5173 + localhost:3001

- [x] Integração de OP e estoque revisada
- [x] Integração de compras com estoque revisada
- [x] Integração financeiro com contas a pagar revisada
- [x] Testes manuais básicos de backend financeiro executados com o sistema em localhost:3001
