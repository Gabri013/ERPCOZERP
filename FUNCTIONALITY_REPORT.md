# FUNCTIONALITY_REPORT — Integração COZINCA INOX (ERPCOZERP)

Este relatório descreve **funcionalidades implementadas** nesta entrega (orquestração de negócio e APIs), **arquivos alterados** e **itens ainda recomendados** para cobrir 100% da especificação industrial original (escopo muito amplo).

## Resumo executivo

Foi criado o módulo backend **`/api/cozinca`** com serviços que **alteram registros reais** (`entity_records`) para:

- **Apontamento integrado**: baixa de insumos via **BOM JSON** no cadastro de produto, movimentações de estoque, histórico de OP, avanço de **etapa Kanban** (`etapaKanban`), entrada de produto acabado ao concluir.
- **Vendas**: gerar **pedido a partir de orçamento**, atualizar **oportunidade CRM** quando vinculada por `orcamento_id`; no pedido — **reserva de estoque**, **geração de OP**, **contas a receber**, **fluxo completo** (ações combinadas).
- **Chão de fábrica**: snapshot agregando **máquinas** e **OPs ativas** (sem mocks fixos na página).
- **Recebimento de compras**: conferência com **geração de conta a pagar** (fluxo simplificado).
- **Consultas**: custo por BOM (`/produtos/:codigo/custo-bom`), KPIs por setor (`/dashboard/kpis`), fiscal **mock** (XML NF-e, status Sefaz, SPED texto sintético).
- **Engenharia**: cálculo de **peso de chapa inox** (fórmula mm³ → kg com densidade 7850), **importação de BOM** via texto CSV/TSV (criação opcional de insumos faltantes), expostos em `/api/cozinca/engenharia/*` e na página **BOM e 3D** (inclui visualizador Three.js de demonstração).

O modelo de dados continua baseado em **entidades JSON** (Prisma `Entity` / `EntityRecord`), com **campos novos** na configuração seedada (BOM, roteiro, ficha técnica, etapa Kanban, CRM atividades, vínculos orçamento/oportunidade).

## Backend — arquivos novos

| Arquivo | Função |
|---------|--------|
| `apps/backend/src/modules/cozinca/cozinca.service.ts` | Regras de integração (apontamento, BOM, pedidos, OPs, financeiro, snapshot, KPIs, fiscal mock). |
| `apps/backend/src/modules/cozinca/cozinca.routes.ts` | Rotas REST sob `/api/cozinca/*`. |
| `apps/backend/src/modules/cozinca/cozinca.module.ts` | Registro do módulo no Express. |

## Backend — arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `apps/backend/src/app.ts` | `registerCozincaModule(app)`. |
| `apps/backend/src/infra/entity-permissions.ts` | Entidade `crm_atividade` + mapeamento legado `ver_crm`. |
| `apps/backend/prisma/seed.ts` | Campos `bom_json`, `roteiro_json`, `ficha_tecnica_json`, `custo_mao_obra` em **produto**; **pedido_venda** status estendidos; **ordem_producao.etapaKanban**; **crm_oportunidade** (`orcamento_id`, `pedido_id`, estágios alinhados ao funil); entidade e registros **crm_atividade**; BOM exemplo em **EIX-025**; itens no pedido **PV-00541**; seeds CRM/oportunidades; permissões granulares `crm_atividade`. |

## Frontend — arquivos novos

| Arquivo | Função |
|---------|--------|
| `apps/frontend/src/services/cozincaApi.js` | Cliente HTTP para `/api/cozinca` (inclui `importarBomCsv`, `pesoChapaInox`). |
| `apps/frontend/src/pages/engenharia/Engenharia.jsx` | Peso de chapa, importação de BOM, permissões por seção. |
| `apps/frontend/src/components/engenharia/EngenhariaViewer3D.jsx` | Viewer **Three.js** (OrbitControls, wireframe). |

## Frontend — arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `apps/frontend/src/pages/producao/Apontamento.jsx` | Apontamentos via **`cozincaApi.registrarApontamento`** (integração completa). |
| `apps/frontend/src/components/producao/ApontamentoModal.jsx` | Operador padrão = **usuário logado** (`full_name`). |
| `apps/frontend/src/pages/producao/ChaoDeFabrica.jsx` | Dados de **`/api/cozinca/chao-fabrica/snapshot`** em vez de lista estática. |
| `apps/frontend/src/pages/vendas/Orcamentos.jsx` | Ação **Gerar pedido de venda** (integração). |
| `apps/frontend/src/pages/vendas/PedidosVenda.jsx` | Ações **Reservar estoque**, **Gerar OP**, **Gerar contas a receber**, **Fluxo completo**; filtros de status alinhados; resumo considera **Em aprovação** / **Produção**. |
| `apps/frontend/src/pages/crm/Atividades.jsx` | Lista carregada de **`/api/records?entity=crm_atividade`** (sem lista mockada). |
| `apps/frontend/src/App.jsx` | Rota **`/engenharia`** com `PermissaoRoute` (`ver_roteiros` / `editar_produtos` / `ver_estoque`). |
| `apps/frontend/src/components/layout/Sidebar.jsx` | Grupo **Engenharia** → BOM e 3D. |

## Endpoints principais (`/api/cozinca`)

| Método | Rota | Permissão (resumo) |
|--------|------|---------------------|
| POST | `/apontamento/registrar` | `apontar` |
| POST | `/orcamentos/:id/gerar-pedido` | `criar_orcamentos` ou `criar_pedidos` |
| POST | `/pedidos/:id/reservar-estoque` | `movimentar_estoque` |
| POST | `/pedidos/:id/gerar-op` | `criar_op` |
| POST | `/pedidos/:id/gerar-contas-receber` | `editar_financeiro` |
| POST | `/pedidos/:id/fluxo-venda` | `aprovar_pedidos` |
| POST | `/recebimentos/:id/entrada` | `ver_compras` |
| GET | `/chao-fabrica/snapshot` | `ver_chao_fabrica` |
| GET | `/dashboard/kpis?sector=` | autenticado |
| GET | `/produtos/:codigo/custo-bom` | `ver_estoque` |
| GET | `/fiscal/nfe/pedido/:pedidoId/xml-mock` | `ver_fiscal` |
| GET | `/fiscal/sefaz/mock-status/:chave` | `ver_fiscal` |
| GET | `/fiscal/sped/export.txt` | `ver_fiscal` |
| POST | `/engenharia/bom-import` | `editar_produtos` |
| GET | `/engenharia/peso-chapa?xMm=&yMm=&eMm=` | `ver_estoque` |

## Regras de negócio implementadas (detalhe)

1. **BOM**: array JSON em `produto.bom_json`: `{ codigo, qtd, perda_pct }`. Consumo proporcional à **quantidade boa** em apontamento **Finalizado**.
2. **Kanban interno**: campo `etapaKanban` em OP (`a_fazer` → … → `concluido`); ao **Finalizar** apontamento, avança uma etapa; em `concluido`, status OP `concluida` e entrada de estoque do produto acabado.
3. **Orçamento → pedido**: novo pedido com `orcamento_id`; orçamento atualizado; oportunidade com mesmo `orcamento_id` → estágio **Fechado** e `pedido_id`.
4. **Pedido → OP**: para cada item com produto tipo **Produto** ou **Semi-Acabado**, cria OP; sem itens, gera OP genérica (rastreabilidade manual).
5. **Fiscal (mock)**: XML simplificado, resposta Sefaz sintética, arquivo SPED texto para download — adequados a **homologação / demonstração**, não a produção fiscal real.

## Itens não cobertos ou parciais (próximas iterações)

Para transparência com o pedido original extenso:

- **Fila de eventos assíncrona** (Redis/Bull): não implementada — integrações são **síncronas** na requisição (com possível evolução futura).
- **CRM**: pipeline visual completo, e-mail de cotação automático, comparativo de cotações — permanecem como melhorias sobre registros/API atuais.
- **Compras**: workflow OC multi-etapas (solicitante → compras → financeiro) — não modelado como máquina de estados dedicada.
- **PCP**: Gantt, carga-máquina fina, sequenciamento por capacidade — não implementados (dados de capacidade não existem como tabela dedicada).
- **RH / Folha**: cálculos legais completos, importação real — não alterados além do que já existia em entidades.
- **Financeiro**: conciliação com **importação CSV real**, DRE contábil completa — parcialmente cobertos por relatórios existentes; não refatorados aqui.
- **NF-e / SPED reais**: apenas **mock/export sintético**; integração Sefaz/Contabilidade real exige certificados e layouts oficiais.

## Migrações Prisma

Nenhuma **migration nova** de tabelas foi necessária: o projeto usa **`EntityRecord.data` (JSON)** para o modelo operacional. Campos novos entram via **config da entidade** no seed (`Entity.config`).

## Como validar rapidamente

1. Rodar API + seed (`SEED_ENABLED=true` em dev se aplicável).
2. Login com usuário que tenha `apontar`, `ver_chao_fabrica`, permissões de vendas/financeiro conforme ação.
3. Abrir **OP** com produto **EIX-025**, registrar apontamento com **quantidade > 0** e status finalizado → verificar **movimentações** e estoque.
4. Em **Orçamentos**, **Gerar pedido**; em **Pedidos**, testar **Fluxo completo** (perfil com `aprovar_pedidos`).

---
*Documento gerado na entrega de integração COZINCA INOX — COZINCA INOX / ERPCOZERP.*
