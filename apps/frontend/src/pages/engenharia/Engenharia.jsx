import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import EngenhariaViewer3D from '@/components/engenharia/EngenhariaViewer3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/services/api';
import { cozincaApi } from '@/services/cozincaApi';
import { usePermissao } from '@/lib/PermissaoContext';
import { useToast } from '@/components/ui/use-toast';

/** Peso chapa inox (kg), mesma fórmula do backend: vol m³ × 7850 */
function pesoLocalKg(xMm, yMm, eMm) {
  const volM3 = (Number(xMm) * Number(yMm) * Number(eMm)) / 1e9;
  return Number((volM3 * 7850).toFixed(4));
}

export default function Engenharia() {
  const { toast } = useToast();
  const { pode } = usePermissao();
  const podeBom = pode('editar_produtos');
  const podePesoApi = pode('ver_estoque');
  const pode3d = pode('ver_roteiros');

  const [produtos, setProdutos] = useState([]);
  const [codigoAlvo, setCodigoAlvo] = useState('');
  const [csvText, setCsvText] = useState('');
  const [criarInsumos, setCriarInsumos] = useState(true);
  const [bomLoading, setBomLoading] = useState(false);

  const [xMm, setXMm] = useState('1000');
  const [yMm, setYMm] = useState('2000');
  const [eMm, setEMm] = useState('3');
  const [pesoServidor, setPesoServidor] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/estoque');
        const list = Array.isArray(res?.data) ? res.data : [];
        setProdutos(list);
        if (list[0]?.codigo) setCodigoAlvo(String(list[0].codigo));
      } catch {
        setProdutos([]);
      }
    })();
  }, []);

  const pesoLocal = useMemo(
    () => pesoLocalKg(xMm, yMm, eMm),
    [xMm, yMm, eMm],
  );

  const handlePesoApi = async () => {
    if (!podePesoApi) return;
    try {
      const d = await cozincaApi.pesoChapaInox(xMm, yMm, eMm);
      setPesoServidor(d?.pesoKg ?? null);
      toast({ title: 'Peso no servidor', description: `${d?.pesoKg ?? '—'} kg` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Falha ao calcular', description: e?.response?.data?.error || e?.message || 'Erro' });
    }
  };

  const handleImportBom = async () => {
    if (!podeBom || !csvText.trim() || !codigoAlvo) {
      toast({ variant: 'destructive', title: 'BOM', description: 'Informe o texto e o produto alvo' });
      return;
    }
    setBomLoading(true);
    try {
      await cozincaApi.importarBomCsv({
        csvText,
        produtoCodigo: codigoAlvo,
        criarInsumosFaltantes: criarInsumos,
      });
      toast({ title: 'BOM importada', description: 'Produto atualizado com sucesso.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Importação', description: e?.response?.data?.error || e?.message || 'Falha' });
    } finally {
      setBomLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader title="Engenharia" subtitle="Peso de chapa, importação de BOM e visualização 3D" />

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Peso de chapa inox (aprox.)</h2>
        <p className="text-xs text-muted-foreground">
          Fórmula: (X×Y×espessura / 10⁹) m³ × 7850 kg/m³ — dimensões em mm.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="xmm">Largura X (mm)</Label>
            <Input id="xmm" value={xMm} onChange={(e) => setXMm(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="ymm">Comprimento Y (mm)</Label>
            <Input id="ymm" value={yMm} onChange={(e) => setYMm(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="emm">Espessura (mm)</Label>
            <Input id="emm" value={eMm} onChange={(e) => setEMm(e.target.value)} inputMode="decimal" />
          </div>
        </div>
        <p className="text-sm">
          Peso local: <strong>{pesoLocal} kg</strong>
          {pesoServidor != null && podePesoApi && (
            <span className="text-muted-foreground"> · Servidor: {pesoServidor} kg</span>
          )}
        </p>
        {podePesoApi && (
          <Button type="button" variant="secondary" size="sm" onClick={handlePesoApi}>
            Validar no servidor
          </Button>
        )}
      </section>

      {podeBom && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Importação de BOM (CSV/TSV)</h2>
          <p className="text-xs text-muted-foreground">
            Uma linha por item: <code className="bg-muted px-1 rounded">codigo;qtd;perda_opcional</code>. Linhas iniciando com # ou ; são ignoradas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cod-alvo">Produto alvo (código)</Label>
              <select
                id="cod-alvo"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={codigoAlvo}
                onChange={(e) => setCodigoAlvo(e.target.value)}
              >
                {produtos.map((p) => (
                  <option key={p.id || p.codigo} value={p.codigo}>
                    {p.codigo} — {p.descricao || '—'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox id="criar" checked={criarInsumos} onCheckedChange={(v) => setCriarInsumos(Boolean(v))} />
                <Label htmlFor="criar" className="text-sm font-normal cursor-pointer">
                  Criar matéria-prima faltante
                </Label>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="bom-text">Conteúdo</Label>
            <Textarea
              id="bom-text"
              className="font-mono text-xs min-h-[140px]"
              placeholder={'MP001;2;5\nMP002;1\n# comentário'}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleImportBom} disabled={bomLoading}>
            {bomLoading ? 'Importando…' : 'Aplicar BOM ao produto'}
          </Button>
        </section>
      )}

      {pode3d && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Visualizador 3D</h2>
          <EngenhariaViewer3D />
        </section>
      )}

      {!podeBom && !pode3d && podePesoApi && (
        <p className="text-sm text-muted-foreground">Você pode usar apenas o cálculo de peso com validação no servidor.</p>
      )}
    </div>
  );
}
