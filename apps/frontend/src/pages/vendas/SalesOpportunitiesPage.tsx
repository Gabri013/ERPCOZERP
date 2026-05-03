// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createOpportunity, listOpportunities, listSalesCustomers } from '@/services/salesApi';
import { PodeRender } from '@/lib/PermissaoContext';
import { useState } from 'react';

export default function SalesOpportunitiesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');

  const customers = useQuery({
    queryKey: ['sales-customers'],
    queryFn: listSalesCustomers,
  });

  const list = useQuery({
    queryKey: ['sales-opportunities'],
    queryFn: listOpportunities,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createOpportunity({
        customerId,
        title: title.trim(),
        status: 'LEAD',
      }),
    onSuccess: (data) => {
      toast({ title: 'Oportunidade criada' });
      setOpen(false);
      setTitle('');
      setCustomerId('');
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
      navigate(`/vendas/oportunidades/${data.id}`);
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const columns = [
    { key: 'number', label: 'Nº', width: 120 },
    { key: 'title', label: 'Título' },
    {
      key: 'customer',
      label: 'Cliente',
      render: (_: unknown, row: any) => row.customer?.name ?? '—',
    },
    { key: 'status', label: 'Status', width: 120 },
    {
      key: 'quotes',
      label: 'Propostas',
      width: 90,
      render: (_: unknown, row: any) => (row.quotes?.length ?? 0),
    },
    {
      key: 'id',
      label: '',
      sortable: false,
      width: 100,
      render: (_: unknown, row: any) => (
        <Button type="button" size="sm" variant="outline" asChild>
          <Link to={`/vendas/oportunidades/${row.id}`}>Abrir</Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Oportunidades (comercial)"
        subtitle="Funil pré-venda e vínculo com propostas versionadas"
        breadcrumbs={['Início', 'Vendas', 'Oportunidades']}
        actions={
          <PodeRender acao="editar_pedidos">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button">Nova oportunidade</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova oportunidade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="opp-title">Título</Label>
                    <Input
                      id="opp-title"
                      value={title}
                      onChange={(e: any) => setTitle(e.target.value)}
                      placeholder="Ex.: Projeto expansão linha 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opp-cliente">Cliente</Label>
                    <select
                      id="opp-cliente"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {(customers.data ?? []).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    disabled={!title.trim() || !customerId || createMut.isPending}
                    onClick={() => createMut.mutate()}
                  >
                    {createMut.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PodeRender>
        }
      />

      {list.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={list.data ?? []} loading={false} />
      )}
    </div>
  );
}
