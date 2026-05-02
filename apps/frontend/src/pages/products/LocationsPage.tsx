// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button.jsx';
import { listLocations, createLocation, deleteLocation } from '@/services/stockApi';
import { PodeRender } from '@/lib/PermissaoContext';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

export default function LocationsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['stock-locations'], queryFn: listLocations });
  const [showNew, setShowNew] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const createMut = useMutation({
    mutationFn: () => createLocation({ code, name, active: true }),
    onSuccess: () => {
      toast.success('Endereço criado');
      qc.invalidateQueries({ queryKey: ['stock-locations'] });
      setShowNew(false);
      setCode('');
      setName('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      toast.success('Removido');
      qc.invalidateQueries({ queryKey: ['stock-locations'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data || [];
  const columns = [
    { key: 'code', label: 'Código', width: 100 },
    { key: 'name', label: 'Nome' },
    { key: 'warehouse', label: 'Galpão', width: 120, mobileHidden: true },
    {
      key: 'active',
      label: 'Ativo',
      width: 70,
      render: (v: unknown) => (v ? 'Sim' : 'Não'),
    },
    {
      key: 'id',
      label: '',
      width: 90,
      render: (_: unknown, row: { id: string; code: string }) => (
        <PodeRender acao="editar_produtos">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-destructive"
            onClick={() => {
              if (row.code === 'DEFAULT') {
                toast.error('O endereço padrão não pode ser excluído');
                return;
              }
              if (confirm('Excluir este endereço?')) delMut.mutate(row.id);
            }}
          >
            Excluir
          </Button>
        </PodeRender>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Endereçamento"
        breadcrumbs={['Início', 'Estoque', 'Endereçamento']}
        actions={(
          <PodeRender acao="editar_produtos">
            <Button size="sm" type="button" onClick={() => setShowNew(true)}>
              <Plus size={14} />
              Novo endereço
            </Button>
          </PodeRender>
        )}
      />

      {q.isLoading && (
        <div className="flex justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={18} />
          Carregando…
        </div>
      )}
      {q.isError && (
        <div className="text-sm text-destructive">{(q.error as Error)?.message}</div>
      )}
      {!q.isLoading && !q.isError && <DataTable columns={columns} data={rows} />}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-4 space-y-3 shadow-lg">
            <div className="font-medium text-sm">Novo endereço</div>
            <label className="text-xs block space-y-1">
              Código
              <input
                className="w-full rounded border border-input px-2 py-1.5 text-sm"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label className="text-xs block space-y-1">
              Nome
              <input
                className="w-full rounded border border-input px-2 py-1.5 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!code.trim() || !name.trim() || createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
