/**
 * Parser e cálculos para BOM exportada do SolidWorks / planilhas industriais (inox).
 */

export type ParsedBomHeader = Record<string, number>;

export interface ParsedBomRow {
  codigo: string;
  descricao: string;
  material: string;
  xMm: number | null;
  yMm: number | null;
  qtd: number;
  raw: Record<string, string>;
}

/** Extrai espessura em mm de strings como "#430-0,8-1000043" ou "AISI304-1,5". */
export function extractThicknessMm(materialRaw: string): number | null {
  const material = String(materialRaw || '').trim();
  if (!material) return null;

  const segments = material.split(/[-_/]/);
  for (const seg of segments) {
    const t = seg.trim();
    const m = t.match(/^(\d+[.,]\d+)$/);
    if (m) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (Number.isFinite(v) && v >= 0.15 && v <= 80) return v;
    }
  }

  const mmGlob = material.match(/(\d+[.,]\d+)\s*mm/i);
  if (mmGlob) {
    const v = parseFloat(mmGlob[1].replace(',', '.'));
    if (Number.isFinite(v) && v >= 0.15 && v <= 80) return v;
  }

  const plain = material.match(/\b(\d+[.,]\d+)\b/);
  if (plain) {
    const v = parseFloat(plain[1].replace(',', '.'));
    if (Number.isFinite(v) && v >= 0.15 && v <= 6) return v;
  }

  return null;
}

/** Área (m²) * espessura (m) * densidade (kg/m³) */
export function calcSheetWeightKg(xMm: number, yMm: number, thicknessMm: number): number {
  const areaM2 = (Number(xMm) * Number(yMm)) / 1_000_000;
  const volM3 = areaM2 * (Number(thicknessMm) / 1000);
  return Number((volM3 * 7850).toFixed(4));
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function parseNumberCell(v: string): number | null {
  const s = String(v ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Detecta índices de colunas pela primeira linha não vazia. */
export function detectSolidWorksHeader(line: string): ParsedBomHeader | null {
  const delim = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  const cells = line.split(delim).map((c) => c.trim());
  const header: ParsedBomHeader = {};

  const keys: Array<{ key: keyof ParsedBomRow | 'qtd'; aliases: string[] }> = [
    { key: 'codigo', aliases: ['codigo', 'codigo_', 'code', 'item', 'ref'] },
    { key: 'descricao', aliases: ['descricao', 'description', 'nome'] },
    { key: 'material', aliases: ['material', 'mat'] },
    { key: 'xMm', aliases: ['x', 'largura', 'lx'] },
    { key: 'yMm', aliases: ['y', 'comprimento', 'ly', 'profundidade'] },
    { key: 'qtd', aliases: ['qtd', 'quantidade', 'qty', 'qtde'] },
  ];

  cells.forEach((cell, idx) => {
    const n = normalizeHeader(cell);
    for (const { key, aliases } of keys) {
      if (aliases.some((a) => n === a || n.startsWith(a + '_') || n.includes(a))) {
        header[key as string] = idx;
        break;
      }
    }
  });

  if (header['codigo'] === undefined) return null;
  return header;
}

export function parseSolidWorksBomTable(text: string): { header: ParsedBomHeader; rows: ParsedBomRow[] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { header: {}, rows: [] };

  let header = detectSolidWorksHeader(lines[0]);
  let dataStart = 1;
  if (!header) {
    header = detectSolidWorksHeader(lines[1] || '') || {};
    dataStart = 2;
  }

  const delim = (lines[dataStart] || lines[0]).includes('\t')
    ? '\t'
    : (lines[dataStart] || lines[0]).includes(';')
      ? ';'
      : ',';

  const rows: ParsedBomRow[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^[#;]/.test(line)) continue;
    const cells = line.split(delim).map((c) => c.trim());
    const ci = header['codigo'] ?? 0;
    const codigo = String(cells[ci] || '').trim();
    if (!codigo) continue;

    const descIdx = header['descricao'] ?? 1;
    const matIdx = header['material'] ?? 2;
    const xIdx = header['xMm'] ?? 3;
    const yIdx = header['yMm'] ?? 4;
    const qIdx = header['qtd'] ?? 5;

    const descricao = String(cells[descIdx] ?? '').trim();
    const material = String(cells[matIdx] ?? '').trim();
    const xMm = parseNumberCell(cells[xIdx] ?? '');
    const yMm = parseNumberCell(cells[yIdx] ?? '');
    const qtdRaw = parseNumberCell(cells[qIdx] ?? '');
    const qtd = qtdRaw != null && qtdRaw > 0 ? qtdRaw : 1;

    const raw: Record<string, string> = {};
    cells.forEach((c, j) => {
      raw[`col_${j}`] = c;
    });

    rows.push({
      codigo,
      descricao,
      material,
      xMm,
      yMm,
      qtd,
      raw,
    });
  }

  return { header, rows };
}

export function enrichRowWeights(row: ParsedBomRow): {
  thicknessMm: number | null;
  weightKg: number;
  isSheet: boolean;
} {
  const th = extractThicknessMm(row.material);
  const isSheet =
    th != null &&
    row.xMm != null &&
    row.yMm != null &&
    row.xMm > 0 &&
    row.yMm > 0;

  const weightKg = isSheet && th != null ? calcSheetWeightKg(row.xMm!, row.yMm!, th) : 0;

  return { thicknessMm: th, weightKg, isSheet };
}
