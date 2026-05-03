// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
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
import { addSalesActivity, getOpportunity, patchOpportunity } from '@/services/salesApi';
import { PodeRender } from '@/lib/PermissaoContext';
import { useState } from 'react';

const STATUS_OPTIONS = [
  'LEAD',
  'QUALIFYING',
  'PROPOSAL',
  'WON',
  'LOST',
  'NURTURE',
  'DISCARDED',
];

function money(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');

  const q = useQuery({
    queryKey: ['sales-opportunity', id],
    queryFn: () => getOpportunity(id!),
    enabled: !!id,
  });

  const patchStatus = useMutation({
    mutationFn: (status: string) => patchOpportunity(id!, { status }),
    onSuccess: () => {
      toast({ title: 'Status atualizado' });
      qc.invalidateQueries({ queryKey: ['sales-opportunity', id] });
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const noteMut = useMutation({
    mutationFn: (body: string) => addSalesActivity({ opportunityId: id!, type: 'NOTE', body }),
    onSuccess: () => {
      toast({ title: 'Registrado' });
      setNoteText('');
      qc.invalidateQueries({ queryKey: ['sales-opportunity', id] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const row = q.data;

  return (
    <div>
      <PageHeader
        title={row ? `${row.number} · ${row.title}` : 'Oportunidade'}
        subtitle={row?.customer?.name ?? ''}
        breadcrumbs={['Início', 'Vendas', 'Oportunidades', row?.number ?? '…']}
        actions={
          <Button type="button" variant="outline" asChild>
            <Link to="/vendas/oportunidades">Voltar</Link>
          </Button>
        }
      />

      {q.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : q.isError || !row ? (
        <p className="text-destructive py-8">Oportunidade não encontrada.</p>
      ) : (
        <div className="space-y-6 max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm text-muted-foreground">Status do funil</div>
              <PodeRender acao="editar_pedidos" fallback={<div className="font-medium">{row.status}</div>}>
                <Select
                  value={row.status}
                  onValueChange={(v: string) => patchStatus.mutate(v)}
                  disabled={patchStatus.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PodeRender>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Responsável</div>
              <div className="font-medium">{row.owner?.fullName ?? row.owner?.email ?? '—'}</div>
            </div>
          </div>

          {(row.scopeNotes || row.deliveryNotes) ? (
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              {row.scopeNotes ? (
                <div>
                  <div className="text-muted-foreground">Escopo</div>
                  <div className="whitespace-pre-wrap">{row.scopeNotes}</div>
                </div>
              ) : null}
              {row.deliveryNotes ? (
                <div>
                  <div className="text-muted-foreground">Entrega / prazo</div>
                  <div className="whitespace-pre-wrap">{row.deliveryNotes}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2">Propostas (ORC)</div>
            {(row.quotes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma proposta vinculada ainda.</p>
            ) : (
              <ul className="divide-y text-sm">
                {(row.quotes ?? []).map((qq: any) => (
                  <li key={qq.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {qq.number} · V{qq.versionNumber ?? 1} · {qq.status}
                    </span>
                    <span className="text-muted-foreground">{money(qq.totalAmount)}</span>
                    <Button type="button" size="sm" variant="link" asChild>
                      <Link to={`/vendas/propostas/${qq.id}`}>Abrir proposta</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-medium text-sm">Atividades</div>
            <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
              {(row.activities ?? []).length === 0 ? (
                <li className="text-muted-foreground">Nenhuma atividade.</li>
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
            <PodeRender acao="editar_pedidos">
              <div className="flex flex-col gap-2 pt-2">
                <Textarea
                  placeholder="Nota comercial, ligação, e-mail…"
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
                  Registrar
                </Button>
              </div>
            </PodeRender>
          </div>
        </div>
      )}
    </div>
  );
}
