# BOM_ADVANCED_REPORT — Engenharia Industrial Avançada

**Data:** 2026-05-02  
**Módulo:** Engenharia (BOM Avançada + 3D + Workflow)  
**Status:** ✅ Implementado e build validado

---

## 1. Resumo das Funcionalidades

| # | Funcionalidade | Status | Onde |
|---|---------------|--------|------|
| 1 | Cálculo automático de peso de chapas inox | ✅ | Backend + Frontend |
| 2 | Auto-cadastro de componentes faltantes | ✅ | Backend (importação BOM) |
| 3 | Workflow de validação de engenharia (BOM status) | ✅ | Backend + Dashboard |
| 4 | Anexo de arquivos técnicos (DXF, PDF, 3D) | ✅ | Backend + Frontend |
| 5 | Visualizador 3D interativo (Three.js) | ✅ | Frontend |

---

## 2. Algoritmo de Cálculo de Peso

### Fórmula

```
Área (m²)   = X(mm) × Y(mm) ÷ 1.000.000
Volume (m³) = Área × espessura(mm) ÷ 1.000
Peso (kg)   = Volume × 7.850 (densidade inox kg/m³)
```

### Extração de espessura do campo MATERIAL

O campo MATERIAL do SolidWorks frequentemente contém a especificação do aço com espessura embutida:

| MATERIAL | Espessura extraída |
|----------|-------------------|
| `#430-0,8-1000043` | 0.8 mm |
| `AISI304-1,5` | 1.5 mm |
| `304-2,0mm` | 2.0 mm |
| `Inox 3mm` | 3.0 mm |
| `PVC Rígido` | null (não é chapa) |
| `UN. COND.1-4 HP` | null (componente) |

A função `extractThicknessMm(material)` aplica as seguintes estratégias em ordem:
1. **Segmentos delimitados por `-`, `_`, `/`** — busca padrão `\d+[.,]\d+` na faixa 0.15–80 mm.
2. **Sufixo `mm`** — busca `\d+[.,]\d+\s*mm`.
3. **Número isolado plausível** — qualquer decimal no intervalo 0.15–6 mm.

### Exemplo de verificação (linha 67 da planilha de exemplo)

```
X = 693,9 mm  Y = 371,5 mm  MATERIAL = #430-0,8-1000043
→ Espessura = 0,8 mm
→ Área = (693,9 × 371,5) / 1.000.000 = 0,25782 m²
→ Volume = 0,25782 × 0,0008 = 0,000206256 m³
→ Peso = 0,000206256 × 7850 = 1,619 kg
```

> A documentação afirmava ≈ 1,62 kg — **confirmado**.

---

## 3. Auto-Cadastro de Componentes

Durante `importBomForProduct()`, para cada linha da planilha:

```typescript
// 1. Verifica existência
const exists = await productExistsAsProductOrRaw(codigo);

// 2. Se não existe, cria automaticamente
if (!exists) {
  // EntityRecord de produto (tipo = 'Matéria-Prima', grupo = 'Auto BOM')
  const entityRecord = await prisma.entityRecord.create({ ... });

  // RawMaterial com metadados técnicos
  await prisma.rawMaterial.create({
    code, name, materialCode,
    dimensionsX, dimensionsY, thickness,
    weightKg, supplierDefault: 'A definir',
    linkedEntityRecordId: entityRecord.id,
  });
}
```

Os campos preenchidos automaticamente:
- `code` → CÓDIGO da planilha
- `name` → DESCRIÇÃO
- `materialCode` → MATERIAL (especificação técnica)
- `dimensionsX/Y` → X, Y da planilha (se > 0)
- `thickness` → extraído do campo MATERIAL
- `weightKg` → calculado se for chapa
- `supplierDefault` → "A definir" (preencher posteriormente)

---

## 4. Workflow de Validação de Engenharia

### Estados possíveis

```
EMPTY ──→ PENDING_ENGINEERING ──→ COMPLETE
  ↑                ↓
  └────────────────┘  (pode retroceder)
```

| Status | Significado | Quem altera |
|--------|------------|-------------|
| `EMPTY` | Produto criado, sem BOM | Automático (ao criar produto) |
| `PENDING_ENGINEERING` | Projetista está elaborando | Projetista (botão inline) |
| `COMPLETE` | BOM aprovada e completa | Automático (ao importar) ou Projetista |

### Gatilhos automáticos

- **Criação de produto** → `EMPTY` + notificação enviada a todos os usuários com role `projetista`
- **Importação BOM** → `COMPLETE` (automático ao final da importação bem-sucedida)
- **Limpeza de BOM** → retorna a `EMPTY`

### Notificação ao Projetista

```typescript
await prisma.userNotification.createMany({
  data: projetistas.map(u => ({
    userId: u.userId,
    sector: 'Engenharia',
    type: 'warning',
    text: `[BOM] Novo produto ${cod} — ${desc} — definir lista de materiais.`,
  })),
});
```

### APIs de workflow

```
GET  /api/products/pending-bom           → lista EMPTY + PENDING
PUT  /api/products/:id/bom-status        → muda status manualmente
POST /api/products/:id/bom/import        → importa e seta COMPLETE
```

---

## 5. Estrutura de Arquivos Técnicos

### Modelo Prisma (`TechnicalFile`)

```prisma
model TechnicalFile {
  id              String   @id
  productRecordId String?  // EntityRecord do produto
  opRecordId      String?  // EntityRecord da OP
  tipo            String   // DXF | PDF | MODELO_3D | OUTRO
  nomeOriginal    String
  caminhoArquivo  String   // caminho relativo em uploads/
  uploadedBy      String?
  createdAt       DateTime
}
```

### Armazenamento

```
uploads/
  tech/     → DXF e PDF (max 85 MB por arquivo)
  3d/       → STL, glTF, glB, OBJ
  catalog/  → arquivos de produtos do catálogo Prisma
```

### APIs

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/products/:id/files` | Upload DXF/PDF (multipart, até 20 arquivos) |
| `GET` | `/api/products/:id/files` | Lista arquivos do produto |
| `GET` | `/api/products/files/:fileId/raw` | Serve o arquivo (autenticado) |
| `POST` | `/api/products/:id/model3d` | Upload do modelo 3D |
| `GET` | `/api/products/:id/model3d` | Serve o modelo 3D |
| `GET` | `/api/products/by-op/:opId/files` | Arquivos disponíveis no Chão de Fábrica |

### Integração OP → Chão de Fábrica

Ao criar uma OP a partir de um pedido de venda, `linkProductTechnicalFilesToOp()` copia automaticamente os arquivos DXF e PDF do produto para o contexto da OP, tornando-os acessíveis para operadores em `DetalheOP.jsx`.

---

## 6. Visualizador 3D Interativo

### Biblioteca utilizada

**Three.js v0.171** (instalado em `apps/frontend/package.json`)

Carregamento lazy (dynamic import) para não impactar o bundle principal.

### Formatos suportados

| Formato | Loader | Uso típico |
|---------|--------|------------|
| `.stl` | `STLLoader` | SolidWorks export, peças mecânicas |
| `.gltf` / `.glb` | `GLTFLoader` | Modelos modernos, animações |
| `.obj` | `OBJLoader` | Modelos legados |

### Controles (OrbitControls)

| Ação | Controle |
|------|---------|
| Rotacionar | Arrastar botão esquerdo |
| Zoom | Scroll do mouse |
| Panorâmica | Arrastar botão direito ou Shift+arrastar |
| Reset | Botão "Reset câmera" (futuro) |
| Wireframe | Botão toggle na UI |

### Componentes

- **`Model3DViewer.jsx`** — viewer integrado na ficha do produto (`ProdutoDetalhe.jsx`)  
  Recebe `modelUrl` → faz fetch autenticado → cria blob URL → carrega com Three.js
- **`EngenhariaViewer3D.jsx`** — demonstração interativa (sem URL — exibe cubo de referência)  
  Disponível em `Engenharia > Dashboard`

### Pipeline completo

```
Projetista → Upload STL no ProdutoDetalhe (aba "Modelo 3D")
    ↓
POST /api/products/:id/model3d (multer → disco uploads/3d/)
    ↓
Salvo em ProductIndustrialMeta.model3dPath + TechnicalFile
    ↓
GET /api/products/:id/model3d (serve arquivo autenticado)
    ↓
Model3DViewer.jsx (fetch blob → Three.js STLLoader → renderer)
```

---

## 7. Dashboard de Engenharia

### Páginas disponíveis

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/engenharia` | `Engenharia.jsx` | Dashboard com stats BOM + calculadora + pendentes recentes |
| `/engenharia/pendentes-bom` | `PendentesBom.jsx` | Fila do projetista com ações rápidas de status |
| `/engenharia/projetos` | `ProjetosEngenharia.jsx` | Catálogo completo com coluna BOM status + filtros |

### Calculadora de peso inline (dashboard)

Disponível no dashboard sem precisar abrir a ficha do produto. Cálculo em tempo real, sem chamada ao servidor.

---

## 8. BOM na Ordem de Produção (OP)

O `DetalheOP.jsx` agora possui aba **"BOM"** que:
1. Busca a BOM pelo código do produto via `GET /api/products/by-code/:code/bom`
2. Exibe tabela com Código, Descrição, Material, Processo (badges coloridos), Qtd, Peso
3. Permite ao operador verificar os insumos necessários para a produção

---

## 9. Diagrama de Integração

```
Projetista importa planilha SolidWorks
    │
    ▼
ImportBomModal (papaparse / xlsx)
    │ CSV normalizado
    ▼
POST /api/products/:id/bom/import
    │
    ├─ extractThicknessMm(material) → espessura
    ├─ calcSheetWeightKg(x, y, e) → peso
    ├─ normalizeProcess(processo) → LASER | DOBRA | ...
    │
    ├─ autoCreateComponent() ──► RawMaterial + EntityRecord (se não existe)
    │
    ├─ BillOfMaterialLine.create() ──► BD (process, weight, qty)
    │
    ├─ ProductIndustrialMeta.bomStatus = 'COMPLETE'
    │
    └─ UserNotification → Projetistas (se novo produto)

Ao liberar OP:
    ├─ WorkOrderItem.create() ← linhas BOM
    ├─ TechnicalFile cópia (DXF/PDF) → opRecordId
    └─ DetalheOP aba "BOM" → operador vê insumos
```

---

## 10. Build Final

```
Backend TypeScript (npx tsc --noEmit)  ✅ Exit 0
Frontend (npm run build)               ✅ Exit 0
Linter (ReadLints)                     ✅ Sem erros
```

### Arquivos alterados nesta iteração

| Arquivo | Operação |
|---------|----------|
| `apps/frontend/src/pages/engenharia/Engenharia.jsx` | Reescrito — Dashboard com stats BOM |
| `apps/frontend/src/pages/engenharia/ProjetosEngenharia.jsx` | Atualizado — coluna BOM + filtro |
| `apps/frontend/src/pages/engenharia/PendentesBom.jsx` | Atualizado — stats + ações rápidas |
| `apps/frontend/src/pages/producao/DetalheOP.jsx` | Atualizado — aba BOM do produto |
| `apps/frontend/src/services/productsApi.js` | Atualizado — método `bomForProductCode()` |
| `apps/backend/src/modules/products/products.routes.ts` | Atualizado — endpoint `GET /by-code/:code/bom` |
| `apps/backend/src/modules/products/products.service.ts` | Atualizado — `findProdutoEntityRecordByCode()` |
