/**
 * ImportBomModal — importação de BOM do SolidWorks (ou qualquer planilha industrial)
 *
 * Fluxo:
 *   1. Entrada: colar texto OU fazer upload de CSV/Excel
 *   2. Detecção automática de colunas + mapeamento manual
 *   3. Pré-visualização com peso calculado e indicação de itens novos
 *   4. Confirmar importação → relatório de resultados
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
  AlertTriangle,
} from 'lucide-react';
import { productsApi } from '@/services/productsApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMN_KEYS = [
  { key: 'codigo', label: 'Código', required: true },
  { key: 'descricao', label: 'Descrição' },
  { key: 'material', label: 'Material' },
  { key: 'processo', label: 'Processo' },
  { key: 'x', label: 'X (mm)' },
  { key: 'y', label: 'Y (mm)' },
  { key: 'qtd', label: 'Qtd' },
  { key: 'qtd_total', label: 'Qtd Total' },
];

const PROCESSO_COLORS = {
  ALMOXARIFADO: 'bg-blue-100 text-blue-700',
  LASER: 'bg-orange-100 text-orange-700',
  DOBRA: 'bg-purple-100 text-purple-700',
  SOLDA: 'bg-red-100 text-red-700',
  USINAGEM: 'bg-yellow-100 text-yellow-700',
  PINTURA: 'bg-pink-100 text-pink-700',
  MONTAGEM: 'bg-green-100 text-green-700',
  CORTE: 'bg-orange-50 text-orange-600',
};

const processoBadge = (proc) => {
  const cls = PROCESSO_COLORS[proc] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      {proc || '—'}
    </span>
  );
};

// ─── CSV/Excel parsing helpers ─────────────────────────────────────────────────

/**
 * Dado texto bruto (CSV, TSV, ou colado de Excel), detecta colunas automaticamente
 * e retorna { headers: string[], rows: Record<string, string>[] }
 */
function parseRawText(text) {
  if (!text.trim()) return { headers: [], rows: [] };
  const result = Papa.parse(text.trim(), {
    header: true,
    delimiter: text.includes('\t') ? '\t' : text.includes(';') ? ';' : undefined,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return { headers: result.meta.fields || [], rows: result.data || [] };
}

async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const headers = json.length > 0 ? Object.keys(json[0]) : [];
        resolve({ headers, rows: json });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/** Tenta fazer correspondência automática de cabeçalho → coluna BOM */
function autoMapColumns(headers) {
  const ALIASES = {
    codigo: ['codigo', 'cod', 'code', 'item', 'ref', 'referencia', 'pn', 'part', 'part_number'],
    descricao: ['descricao', 'descri', 'description', 'desc', 'nome', 'name', 'componente'],
    material: ['material', 'mat', 'materia', 'raw_material', 'spec'],
    processo: ['processo', 'process', 'operacao', 'operation', 'proc', 'op', 'setor'],
    x: ['x', 'lx', 'largura', 'width', 'dim_x'],
    y: ['y', 'ly', 'comprimento', 'length', 'profundidade', 'dim_y'],
    qtd: ['qtd', 'qtde', 'qty', 'quantidade', 'quant'],
    qtd_total: ['qtd_total', 'qtde_total', 'qty_total', 'total', 'quantidade_total'],
  };

  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\s]+/g, '_');

  const mapping = {};
  for (const [key, aliases] of Object.entries(ALIASES)) {
    const match = headers.find((h) =>
      aliases.some((a) => normalize(h) === a || normalize(h).includes(a)),
    );
    if (match) mapping[key] = match;
  }
  return mapping;
}

/** Aplica mapeamento de colunas para produzir linhas normalizadas */
function applyMapping(rows, mapping) {
  return rows
    .map((row) => ({
      codigo: String(row[mapping.codigo] ?? '').trim(),
      descricao: String(row[mapping.descricao] ?? '').trim(),
      material: String(row[mapping.material] ?? '').trim(),
      processo: String(row[mapping.processo] ?? '').trim(),
      x: String(row[mapping.x] ?? '').trim(),
      y: String(row[mapping.y] ?? '').trim(),
      qtd: String(row[mapping.qtd] ?? '').trim(),
      qtd_total: String(row[mapping.qtd_total] ?? '').trim(),
    }))
    .filter((r) => r.codigo && r.codigo !== '0');
}

/**
 * Converte linhas normalizadas para o CSV interno que o backend espera
 * (cabeçalho + linhas tab-separadas).
 */
function buildCsvForBackend(mappedRows) {
  const header = 'CODIGO\tDESCRICAO\tMATERIAL\tPROCESSO\tX\tY\tQTD\tQTD_TOTAL';
  const lines = mappedRows.map(
    (r) =>
      `${r.codigo}\t${r.descricao}\t${r.material}\t${r.processo}\t${r.x}\t${r.y}\t${r.qtd}\t${r.qtd_total}`,
  );
  return [header, ...lines].join('\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportBomModal({ productRecordId, productName, onClose, onImported }) {
  const [step, setStep] = useState('input'); // input | mapping | preview | result
  const [inputTab, setInputTab] = useState('paste'); // paste | upload
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({});
  const [mappedRows, setMappedRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  // ── Parse input ─────────────────────────────────────────────────────────────

  const handleParseText = useCallback(() => {
    setError('');
    if (!rawText.trim()) {
      setError('Cole ou carregue a planilha antes de continuar.');
      return;
    }
    const { headers, rows } = parseRawText(rawText);
    if (!headers.length || !rows.length) {
      setError('Nenhuma linha ou cabeçalho detectado. Verifique o formato (CSV, TSV ou Excel colado).');
      return;
    }
    const autoMap = autoMapColumns(headers);
    setParsedData({ headers, rows });
    setMapping(autoMap);
    setStep('mapping');
  }, [rawText]);

  const handleFileUpload = useCallback(async (file) => {
    setError('');
    try {
      let data;
      if (file.name.match(/\.(xlsx|xls|ods)$/i)) {
        data = await parseExcelFile(file);
      } else {
        const text = await file.text();
        data = parseRawText(text);
        setRawText(text);
      }
      if (!data.headers.length || !data.rows.length) {
        setError('Arquivo sem dados. Verifique o formato.');
        return;
      }
      const autoMap = autoMapColumns(data.headers);
      setParsedData(data);
      setMapping(autoMap);
      setStep('mapping');
    } catch (e) {
      setError(`Falha ao ler arquivo: ${e?.message}`);
    }
  }, []);

  // ── Mapping → Preview ────────────────────────────────────────────────────────

  const handlePreview = useCallback(async () => {
    setError('');
    if (!mapping.codigo) {
      setError('Selecione ao menos a coluna de Código.');
      return;
    }
    const rows = applyMapping(parsedData.rows, mapping);
    if (!rows.length) {
      setError('Nenhuma linha com código após aplicar o mapeamento.');
      return;
    }
    setMappedRows(rows);
    const csv = buildCsvForBackend(rows);
    setLoadingPreview(true);
    try {
      const data = await productsApi.importBom(productRecordId, { csvText: csv, dryRun: true });
      setPreview(data);
      setStep('preview');
    } catch (e) {
      setError(`Falha na pré-visualização: ${e?.message}`);
    } finally {
      setLoadingPreview(false);
    }
  }, [mapping, parsedData, productRecordId]);

  // ── Confirm import ───────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    setError('');
    setImporting(true);
    try {
      const csv = buildCsvForBackend(mappedRows);
      const data = await productsApi.importBom(productRecordId, { csvText: csv, dryRun: false });
      setResult(data);
      setStep('result');
      onImported?.();
    } catch (e) {
      setError(`Falha na importação: ${e?.message}`);
    } finally {
      setImporting(false);
    }
  }, [mappedRows, productRecordId, onImported]);

  // ── Drag & drop ───────────────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={20} className="text-primary" />
            <div>
              <h2 className="font-semibold text-sm">Importar BOM — SolidWorks</h2>
              {productName && (
                <p className="text-[11px] text-muted-foreground truncate max-w-[300px]">{productName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StepIndicator step={step} />
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: INPUT ─────────────────────────────────────────────── */}
          {step === 'input' && (
            <Tabs value={inputTab} onValueChange={setInputTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="paste">Colar planilha</TabsTrigger>
                <TabsTrigger value="upload">Upload arquivo</TabsTrigger>
              </TabsList>

              <TabsContent value="paste">
                <p className="text-xs text-muted-foreground mb-2">
                  Copie a planilha do SolidWorks / Excel e cole abaixo (CSV, TSV ou valores separados por tabulação).
                </p>
                <textarea
                  className="w-full min-h-[200px] font-mono text-xs border border-border rounded-md p-3 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={'CODIGO\tDESCRICAO\tMATERIAL\tPROCESSO\tX\tY\tQTD\n1007802\tUN. COND.1-4 HP\tUN. COND.1-4 HP-UFUS70HAK\tALMOXARIFADO\t\t\t1\nCABPD-PC01\tBASE UNID CONDENSADORA\t#430-0,8-1000043\tLASER\t693,9\t371,5\t1'}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <div className="mt-3 flex justify-between items-center">
                  <p className="text-[11px] text-muted-foreground">
                    Suporta: CSV, TSV, ponto-e-vírgula ou tabulação como separador.
                  </p>
                  <Button onClick={handleParseText} disabled={!rawText.trim()} className="gap-2">
                    Analisar <ChevronRight size={14} />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/60 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <UploadCloud size={36} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Arraste um arquivo ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">CSV, TSV, XLS ou XLSX</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* ── STEP 2: MAPPING ────────────────────────────────────────────── */}
          {step === 'mapping' && parsedData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-1">Mapeamento de colunas</h3>
                <p className="text-xs text-muted-foreground">
                  {parsedData.headers.length} colunas detectadas · {parsedData.rows.length} linhas.
                  Ajuste a correspondência se necessário.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COLUMN_KEYS.map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      {label}{required && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                    <select
                      className="w-full border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                      value={mapping[key] || ''}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [key]: e.target.value || undefined }))
                      }
                    >
                      <option value="">— ignorar —</option>
                      {parsedData.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Sample preview */}
              <div className="overflow-x-auto rounded border border-border">
                <table className="min-w-max w-full text-[11px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {COLUMN_KEYS.filter((k) => mapping[k.key]).map((k) => (
                        <th key={k.key} className="text-left px-2 py-1.5 font-medium">
                          {k.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/60">
                        {COLUMN_KEYS.filter((k) => mapping[k.key]).map((k) => (
                          <td key={k.key} className="px-2 py-1 max-w-[160px] truncate">
                            {String(row[mapping[k.key]] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > 5 && (
                  <p className="px-2 py-1 text-[10px] text-muted-foreground">
                    + {parsedData.rows.length - 5} linhas…
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep('input')}>
                  ← Voltar
                </Button>
                <Button size="sm" onClick={handlePreview} disabled={loadingPreview || !mapping.codigo} className="gap-2">
                  {loadingPreview ? <Loader2 size={14} className="animate-spin" /> : null}
                  Pré-visualizar
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PREVIEW ─────────────────────────────────────────────── */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.rowCount} linhas</Badge>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {preview.rowCount - (preview.wouldCreateCount ?? 0)} já cadastrados
                </Badge>
                {preview.wouldCreateCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    {preview.wouldCreateCount} serão criados automaticamente
                  </Badge>
                )}
              </div>

              <div className="overflow-x-auto rounded border border-border max-h-80">
                <table className="min-w-[700px] w-full text-xs">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                    <tr className="border-b">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Código</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-left p-2">Material</th>
                      <th className="text-left p-2">Processo</th>
                      <th className="text-right p-2">X</th>
                      <th className="text-right p-2">Y</th>
                      <th className="text-right p-2">e (mm)</th>
                      <th className="text-right p-2">Peso kg</th>
                      <th className="text-right p-2">Qtd</th>
                      <th className="text-center p-2">Novo?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.preview ?? []).map((row) => (
                      <tr
                        key={row.line}
                        className={`border-b border-border/60 ${row.auto_create ? 'bg-amber-50/60' : ''}`}
                      >
                        <td className="p-2 text-muted-foreground">{row.line}</td>
                        <td className="p-2 font-mono font-medium">{row.codigo}</td>
                        <td className="p-2 max-w-[140px] truncate text-muted-foreground">{row.descricao || '—'}</td>
                        <td className="p-2 max-w-[120px] truncate text-muted-foreground">{row.material || '—'}</td>
                        <td className="p-2">{processoBadge(row.processo)}</td>
                        <td className="p-2 text-right">{row.x_mm != null ? row.x_mm : '—'}</td>
                        <td className="p-2 text-right">{row.y_mm != null ? row.y_mm : '—'}</td>
                        <td className="p-2 text-right">{row.thickness_mm != null ? row.thickness_mm : '—'}</td>
                        <td className="p-2 text-right">
                          {row.weight_kg > 0 ? Number(row.weight_kg).toFixed(3) : '—'}
                        </td>
                        <td className="p-2 text-right font-medium">{row.qtd}</td>
                        <td className="p-2 text-center">
                          {row.auto_create ? (
                            <span className="text-amber-600 text-[10px] font-medium">+ Criar</span>
                          ) : (
                            <CheckCircle2 size={13} className="text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(preview.wouldCreate ?? []).length > 0 && (
                <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs">
                  <p className="font-medium text-amber-800 mb-1">
                    {preview.wouldCreate.length} novos registros serão criados automaticamente:
                  </p>
                  <p className="text-amber-700 font-mono leading-relaxed break-all">
                    {preview.wouldCreate.slice(0, 20).join(', ')}
                    {preview.wouldCreate.length > 20 && ` … (+${preview.wouldCreate.length - 20})`}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                  ← Voltar
                </Button>
                <Button size="sm" onClick={handleImport} disabled={importing} className="gap-2">
                  {importing ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirmar importação
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: RESULT ──────────────────────────────────────────────── */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <CheckCircle2 size={22} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-800">BOM importada com sucesso!</p>
                  <p className="text-xs text-green-700">
                    {result.rowCount} linhas processadas · Status: COMPLETE
                  </p>
                </div>
              </div>

              {result.importLog?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Log de importação
                  </p>
                  <div className="rounded border border-border bg-muted/30 p-3 space-y-0.5 max-h-48 overflow-y-auto">
                    {result.importLog.map((line, i) => (
                      <p key={i} className="text-[11px] font-mono text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Linhas na BOM" value={result.rowCount ?? '—'} color="blue" />
                <StatCard label="Itens criados" value={result.importLog?.filter(l => l.includes('Criado')).length ?? 0} color="amber" />
                <StatCard label="Status" value="COMPLETE" color="green" />
              </div>

              <div className="flex justify-end">
                <Button onClick={onClose} className="gap-2">
                  <CheckCircle2 size={14} /> Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = ['input', 'mapping', 'preview', 'result'];
  const labels = ['Entrada', 'Colunas', 'Prévia', 'Resultado'];
  const current = steps.indexOf(step);

  return (
    <div className="hidden sm:flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              i < current
                ? 'bg-green-500 text-white'
                : i === current
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          <span
            className={`text-[10px] hidden md:inline ${
              i === current ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}
          >
            {labels[i]}
          </span>
          {i < steps.length - 1 && <ChevronRight size={12} className="text-muted-foreground/50" />}
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${colors[color] || colors.blue}`}>
      <p className="text-[10px] font-medium opacity-70 uppercase">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
