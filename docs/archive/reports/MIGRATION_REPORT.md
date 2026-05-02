# Relatório de migração legado → ERP Cozinha

Gerado em: 2026-05-01T22:58:58.622Z
Dump: `127_0_0_1.sql`
Tempo total: **9.31s**

> As contagens em **Contagens principais** referem-se a registros processados **nesta execução** (reexecuções idempotentes podem mostrar 0 em itens já importados). Os **totais no banco** abaixo refletem o estado após esta corrida.

## Modelo alvo

Os dados de negócio são gravados em **Entity / EntityRecord** (`data` JSON), com chave idempotente `legacy_key`. Usuários legados usam coluna `users.legacy_id`.

## Contagens principais (processamento)

- **users**: 16
- **permissions_legacy**: 135
- **role_permissions_legacy**: 236
- **cliente**: 37
- **pessoa_cliente**: 37
- **produto**: 12
- **insumo**: 13
- **bom_estruturas**: 12
- **orcamento**: 1
- **pedido_venda**: 43
- **ordem_producao**: 47
- **apontamento**: 243
- **historico_op**: 41
- **conta_receber**: 11
- **user_notifications**: 0
- **audit_logs_legacy**: 0

## Tabelas detectadas no SQL (linhas parseadas)

- `notificacoes_envios`: 1436
- `notificacoes`: 775
- `os_etapas_producao`: 243
- `grupos_permissoes`: 236
- `permissoes`: 135
- `vendas_itens`: 112
- `os_arquivos`: 88
- `usuarios_expediente_logs`: 54
- `naturezas_operacao`: 49
- `ordens_servico`: 47
- `vendas`: 43
- `os_historico_status`: 41
- `clientes`: 37
- `pessoas`: 37
- `usuarios_expedientes`: 33
- `regras_tributacao`: 28
- `plano_contas`: 27
- `usuarios`: 16
- `usuarios_grupos`: 16
- `logs_sistema`: 15
- `componentes_produto`: 13
- `insumos`: 13
- `estrutura_produto`: 12
- `produtos`: 12
- `condicoes_parcelas`: 11
- `contas_receber`: 11
- `pagamentos`: 10
- `cfop`: 8
- `grupos_usuarios`: 7
- `grupos_produtos`: 6
- `condicoes_pagamento`: 5
- `familias_produtos`: 5
- `os_observacoes`: 5
- `pessoas_classificacoes`: 5
- `tipos_caixa`: 5
- `os_itens`: 4
- `setores_estoque`: 3
- `tipos_documento_fiscal`: 3
- `logs_retorno_etapa`: 2
- `os_projetos`: 2

## Ações especiais

- CNPJ/CPF: apenas dígitos em `cnpj_cpf` quando possível.
- Endereço em `nome_fantasia`: quando parecia endereço e `endereco` vazio, campos foram reorganizados.
- Senhas bcrypt PHP (`$2y$`) convertidas para `$2a$` (compatível com bcryptjs).
- Fotos de produto: referência salva em `foto_ref` como caminho lógico `/legacy-uploads/<arquivo>` (copiar arquivos manualmente se necessário).
- Permissões legadas: códigos `legacy.<módulo>.<recurso>.<ação>`, categoria `legacy.dbcozinca`.

## Ignorados / erros

- Nenhum erro fatal

## Notas

- notificacoes_envios: 1436 registros conservados apenas no SQL legado (sem tabela dedicada no ERP atual).

## Totais no banco (após esta execução)

- Usuários com `legacy_id`: **16**
- Logs de auditoria com ação `legacy.*`: **30**
- Notificações importadas (prefixo `[legacy_notif:`): **775**
- Registros dinâmicos por entidade (entity_records não excluídos):

- `apontamento_producao`: 254
- `cliente`: 77
- `ordem_producao`: 51
- `pedido_venda`: 46
- `historico_op`: 42
- `produto`: 30
- `conta_receber`: 13
- `rh_funcionario`: 8
- `rh_ponto`: 7
- `rh_folha_pagamento`: 7
- `rh_ferias`: 6
- `fiscal_nfe`: 5
- `estoque_inventario`: 5
- `compras_recebimento`: 5
- `movimentacao_estoque`: 4
- `producao_maquina`: 4
- `cotacao_compra`: 3
- `tabela_preco`: 3
- `orcamento`: 3
- `crm_oportunidade`: 3
- `crm_lead`: 3
- `fornecedor`: 3
- `workflow`: 2
- `ordem_compra`: 2
- `conta_pagar`: 2
