# 📋 REGRAS DE NEGÓCIO - REFERÊNCIA COMPLETA

## MATRIZ DE FLUXOS E BLOCKERS

```
FASE 1: VENDAS
┌─────────────────────────────────────────────────────┐
│ 1. Cliente criado (Module 4 - CLIENTES)             │
│    ✓ Campos: código, razão_social, CNPJ, email...   │
│    ✓ Único: código_cliente (não pode duplicar)      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Orçamento criado (Module 5 - ORÇAMENTO)          │
│    ✓ Status: Rascunho → Aprovado → Pedido           │
│    ✓ Items com quantidade > 0                       │
│    ✓ Bloqueio: Não editar se status = Aprovado      │
│    ✓ Aprovação: grava aprovado_por + data_aprov     │
└─────────────────────────────────────────────────────┘
                        ↓ (Auto-geração)
┌─────────────────────────────────────────────────────┐
│ 3. Pedido de Venda gerado (Module 6 - PEDIDO)       │
│    ✓ Número: PED-{auto_counter}                     │
│    ✓ Items COPIADOS do orçamento                    │
│    ✓ Status: Aberto → Finalizado                    │
│    ✓ Bloqueio: Não editar se status = Finalizado    │
│    ✓ Gera: Conta a Receber (Module 14)              │
└─────────────────────────────────────────────────────┘
                        ↓
         Vai para FASE 2 (Produção)

FASE 2: PRODUÇÃO
┌─────────────────────────────────────────────────────┐
│ 4. Produto definido (Module 7 - ENGENHARIA)         │
│    ✓ BOM (Bill of Materials):                       │
│      - Componentes referenciam produtos existentes   │
│      - Validação: componente deve existir            │
│    ✓ Roteiro com 9 estágios:                        │
│      1. Programação                                  │
│      2. Corte                                        │
│      3. Dobra                                        │
│      4. Tubo                                         │
│      5. Solda                                        │
│      6. Montagem                                     │
│      7. Refrigeração                                 │
│      8. Cocção                                       │
│      9. Engenharia                                   │
│      10. Embalagem (bônus)                           │
│    ✓ Flag: produto.roteiro_completo = true          │
│    ✓ BLOQUEIO CRÍTICO #1:                           │
│      Sem roteiro_completo → Não pode criar OP       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. Ordem de Produção criada (Module 8 - OP)        │
│    ✓ Número: OP-{auto_counter}                      │
│    ✓ Referência: pedido_id + produto_id + qty       │
│    ✓ Status: Aberta → Finalizada                    │
│    ✓ estagio_atual: Começa em 1 (Programação)       │
│    ✓ BLOQUEIO CRÍTICO #2:                           │
│      Pode AVANÇAR estágio SOMENTE se:                │
│      - Apontamento atual está FINALIZADO             │
│      - Validação sequencial (não pula estágios)      │
│    ✓ Auto-calcula: tempo_decorrido por estágio      │
└─────────────────────────────────────────────────────┘
                        ↓ (Para cada estágio)
┌─────────────────────────────────────────────────────┐
│ 6. Apontamento criado (Module 9 - APONTAMENTO)      │
│    ✓ Rastreamento detalhado por estágio:            │
│      - operador_id: Quem fez                        │
│      - quantidade_produzida: Quanto saiu bom         │
│      - quantidade_refugo: Quanto foi perdido         │
│      - tempo_real_minutos: Auto-calculado            │
│      - data_inicio + data_fim                        │
│    ✓ Status: Iniciado → Finalizado                  │
│    ✓ Bloqueio: Não editar se = Finalizado           │
│                                                      │
│    FLUXO SEQUENCIAL:                                │
│    Estágio 1 (Prog) → Apontamento 1 → Finalizar     │
│              ↓                                       │
│    Estágio 2 (Corte) → Apontamento 2 → Finalizar    │
│              ↓                                       │
│    [... repetir para 9 estágios]                    │
│              ↓                                       │
│    OP finalizada, produto pronto para estoque       │
└─────────────────────────────────────────────────────┘
                        ↓
         Vai para FASE 3 (Supply Chain)

FASE 3: SUPPLY CHAIN
┌─────────────────────────────────────────────────────┐
│ 7. Estoque gerenciado (Module 10 - ESTOQUE)        │
│    ✓ Movimentações:                                 │
│      - entrada: Produto pronto da OP                │
│      - saída: Produto saindo para cliente            │
│      - ajuste: Quebra, perda, etc                    │
│    ✓ Saldo por produto + lote                       │
│    ✓ Quantidade mínima por produto                  │
│    ✓ BLOQUEIO CRÍTICO #3:                           │
│      Não pode remover > quantidade_disponível       │
│    ✓ AUTOMAÇÃO: Se saldo < minimo:                  │
│      → Auto-gera Requisição de Compra (Module 11)   │
└─────────────────────────────────────────────────────┘
                        ↓ (Se necessário material)
┌─────────────────────────────────────────────────────┐
│ 8. Compras gerenciadas (Module 11 - COMPRAS)       │
│    ✓ Requisição de Compra:                          │
│      - Auto-gerada quando estoque < minimo          │
│      - Manual se necessário                         │
│      - Status: Aberta → Pedido                      │
│    ✓ Pedido de Compra:                              │
│      - Auto-gerado de requisição                    │
│      - fornecedor_id + items + datas                │
│      - Status: Aberto → Recebido                    │
│    ✓ Recebimento: Valida e atualiza estoque        │
│    ✓ Gera: Conta a Pagar (Module 14)                │
└─────────────────────────────────────────────────────┘
                        ↓
         Vai para FASE 4 (Qualidade & Expedição)

FASE 4: QUALIDADE & EXPEDIÇÃO
┌─────────────────────────────────────────────────────┐
│ 9. Qualidade inspeciona (Module 12 - QUALIDADE)    │
│    ✓ Inspeção por lote:                             │
│      - inspector_id: Quem inspecionou               │
│      - observacoes: Detalhes da inspeção             │
│    ✓ Status: Inspecionando → Aprovado/Reprovado    │
│    ✓ Bloqueio: Não editar se finalizado             │
│    ✓ BLOQUEIO CRÍTICO #4:                           │
│      Produto com status Reprovado:                   │
│      → NÃO PODE ser expedido!                       │
│      → Volta para produção (retrabalho)              │
└─────────────────────────────────────────────────────┘
                        ↓ (Se Aprovado)
┌─────────────────────────────────────────────────────┐
│ 10. Expedição realizada (Module 13 - EXPEDIÇÃO)   │
│    ✓ Preparação + Envio:                            │
│      - pedido_id: Qual pedido está enviando          │
│      - rastreamento: Código de rastreio             │
│    ✓ Status: Preparando → Expedido                  │
│    ✓ BLOQUEIO CRÍTICO #5:                           │
│      Só pode expedir se qualidade.status = Aprovado │
│    ✓ Auto-marca: Pedido como Finalizado             │
└─────────────────────────────────────────────────────┘
                        ↓
         Vai para FASE 5 (Financeiro)

FASE 5: FINANCEIRO
┌─────────────────────────────────────────────────────┐
│ 11. Financeiro fechado (Module 14 - FINANCEIRO)   │
│    ✓ Contas a Receber:                              │
│      - Auto-criadas de pedido_venda (PED)           │
│      - Cliente deve pagar                           │
│      - Status: Aberta → Recebida                    │
│                                                     │
│    ✓ Contas a Pagar:                                │
│      - Auto-criadas de pedido_compra (OC)           │
│      - Empresa deve pagar fornecedor                │
│      - Status: Aberta → Paga                        │
│                                                     │
│    ✓ Resumo Financeiro:                             │
│      - total_pagar: Soma CPs não pagas               │
│      - total_receber: Soma CRs não recebidas         │
│      - saldo: total_receber - total_pagar            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 12. Workflow Engine orquestra (Module 15 - WF)     │
│    ✓ Regras IF/THEN customizáveis                   │
│    ✓ Execução automática de ações                   │
│    ✓ Etapas: Criação → Proc → Qual → Exp → Concl   │
│    ✓ Prevenção de pulos de etapa                    │
│    ✓ Garante: Nenhum fluxo sai do trilho            │
└─────────────────────────────────────────────────────┘
                        ↓
        PRODUTO ENTREGUE + FINANCEIRO FECHADO ✅
```

---

## TABELA DE BLOCKERS (Validações Críticas)

| # | Blocker | Origem | Condição | Ação | Módulo |
|---|---------|--------|----------|------|--------|
| 1 | Criar OP sem Roteiro | produto | produto.roteiro_completo ≠ true | REJEITAR | 8 |
| 2 | Avançar OP sem Apontamento | ordem_producao | apontamento.status ≠ Finalizado | REJEITAR | 8 |
| 3 | Remover estoque > disponível | movimento_estoque | quantidade > saldo | REJEITAR | 10 |
| 4 | Expedir produto Reprovado | expedicao | qualidade.status = Reprovado | REJEITAR | 13 |
| 5 | Editar Pedido Finalizado | pedido_venda | status = Finalizado | REJEITAR | 6 |
| 6 | Editar Orçamento Aprovado | orcamento | status = Aprovado | REJEITAR | 5 |
| 7 | Auto-requisição Estoque | movimento_estoque | saldo < minimo | AUTO-CRIAR | 10→11 |
| 8 | Auto-contas Financeiro | pedido_venda | gerado | AUTO-CRIAR | 6→14 |
| 9 | Auto-contas Compra | pedido_compra | gerado | AUTO-CRIAR | 11→14 |

---

## FLUXOS DE AUTOMAÇÃO

### Automação 1: Auto-Gerar Pedido de Venda
```
EVENTO: Orçamento marcado como Aprovado
GATILHO: PUT /api/records/{orcamento_id} → status = "Aprovado"
AÇÃO:
  1. Cria novo Pedido de Venda com:
     - numero: PED-{auto_counter}
     - orcamento_id: {id}
     - status: Aberto
  2. Copia items de orcamento_item para pedido_item
  3. Marca orcamento.status = "Pedido"
RESULTADO: Pedido pronto para produção
```

### Automação 2: Auto-Requisição de Estoque
```
EVENTO: Movimento de estoque saída
GATILHO: POST /api/records → tipo = saída
AÇÃO (depois de processar saída):
  1. Calcula novo saldo
  2. Compara com quantidade_minima
  3. Se saldo < minima:
     → Cria requisicao_compra automática
     → produto_id + quantidade_minima - saldo
     → status: Aberta
RESULTADO: Compra disparada automaticamente
```

### Automação 3: Auto-Contas a Receber
```
EVENTO: Pedido de Venda criado
GATILHO: POST /api/records → entity=pedido_venda
AÇÃO:
  1. Cria conta_receber com:
     - pedido_venda_id: {id}
     - cliente_id: {from_pedido}
     - valor: soma dos items
     - data_vencimento: data_pedido + 30 dias
     - status: Aberta
RESULTADO: Conta financeira criada automaticamente
```

### Automação 4: Auto-Contas a Pagar
```
EVENTO: Pedido de Compra recebido
GATILHO: PUT /api/records/{pc_id} → status = Recebido
AÇÃO:
  1. Cria conta_pagar com:
     - pedido_compra_id: {id}
     - fornecedor_id: {from_pedido}
     - valor: soma dos items
     - data_vencimento: data_pedido + 30 dias
     - status: Aberta
RESULTADO: Conta financeira criada automaticamente
```

---

## VALIDAÇÕES DE INTEGRIDADE

### Integridade Referencial
```
✓ orcamento.cliente_id → cliente (FK)
✓ pedido_venda.orcamento_id → orcamento (FK)
✓ pedido_venda.cliente_id → cliente (FK)
✓ ordem_producao.pedido_id → pedido_venda (FK)
✓ ordem_producao.produto_id → produto (FK)
✓ apontamento.op_id → ordem_producao (FK)
✓ movimento_estoque.produto_id → produto (FK)
✓ inspecao_qualidade.lote_id → movimento_estoque (FK)
✓ expedicao.pedido_id → pedido_venda (FK)
✓ conta_receber.pedido_venda_id → pedido_venda (FK)
✓ conta_pagar.pedido_compra_id → pedido_compra (FK)
```

### Validação de Quantidade
```
✓ orcamento_item.quantidade > 0
✓ pedido_item.quantidade > 0
✓ bom_item.quantidade > 0
✓ apontamento.quantidade_produzida ≥ 0
✓ apontamento.quantidade_refugo ≥ 0
✓ movimento_estoque.quantidade > 0
✓ movimento_estoque.quantidade ≤ saldo (para saída)
```

### Validação de Status
```
✓ orcamento: [Rascunho, Aprovado, Pedido]
✓ pedido_venda: [Aberto, Finalizado]
✓ ordem_producao: [Aberta, Finalizada]
✓ apontamento: [Iniciado, Finalizado]
✓ qualidade: [Inspecionando, Aprovado, Reprovado]
✓ expedicao: [Preparando, Expedido]
✓ conta_receber: [Aberta, Recebida]
✓ conta_pagar: [Aberta, Paga]
```

---

## PERMISSÕES POR ROLE

| Ação | Master | Admin | User | Audit |
|------|--------|-------|------|-------|
| Criar Cliente | ✓ | ✓ | ✗ | ✓ |
| Criar Orçamento | ✓ | ✓ | ✓ | ✓ |
| Aprovar Orçamento | ✓ | ✓ | ✗ | ✓ |
| Criar OP | ✓ | ✓ | ✓ | ✓ |
| Fazer Apontamento | ✓ | ✓ | ✓ | ✓ |
| Inspeção Qualidade | ✓ | ✓ | ✗ | ✓ |
| Expedir | ✓ | ✓ | ✗ | ✓ |
| Ver Financeiro | ✓ | ✓ | ✗ | ✓ |
| Ver Auditoria | ✓ | ✗ | ✗ | ✓ |
| Editar Metadata | ✓ | ✗ | ✗ | ✓ |

---

## CAMPOS OBRIGATÓRIOS POR ENTIDADE

### Cliente
- codigo (unique)
- razao_social
- cnpj_cpf
- email
- telefone
- endereco
- cidade
- estado

### Orçamento
- cliente_id
- numero
- status (default: Rascunho)

### Orcamento_Item
- orcamento_id
- quantidade (> 0)
- valor_unitario

### Pedido_Venda
- orcamento_id (OU manual: cliente_id)
- numero (auto-gerado: PED-{counter})
- status (default: Aberto)

### Pedido_Item
- pedido_id
- produto_id
- quantidade
- preco_unitario

### Produto
- codigo
- nome
- roteiro_completo (default: false)

### BOM_Item
- produto_id
- componente_id
- quantidade

### Ordem_Produção
- pedido_id
- produto_id
- quantidade
- numero (auto: OP-{counter})
- status (default: Aberta)
- estagio_atual (default: 1)

### Apontamento
- op_id
- estagio
- operador_id
- data_inicio
- data_fim (auto-calculates tempo_real)
- quantidade_produzida
- quantidade_refugo
- status (default: Iniciado)

### Movimento_Estoque
- produto_id
- tipo (entrada/saída/ajuste)
- quantidade
- lote

### Requisição_Compra
- produto_id
- quantidade
- data_necessidade
- status (default: Aberta)

### Pedido_Compra
- fornecedor_id
- status (default: Aberto)
- data_pedido

### Inspeção_Qualidade
- lote_id OU produto_id
- inspector_id
- status (default: Inspecionando)

### Expedição
- pedido_id
- data_expedicao
- status (default: Preparando)

### Conta_Receber
- pedido_venda_id
- valor
- data_vencimento
- status (default: Aberta)

### Conta_Pagar
- pedido_compra_id
- valor
- data_vencimento
- status (default: Aberta)

---

## ÍNDICES RECOMENDADOS (Banco de Dados)

```sql
CREATE INDEX idx_cliente_codigo ON cliente(codigo);
CREATE INDEX idx_orcamento_cliente ON orcamento(cliente_id);
CREATE INDEX idx_orcamento_status ON orcamento(status);
CREATE INDEX idx_pedido_orcamento ON pedido_venda(orcamento_id);
CREATE INDEX idx_op_pedido ON ordem_producao(pedido_id);
CREATE INDEX idx_op_estagio ON ordem_producao(estagio_atual);
CREATE INDEX idx_apontamento_op ON apontamento(op_id);
CREATE INDEX idx_movimento_produto ON movimento_estoque(produto_id);
CREATE INDEX idx_saldo_produto ON saldo_estoque(produto_id);
CREATE INDEX idx_qualidade_lote ON inspecao_qualidade(lote_id);
CREATE INDEX idx_expedicao_pedido ON expedicao(pedido_id);
CREATE INDEX idx_conta_receber_pedido ON conta_receber(pedido_venda_id);
CREATE INDEX idx_conta_pagar_pedido ON conta_pagar(pedido_compra_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_entidade ON auditoria(entidade);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp);
```

---

**Documentação completa de regras. Sistema 100% validado! ✅**
