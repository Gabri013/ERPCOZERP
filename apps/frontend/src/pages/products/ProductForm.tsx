// @ts-nocheck
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import {
  createStockProduct,
  getStockProduct,
  updateStockProduct,
  type StockProduct,
} from '@/services/stockApi';
import { toast } from 'sonner';

const schema = z.object({
  code: z.string().max(120).optional(),
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  unit: z.string().optional(),
  productType: z.string().optional(),
  group: z.string().optional(),
  costPrice: z.coerce.number().optional().nullable(),
  salePrice: z.coerce.number().optional().nullable(),
  minStock: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().optional().nullable(),
  status: z.string().optional(),
  techSheet: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === 'novo';

  const q = useQuery({
    queryKey: ['stock-product', id],
    queryFn: () => getStockProduct(id as string),
    enabled: Boolean(id) && !isNew,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'UN',
      status: 'Ativo',
      minStock: 0,
    },
  });

  useEffect(() => {
    if (q.data) {
      const p = q.data as StockProduct;
      form.reset({
        code: p.code,
        name: p.name,
        description: p.description ?? '',
        unit: p.unit,
        productType: p.productType ?? '',
        group: p.group ?? '',
        costPrice: p.costPrice ?? undefined,
        salePrice: p.salePrice ?? undefined,
        minStock: p.minStock,
        reorderPoint: p.reorderPoint ?? undefined,
        status: p.status,
        techSheet: p.techSheet ?? '',
      });
    }
  }, [q.data, form]);

  const saveMut = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload = {
        ...vals,
        description: vals.description || null,
        productType: vals.productType || null,
        group: vals.group || null,
        reorderPoint: vals.reorderPoint ?? null,
        techSheet: vals.techSheet || null,
      };
      if (isNew) return createStockProduct(payload);
      return updateStockProduct(id as string, payload);
    },
    onSuccess: (data) => {
      toast.success(isNew ? 'Produto criado' : 'Produto atualizado');
      qc.invalidateQueries({ queryKey: ['stock-products'] });
      if (isNew && data && typeof data === 'object' && data !== null && 'id' in data) {
        navigate(`/estoque/produtos/${(data as StockProduct).id}`, { replace: true });
      }
    },
    onError: (e: Error) => toast.error(e.message || 'Falha ao salvar'),
  });

  const onSubmit = form.handleSubmit((vals) => saveMut.mutate(vals));

  if (!isNew && q.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        Carregando…
      </div>
    );
  }

  if (!isNew && q.isError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        {(q.error as Error)?.message || 'Produto não encontrado'}
      </div>
    );
  }

  const product = q.data as StockProduct | undefined;

  return (
    <div>
      <PageHeader
        title={isNew ? 'Novo produto' : product?.name || 'Produto'}
        breadcrumbs={['Início', 'Estoque', 'Produtos', isNew ? 'Novo' : product?.code || '']}
        actions={(
          <Button variant="outline" size="sm" asChild>
            <Link to="/estoque/produtos">
              <ArrowLeft size={14} />
              Voltar
            </Link>
          </Button>
        )}
      />

      <Tabs defaultValue="dados" className="mt-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="bom">BOM / industrial</TabsTrigger>
          <TabsTrigger value="ficha">Ficha técnica</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <form onSubmit={onSubmit} className="max-w-2xl space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Código (vazio = gerar PROD-…)</span>
                <input
                  {...form.register('code')}
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs space-y-1 sm:col-span-2">
                <span className="text-muted-foreground">Nome *</span>
                <input
                  {...form.register('name')}
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                />
                {form.formState.errors.name && (
                  <span className="text-destructive">{form.formState.errors.name.message}</span>
                )}
              </label>
              <label className="text-xs space-y-1 sm:col-span-2">
                <span className="text-muted-foreground">Descrição</span>
                <textarea
                  {...form.register('description')}
                  rows={2}
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Unidade</span>
                <input {...form.register('unit')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Tipo</span>
                <input {...form.register('productType')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Grupo</span>
                <input {...form.register('group')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Status</span>
                <select {...form.register('status')} className="w-full rounded border border-input px-2 py-1.5 text-sm">
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Custo</span>
                <input type="number" step="0.01" {...form.register('costPrice')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Venda</span>
                <input type="number" step="0.01" {...form.register('salePrice')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Estoque mínimo</span>
                <input type="number" step="0.01" {...form.register('minStock')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-muted-foreground">Ponto de pedido</span>
                <input type="number" step="0.01" {...form.register('reorderPoint')} className="w-full rounded border border-input px-2 py-1.5 text-sm" />
              </label>
            </div>

            {!isNew && product && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                <div className="font-medium text-foreground">Saldo consolidado: {product.totalQty}</div>
                <ul className="mt-1 space-y-0.5 text-muted-foreground">
                  {product.locations.map((l) => (
                    <li key={l.locationId}>
                      {l.locationCode} — {l.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending && <Loader2 className="animate-spin" size={14} />}
                Salvar
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="bom" className="mt-4 space-y-3 text-sm max-w-2xl">
          <p className="text-muted-foreground">
            A lista de materiais (BOM), arquivos técnicos e modelo 3D permanecem no cadastro industrial (entidade
            legada), quando o produto estiver vinculado.
          </p>
          {product?.entityRecordId ? (
            <Button asChild variant="secondary">
              <Link to={`/estoque/produtos/bom/${product.entityRecordId}`}>Abrir BOM / SolidWorks / 3D</Link>
            </Button>
          ) : (
            <p className="text-amber-700 dark:text-amber-400">
              Nenhum vínculo com cadastro industrial. Informe o ID do registro legado no backend ou associe após
              migração.
            </p>
          )}
        </TabsContent>

        <TabsContent value="ficha" className="mt-4 max-w-2xl">
          <label className="text-xs space-y-1 block">
            <span className="text-muted-foreground">Conteúdo da ficha técnica</span>
            <textarea
              {...form.register('techSheet')}
              rows={12}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={onSubmit} disabled={saveMut.isPending}>
              Salvar ficha
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
