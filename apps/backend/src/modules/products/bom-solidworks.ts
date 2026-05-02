/**
 * Parser e cálculos para BOM exportada do SolidWorks / planilhas industriais (inox).
 *
 * Colunas suportadas (cabeçalho flexível, português ou inglês):
 *   Nº / Item, QTD / Quantidade / Qty, X / Largura, Y / Comprimento,
 *   Material / Mat, Descrição / Description, Código / Code / Item / Ref,
 *   Processo / Process / Operação, QTD. TOTAL / Qty Total / Total
 */

export type ParsedBomHeader = Record<string, number>;

export interface ParsedBomRow {
  /** Código do componente (obrigatório) */
  codigo: string;
  descricao: string;
  material: string;
  processo: string;
  xMm: number | null;
  yMm: number | null;
  /** Quantidade por unidade do produto pai */
  qtd: number;
  /** Quantidade total (já multiplicada); pode ser null se não informado */
  qtdTotal: number | null;
  raw: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extração de espessura
// ─────────────────────────────────────────────────────────────────────────────

/** Extrai espessura em mm de strings como "#430-0,8-1000043" ou "AISI304-1,5mm". */
export function extractThicknessMm(materialRaw: string): number | null {
  const material = String(materialRaw || '').trim();
  if (!material) return null;

  // Segmentos separados por -, _, /
  const segments = material.split(/[-_/]/);
  for (const seg of segments) {
    const t = seg.trim();
    const m = t.match(/^(\d+[.,]\d+)$/);
    if (m) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (Number.isFinite(v) && v >= 0.15 && v <= 80) return v;
    }
  }

  // "1,5mm" ou "1.5 mm"
  const mmGlob = material.match(/(\d+[.,]\d+)\s*mm/i);
  if (mmGlob) {
    const v = parseFloat(mmGlob[1].replace(',', '.'));
    if (Number.isFinite(v) && v >= 0.15 && v <= 80) return v;
  }

  // Número isolado plausível para espessura de chapa (0,15–6 mm)
  const plain = material.match(/\b(\d+[.,]\d+)\b/);
  if (plain) {
    const v = parseFloat(plain[1].replace(',', '.'));
    if (Number.isFinite(v) && v >= 0.15 && v <= 6) return v;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de peso
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_DENSITY_KG_M3 = 7850; // aço inox

/** Área (m²) × espessura (m) × densidade (kg/m³) */
export function calcSheetWeightKg(
  xMm: number,
  yMm: number,
  thicknessMm: number,
  densityKgM3 = DEFAULT_DENSITY_KG_M3,
): number {
  const areaM2 = (Number(xMm) * Number(yMm)) / 1_000_000;
  const volM3 = areaM2 * (Number(thicknessMm) / 1000);
  return Number((volM3 * densityKgM3).toFixed(4));
}

// ─────────────────────────────────────────────────────────────────────────────
// Detecção de cabeçalho
// ─────────────────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\s]+/g, '_')
    .replace(/__+/g, '_');
}

function parseNumberCell(v: string): number | null {
  const s = String(v ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Detecta o delimitador de uma linha.
 * Ordem de preferência: tab → ponto-e-vírgula → vírgula.
 */
export function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  return ',';
}

/** Detecta índices de colunas pela primeira linha com cabeçalho. */
export function detectSolidWorksHeader(line: string): ParsedBomHeader | null {
  const delim = detectDelimiter(line);
  const cells = line.split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ''));

  const header: ParsedBomHeader = {};

  const keys: Array<{ key: string; aliases: string[] }> = [
    {
      key: 'codigo',
      aliases: ['codigo', 'cod', 'code', 'item', 'ref', 'referencia', 'pn', 'part_number', 'n'],
    },
    {
      key: 'descricao',
      aliases: ['descricao', 'description', 'desc', 'nome', 'name', 'componente'],
    },
    {
      key: 'material',
      aliases: ['material', 'mat', 'materia_prima', 'raw_material', 'spec', 'especificacao'],
    },
    {
      key: 'processo',
      aliases: [
        'processo',
        'process',
        'operacao',
        'operation',
        'proc',
        'op',
        'setor',
        'tipo_operacao',
      ],
    },
    {
      key: 'xMm',
      aliases: ['x', 'largura', 'lx', 'width', 'comprimento_x', 'dim_x'],
    },
    {
      key: 'yMm',
      aliases: ['y', 'comprimento', 'ly', 'length', 'profundidade', 'dim_y', 'comprimento_y'],
    },
    {
      key: 'qtd',
      aliases: ['qtd', 'quantidade', 'qty', 'qtde', 'quant', 'qnt'],
    },
    {
      key: 'qtdTotal',
      aliases: [
        'qtd_total',
        'qtde_total',
        'qty_total',
        'total',
        'quantidade_total',
        'qtd__total',
        'qtt',
      ],
    },
  ];

  cells.forEach((cell, idx) => {
    const n = normalizeHeader(cell);
    for (const { key, aliases } of keys) {
      if (header[key] !== undefined) continue; // already mapped
      if (aliases.some((a) => n === a || n.startsWith(a + '_') || n.includes(a))) {
        header[key] = idx;
        break;
      }
    }
  });

  if (header['codigo'] === undefined) return null;
  return header;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser principal
// ─────────────────────────────────────────────────────────────────────────────

export function parseSolidWorksBomTable(text: string): {
  header: ParsedBomHeader;
  rows: ParsedBomRow[];
  detectedDelimiter: string;
  columnNames: string[];
} {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());

  if (!lines.length) {
    return { header: {}, rows: [], detectedDelimiter: ',', columnNames: [] };
  }

  // Find header row (first line with known keys)
  let header: ParsedBomHeader | null = null;
  let dataStart = 1;
  const delim = detectDelimiter(lines[0]);

  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    header = detectSolidWorksHeader(lines[i]);
    if (header) {
      dataStart = i + 1;
      break;
    }
  }
  if (!header) header = {};

  const columnNames = lines[dataStart - 1]
    .split(delim)
    .map((c) => c.trim().replace(/^["']|["']$/g, ''));

  const rows: ParsedBomRow[] = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^[#;]/.test(line)) continue;

    const cells = line.split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const ci = header['codigo'] ?? 0;
    const codigo = String(cells[ci] || '').trim();
    if (!codigo || codigo === '0' || /^n[uú]mero/i.test(codigo)) continue;

    const descIdx = header['descricao'] ?? 1;
    const matIdx = header['material'] ?? 2;
    const procIdx = header['processo'];
    const xIdx = header['xMm'] ?? 3;
    const yIdx = header['yMm'] ?? 4;
    const qIdx = header['qtd'] ?? 5;
    const qtIdx = header['qtdTotal'];

    const descricao = String(cells[descIdx] ?? '').trim();
    const material = String(cells[matIdx] ?? '').trim();
    const processo = procIdx !== undefined ? String(cells[procIdx] ?? '').trim() : '';
    const xMm = parseNumberCell(cells[xIdx] ?? '');
    const yMm = parseNumberCell(cells[yIdx] ?? '');
    const qtdRaw = parseNumberCell(cells[qIdx] ?? '');
    const qtd = qtdRaw != null && qtdRaw > 0 ? qtdRaw : 1;
    const qtdTotal =
      qtIdx !== undefined ? parseNumberCell(cells[qtIdx] ?? '') : null;

    const raw: Record<string, string> = {};
    cells.forEach((c, j) => {
      raw[`col_${j}`] = c;
    });

    rows.push({ codigo, descricao, material, processo, xMm, yMm, qtd, qtdTotal, raw });
  }

  return { header, rows, detectedDelimiter: delim, columnNames };
}

// ─────────────────────────────────────────────────────────────────────────────
// Enriquecimento de peso
// ─────────────────────────────────────────────────────────────────────────────

export function enrichRowWeights(row: ParsedBomRow): {
  thicknessMm: number | null;
  weightKg: number;
  isSheet: boolean;
} {
  const th = extractThicknessMm(row.material);
  const isSheet =
    th != null && row.xMm != null && row.yMm != null && row.xMm > 0 && row.yMm > 0;

  const weightKg =
    isSheet && th != null ? calcSheetWeightKg(row.xMm!, row.yMm!, th) : 0;

  return { thicknessMm: th, weightKg, isSheet };
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorização de processo
// ─────────────────────────────────────────────────────────────────────────────

/** True para processos de compra/almoxarifado (item não fabricado internamente). */
export function isExternalProcess(processo: string): boolean {
  const p = String(processo || '').trim().toUpperCase();
  return (
    p === 'ALMOXARIFADO' ||
    p === 'COMPRA' ||
    p === 'BOUGHT' ||
    p === 'BUY' ||
    p === 'FORNECIDO' ||
    p === '' // sem processo = assume externo por padrão
  );
}

/** Normaliza o nome do processo para um valor padronizado. */
export function normalizeProcess(processo: string): string {
  const p = String(processo || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const MAP: Record<string, string> = {
    ALMOXARIFADO: 'ALMOXARIFADO',
    COMPRA: 'ALMOXARIFADO',
    BOUGHT: 'ALMOXARIFADO',
    LASER: 'LASER',
    'CORTE LASER': 'LASER',
    'CORTE A LASER': 'LASER',
    DOBRA: 'DOBRA',
    DOBRAMENTO: 'DOBRA',
    SOLDA: 'SOLDA',
    SOLDADO: 'SOLDA',
    SOLDAGEM: 'SOLDA',
    USINAGEM: 'USINAGEM',
    USINAGE: 'USINAGEM',
    PINTURA: 'PINTURA',
    PINTURA_PO: 'PINTURA_PO',
    MONTAGEM: 'MONTAGEM',
    ASSEMBLY: 'MONTAGEM',
    CORTE: 'CORTE',
    ESTAMPAGEM: 'ESTAMPAGEM',
    STAMP: 'ESTAMPAGEM',
    GUILHOTINA: 'GUILHOTINA',
    TERCEIRIZADO: 'TERCEIRIZADO',
    OUTSOURCED: 'TERCEIRIZADO',
  };
  return MAP[p] ?? (p || 'ALMOXARIFADO');
}
