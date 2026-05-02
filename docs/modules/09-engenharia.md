# Módulo 9 – Engenharia

## Objetivo
Gestão de BOM (Lista de Materiais), importação de arquivos SolidWorks, cálculo de peso automático, validação de BOM e visualizador 3D interativo.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/products/products.routes.ts` | Endpoints BOM, upload de arquivos |
| `apps/backend/src/modules/products/products.service.ts` | previewBomImport, replaceBomLines, clearBomLines |
| `apps/backend/src/modules/products/bom-solidworks.ts` | Parser CSV/Excel estilo SolidWorks |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/engenharia/Engenharia.jsx` | Dashboard: estatísticas de BOM, calculadora de peso |
| `apps/frontend/src/pages/engenharia/ProjetosEngenharia.jsx` | Lista de produtos com status de BOM, filtros |
| `apps/frontend/src/pages/engenharia/PendentesBom.jsx` | BOMs pendentes de validação com ações rápidas |
| `apps/frontend/src/pages/estoque/ProdutoDetalhe.jsx` | Ficha industrial: aba BOM, aba 3D, aba Arquivos |
| `apps/frontend/src/components/engenharia/ImportBomModal.jsx` | Modal multi-etapa para importação de BOM |

## Funcionalidades

### Importação de BOM
- Suporta CSV, Excel (`.xlsx`), texto tabulado
- Auto-detecção de colunas (código, descrição, quantidade, unidade, material, espessura, processo)
- Mapeamento manual de colunas quando auto-detecção falha
- Preview com cálculo de peso automático (densidade × espessura × área)
- Auto-criação de componentes inexistentes no estoque

### Cálculo de Peso Automático
```
Peso (kg) = largura(mm) × comprimento(mm) × espessura(mm) × densidade(g/cm³) ÷ 1.000.000
```

Densidades padrão:
- Aço inoxidável AISI 304/316: 7,93 g/cm³
- Aço carbono: 7,85 g/cm³
- Alumínio: 2,70 g/cm³

### Status de BOM (`bom_status`)
- `pendente` — sem BOM cadastrada
- `em_revisao` — importada, aguardando validação
- `aprovada` — validada pelo engenheiro
- `obsoleta` — substituída por revisão mais recente

### Visualizador 3D
- Suporta `.stl`, `.gltf`, `.glb`, `.obj`
- Controles de órbita (mouse drag), zoom (scroll), reset de câmera
- Renderização com Three.js + OrbitControls

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products/:id/bom` | Listar linhas de BOM |
| PUT | `/api/products/:id/bom` | Substituir BOM completa |
| DELETE | `/api/products/:id/bom` | Limpar BOM |
| POST | `/api/products/:id/bom/preview` | Preview antes de importar |
| GET | `/api/products/by-code/:code/bom` | BOM por código do produto |
| POST | `/api/products/:id/files` | Upload de arquivo (DXF, PDF, STL, glTF) |

## Permissões

`ver_engenharia`, `importar_bom`, `upload_engenharia`

## Como Testar

1. Acesse **Engenharia → Projetos** e filtre por status `pendente`.
2. Abra um produto e vá à aba **Lista de Materiais**.
3. Clique em **Importar BOM**, carregue um CSV do SolidWorks.
4. Mapeie as colunas, revise o preview e confirme.
5. Altere o status para `aprovada` em **Engenharia → Pendentes**.
6. Faça upload de um arquivo `.stl` e visualize em 3D.
