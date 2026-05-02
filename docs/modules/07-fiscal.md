# Módulo 7 – Fiscal

## Objetivo
Emissão de NF-e (mock), consulta por chave de acesso e exportação SPED.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/fiscal/fiscal.module.ts` | Registra rotas |
| `apps/backend/src/modules/fiscal/fiscal.routes.ts` | Endpoints NF-e, SPED |
| `apps/backend/src/modules/fiscal/fiscal.service.ts` | Geração de XML mock, consulta, exportação SPED |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/fiscal/NFe.jsx` | Listagem de NF-e, emitir, cancelar |
| `apps/frontend/src/pages/fiscal/NFeConsulta.jsx` | Consulta por chave de acesso |
| `apps/frontend/src/pages/fiscal/SPED.jsx` | Exportação de arquivo SPED (texto) |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/fiscal/nfes` | Listar NF-es emitidas |
| POST | `/api/fiscal/nfes/issue-mock` | Emitir NF-e (XML mock) |
| POST | `/api/fiscal/nfes/:id/cancel` | Cancelar NF-e |
| GET | `/api/fiscal/nfes/consult/:key` | Consultar por chave de acesso |
| GET | `/api/fiscal/sped/export` | Exportar SPED (arquivo texto) |

## Modelo Prisma

- `FiscalNfe` — saleOrderId, xml, status (emitida/cancelada), chave de acesso, data emissão, CNPJ emitente/destinatário, valor total

## Notas de Implementação

> Esta é uma implementação **mock** para desenvolvimento/demonstração. Para uso em produção, integre com uma API de SEFAZ ou provedor certificado (ex.: NFe.io, Enotas, Omie Fiscal). O XML gerado segue o leiaute NF-e 4.0 simplificado.

## Permissões

`ver_nfe`, `emitir_nfe`, `consultar_nfe`, `exportar_sped`

## Como Testar

1. Acesse **Fiscal → NF-e**, selecione um pedido de venda e clique em **Emitir**.
2. O XML mock será gerado e a NF-e aparecerá na listagem com status "emitida".
3. Copie a chave de acesso e consulte em **Consulta NF-e**.
4. Acesse **SPED**, selecione período e exporte o arquivo de texto.
