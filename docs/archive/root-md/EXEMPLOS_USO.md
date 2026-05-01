# 📚 Exemplos de Uso dos Serviços Hybrid

Este arquivo mostra como usar cada serviço em páginas React.

---

## 1. Exemplo Básico: Listar Produtos

### Arquivo: `src/pages/estoque/Produtos.jsx`

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produtoService } from '@/services/produtoService';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function Produtos() {
  const queryClient = useQueryClient();

  // Buscar produtos
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => produtoService.getAll(),
  });

  // Deletar produto
  const { mutate: deletar } = useMutation({
    mutationFn: (id) => produtoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto deletado');
    },
    onError: () => toast.error('Erro ao deletar'),
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Produtos</h1>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>SKU</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.sku}</td>
              <td>R$ {p.preco.toFixed(2)}</td>
              <td>{p.estoque}</td>
              <td>
                <Button size="sm" onClick={() => deletar(p.id)}>
                  Deletar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 2. Exemplo: Criar e Editar com Modal

### Arquivo: `src/pages/estoque/Produtos.jsx`

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produtoService } from '@/services/produtoService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function Produtos() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    sku: '',
    preco: 0,
    estoque: 0,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => produtoService.getAll(),
  });

  const { mutate: salvar } = useMutation({
    mutationFn: (data) =>
      editing
        ? produtoService.update(editing.id, data)
        : produtoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success(editing ? 'Atualizado' : 'Criado com sucesso');
      setOpen(false);
      setForm({ nome: '', sku: '', preco: 0, estoque: 0 });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    salvar(form);
  };

  const handleEdit = (produto) => {
    setEditing(produto);
    setForm(produto);
    setOpen(true);
  };

  return (
    <div>
      <h1>Produtos</h1>
      <Button onClick={() => { setEditing(null); setOpen(true); }}>
        + Novo Produto
      </Button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Novo'} Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Preço"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
            />
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabela */}
      <table className="mt-4">
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>
                <Button size="sm" onClick={() => handleEdit(p)}>Editar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. Exemplo: Usar Listeners em Tempo Real

### Arquivo: `src/pages/Dashboard.jsx`

```jsx
import { useEffect, useState } from 'react';
import { produtoService } from '@/services/produtoService';

export default function Dashboard() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    // Listener em tempo real
    const unsubscribe = produtoService.onProdutosChange((docs) => {
      setProdutos(docs);
    });

    return unsubscribe; // Cleanup
  }, []);

  return (
    <div>
      <h1>Produtos em Tempo Real</h1>
      <p>Total: {produtos.length}</p>
      {/* ... */}
    </div>
  );
}
```

---

## 4. Exemplo: Validar Permissões

### Arquivo: `src/pages/vendas/PedidosVenda.jsx`

```jsx
import { useAuth } from '@/lib/AuthContext';
import { usuariosService } from '@/services/usuariosService';
import { useMutation } from '@tanstack/react-query';

export default function PedidosVenda() {
  const { user } = useAuth();

  // Verificar se pode aprovar
  const { mutate: aprovar } = useMutation({
    mutationFn: async (pedidoId) => {
      // Só vendas/dono podem aprovar
      if (user.role !== 'vendas' && user.role !== 'dono') {
        throw new Error('Sem permissão para aprovar pedidos');
      }

      // Ou verificar permissão customizada
      const temPermissao = await usuariosService.hasPermission(
        user.uid,
        'aprovar_pedidos'
      );
      
      if (!temPermissao) {
        throw new Error('Sem permissão para aprovar pedidos');
      }

      // Aprovar pedido
      return pedidosService.update(pedidoId, { status: 'Aprovado' });
    },
  });

  return (
    <div>
      <h1>Pedidos de Venda</h1>
      {/* ... */}
    </div>
  );
}
```

---

## 5. Exemplo: Busca/Filtro

### Arquivo: `src/pages/estoque/Produtos.jsx`

```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { produtoService } from '@/services/produtoService';
import { Input } from '@/components/ui/input';

export default function Produtos() {
  const [busca, setBusca] = useState('');

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', busca],
    queryFn: async () => {
      if (!busca.trim()) {
        return produtoService.getAll();
      }
      return produtoService.search(busca);
    },
  });

  return (
    <div>
      <Input
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {/* ... */}
    </div>
  );
}
```

---

## 6. Exemplo: Estatísticas/Métricas

### Arquivo: `src/pages/Dashboard.jsx`

```jsx
import { useQuery } from '@tanstack/react-query';
import { clientesService } from '@/services/clientesService';
import { produtoService } from '@/services/produtoService';

export default function Dashboard() {
  const { data: statsClientes = {} } = useQuery({
    queryKey: ['stats-clientes'],
    queryFn: () => clientesService.getStats(),
  });

  const { data: estoqueBaixo = [] } = useQuery({
    queryKey: ['estoque-baixo'],
    queryFn: () => produtoService.getEstoqueBaixo(),
  });

  const { data: valorEstoque = 0 } = useQuery({
    queryKey: ['valor-estoque'],
    queryFn: () => produtoService.getValorTotalEstoque(),
  });

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="grid">
        <Card>
          <h3>Total de Clientes</h3>
          <p className="text-2xl">{statsClientes.total}</p>
        </Card>
        
        <Card>
          <h3>Clientes Ativos</h3>
          <p className="text-2xl">{statsClientes.ativos}</p>
        </Card>
        
        <Card>
          <h3>Crédito Total Disponível</h3>
          <p className="text-2xl">
            R$ {statsClientes.creditoTotal?.toLocaleString('pt-BR')}
          </p>
        </Card>
        
        <Card>
          <h3>Valor do Estoque</h3>
          <p className="text-2xl">
            R$ {valorEstoque?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {estoqueBaixo.length > 0 && (
        <Card className="mt-4 border-amber-500">
          <h3>⚠️ Produtos com Estoque Baixo</h3>
          {estoqueBaixo.map((p) => (
            <p key={p.id}>{p.nome}: {p.estoque} un</p>
          ))}
        </Card>
      )}
    </div>
  );
}
```

---

## 7. Exemplo: Operações em Batch

### Arquivo: `src/pages/estoque/Inventario.jsx`

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { firestoreRepository } from '@/services/firestoreRepository';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function Inventario() {
  const queryClient = useQueryClient();

  const { mutate: ajustarEstoque } = useMutation({
    mutationFn: async (ajustes) => {
      // ajustes = [{ id: '1', novaQtd: 100 }, ...]
      const operations = ajustes.map((ajuste) => ({
        collection: 'produtos',
        id: ajuste.id,
        type: 'update',
        data: { estoque: ajuste.novaQtd },
      }));

      await firestoreRepository.batch(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Estoque ajustado');
    },
  });

  const handleSaveInventario = () => {
    const ajustes = [
      { id: '1', novaQtd: 150 },
      { id: '2', novaQtd: 200 },
      { id: '3', novaQtd: 3000 },
    ];
    ajustarEstoque(ajustes);
  };

  return (
    <div>
      <h1>Inventário</h1>
      <Button onClick={handleSaveInventario}>Salvar Ajustes</Button>
    </div>
  );
}
```

---

## 8. Exemplo: Tratamento de Erros

### Arquivo: `src/pages/estoque/Produtos.jsx`

```jsx
import { useQuery } from '@tanstack/react-query';
import { produtoService } from '@/services/produtoService';
import { AlertCircle } from 'lucide-react';

export default function Produtos() {
  const { data: produtos = [], isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => produtoService.getAll(),
    retry: 3, // Tentar 3 vezes
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });

  if (isLoading) return <div>Carregando...</div>;

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-100 border border-red-400 rounded">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p>Erro ao carregar produtos</p>
          <p className="text-sm text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Produtos ({produtos.length})</h1>
      {/* ... */}
    </div>
  );
}
```

---

## 📋 Padrão Geral para QUALQUER Serviço

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seuService } from '@/services/seuService';
import toast from 'react-hot-toast';

export default function SuaPagina() {
  const queryClient = useQueryClient();

  // READ
  const { data, isLoading, error } = useQuery({
    queryKey: ['chave-unica'],
    queryFn: () => seuService.getAll(),
  });

  // CREATE
  const { mutate: criar } = useMutation({
    mutationFn: (dados) => seuService.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chave-unica'] });
      toast.success('Criado com sucesso');
    },
  });

  // UPDATE
  const { mutate: editar } = useMutation({
    mutationFn: ({ id, dados }) => seuService.update(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chave-unica'] });
      toast.success('Atualizado com sucesso');
    },
  });

  // DELETE
  const { mutate: deletar } = useMutation({
    mutationFn: (id) => seuService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chave-unica'] });
      toast.success('Deletado com sucesso');
    },
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return <div>{/* Seu componente aqui */}</div>;
}
```

---

## 🎯 Próximos Passos

1. **Copie um desses exemplos** para sua página
2. **Adapte o nome do serviço** (produtoService → seuService)
3. **Teste localmente** antes de fazer deploy
4. **Verifique o console** do navegador para erros
5. **Verifique Firestore Console** para ver dados sendo salvos

---

**Dica**: Use TypeScript para maior segurança de tipos!
