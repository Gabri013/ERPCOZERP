import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { productsApi } from '@/services/productsApi';
import Model3DViewer from '@/components/products/Model3DViewer';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileUp, Loader2 } from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';

export default function ProdutoDetalhe() {
  const { id: recordId } = useParams();
  const { toast } = useToast();
  const { pode } = usePermissao();
  const canEdit = pode('editar_produtos');

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState(null);
  const [bomLines, setBomLines] = useState([]);
  const [files, setFiles] = useState([]);
  const [bomText, setBomText] = useState('');
  const [preview, setPreview] = useState(null);
  const [bomStatus, setBomStatus] = useState('EMPTY');
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/estoque/${recordId}`);
      const p = res?.data;
      setProduto(p);
      setBomStatus(p?.bom_status || 'EMPTY');
      const [lines, fl] = await Promise.all([
        productsApi.listBomLines(recordId).catch(() => []),
        productsApi.listFiles(recordId).catch(() => []),
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

  const handlePreviewBom = async () => {
    if (!bomText.trim()) {
      toast({ variant: 'destructive', title: 'Cole a planilha exportada do SolidWorks' });
      return;
    }
    try {
      const data = await productsApi.importBom(recordId, { csvText: bomText, dryRun: true });
      setPreview(data);
      toast({ title: 'Pré-visualização', description: `${data.rowCount || 0} linhas analisadas` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Prévia', description: e?.message || 'Erro' });
    }
  };

  const handleImportBom = async () => {
    if (!canEdit) return;
    try {
      await productsApi.importBom(recordId, { csvText: bomText, dryRun: false });
      toast({ title: 'BOM importada', description: 'Status atualizado para COMPLETE.' });
      setPreview(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Importação', description: e?.message || 'Erro' });
    }
  };

  const handleStatus = async (v) => {
    if (!canEdit) return;
    setSavingStatus(true);
    try {
      await productsApi.putBomStatus(recordId, v);
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
        <Select value={bomStatus} onValueChange={handleStatus} disabled={!canEdit || savingStatus}>
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
          <p className="text-xs text-muted-foreground">
            Cole exportação CSV/TSV do SolidWorks (código, descrição, material, X, Y, quantidade). Espessura é inferida do campo Material (ex.: #430-0,8-…).
          </p>
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            placeholder="CÓDIGO;DESCRIÇÃO;MATERIAL;X;Y;QTD"
            value={bomText}
            onChange={(e) => setBomText(e.target.value)}
            disabled={!canEdit}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handlePreviewBom} disabled={!canEdit}>
              Pré-visualizar (peso / novos códigos)
            </Button>
            <Button type="button" onClick={handleImportBom} disabled={!canEdit}>
              Importar e gravar
            </Button>
          </div>

          {preview?.preview && (
            <div className="overflow-x-auto rounded border border-border">
              <table className="min-w-[600px] w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-right">Peso kg</th>
                    <th className="p-2 text-right">e mm</th>
                    <th className="p-2 text-center">Novo?</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="p-2">{row.line}</td>
                      <td className="p-2 font-mono">{row.codigo}</td>
                      <td className="p-2 text-right">{row.weight_kg}</td>
                      <td className="p-2 text-right">{row.thickness_mm ?? '—'}</td>
                      <td className="p-2 text-center">{row.auto_create ? 'Sim' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.preview.length > 50 && (
                <p className="p-2 text-xs text-muted-foreground">Mostrando 50 de {preview.preview.length} linhas.</p>
              )}
            </div>
          )}

          <div className="overflow-x-auto rounded border border-border">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 text-left">Código</th>
                  <th className="p-2 text-right">Qtd</th>
                  <th className="p-2 text-right">Peso kg</th>
                  <th className="p-2 text-right">X/Y mm</th>
                </tr>
              </thead>
              <tbody>
                {bomLines.map((l) => (
                  <tr key={l.id} className="border-b border-border/50">
                    <td className="p-2 font-mono">{l.componentCode}</td>
                    <td className="p-2 text-right">{l.quantity}</td>
                    <td className="p-2 text-right">{l.weightKg ?? '—'}</td>
                    <td className="p-2 text-right text-xs">
                      {l.xMm ?? '—'} × {l.yMm ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!bomLines.length && <p className="p-4 text-sm text-muted-foreground">Nenhuma linha persistida — importe a BOM.</p>}
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
                disabled={!canEdit}
                onChange={async (e) => {
                  const fl = e.target.files;
                  if (!fl?.length) return;
                  try {
                    await productsApi.uploadFiles(recordId, fl);
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

        <TabsContent value="m3d" className="mt-4 space-y-4">
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
                    await productsApi.uploadModel3d(recordId, f);
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
          <Model3DViewer modelUrl={productsApi.model3dUrl(recordId)} title={codigo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
