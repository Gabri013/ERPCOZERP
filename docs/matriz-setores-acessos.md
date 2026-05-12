# Matriz de Setores, Funcionalidades e Permissões

Este documento organiza, em uma única referência, o que cada setor deve visualizar no ERP, quais funções entram em cada bloco e quais permissões controlam o acesso.

## Princípios

- Cada setor vê primeiro o seu fluxo principal.
- Funções operacionais só aparecem quando a permissão correspondente existe.
- Administração e relatórios ficam separados do fluxo operacional.
- O backend é a fonte de verdade das permissões; o frontend deve apenas refletir essa matriz.

## Setores e Visão Principal

| Setor | O que deve visualizar primeiro | Permissões base |
| --- | --- | --- |
| `master` / diretoria | Tudo: visão global, usuários, configurações, relatórios, CRM, vendas, produção, financeiro, RH | todas |
| `gerente` | Dashboard geral, CRM, vendas, produção, estoque, compras, qualidade, expedição, financeiro, RH, relatórios | `ver_crm`, `ver_pedidos`, `ver_clientes`, `ver_orcamentos`, `ver_estoque`, `ver_compras`, `ver_op`, `ver_kanban`, `ver_pcp`, `ver_chao_fabrica`, `ver_financeiro`, `ver_rh`, `ver_relatorios` |
| `gerente_producao` | PCP, OPs, kanban, chão de fábrica, estoque, compras de material, qualidade e relatórios | `ver_op`, `criar_op`, `editar_op`, `apontar`, `ver_kanban`, `ver_pcp`, `ver_roteiros`, `ver_maquinas`, `ver_chao_fabrica`, `ver_estoque`, `ver_compras`, `ver_qualidade`, `ver_relatorios` |
| `orcamentista_vendas` | CRM comercial, orçamentos, pedidos, clientes, catálogo e relatórios comerciais | `ver_crm`, `ver_pedidos`, `criar_pedidos`, `editar_pedidos`, `ver_clientes`, `editar_clientes`, `ver_orcamentos`, `criar_orcamentos`, `ver_relatorios` |
| `projetista` | Engenharia, roteiros, BOM/pendências, OPs de engenharia, estoque de apoio e relatórios | `ver_op`, `ver_pcp`, `ver_roteiros`, `editar_produtos`, `ver_estoque`, `ver_compras`, `ver_relatorios` |
| `compras` | Fornecedores, solicitações, cotações, pedidos de compra, recebimento e estoque de apoio | `ver_compras`, `criar_oc`, `editar_fornecedores`, `ver_estoque`, `movimentacao.view`, `movimentacao.create`, `ver_pedidos`, `ver_op`, `ver_relatorios` |
| `corte_laser` | OPs, apontamento, chão de fábrica, roteiros, kanban e estoque mínimo | `ver_op`, `apontar`, `ver_chao_fabrica`, `ver_roteiros`, `ver_kanban`, `ver_estoque` |
| `dobra_montagem` | OPs, apontamento, chão de fábrica, roteiros, kanban e estoque mínimo | `ver_op`, `apontar`, `ver_chao_fabrica`, `ver_roteiros`, `ver_kanban`, `ver_estoque` |
| `solda` | OPs, apontamento, chão de fábrica, roteiros, kanban e estoque mínimo | `ver_op`, `apontar`, `ver_chao_fabrica`, `ver_roteiros`, `ver_kanban`, `ver_estoque` |
| `expedicao` | Separação, expedição, OPs, apontamento, estoque e relatórios operacionais | `ver_op`, `apontar`, `ver_chao_fabrica`, `ver_pedidos`, `ver_expedicao`, `editar_expedicao`, `ver_estoque`, `movimentar_estoque`, `ver_relatorios` |
| `qualidade` | Inspeções, não conformidades, databooks, documentação de qualidade e relatórios | `ver_qualidade`, `editar_qualidade`, `aprovar_qualidade`, `ver_op`, `apontar`, `ver_kanban`, `ver_chao_fabrica`, `ver_relatorios` |
| `financeiro` | Contas, fluxo de caixa, DRE, conciliação, painel e aprovações | `ver_financeiro`, `editar_financeiro`, `aprovar_financeiro`, `ver_relatorio_financeiro`, `ver_fiscal`, `ver_contabilidade`, `ver_relatorios` |
| `rh` | Funcionários, ponto, folha, férias e relatórios de pessoas | `ver_rh`, `editar_funcionarios`, `ver_folha`, `ver_relatorios` |
| `user` / visualizador | Apenas dashboard e relatórios básicos | `ver_relatorios` |

## Blocos Funcionais

### CRM

- Deve reunir qualificação, pipeline, leads, oportunidades, dashboard e inbox.
- Público principal: diretoria, gerente e vendas.
- Permissões principais: `ver_crm`, `crm.view`, `crm.pipeline`, `crm.dashboard`.

### Vendas

- Fluxo principal: orçamentos, pedidos, clientes, propostas e tabela de preços.
- Permissões principais: `ver_pedidos`, `criar_pedidos`, `editar_pedidos`, `aprovar_pedidos`, `ver_clientes`, `editar_clientes`, `ver_orcamentos`, `criar_orcamentos`.

### Compras

- Fluxo principal: fornecedores, solicitações, cotações, pedidos de compra, recebimentos e importação.
- Permissões principais: `ver_compras`, `criar_oc`, `editar_fornecedores`.

### Estoque

- Fluxo principal: produtos, movimentações, inventário, endereçamento, lotes/séries e transferências.
- Permissões principais: `ver_estoque`, `movimentar_estoque`, `editar_produtos`.

### Produção

- Fluxo principal: OPs, PCP, kanban, chão de fábrica, monitoramento, apontamento, roteiros e máquinas.
- Permissões principais: `ver_op`, `criar_op`, `editar_op`, `apontar`, `ver_kanban`, `ver_pcp`, `ver_roteiros`, `ver_maquinas`, `ver_chao_fabrica`.

### Qualidade

- Fluxo principal: controle de qualidade, documentos, databooks e não conformidades.
- Permissões principais: `ver_qualidade`, `editar_qualidade`, `aprovar_qualidade`.

### Expedição

- Fluxo principal: expedir pedidos, baixar estoque e acompanhar OPs prontas.
- Permissões principais: `ver_expedicao`, `editar_expedicao`, `ver_pedidos`, `ver_estoque`, `movimentar_estoque`.

### Financeiro

- Fluxo principal: contas a receber, contas a pagar, fluxo de caixa, DRE, conciliação, painel e aprovações.
- Permissões principais: `ver_financeiro`, `editar_financeiro`, `aprovar_financeiro`, `ver_relatorio_financeiro`.

### RH

- Fluxo principal: funcionários, ponto, folha de pagamento e férias.
- Permissões principais: `ver_rh`, `editar_funcionarios`, `ver_folha`.

### Sistema / Administração

- Fluxo principal: relatórios, usuários, configurações, qualidade de sistema e auto-correções.
- Permissões principais: `relatorios:view`, `editar_config`, `gerenciar_usuarios`, `impersonate`.

## Normalização Recomendada

Para manter a interface previsível, o frontend deve usar os códigos oficiais do backend como referência:

- CRM: `ver_crm`
- Vendas: `ver_pedidos`, `ver_clientes`, `ver_orcamentos`
- Produção: `ver_op`, `ver_pcp`, `ver_kanban`, `ver_chao_fabrica`
- Qualidade: `ver_qualidade`
- Expedição: `ver_expedicao`
- Financeiro: `ver_financeiro`
- RH: `ver_rh`, `ver_folha`
- Sistema: `relatorios:view`, `editar_config`, `gerenciar_usuarios`

## Próximo Passo Técnico

1. Criar um arquivo único de referência para menus e rotas com essa matriz.
2. Trocar no frontend as permissões soltas por uma enumeração central.
3. Revisar o sidebar e as rotas para usar os mesmos códigos do backend.
4. Separar por seção: comercial, operacional, gestão e sistema.