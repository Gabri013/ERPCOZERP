// @ts-nocheck — shadcn/jsx UI without full TS props
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import {
  addSalesActivity,
  convertQuote,
  createQuoteRevision,
  getQuote,
  patchQuote,
} from '@/services/salesApi';
import { PodeRender } from '@/lib/PermissaoContext';
import { useState } from 'react';

function money(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function QuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');

  const q = useQuery({
    queryKey: ['sales-quote', id],
    queryFn: () => getQuote(id!),
    enabled: !!id,
  });

  const patchTech = useMutation({
    mutationFn: (technicalReview: string) => patchQuote(id!, { technicalReview }),
    onSuccess: () => {
      toast({ title: 'Validação técnica atualizada' });
      qc.invalidateQueries({ queryKey: ['sales-quote', id] });
      qc.invalidateQueries({ queryKey: ['sales-quotes'] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const rev = useMutation({
    mutationFn: () => createQuoteRevision(id!),
    onSuccess: (data) => {
      toast({ title: 'Nova versão da proposta criada' });
      qc.invalidateQueries({ queryKey: ['sales-quotes'] });
      navigate(`/vendas/propostas/${data.id}`, { replace: true });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const conv = useMutation({
    mutationFn: () => convertQuote(id!),
    onSuccess: (so) => {
      toast({
        title: 'Convertido em pedido de venda',
        description: `Pedido ${so.number}`,
      });
      qc.invalidateQueries({ queryKey: ['sales-quote', id] });
      qc.invalidateQueries({ queryKey: ['sales-quotes'] });
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const noteMut = useMutation({
    mutationFn: (body: string) => addSalesActivity({ quoteId: id!, type: 'NOTE', body }),
    onSuccess: () => {
      toast({ title: 'Atividade registrada' });
      setNoteText('');
      qc.invalidateQueries({ queryKey: ['sales-quote', id] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const row = q.data;
  const locked = !!(row?.lockedAt || row?.status === 'CONVERTIDO');

  const itemCols = [
    { key: 'product', label: 'Produto', render: (_: unknown, it: any) => it.product?.name ?? '—' },
    {
      key: 'quantity',
      label: 'Qtd',
      width: 80,
      render: (v: unknown) => (typeof v === 'object' && v && 'toString' in v ? String(v) : String(v ?? '')),
    },
    {
      key: 'unitPrice',
      label: 'Preço unit.',
      width: 110,
      render: (v: unknown) => money(v),
    },
  ];

  return (
    <div>
      <PageHeader
        title={row ? `${row.number} · V${row.versionNumber ?? 1}` : 'Proposta'}
        subtitle={
          row?.opportunity
            ? (
              <span>
                Oportunidade{' '}
                <Link className="text-primary underline" to={`/vendas/oportunidades/${row.opportunity.id}`}>
                  {row.opportunity.number}
                </Link>
                {' — '}
                {row.opportunity.title}
              </span>
            )
            : ''
        }
        breadcrumbs={['Início', 'Vendas', 'Propostas', row?.number ?? '…']}
        actions={
          <Button type="button" variant="outline" asChild>
            <Link to="/vendas/propostas">Voltar à lista</Link>
          </Button>
        }
      />

      {q.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : q.isError || !row ? (
        <p className="text-destructive py-8">Proposta não encontrada.</p>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {locked ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Esta versão está bloqueada (convertida ou travada). Edição e nova revisão não estão disponíveis.
              {row.saleOrder ? (
                <span className="ml-2">
                  Pedido:{' '}
                  <Link className="underline font-medium" to="/vendas/pedidos">
                    {row.saleOrder.number}
                  </Link>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Cliente</div>
              <div className="font-medium">{row.customer?.name ?? '—'}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="font-medium">{money(row.totalAmount)}</div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-medium text-sm">Validação técnica</div>
            <Select
              value={row.technicalReview ?? 'NOT_REQUIRED'}
              onValueChange={(v: string) => patchTech.mutate(v)}
              disabled={locked || patchTech.isPending}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_REQUIRED">Não exige</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="APPROVED">Aprovada</SelectItem>
                <SelectItem value="NEEDS_ADJUSTMENT">Ajustes necessários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-2">Itens</h3>
            <DataTable columns={itemCols} data={row.items ?? []} loading={false} />
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-medium text-sm">Linha do tempo</div>
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {(row.activities ?? []).length === 0 ? (
                <li className="text-muted-foreground">Nenhuma atividade ainda.</li>
              ) : (
                (row.activities ?? []).map((a: any) => (
                  <li key={a.id} className="border-b border-border/60 pb-2">
                    <span className="text-muted-foreground text-xs">
                      {new Date(a.createdAt).toLocaleString('pt-BR')} · {a.type}
                      {a.user?.fullName ? ` · ${a.user.fullName}` : ''}
                    </span>
                    <div className="whitespace-pre-wrap mt-1">{a.body}</div>
                  </li>
                ))
              )}
            </ul>
            {!locked ? (
              <div className="flex flex-col gap-2 pt-2">
                <Textarea
                  placeholder="Nova nota ou registro de contato…"
                  value={noteText}
                  onChange={(e: any) => setNoteText(e.target.value)}
                  rows={3}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!noteText.trim() || noteMut.isPending}
                  onClick={() => noteMut.mutate(noteText.trim())}
                >
                  Registrar atividade
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <PodeRender acao="editar_pedidos">
              {!locked ? (
                <>
                  <Button type="button" variant="secondary" disabled={rev.isPending} onClick={() => rev.mutate()}>
                    Nova revisão (V{(row.versionNumber ?? 1) + 1})
                  </Button>
                  <Button type="button" disabled={conv.isPending} onClick={() => conv.mutate()}>
                    Converter em pedido
                  </Button>
                </>
              ) : null}
            </PodeRender>
          </div>
        </div>
      )}
    </div>
  );
}
