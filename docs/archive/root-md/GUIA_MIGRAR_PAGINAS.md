---
title: "Fase 3: Como Conectar Páginas aos Serviços"
description: "Guia prático para converter páginas de dados mock para dados reais com CRUD funcional"
---

# 🔗 Fase 3: Conectar Páginas aos Serviços

## 📌 Resumo

Todas as 9 páginas principais já existem no repo, mas ainda usam **dados mock locais** (storage.js).

**Objetivo**: Converter cada página para usar os novos **serviços híbridos** que funcionam tanto em modo local quanto Firebase.

**Tempo Estimado**: ~20-30 minutos por página = ~20 horas total

**Benefício**: CRUD 100% funcional, sincronização em tempo real, relatórios automáticos

---

## 🔄 Padrão de Migração

### ANTES (Modo Mock)
```jsx
import { storage } from '@/services/storage';

export default function Fornecedores() {
  const MOCK_INICIAL = [{...}, ...];
  const [data, setData] = useState(getData());
  const [editando, setEditando] = useState(null);

  const getData = () => storage.get('fornecedores', MOCK_INICIAL);
  
  const handleSave = (form) => {
    if (editando) {
      // Update logic
    } else {
      // Create logic
    }
    setData([...getData()]); // Recarregar manualmente
  };
}
```

**Problemas**:
- ❌ Sem listeners em tempo real
- ❌ Sem validação de negócio
- ❌ Sem sincronização Firestore
- ❌ Código duplicado em cada página
- ❌ Sem cache automático

---

### DEPOIS (Com Serviço)
```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { fornecedoresService } from '@/services/fornecedoresService';
import { useQueryClient } from '@tanstack/react-query';

export default function Fornecedores() {
  const queryClient = useQueryClient();

  // Buscar dados
  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => fornecedoresService.getAll(),
  });

  // Criar/Atualizar
  const { mutate: salvar } = useMutation({
    mutationFn: (dados) => 
      editando 
        ? fornecedoresService.update(editando.id, dados)
        : fornecedoresService.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
      setEditando(null);
    },
  });

  // Deletar
  const { mutate: deletar } = useMutation({
    mutationFn: (id) => fornecedoresService.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['fornecedores']),
  });

  return (
    <div>
      <h1>Fornecedores</h1>
      {isLoading && <p>Carregando...</p>}
      {/* Table/List aqui */}
    </div>
  );
}
```

**Benefícios**:
- ✅ Listeners em tempo real (quando alguém edita, todos veem)
- ✅ Cache automático (React Query)
- ✅ Validação de negócio no serviço
- ✅ Modo local + Firebase transparente
- ✅ Loading/error states automáticos
- ✅ Otimista updates (UI atualiza antes da resposta)

---

## 📋 Módulos a Migrar

### VENDAS (4 páginas)
```
src/pages/vendas/
├─ Clientes.jsx          → clientesService
├─ Orcamentos.jsx        → pedidosService (filtro status='Orçamento')
├─ Pedidos.jsx           → pedidosService (filtro status='Pedido')
└─ Acompanhamento.jsx    → pedidosService.getAll() com listeners
```

### ESTOQUE (3 páginas)
```
src/pages/estoque/
├─ Produtos.jsx          → produtoService
├─ Movimentacoes.jsx     → movimentacoesService
└─ Inventario.jsx        → produtoService (com KPIs)
```

### COMPRAS (4 páginas)
```
src/pages/compras/
├─ Fornecedores.jsx      → fornecedoresService
├─ OrdensCompra.jsx      → ordensCompraService (criar!)
├─ Cotacoes.jsx          → (criar cotacaoService)
└─ Recebimentos.jsx      → (criar recebimentoService)
```

### PRODUÇÃO (3 páginas)
```
src/pages/producao/
├─ OrdensProducao.jsx    → producaoService
├─ Kanban.jsx            → producaoService com status filtering
└─ PCP.jsx               → producaoService com stats
```

### FINANCEIRO (3 páginas)
```
src/pages/financeiro/
├─ ContasReceber.jsx     → contasReceberService
├─ ContasPagar.jsx       → contasPagarService
└─ FluxoCaixa.jsx        → ambos com agregação
```

### RH (2 páginas)
```
src/pages/rh/
├─ Funcionarios.jsx      → rhService
└─ Folha.jsx             → rhService com totalização
```

### CRM (2 páginas)
```
src/pages/crm/
├─ Oportunidades.jsx     → (criar oportunidadeService)
└─ Leads.jsx             → (criar leadService)
```

**Total**: 21 páginas de UI

---

## 🎯 Exemplo Prático: Migrar Fornecedores

### Passo 1: Verificar Arquivo Original
```jsx
// src/pages/compras/Fornecedores.jsx (atual)
import { storage } from '@/services/storage';

const MOCK_INICIAL = [
  { id:'1', codigo:'FOR-001', razao_social:'Rolamentos...' },
  // ... 4 mais
];

if (!localStorage.getItem('nomus_erp_fornecedores')) 
  storage.set('fornecedores', MOCK_INICIAL);

const getData = () => storage.get('fornecedores', MOCK_INICIAL);
```

### Passo 2: Importar Serviço e React Query
```jsx
// Adicionar imports
import { useQuery, useMutation } from '@tanstack/react-query';
import { fornecedoresService } from '@/services/fornecedoresService';
import { useQueryClient } from '@tanstack/react-query';
```

### Passo 3: Substituir useState por useQuery
```jsx
// Antes
const [data, setData] = useState(getData());

// Depois
const queryClient = useQueryClient();
const { data: fornecedores = [], isLoading, error } = useQuery({
  queryKey: ['fornecedores'],
  queryFn: () => fornecedoresService.getAll(),
});
```

### Passo 4: Substituir handleSave por useMutation
```jsx
// Antes
const handleSave = (form) => {
  const all = getData();
  if (editando) {
    saveData(all.map(f => f.id === editando.id ? {...f, ...form} : f));
  } else {
    saveData([...all, {...form, id: Date.now()}]);
  }
  reload();
};

// Depois
const { mutate: salvar, isPending } = useMutation({
  mutationFn: (form) => 
    editando 
      ? fornecedoresService.update(editando.id, form)
      : fornecedoresService.create(form),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    setEditando(null);
    setShowModal(false);
  },
  onError: (error) => {
    console.error('Erro ao salvar:', error);
  },
});

const handleSave = (form) => salvar(form);
```

### Passo 5: Substituir handleDelete por useMutation
```jsx
// Antes
const handleDelete = (id) => {
  saveData(getData().filter(f => f.id !== id));
  reload();
};

// Depois
const { mutate: deletar } = useMutation({
  mutationFn: (id) => fornecedoresService.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
  },
});

const handleDelete = (id) => {
  if (confirm('Tem certeza?')) deletar(id);
};
```

### Passo 6: Atualizar Renderização
```jsx
// Antes
<DataTable
  columns={...}
  data={filtered}
  onEdit={...}
/>

// Depois
{isLoading && <Skeleton />}
{error && <ErrorAlert message={error.message} />}
{!isLoading && (
  <DataTable
    columns={...}
    data={filtered}
    onEdit={...}
    isLoading={isPending}
  />
)}
```

### Passo 7: Adicionar Listener (Opcional)
```jsx
// Em tempo real quando alguém edita (Firebase)
useEffect(() => {
  const unsubscribe = fornecedoresService.onFornecedoresChange((dados) => {
    queryClient.setQueryData(['fornecedores'], dados);
  });
  
  return () => unsubscribe();
}, [queryClient]);
```

---

## 🚀 Checklist de Migração

Para cada página:

- [ ] **Imports**
  - [ ] Remover `import { storage }`
  - [ ] Adicionar `import { useQuery, useMutation }`
  - [ ] Adicionar import do serviço específico

- [ ] **Data Fetching**
  - [ ] Substituir `useState(getData())` por `useQuery(...)`
  - [ ] Remover `getData()` function
  - [ ] Remover `saveData()` function

- [ ] **Mutations**
  - [ ] Substituir `handleSave` por `useMutation + mutate`
  - [ ] Substituir `handleDelete` por `useMutation + mutate`
  - [ ] Adicionar `invalidateQueries` em `onSuccess`

- [ ] **Rendering**
  - [ ] Adicionar `isLoading` states
  - [ ] Adicionar `error` handling
  - [ ] Remover `reload()` calls

- [ ] **Testing**
  - [ ] Teste criar (C)
  - [ ] Teste ler (R)
  - [ ] Teste atualizar (U)
  - [ ] Teste deletar (D)
  - [ ] Teste em Firefox (outro browser)
  - [ ] Teste modo local
  - [ ] Teste offline (Devtools → Network → Offline)

- [ ] **Advanced** (Opcional)
  - [ ] Adicionar listeners em tempo real
  - [ ] Implementar search com filtros do serviço
  - [ ] Implementar paginação
  - [ ] Adicionar otimista updates

---

## 📊 Implementação Order (Recomendado)

**Por Impacto** (começar pelas mais críticas):

1. **Dashboard** (1 página) - KPIs desde serviços
2. **Vendas** (4 páginas) - Receita principal
3. **Financeiro** (3 páginas) - Caixa
4. **Produção** (3 páginas) - Operações
5. **Estoque** (3 páginas) - Inventário
6. **Compras** (4 páginas) - Custos
7. **RH** (2 páginas) - Pessoas
8. **CRM** (2 páginas) - Clientes
9. **Configurações** - Usuários e permissões

**Tempo Total Estimado**: ~20 horas

---

## 🛠️ Ferramentas Úteis

### Verificar se Serviço está Funcionando
```javascript
// Console do navegador (F12)
const fornecedores = await window.fornecedoresService.getAll();
console.table(fornecedores);
```

### Testar Offline
```
DevTools (F12)
→ Application
→ Storage
→ Local Storage
→ Ver chaves 'nomus_erp_*'
```

### Forçar Modo Firestore
```env
# .env.local
VITE_BACKEND_PROVIDER=firebase
VITE_FIREBASE_PROJECT_ID=seu-projeto-aqui
# ... outras chaves
```

---

## ✨ Exemplo Completo: Página Migrada

```jsx
// src/pages/compras/Fornecedores.jsx (NOVA)
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { fornecedoresService } from '@/services/fornecedoresService';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import ModalFornecedor from '@/components/compras/ModalFornecedor';
import { Plus } from 'lucide-react';

export default function Fornecedores() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  // Buscar dados
  const { data: fornecedores = [], isLoading, error } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => fornecedoresService.getAll(),
  });

  // Criar/Atualizar
  const { mutate: salvar, isPending } = useMutation({
    mutationFn: (form) => 
      editando
        ? fornecedoresService.update(editando.id, form)
        : fornecedoresService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setEditando(null);
      setShowModal(false);
    },
  });

  // Deletar
  const { mutate: deletar } = useMutation({
    mutationFn: (id) => fornecedoresService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    },
  });

  // Filtrar
  const filtered = fornecedores.filter(f => {
    const s = search.toLowerCase();
    return !s || 
      f.nome.toLowerCase().includes(s) || 
      f.cnpj.includes(s);
  });

  // Handlers
  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja deletar?')) {
      deletar(id);
    }
  };

  const handleEdit = (f) => {
    setEditando(f);
    setShowModal(true);
  };

  return (
    <>
      <PageHeader title="Fornecedores" />
      
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar fornecedor..."
        action={
          <button 
            onClick={() => { setEditando(null); setShowModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={20} /> Novo Fornecedor
          </button>
        }
      />

      {isLoading && <p>Carregando...</p>}
      {error && <p className="text-red-500">Erro: {error.message}</p>}
      
      {!isLoading && (
        <DataTable
          columns={[
            { header: 'Nome', accessor: 'nome' },
            { header: 'CNPJ', accessor: 'cnpj' },
            { header: 'Telefone', accessor: 'telefone' },
            { header: 'Prazo', accessor: 'prazoEntrega', render: v => `${v} dias` },
          ]}
          data={filtered}
          actions={[
            { label: 'Editar', onClick: (row) => handleEdit(row) },
            { label: 'Deletar', onClick: (row) => handleDelete(row.id) },
          ]}
        />
      )}

      <ModalFornecedor
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initial={editando}
        onSave={salvar}
        isLoading={isPending}
      />
    </>
  );
}
```

---

## 📈 Resultado Final

**Antes** (Fase 2):
- ✅ 9 serviços criados
- ❌ 40+ páginas sem dados reais
- ❌ Sem CRUD funcional
- ❌ Sem sincronização

**Depois** (Fase 3):
- ✅ 9 serviços criados
- ✅ 40+ páginas com dados reais
- ✅ CRUD 100% funcional
- ✅ Sincronização em tempo real
- ✅ Pronto para deploy

---

## 🎯 Próximas Fases

Após completar Fase 3:

**Fase 4**: Testes
- Testar cada página no modo local
- Testar cada página no modo Firebase
- Testar offline/online sync

**Fase 5**: Deploy Firebase Hosting
- Configurar Firebase Hosting
- Deploy inicial em staging
- Deploy em produção
- Monitorar performance

---

## 📞 Suporte

Se encontrar problemas:

1. **Serviço não carrega dados**
   - Verificar console (F12)
   - Confirmar localStorage tem dados
   - Confirmar VITE_BACKEND_PROVIDER está correto

2. **Mutação não funciona**
   - Verificar se `queryClient.invalidateQueries` está sendo chamado
   - Verificar console para erros
   - Adicionar logs em `onSuccess` e `onError`

3. **Página demora muito**
   - Adicionar `.staleTime: 1000 * 60 * 5` ao useQuery (5 min)
   - Isso evita refetch automático
   - Ideal para dados que mudam pouco

---

**Documentação**: EXEMPLOS_USO.md tem 8 exemplos prontos para copiar/colar

**Status**: 🟡 FASE 3 READY TO START

**Tempo Restante**: ~20 horas
