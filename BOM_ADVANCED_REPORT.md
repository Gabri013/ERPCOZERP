# BOM_ADVANCED_REPORT — COZINCA INOX (SolidWorks / inox)

Este relatório documenta a **evolução da BOM** para chapas de aço inox: cálculo de peso, auto-cadastro, workflow de engenharia, anexos técnicos e visualização 3D.

## 1. Algoritmo de peso (chapas)

Para linhas em que o campo **Material** permite inferir a **espessura** (ex.: `#430-0,8-1000043` → **0,8 mm**) e **X**, **Y** são dimensões em **mm** &gt; 0:

1. **Área (m²)** = `(X × Y) / 1.000.000`
2. **Espessura (m)** = `espessura_mm / 1000`
3. **Volume (m³)** = `Área × espessura_m`
4. **Peso (kg)** = `Volume × 7850` (densidade aço inox, kg/m³)

**Exemplo de validação:** X = 693,9 mm, Y = 371,5 mm, e = 0,8 mm → peso ≈ **1,62 kg** (arredondamentos podem diferir na 3ª casa).

A espessura é obtida por **heurística** sobre o texto `MATERIAL`: segmentos numéricos no formato `0,8` / `1.5` entre separadores (`-`, `_`, `/`), com validação de faixa razoável (≈ 0,15–80 mm).

## 2. Persistência

| Destino | Campo / tabela | Conteúdo |
|--------|----------------|----------|
| Lista industrial | `bill_of_material_lines.weight_kg` | Peso calculado por linha (chapa) ou vazio |
| Catálogo industrial | `raw_materials` | `dimensions_x`, `dimensions_y`, `thickness`, `weight_kg`, `supplier_default` = "A definir" |
| Cadastro dinâmico | `entity_records` (entidade `produto`) | `bom_json` sincronizado para compatibilidade com apontamento / cozinca |
| Metadados | `product_industrial_meta` | `bom_status`, `model3d_path` |

## 3. Workflow de validação de engenharia

- **`bom_status`** (`product_industrial_meta` + espelho opcional em `produto.bom_status` no JSON):
  - **EMPTY** — produto novo sem BOM (padrão ao criar registro `produto`).
  - **PENDING_ENGINEERING** — projetista em elaboração.
  - **COMPLETE** — BOM importada e validada.

- Ao **criar** um produto (`POST /api/estoque` ou `POST /api/records` entidade `produto`): cria-se meta **EMPTY** e **notificação** para usuários com papel **projetista**.

- **Listagem de pendentes:** `GET /api/products/pending-bom` — usada na página **Engenharia → Pendentes BOM** (`/engenharia/pendentes-bom`).

- **Uso em pedidos:** `reservar estoque` e **gerar OP** validam itens do pedido: cada código de produto deve ter **BOM COMPLETE** ou, **legado**, `bom_json` preenchido sem meta industrial (migrações antigas).

## 4. Anexos técnicos

- Modelo Prisma **`TechnicalFile`**: `tipo` (DXF, PDF, MODELO_3D, OUTRO), `nome_original`, `caminho_arquivo`, vínculo opcional a `product_record_id` ou `op_record_id`.

- Armazenamento em disco: pasta configurável (`UPLOAD_DIR`, padrão `uploads/` na raiz do processo; Docker: volume `./data/uploads` → `/app/uploads`).

- **Upload produto:** `POST /api/products/:id/files` (multipart `files`).

- **Leitura autenticada:** `GET /api/products/files/:fileId/raw` (Bearer JWT).

- **OP:** ao **gerar OP a partir do pedido**, cópias lógicas de arquivos **DXF/PDF** do produto são associadas à OP; operadores veem na aba **Arquivos** da ordem (`GET /api/products/by-op/:opRecordId/files`).

## 5. Visualizador 3D

- **Biblioteca:** **Three.js** (já no `package.json` do frontend).

- **Componente:** `apps/frontend/src/components/products/Model3DViewer.jsx` — carrega o binário com **Authorization Bearer**, cria **object URL** e usa **STLLoader / GLTFLoader / OBJLoader** + **OrbitControls** (rotação, zoom, pan com botão direito).

- **Upload:** `POST /api/products/:id/model3d` — grava em `uploads/3d/` e atualiza `product_industrial_meta.model3d_path`.

- **Download para viewer:** `GET /api/products/:id/model3d` (autenticado).

## 6. Endpoints principais (`/api/products`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/pending-bom` | Produtos com BOM pendente |
| POST | `/:id/bom/import` | Corpo JSON: `csvText`, `dryRun` opcional |
| PUT | `/:id/bom-status` | `{ status: 'EMPTY' \| 'PENDING_ENGINEERING' \| 'COMPLETE' }` |
| GET | `/:id/bom/lines` | Linhas `bill_of_material_lines` |
| GET/POST | `/:id/files` | Lista / upload múltiplo |
| POST/GET | `/:id/model3d` | Upload / download modelo 3D |
| GET | `/files/:fileId/raw` | Stream arquivo técnico |
| GET | `/by-op/:opRecordId/files` | Arquivos da OP |

## 7. API legado `/api/estoque`

Implementação dedicada para **CRUD de produtos** (EntityRecord `produto`), retornando array JSON na listagem — compatível com a tela **Estoque → Produtos**. Inclui enriquecimento com `bom_status` no **GET por id**.

## 8. Instruções de uso (projetista)

1. Acesse **Estoque → Produtos** e abra **Ficha industrial** no produto desejado (`/estoque/produtos/:id`).
2. Aba **Lista de materiais:** cole o CSV/TSV exportado do SolidWorks; use **Pré-visualizar** para conferir pesos e itens novos; **Importar e gravar** define status **COMPLETE**.
3. Aba **Arquivos técnicos:** envie DXF/PDF.
4. Aba **Modelo 3D:** envie STL, glTF, glB ou OBJ.
5. Acompanhe pendentes em **Engenharia → Pendentes BOM**.

---

*Documento gerado como parte da entrega BOM avançada — COZINCA INOX / ERPCOZERP.*
