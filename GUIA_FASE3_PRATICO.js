#!/usr/bin/env node

/**
 * SCRIPT: Como Começar a Fase 3
 * 
 * Esta é uma versão simplificada de como migrar páginas.
 * Copy-paste em cada página e adaptar os nomes.
 */

// ============================================
// PASSO 1: Imports (Remover antigas, adicionar novas)
// ============================================

// ❌ REMOVER ISTO:
// import { storage } from '@/services/storage';

// ✅ ADICIONAR ISTO:
import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { fornecedoresService } from '@/services/fornecedoresService'; // Trocar para seu serviço

// ============================================
// PASSO 2: Setup no Componente
// ============================================

export default function Fornecedores() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editando, setEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ❌ REMOVER:
  // const [data, setData] = useState(getData());
  // const getData = () => storage.get('fornecedores', MOCK_INICIAL);
  // const reload = () => setData([...getData()]);

  // ============================================
  // PASSO 3: useQuery para Buscar Dados
  // ============================================
  
  const { data: fornecedores = [], isLoading, error } = useQuery({
    queryKey: ['fornecedores'], // Mudar chave para sua entidade
    queryFn: () => fornecedoresService.getAll(), // Trocar serviço
    // Opcional: não refetch automaticamente
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // ============================================
  // PASSO 4: useMutation para Criar/Atualizar
  // ============================================

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: (dados) => {
      if (editando) {
        // Atualizar
        return fornecedoresService.update(editando.id, dados);
      } else {
        // Criar
        return fornecedoresService.create(dados);
      }
    },
    onSuccess: () => {
      // Recarregar dados automaticamente
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      // Limpar form
      setEditando(null);
      setShowModal(false);
      // Opcional: mostrar toast
      // showToast('Salvo com sucesso!', 'success');
    },
    onError: (error) => {
      console.error('Erro:', error);
      // showToast('Erro ao salvar', 'error');
    },
  });

  // ============================================
  // PASSO 5: useMutation para Deletar
  // ============================================

  const { mutate: deletar } = useMutation({
    mutationFn: (id) => fornecedoresService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      // showToast('Deletado com sucesso!', 'success');
    },
    onError: (error) => {
      console.error('Erro ao deletar:', error);
      // showToast('Erro ao deletar', 'error');
    },
  });

  // ============================================
  // PASSO 6: Handlers
  // ============================================

  const handleSave = (form) => {
    salvar(form); // Mutation cuida de tudo
  };

  const handleEdit = (item) => {
    setEditando(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja deletar?')) {
      deletar(id);
    }
  };

  // ============================================
  // PASSO 7: Renderizar
  // ============================================

  return (
    <>
      <PageHeader title="Fornecedores" />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar fornecedor..."
        action={
          <button
            onClick={() => {
              setEditando(null);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={20} /> Novo
          </button>
        }
      />

      {/* Mostrar loading */}
      {isLoading && <div>Carregando...</div>}

      {/* Mostrar erro */}
      {error && <div className="alert alert-error">{error.message}</div>}

      {/* Mostrar dados */}
      {!isLoading && fornecedores.length > 0 ? (
        <DataTable
          columns={[
            { header: 'Nome', accessor: 'nome' },
            { header: 'CNPJ', accessor: 'cnpj' },
            { header: 'Telefone', accessor: 'telefone' },
          ]}
          data={fornecedores.filter(f => {
            const s = search.toLowerCase();
            return !s || f.nome.toLowerCase().includes(s);
          })}
          actions={[
            { label: 'Editar', onClick: handleEdit },
            { label: 'Deletar', onClick: handleDelete },
          ]}
        />
      ) : (
        <div>Nenhum fornecedor encontrado</div>
      )}

      <ModalFornecedor
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initial={editando}
        onSave={handleSave}
        isLoading={isPending}
      />
    </>
  );
}

// ============================================
// RESUMO: 3 Mudanças Principais
// ============================================

/*
1. Remover localStorage, adicionar React Query:
   ❌ const [data, setData] = useState(getData());
   ✅ const { data } = useQuery({ ... });

2. Remover handlers manuais, usar Mutations:
   ❌ const handleSave = () => { getData(); saveData(); };
   ✅ const { mutate: salvar } = useMutation({ ... });

3. Chamar mutate em vez de handler local:
   ❌ handleSave(form);
   ✅ salvar(form); // Mutation cuida de tudo
*/

// ============================================
// DICA: Testar em 30 Segundos
// ============================================

/*
1. npm run dev
2. Abrir página em http://localhost:5173
3. Clicar "Novo" → Criar item
4. Verificar localStorage (DevTools → Application → Local Storage)
5. Recarregar página → Dados persistem ✅
6. Editar item
7. Deletar item
*/

// ============================================
// DICA: Ativar Listener em Tempo Real
// ============================================

/*
import { useEffect } from 'react';

// Opcional: Listener para sync em tempo real
useEffect(() => {
  const unsubscribe = fornecedoresService.onFornecedoresChange((dados) => {
    queryClient.setQueryData(['fornecedores'], dados);
  });
  
  return () => unsubscribe();
}, [queryClient]);
*/

// ============================================
// DICA: Adicionar Otimista Updates
// ============================================

/*
const { mutate: salvar } = useMutation({
  mutationFn: (dados) => 
    editando 
      ? fornecedoresService.update(editando.id, dados)
      : fornecedoresService.create(dados),
  
  // Atualizar UI ANTES da resposta do servidor
  onMutate: async (novosDados) => {
    // Cancelar queries em voo
    await queryClient.cancelQueries({ queryKey: ['fornecedores'] });
    
    // Snapshot dos dados antigos
    const previousData = queryClient.getQueryData(['fornecedores']);
    
    // Atualizar UI otimisticamente
    queryClient.setQueryData(['fornecedores'], (old) => [
      ...old,
      { id: Date.now(), ...novosDados },
    ]);
    
    return { previousData };
  },
  
  onError: (error, newData, context) => {
    // Se erro, reverter para antigos dados
    queryClient.setQueryData(['fornecedores'], context.previousData);
  },
  
  onSuccess: () => {
    // Confirmar dados do servidor
    queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
  },
});
*/

// ============================================
// CHECKLIST: Migrar Uma Página
// ============================================

/*
□ Remover imports de storage
□ Adicionar imports React Query
□ Remover useState para dados
□ Adicionar useQuery
□ Remover handleSave local
□ Adicionar useMutation para create/update
□ Remover handleDelete local
□ Adicionar useMutation para delete
□ Atualizar renderização (isLoading, error)
□ Testar criar (C)
□ Testar ler (R)
□ Testar atualizar (U)
□ Testar deletar (D)
□ Testar offline (F12 → Network → Offline)
□ Testar reload de página (dados persistem?)
□ Commit!
*/

// ============================================
// FAQ
// ============================================

/*
Q: Por que React Query?
A: Cache automático, refetch em background, loading states, 
   deduplica requests

Q: Precisa fazer listener?
A: Não é obrigatório. Funciona bem sem.
   Listener é para sync em tempo real entre abas.

Q: E a validação?
A: Pode adicionar em dois lugares:
   1. Form (Zod, React Hook Form)
   2. Serviço (antes de salvar)

Q: E se der erro no Firestore?
A: Mutation cuida automaticamente. 
   Adicionar handler em onError se precisar.

Q: Precisa de autenticação?
A: Sim! Ler DEPLOY_FIREBASE.md
   Sistema verifica userID em cada request.
*/
