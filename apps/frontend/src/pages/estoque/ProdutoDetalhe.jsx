import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recordsServiceApi } from '@/services/recordsServiceApi';
import { productsApi } from '@/services/productsApi';
import { stockApi } from '@/services/stockApi';
import Model3DViewer from '@/components/products/Model3DViewer';
import ImportBomModal from '@/components/engenharia/ImportBomModal';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileUp, Loader2, Upload, Trash2 } from 'lucide-react';
import { usePermissions } from '@/lib/PermissaoContext';

export default function ProdutoDetalhe() {
  const { id: recordId } = useParams();
  const { toast } = useToast();
  const { pode } = usePermissions();
  const canEdit = pode('editar_produtos') || pode('produto.update');

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState(null);
  const [bomLines, setBomLines] = useState([]);
  const [files, setFiles] = useState([]);
  const [bomStatus, setBomStatus] = useState('EMPTY');
  const [savingStatus, setSavingStatus] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  /** ID do EntityRecord usado por `/api/products/...` (BOM, arquivos, 3D). */
  const [bomApiId, setBomApiId] = useState(null);

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      let mapped = null;
      try {
        mapped = await stockApi.getProduct(recordId);
      } catch {
        mapped = null;
      }

      let bomRecordId = recordId;
      let displayProduto = null;

      if (mapped?.id) {
        displayProduto = mapped;
        bomRecordId = mapped.entityRecordId || null;
      } else {
        const p = await recordsServiceApi.get(recordId);
        if (!p) {
          toast({ variant: 'destructive', title: 'Produto não encontrado' });
          setProduto(null);
          return;
        }
        displayProduto = p;
        bomRecordId = recordId;
      }

      setProduto(displayProduto);
      setBomStatus(displayProduto?.bom_status || 'EMPTY');
      setBomApiId(bomRecordId);

      const [lines, fl] = await Promise.all([
        bomRecordId ? productsApi.listBomLines(bomRecordId).catch(() => []) : Promise.resolve([]),
        bomRecordId ? productsApi.listFiles(bomRecordId).catch(() => []) : Promise.resolve([]),
      ]);
      setBomLines(lines || []);
      setFiles(fl || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e?.message || 'Falha ao carregar' });
    } finally {
      setLoading(false);
    }
  }, [recordId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearBom = async () => {
    if (!canEdit || !bomApiId) return;
    if (!window.confirm('Apagar todas as linhas da BOM? Esta ação não pode ser desfeita.')) return;
    try {
      await productsApi.clearBom(bomApiId);
      toast({ title: 'BOM limpa', description: 'Status retornado para EMPTY.' });
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e?.message || 'Falha' });
    }
  };

  const handleStatus = async (v) => {
    if (!canEdit || !bomApiId) return;
    setSavingStatus(true);
    try {
      await productsApi.putBomStatus(bomApiId, v);
      setBomStatus(v);
      setProduto((p) => (p ? { ...p, bom_status: v } : p));
      toast({ title: 'Status BOM', description: v });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e?.message });
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando…
      </div>
    );
  }

  if (!produto) {
    return <p className="p-6">Produto não encontrado.</p>;
  }

  const codigo = produto.codigo || '—';
  const bomIncomplete = bomStatus !== 'COMPLETE';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/estoque/produtos" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <PageHeader
          title={`${codigo}`}
          subtitle={produto.descricao || 'Ficha industrial — BOM, arquivos e modelo 3D'}
        />
      </div>

      {bomIncomplete && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          <strong>BOM pendente de engenharia.</strong> Este produto não poderá ser usado em reserva de estoque ou geração de OP até a BOM estar{' '}
          <strong>COMPLETE</strong> (importação SolidWorks concluída).
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm">Status engenharia (BOM)</Label>
        <Select value={bomStatus} onValueChange={handleStatus} disabled={!canEdit || savingStatus || !bomApiId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMPTY">EMPTY — sem BOM</SelectItem>
            <SelectItem value="PENDING_ENGINEERING">PENDING — em elaboração</SelectItem>
            <SelectItem value="COMPLETE">COMPLETE — aprovada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto flex-wrap gap-1">
          <TabsTrigger value="geral">Dados</TabsTrigger>
          <TabsTrigger value="bom">Lista de materiais</TabsTrigger>
          <TabsTrigger value="files">Arquivos técnicos</TabsTrigger>
          <TabsTrigger value="m3d">Modelo 3D</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-4 space-y-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-border p-4">
            <div><span className="text-muted-foreground">Tipo</span><div>{produto.tipo || '—'}</div></div>
            <div><span className="text-muted-foreground">Unidade</span><div>{produto.unidade || '—'}</div></div>
            <div><span className="text-muted-foreground">Estoque</span><div>{produto.estoque_atual ?? '—'}</div></div>
            <div><span className="text-muted-foreground">Status cadastro</span><div>{produto.status || '—'}</div></div>
          </div>
        </TabsContent>

        <TabsContent value="bom" className="mt-4 space-y-4">
          {!bomApiId && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
              Este produto está só no catálogo (Prisma). Para importar BOM SolidWorks e anexos técnicos,
              é necessário um vínculo com registro de entidade de engenharia
              (<span className="font-mono">entityRecordId</span>).
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Lista de Materiais (BOM)</p>
              <p className="text-xs text-muted-foreground">
                {bomLines.length} {bomLines.length === 1 ? 'componente' : 'componentes'} cadastrados
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && bomApiId && bomLines.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearBom}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 size={13} /> Limpar BOM
                </Button>
              )}
              {canEdit && bomApiId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  className="gap-1.5"
                >
                  <Upload size={13} /> Importar BOM (SolidWorks)
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-border">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 text-left w-8">#</th>
                  <th className="p-2 text-left">Código</th>
                  <th className="p-2 text-left">Descrição</th>
                  <th className="p-2 text-left">Material</th>
                  <th className="p-2 text-left">Processo</th>
                  <th className="p-2 text-right">Qtd</th>
                  <th className="p-2 text-right">Peso kg</th>
                  <th className="p-2 text-right">X × Y</th>
                </tr>
              </thead>
              <tbody>
                {bomLines.map((l, i) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="p-2 font-mono text-xs font-medium">{l.componentCode}</td>
                    <td className="p-2 text-xs text-muted-foreground max-w-[160px] truncate">
                      {l.description || '—'}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground max-w-[120px] truncate">
                      {l.materialSpec || '—'}
                    </td>
                    <td className="p-2 text-xs">
                      {l.process ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          l.process === 'ALMOXARIFADO' ? 'bg-blue-100 text-blue-700' :
                          l.process === 'LASER' ? 'bg-orange-100 text-orange-700' :
                          l.process === 'DOBRA' ? 'bg-purple-100 text-purple-700' :
                          l.process === 'SOLDA' ? 'bg-red-100 text-red-700' :
                          l.process === 'MONTAGEM' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {l.process}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-2 text-right font-medium">{Number(l.quantity)}</td>
                    <td className="p-2 text-right text-xs text-muted-foreground">
                      {l.weightKg ? Number(l.weightKg).toFixed(3) : '—'}
                    </td>
                    <td className="p-2 text-right text-xs text-muted-foreground">
                      {l.xMm != null ? `${l.xMm} × ${l.yMm ?? '?'}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!bomLines.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>Nenhuma linha na BOM.</p>
                {canEdit && bomApiId && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setShowImportModal(true)}
                  >
                    <Upload size={13} /> Importar BOM do SolidWorks
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Label className="flex items-center gap-2 cursor-pointer">
              <FileUp className="h-4 w-4" />
              <span>Upload DXF / PDF</span>
              <input
                type="file"
                multiple
                accept=".dxf,.pdf,.DXF,.PDF"
                className="hidden"
                disabled={!canEdit || !bomApiId}
                onChange={async (e) => {
                  const fl = e.target.files;
                  if (!fl?.length) return;
                  try {
                    if (!bomApiId) return;
                    await productsApi.uploadFiles(bomApiId, fl);
                    toast({ title: 'Arquivos enviados' });
                    load();
                  } catch (err) {
                    toast({ variant: 'destructive', title: 'Upload', description: err?.message });
                  }
                  e.target.value = '';
                }}
              />
            </Label>
          </div>
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm">
                <span className="font-mono text-xs">{f.tipo}</span>
                <span className="truncate flex-1">{f.nomeOriginal}</span>
                <button
                  type="button"
                  className="text-primary text-xs underline"
                  onClick={() => productsApi.openFileInNewTab(f.id).catch((e) => toast({ variant: 'destructive', title: e?.message }))}
                >
                  Abrir / baixar
                </button>
              </li>
            ))}
          </ul>
          {!files.length && <p className="text-sm text-muted-foreground">Nenhum arquivo técnico.</p>}
        </TabsContent>

        <TabsContent value="m3d" className="mt-4 space-y-4" key="m3d">
          <div className="flex flex-wrap gap-2">
            <Label className="flex items-center gap-2 cursor-pointer">
              <FileUp className="h-4 w-4" />
              Enviar STL / glTF / glB / OBJ
              <input
                type="file"
                accept=".stl,.gltf,.glb,.obj"
                className="hidden"
                disabled={!canEdit}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    if (!bomApiId) return;
                    await productsApi.uploadModel3d(bomApiId, f);
                    toast({ title: 'Modelo 3D salvo' });
                    load();
                  } catch (err) {
                    toast({ variant: 'destructive', title: 'Upload 3D', description: err?.message });
                  }
                  e.target.value = '';
                }}
              />
            </Label>
          </div>
          <Model3DViewer modelUrl={bomApiId ? productsApi.model3dUrl(bomApiId) : ''} title={codigo} />
        </TabsContent>
      </Tabs>

      {showImportModal && bomApiId && (
        <ImportBomModal
          productRecordId={bomApiId}
          productName={produto?.descricao || produto?.codigo || ''}
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            setShowImportModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
