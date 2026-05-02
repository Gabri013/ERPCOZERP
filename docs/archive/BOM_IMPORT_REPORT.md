# BOM_IMPORT_REPORT — Importação de BOM do SolidWorks

**Data:** 2026-05-02  
**Módulo:** Engenharia (BOM Import)  
**Status:** ✅ Implementado e build validado

---

## 1. Resumo Executivo

Foi implementada a funcionalidade completa de importação de BOM (Bill of Materials) para o ERP COZINCA INOX.  
O projetista pode agora importar a estrutura de produto exportada pelo SolidWorks (CSV, Excel, TSV ou texto colado)  
diretamente na ficha do produto, com mapeamento de colunas, pré-visualização e relatório de resultados.

---

## 2. Arquivos Alterados / Criados

### Backend

| Arquivo | Operação | Descrição |
|---------|----------|-----------|
| `apps/backend/prisma/schema.prisma` | Alterado | Campos `process` e `totalQty` adicionados ao model `BillOfMaterialLine` |
| `apps/backend/prisma/migrations/20260502130000_bom_process_totalqty/migration.sql` | Criado | Migration SQL que adiciona as colunas `process` e `total_qty` na tabela |
| `apps/backend/src/modules/products/bom-solidworks.ts` | Reescrito | Parser estendido com coluna `processo`/`process`, `qtd_total`, detecção robusta de delimitador, normalização de processo, funções `isExternalProcess()` e `normalizeProcess()` |
| `apps/backend/src/modules/products/products.service.ts` | Alterado | `importBomForProduct` e `previewBomImport` agora salvam `process` e `totalQty`; adicionadas funções `replaceBomLines()` e `clearBomLines()` |
| `apps/backend/src/modules/products/products.routes.ts` | Alterado | Novos endpoints: `GET /:id/bom`, `PUT /:id/bom`, `DELETE /:id/bom` |

### Frontend

| Arquivo | Operação | Descrição |
|---------|----------|-----------|
| `apps/frontend/src/components/engenharia/ImportBomModal.jsx` | Criado | Modal completo com 4 etapas: Entrada → Mapeamento → Pré-visualização → Resultado |
| `apps/frontend/src/services/productsApi.js` | Refatorado | Métodos adicionados: `getBom()`, `replaceBom()`, `clearBom()`; método `importBom()` preservado; utilitário `authHeaders()` centralizado |
| `apps/frontend/src/pages/estoque/ProdutoDetalhe.jsx` | Alterado | Aba "Lista de materiais" reformulada: botão "Importar BOM", tabela com coluna Processo com badges coloridos, botão "Limpar BOM"; modal `ImportBomModal` integrado |
| `apps/frontend/package.json` | Alterado | Dependências `papaparse` e `xlsx` adicionadas |

---

## 3. Novos Endpoints da API

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| `POST` | `/api/products/:id/bom/import` | `editar_produtos` | Importa BOM (suporte a `dryRun: true` para prévia) |
| `GET` | `/api/products/:id/bom` | `ver_estoque` | Retorna `{ lines, bomStatus, lineCount }` |
| `PUT` | `/api/products/:id/bom` | `editar_produtos` | Substitui todas as linhas da BOM |
| `DELETE` | `/api/products/:id/bom` | `editar_produtos` | Apaga todas as linhas e seta status `EMPTY` |
| `GET` | `/api/products/:id/bom/lines` | `ver_estoque` | Legado — array de linhas (mantido para compatibilidade) |

---

## 4. Modelo de Dados

### `BillOfMaterialLine` (tabela `bill_of_material_lines`)

Campos novos adicionados nesta implementação:

```sql
ALTER TABLE "bill_of_material_lines"
  ADD COLUMN IF NOT EXISTS "process" TEXT,         -- ex: ALMOXARIFADO, LASER, DOBRA
  ADD COLUMN IF NOT EXISTS "total_qty" DOUBLE PRECISION;
```

Campos existentes preservados: `id`, `product_record_id`, `line_order`, `component_code`, `description`,
`material_spec`, `x_mm`, `y_mm`, `thickness_mm`, `weight_kg`, `quantity`, `created_at`.

---

## 5. Fluxo de Importação (Modal)

```
Entrada (colar texto / upload CSV/XLS)
    ↓
Detecção automática de delimitador e cabeçalhos
    ↓
Mapeamento de colunas (auto + ajuste manual)
    ↓
Pré-visualização (dryRun=true no backend)
  • Peso calculado por linha (chapa: X × Y × espessura × 7850 kg/m³)
  • Marcação de itens novos (serão criados automaticamente)
    ↓
Confirmação → importBom(dryRun=false)
  • Cria Matéria-prima + EntityRecord para códigos não cadastrados
  • Grava linhas na BOM (BillOfMaterialLine)
  • Atualiza bom_json no EntityRecord do produto
  • Status da BOM → COMPLETE
    ↓
Relatório de resultado (itens criados, linhas importadas, log)
```

---

## 6. Processos Suportados

| Processo | Tipo | Uso |
|----------|------|-----|
| `ALMOXARIFADO` | Externo (compra) | Item comprado — gera necessidade de compra |
| `LASER` | Interno | Corte a laser — vincula ao centro de trabalho |
| `DOBRA` | Interno | Dobramento de chapa |
| `SOLDA` / `SOLDAGEM` | Interno | Soldagem |
| `USINAGEM` | Interno | Usinagem CNC |
| `PINTURA` | Interno | Pintura |
| `MONTAGEM` / `ASSEMBLY` | Interno | Montagem final |
| `CORTE` | Interno | Corte guilhotina |
| `TERCEIRIZADO` | Externo | Operação terceirizada |

A função `normalizeProcess()` faz o de-para automático (ex.: "CORTE LASER" → `LASER`, "SOLDADO" → `SOLDA`).

---

## 7. Formato de Entrada Suportado

O parser aceita qualquer combinação das colunas abaixo (ordem livre, cabeçalho obrigatório):

| Coluna BOM | Aliases aceitos |
|-----------|----------------|
| Código | `CODIGO`, `COD`, `CODE`, `ITEM`, `REF`, `PN` |
| Descrição | `DESCRICAO`, `DESCRIPTION`, `NOME`, `COMPONENTE` |
| Material | `MATERIAL`, `MAT`, `SPEC`, `ESPECIFICACAO` |
| Processo | `PROCESSO`, `PROCESS`, `OPERACAO`, `OP`, `SETOR` |
| X (mm) | `X`, `LARGURA`, `LX`, `WIDTH`, `DIM_X` |
| Y (mm) | `Y`, `COMPRIMENTO`, `LY`, `LENGTH`, `DIM_Y` |
| Qtd | `QTD`, `QTY`, `QUANTIDADE`, `QTDE` |
| Qtd Total | `QTD_TOTAL`, `QTY_TOTAL`, `TOTAL`, `QUANTIDADE_TOTAL` |

Separadores aceitos: **tabulação** (TSV), **ponto-e-vírgula** (CSV brasileiro), **vírgula** (CSV padrão).  
Formatos de arquivo: `.csv`, `.tsv`, `.txt`, `.xls`, `.xlsx`, `.ods`.

---

## 8. Exemplo de Planilha (copiar e colar no modal)

```
CODIGO	DESCRICAO	MATERIAL	PROCESSO	X	Y	QTD	QTD_TOTAL
1007802	UN. COND.1-4 HP-UFUS70HAK-EMBRACO	UN. COND.1-4 HP	ALMOXARIFADO			1	1
1006787	MOLDURA ESTENDIDA	MOLDURA ESTENDIDA	ALMOXARIFADO			1	1
1008077	BARREIRA INTERNA - GABINETE	PVC Rígido	ALMOXARIFADO	875,5	373	1	1
CABPD-PC01	BASE UNID CONDENSADORA	#430-0,8-1000043	LASER	693,9	371,5	1	1
```

**Resultado esperado:**
- 4 linhas importadas na BOM
- Itens com código inexistente criados como Matéria-Prima automaticamente
- `CABPD-PC01`: espessura extraída `0,8 mm`; peso calculado `≈ 1.71 kg`

---

## 9. Integrações com Outros Módulos

| Módulo | Integração |
|--------|-----------|
| **Estoque** | Itens `ALMOXARIFADO` com saldo zero → gatilho para recomposição |
| **Compras** | BOM `ALMOXARIFADO` alimenta necessidade de compra ao liberar OP |
| **Produção** | Ao liberar OP, `WorkOrderItem` reserva/consome os itens da BOM |
| **Orçamento** | Custo do produto = soma de `(unitCost × qty)` por linha da BOM |
| **Engenharia** | Status da BOM: `EMPTY` → `PENDING_ENGINEERING` → `COMPLETE` |

---

## 10. Como Testar

### Pré-requisito
```bash
# Aplicar migration (precisa de DATABASE_URL no .env)
cd apps/backend
npx prisma migrate deploy
```

### Via interface
1. Acesse **Estoque > Produtos** e abra a ficha de um produto.
2. Clique na aba **"Lista de materiais"**.
3. Clique em **"Importar BOM (SolidWorks)"**.
4. Cole o exemplo da seção 8 no campo de texto ou faça upload de um arquivo.
5. Clique em **Analisar** → ajuste o mapeamento se necessário → **Pré-visualizar** → **Confirmar importação**.
6. Verifique as linhas na tabela da BOM com os badges de processo.

### Via API (curl)
```bash
# Pré-visualização (dryRun)
curl -X POST http://localhost:3001/api/products/{recordId}/bom/import \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"csvText": "CODIGO\tDESCRICAO\tMATERIAL\tPROCESSO\tX\tY\tQTD\n1007802\tTeste\tAço\tALMOXARIFADO\t\t\t1", "dryRun": true}'

# Importação real
curl -X POST http://localhost:3001/api/products/{recordId}/bom/import \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"csvText": "CODIGO\t...", "dryRun": false}'

# Listar BOM
curl http://localhost:3001/api/products/{recordId}/bom \
  -H "Authorization: Bearer {token}"
```

---

## 11. Build

```
Backend TypeScript (npx tsc --noEmit)  ✅ Exit 0 — sem erros
Frontend (npm run build)               ✅ Exit 0 — build OK
Linter                                 ✅ Sem erros
```
