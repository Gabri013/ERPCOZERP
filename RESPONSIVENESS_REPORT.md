# Relatório de responsividade — ERPCOZERP (frontend)

Este documento lista os componentes e páginas envolvidos na melhoria de **layout responsivo** (mobile, tablet, desktop) com **Tailwind CSS**, alinhado às tarefas: shell (sidebar/header/main), tabelas (`overflow-x`, `min-w`, ações fixas), formulários em grid, modais (`w-[95vw]`, `max-h-[90vh]`, `max-w` progressivo), dashboard, `ResponsiveTable` com `mobileHidden`, e escala de tipografia em `PageHeader` e dashboard.

**Nota:** A aplicação usa o shell em `ERPLayout.jsx` (não `Layout.jsx` separado) para o conteúdo principal com `max-w-7xl mx-auto` e padding responsivo.

## Layout e navegação

| Arquivo | Alterações principais |
|--------|------------------------|
| `apps/frontend/src/components/layout/ERPLayout.jsx` | Main com `max-w-7xl mx-auto`, padding `p-4 sm:p-6 lg:p-8`; overlay e drawer mobile com z-index elevado. |
| `apps/frontend/src/components/layout/Sidebar.jsx` | Drawer em telas &lt; `md`, fechamento (incl. botão), sobreposição ao conteúdo. |
| `apps/frontend/src/components/layout/Header.jsx` | Menu hambúrguer, título/área de busca compactos no mobile, notificações com largura/scroll adaptáveis. |
| `apps/frontend/src/components/common/PageHeader.jsx` | Títulos `text-xl sm:text-2xl md:text-3xl`, subtítulos `text-sm sm:text-base`, ações em coluna no estreito. |

## Tabelas e listagens

| Arquivo | Alterações principais |
|--------|------------------------|
| `apps/frontend/src/components/ui/ResponsiveTable.jsx` | **Novo:** cards em &lt; `sm`, colunas com `mobileHidden`, reutilizável via `ResponsiveTableCards`. |
| `apps/frontend/src/components/common/DataTable.jsx` | `overflow-x-auto`, tabela `min-w-[600px]`, visão desktop/cards mobile, coluna de ação **sticky** à direita (padrão), paginação responsiva. |
| `apps/frontend/src/pages/vendas/Clientes.jsx` | `mobileHidden` em colunas secundárias; ações e detalhe em stack no mobile. |
| `apps/frontend/src/pages/vendas/PedidosVenda.jsx` | Grids e ações responsivos; import de `CONFIG` (correção). |
| `apps/frontend/src/pages/producao/OrdensProducao.jsx` | Resumo em `grid-cols-2 sm:grid-cols-4`; `mobileHidden` em colunas; botões de ação full-width no estreito. |
| `apps/frontend/src/pages/estoque/Produtos.jsx` | `mobileHidden`; detalhe com grid 1/2 colunas; botões em coluna no mobile. |
| `apps/frontend/src/pages/financeiro/ContasReceber.jsx` | Cards de resumo `grid-cols-1 sm:grid-cols-3`; `mobileHidden`; detalhe e ações responsivos. |
| `apps/frontend/src/pages/configuracoes/Usuarios.jsx` | Formulário de usuário em grid; modal de permissões com largura/scroll; grid de checkboxes responsivo. |
| `apps/frontend/src/pages/engenharia/Engenharia.jsx` | `max-w-5xl`, seções em cards, grids 1/3 colunas (peso e BOM), viewer 3D `w-full` + `min-h`. |
| `apps/frontend/src/components/engenharia/EngenhariaViewer3D.jsx` | Canvas responsivo com `ResizeObserver` (largura do contêiner). |

## Formulários e modais

| Arquivo | Alterações principais |
|--------|------------------------|
| `apps/frontend/src/components/ui/dialog.jsx` | `DialogContent` com `w-[95vw]`, `max-h-[90vh]`, `overflow-y-auto`, `sm:max-w-lg md:max-w-xl lg:max-w-2xl`, `DialogFooter` em coluna no mobile. |
| `apps/frontend/src/components/ui/alert-dialog.jsx` | Mesmo padrão de largura/altura para confirmações. |
| `apps/frontend/src/components/common/FormModal.jsx` | Largura e rodapé responsivos. |
| `apps/frontend/src/components/common/DetalheModal.jsx` | Largura e rodapé responsivos. |
| `apps/frontend/src/components/metadata/DynamicFormModal.jsx` | Grid de campos `1 / 2 / 3` colunas, inputs `w-full`, `DialogFooter` empilhado no mobile. |
| `apps/frontend/src/components/metadata/DynamicEntityPage.jsx` | Modal de detalhe com `lg:max-w-4xl` e grid de campos `1 sm:2` colunas. |
| `apps/frontend/src/pages/configuracoes/MetadataStudio.jsx` | Modais de entidade/campo com `sm:max-w-md` e grid tipo/ícone responsivo. |
| `apps/frontend/src/pages/configuracoes/WorkflowBuilder.jsx` | Modal com `sm:max-w-lg`, grids e switches empilhados no mobile. |
| `apps/frontend/src/components/ui/command.jsx` | `DialogContent` (comando/palette) — herda base de `dialog.jsx` onde aplicável. |

## Dashboard e gráficos

| Arquivo | Alterações principais |
|--------|------------------------|
| `apps/frontend/src/pages/Dashboard.jsx` | Grid de cards `1 / 2 / 3 / 4` colunas; tipografia; toolbar em coluna no mobile. |
| `apps/frontend/src/components/dashboard/WidgetGraficoVendas.jsx` | Área do gráfico `h-64 md:h-80 w-full`. |
| `apps/frontend/src/components/dashboard/WidgetGraficoFinanceiro.jsx` | Idem. |
| `apps/frontend/src/components/dashboard/WidgetGraficoProducao.jsx` | Idem. |

## Padrões técnicos (referência)

- **Sidebar mobile:** &lt; `768px` — drawer, hambúrguer no header, `z-index` sobre o conteúdo.  
- **Tabelas:** `sm` (640px) — abaixo disso, listagem em **cards** quando usar `DataTable` + `ResponsiveTable`.  
- **Ações na tabela:** última coluna (ou coluna com `stickyRight`) com `sticky right-0` no desktop.  
- **Formulários:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, campos `w-full`, botões `flex-col sm:flex-row` onde couber.  

## Data

- Relatório alinhado ao estado do repositório após a entrega de responsividade no **frontend** (`apps/frontend`).
