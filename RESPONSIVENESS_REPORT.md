# RESPONSIVENESS_REPORT — Responsividade Total

**Data:** 2026-05-02  
**Status:** ✅ Sistema responsivo em todos os breakpoints

---

## 1. Estratégia de Responsividade

O ERP COZINCA INOX utiliza **Tailwind CSS** com os breakpoints padrão:

| Breakpoint | Pixels | Uso |
|------------|--------|-----|
| (base) | 0–639px | Mobile — cards, menu hambúrguer |
| `sm` | ≥640px | Tablet pequeno |
| `md` | ≥768px | Tablet — sidebar parcialmente visível |
| `lg` | ≥1024px | Desktop — layout completo |
| `xl` | ≥1280px | Widescreen |

---

## 2. Componentes de Layout

### Sidebar (`ERPLayout.jsx` + `Sidebar.jsx`)

| Comportamento | Implementação |
|--------------|---------------|
| Mobile (<768px) | Escondida por padrão; hambúrguer no Header abre drawer overlay |
| Desktop (≥768px) | Visível como coluna fixa; colapsável para `w-14` (apenas ícones) |
| Estado persistido | `sidebarOpen` em `ERPLayout.jsx`; fechamento ao navegar em mobile |
| Acessibilidade | `PanelLeftClose`/`PanelLeftOpen`, `aria-label`, `sr-only` para ícones colapsados |

### Header (`Header.jsx`)

| Elemento | Mobile | Desktop |
|---------|--------|---------|
| Logo | Truncado/oculto | Visível completo |
| Busca | Ícone de busca | Campo expandido |
| Avatar | Compacto | Completo com nome |
| Hambúrguer | Visível (sempre) | Visível (permite colapsar sidebar) |

---

## 3. DataTable — Responsividade de Tabelas

**Componente:** `src/components/common/DataTable.jsx`  
**Dependência:** `src/components/ui/ResponsiveTable.jsx`

### Comportamento por breakpoint

| Breakpoint | Renderização |
|------------|-------------|
| < 640px (`sm`) | Cards (`ResponsiveTableCards`) — `dl` com label/value por linha |
| ≥ 640px | Tabela HTML com `overflow-x-auto`, `min-w-[600px]` |

### Colunas responsivas

```jsx
// Coluna oculta em mobile
{ key: 'created_at', label: 'Data', mobileHidden: true }

// Coluna fixa à direita
{ key: 'acoes', label: '', stickyRight: true }
```

### `sticky` actions

A última coluna (ou qualquer `stickyRight: true`) fica fixada à direita em scroll horizontal, garantindo que ações (Editar/Excluir) sejam sempre acessíveis sem scrollar.

---

## 4. Formulários e Modais

### Padrão de grid responsivo (todos os formulários)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* campos */}
</div>
```

### Modais

```jsx
// FormModal.jsx
className="w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto"
```

---

## 5. Dashboard

### Cards de métricas

```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
```

### Gráficos (Recharts)

```jsx
<div className="w-full h-64 md:h-80">
  <ResponsiveContainer width="100%" height="100%">
```

---

## 6. Páginas e Componentes Responsivos Verificados

| Página | Tabela responsiva | Grid form | Modal responsivo |
|--------|------------------|-----------|-----------------|
| `Clientes.jsx` | ✅ DataTable | ✅ ModalCliente | ✅ |
| `PedidosVenda.jsx` | ✅ DataTable | ✅ | ✅ |
| `OrdensProducao.jsx` | ✅ DataTable | ✅ ModalNovaOP | ✅ |
| `ContasReceber.jsx` | ✅ DataTable | ✅ | ✅ |
| `ContasPagar.jsx` | ✅ DataTable | ✅ | ✅ |
| `Funcionarios.jsx` | ✅ DataTable | ✅ | ✅ |
| `Fornecedores.jsx` | ✅ DataTable | ✅ | ✅ |
| `OrdensCompra.jsx` | ✅ DataTable | ✅ | ✅ |
| `Produtos.jsx` (estoque) | ✅ DataTable | ✅ | ✅ |
| `Movimentacoes.jsx` | ✅ overflow-x-auto | N/A | ✅ |
| `Inventario.jsx` | ✅ overflow-x-auto | ✅ | ✅ |
| `Enderecamento.jsx` | ✅ overflow-x-auto | ✅ | ✅ |
| `ProdutoDetalhe.jsx` | ✅ overflow-x-auto | ✅ (grid) | N/A |
| `Pipeline.jsx` (CRM) | N/A — Kanban | ✅ | ✅ |
| `KanbanProducao.jsx` | N/A — Kanban | ✅ | ✅ |
| `ProjetosEngenharia.jsx` | ✅ DataTable | N/A | N/A |
| `PendentesBom.jsx` | N/A — cards | N/A | N/A |
| `FluxoCaixa.jsx` | ✅ DataTable | ✅ | ✅ |
| `DRE.jsx` | ✅ overflow-x-auto | N/A | N/A |
| `Dashboard.jsx` | N/A — widgets | ✅ ResponsiveContainer | N/A |
| `Usuarios.jsx` | ✅ DataTable | ✅ | ✅ |
| `Empresa.jsx` | N/A — formulário | ✅ | N/A |

---

## 7. Componentes de UI Responsivos

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `ResponsiveTableCards` | `src/components/ui/ResponsiveTable.jsx` | Cards em mobile, tabela em desktop |
| `DataTable` | `src/components/common/DataTable.jsx` | Usa ResponsiveTableCards + sticky columns |
| `FilterBar` | `src/components/common/FilterBar.jsx` | Filtros colapsam em mobile |
| `FormModal` | `src/components/common/FormModal.jsx` | `w-[95vw] max-h-[90vh]` |
| `PageHeader` | `src/components/common/PageHeader.jsx` | Flex-wrap, botões adaptam |

---

## 8. Breakpoints Testados

| Viewport | Resultado |
|----------|-----------|
| 375px (iPhone SE) | ✅ Cards, menu hambúrguer, sidebar oculta |
| 390px (iPhone 14) | ✅ |
| 768px (iPad) | ✅ Sidebar colapsada, tabelas horizontais |
| 1024px (Desktop) | ✅ Sidebar expandida, grids 3 colunas |
| 1440px (Widescreen) | ✅ |
