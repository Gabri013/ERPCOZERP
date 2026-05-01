import jsPDF from 'jspdf';

const MARGIN = 14;
const PAGE_WIDTH = (doc) => doc.internal.pageSize.getWidth();
const PAGE_HEIGHT = (doc) => doc.internal.pageSize.getHeight();

const toText = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  if (Array.isArray(value)) return value.map(toText).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const createDoc = (title, subtitle) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = PAGE_WIDTH(doc);
  const pageHeight = PAGE_HEIGHT(doc);

  doc.setTextColor(28, 41, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, MARGIN, 20);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, MARGIN, 26);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, 30, pageWidth - MARGIN, 30);

  return { doc, pageWidth, pageHeight, y: subtitle ? 38 : 34 };
};

const ensureSpace = (ctx, neededHeight) => {
  if (ctx.y + neededHeight <= ctx.pageHeight - MARGIN) return;
  ctx.doc.addPage();
  ctx.y = MARGIN;
};

const renderField = (ctx, field, x, y, width) => {
  const doc = ctx.doc;
  const value = toText(field.value);
  const labelLines = doc.splitTextToSize(toText(field.label), width - 4);
  const valueLines = doc.splitTextToSize(value, width - 4);
  const height = 4 + (labelLines.length * 4) + 2 + (valueLines.length * 4) + 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(labelLines, x + 2, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(valueLines, x + 2, y + 4 + (labelLines.length * 4) + 2);

  return height;
};

const renderFieldsGrid = (ctx, fields) => {
  if (!fields?.length) return;
  const gap = 4;
  const columnWidth = (ctx.pageWidth - (MARGIN * 2) - gap) / 2;

  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];
    const leftHeight = left ? renderField(ctx, left, MARGIN, ctx.y, columnWidth) : 0;
    const rightHeight = right ? renderField(ctx, right, MARGIN + columnWidth + gap, ctx.y, columnWidth) : 0;
    ctx.y += Math.max(leftHeight, rightHeight) + 4;
    ensureSpace(ctx, 0);
  }
};

const renderSection = (ctx, section) => {
  ensureSpace(ctx, 14);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(28, 41, 66);
  ctx.doc.text(section.title, MARGIN, ctx.y);
  ctx.y += 4;
  renderFieldsGrid(ctx, section.fields || []);
};

const renderTable = (ctx, table) => {
  if (!table?.headers?.length || !table?.rows?.length) return;
  const doc = ctx.doc;
  const tableWidth = ctx.pageWidth - (MARGIN * 2);
  const columnWidth = tableWidth / table.headers.length;
  const headerHeight = 8;
  const rowPadding = 3;

  const drawHeader = () => {
    ensureSpace(ctx, headerHeight + 4);
    doc.setFillColor(30, 64, 175);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.rect(MARGIN, ctx.y, tableWidth, headerHeight, 'F');
    table.headers.forEach((header, index) => {
      const cellX = MARGIN + (index * columnWidth);
      doc.text(toText(header), cellX + 2, ctx.y + 5.5, { maxWidth: columnWidth - 4 });
    });
    ctx.y += headerHeight;
  };

  drawHeader();

  table.rows.forEach((row) => {
    const cells = row.map((cell) => doc.splitTextToSize(toText(cell), columnWidth - 4));
    const rowHeight = Math.max(...cells.map((lines) => (lines.length * 4) + (rowPadding * 2)));
    if (ctx.y + rowHeight > ctx.pageHeight - MARGIN) {
      doc.addPage();
      ctx.y = MARGIN;
      drawHeader();
    }

    doc.setDrawColor(226, 232, 240);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');

    row.forEach((cell, index) => {
      const cellX = MARGIN + (index * columnWidth);
      doc.rect(cellX, ctx.y, columnWidth, rowHeight);
      doc.text(cells[index], cellX + 2, ctx.y + rowPadding + 3, { maxWidth: columnWidth - 4 });
    });

    ctx.y += rowHeight;
  });
};

const finalizePdf = (doc, filename, preview) => {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  if (preview) {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function exportPdfReport({ title, subtitle, filename, fields = [], sections = [], table = null, preview = false }) {
  const { doc, pageWidth, pageHeight, y } = createDoc(title, subtitle);
  const ctx = { doc, pageWidth, pageHeight, y };

  renderFieldsGrid(ctx, fields);
  sections.forEach((section) => renderSection(ctx, section));
  renderTable(ctx, table);

  finalizePdf(doc, filename, preview);
}

function safeText(value) {
  const text = toText(value);
  return text === '—' ? '' : text;
}

function drawBox(doc, x, y, w, h) {
  doc.setDrawColor(60, 60, 60);
  doc.rect(x, y, w, h);
}

function labelValue(doc, x, y, label, value, opts = {}) {
  const { labelSize = 7, valueSize = 9, padX = 2, padY = 3, maxWidth = 0 } = opts;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(labelSize);
  doc.text(String(label), x + padX, y + padY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(valueSize);
  const v = safeText(value);
  if (maxWidth > 0) {
    const lines = doc.splitTextToSize(v, maxWidth - (padX * 2));
    doc.text(lines, x + padX, y + padY + 4);
  } else {
    doc.text(v, x + padX, y + padY + 4);
  }
}

function fmtDateBR(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return String(d);
  }
}

// PDF “formulário” inspirado no modelo enviado (OP Sulfisa)
export function exportOrdemProducaoModelo({
  op,
  apontamentos = [],
  filename,
  preview = true,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = PAGE_WIDTH(doc);
  const pageH = PAGE_HEIGHT(doc);
  const margin = 10;

  // Estilo geral
  doc.setLineWidth(0.2);
  doc.setTextColor(20, 20, 20);

  // Header: logo placeholder + título + caixa nº OP
  const headerY = margin;
  const headerH = 18;
  const logoW = 28;
  drawBox(doc, margin, headerY, logoW, headerH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LOGO', margin + 10, headerY + 10, { align: 'center' });

  drawBox(doc, margin + logoW, headerY, pageW - margin * 2 - logoW - 35, headerH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ORDEM DE PRODUÇÃO', pageW / 2, headerY + 11, { align: 'center' });

  const opBoxX = pageW - margin - 35;
  drawBox(doc, opBoxX, headerY, 35, headerH);
  labelValue(doc, opBoxX, headerY, 'Nº da Ordem de produção', op?.numero, { labelSize: 6, valueSize: 11 });

  let y = headerY + headerH;

  // Linha 1: descrição do produto (grande) + barcode placeholder
  const row1H = 16;
  const descW = pageW - margin * 2 - 35;
  drawBox(doc, margin, y, descW, row1H);
  labelValue(doc, margin, y, 'Descrição do produto', op?.produtoDescricao, { maxWidth: descW, valueSize: 9 });
  drawBox(doc, margin + descW, y, 35, row1H);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('CÓD. BARRAS', margin + descW + 17.5, y + 9, { align: 'center' });
  y += row1H;

  // Linha 2: Código do produto, N.S., Liberação OP, Prazo, Qtde/UN
  const row2H = 12;
  const colW = (pageW - margin * 2) / 5;
  const cols = [
    { label: 'Código do Produto', value: op?.codigoProduto || '' },
    { label: 'N.S.', value: op?.ns || '' },
    { label: 'Liberação OP', value: fmtDateBR(op?.dataLiberacao || op?.dataEmissao) },
    { label: 'Prazo', value: fmtDateBR(op?.prazo) },
    { label: 'Qtde', value: `${safeText(op?.quantidade)} ${safeText(op?.unidade)}`.trim() },
  ];
  cols.forEach((c, i) => {
    const x = margin + (i * colW);
    drawBox(doc, x, y, colW, row2H);
    labelValue(doc, x, y, c.label, c.value, { labelSize: 6, valueSize: 8, maxWidth: colW });
  });
  y += row2H;

  // Linha 3: Nº do pedido, Cliente, Emissão do pedido, Data da emissão
  const row3H = 12;
  const w2 = (pageW - margin * 2) / 2;
  drawBox(doc, margin, y, w2, row3H);
  labelValue(doc, margin, y, 'Nº do pedido', op?.pedidoId || op?.pedidoNumero || '', { labelSize: 6, valueSize: 8, maxWidth: w2 });
  drawBox(doc, margin + w2, y, w2, row3H);
  labelValue(doc, margin + w2, y, 'Cliente', op?.clienteNome || '', { labelSize: 6, valueSize: 8, maxWidth: w2 });
  y += row3H;

  // Linha 4: Inform. Adicion, Observação, Informação complementar do item
  const row4H = 14;
  const infoW = (pageW - margin * 2) * 0.28;
  const obsW = (pageW - margin * 2) * 0.44;
  const compW = (pageW - margin * 2) - infoW - obsW;
  drawBox(doc, margin, y, infoW, row4H);
  labelValue(doc, margin, y, 'Inform. Adicion', op?.informacaoAdicional || '', { labelSize: 6, valueSize: 8, maxWidth: infoW });
  drawBox(doc, margin + infoW, y, obsW, row4H);
  labelValue(doc, margin + infoW, y, 'Observação', op?.observacao || '', { labelSize: 6, valueSize: 8, maxWidth: obsW });
  drawBox(doc, margin + infoW + obsW, y, compW, row4H);
  labelValue(doc, margin + infoW + obsW, y, 'Informação complementar do item', op?.informacaoComplementar || '', { labelSize: 6, valueSize: 8, maxWidth: compW });
  y += row4H;

  // Tabela PROCESSOS
  const tableY = y;
  const tableH = 62;
  drawBox(doc, margin, tableY, pageW - margin * 2, tableH);

  const headerH2 = 8;
  const headers = ['PROCESSO', 'INÍCIO', 'TÉRMINO', 'OBS', 'RESPONSÁVEL', 'LÍDER'];
  const widths = [52, 22, 22, 46, 26, 22];
  let x = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  headers.forEach((h, i) => {
    drawBox(doc, x, tableY, widths[i], headerH2);
    doc.text(h, x + 2, tableY + 5);
    x += widths[i];
  });

  // Lista idêntica ao formulário (ordem 1..10)
  const processRows = [
    'Engenharia',
    'Programação',
    'Corte',
    'Dobra',
    'Tubo',
    'Solda',
    'Mobiliário',
    'Cocção',
    'Refrigeração',
    'Embalagem',
  ];

  const rowH = (tableH - headerH2) / processRows.length;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  const byEtapa = new Map();
  apontamentos.forEach((a) => {
    const etapa = a?.etapa || a?.descricao || '';
    if (!etapa) return;
    if (!byEtapa.has(etapa)) byEtapa.set(etapa, []);
    byEtapa.get(etapa).push(a);
  });

  const etapaCandidatesByProcess = {
    Engenharia: ['Engenharia'],
    'Programação': ['Programação'],
    Corte: ['Corte', 'Corte a Laser', 'Laser'],
    Dobra: ['Dobra'],
    Tubo: ['Tubo'],
    Solda: ['Solda'],
    'Mobiliário': ['Mobiliário', 'Montagem'],
    'Cocção': ['Cocção'],
    'Refrigeração': ['Refrigeração'],
    'Embalagem': ['Embalagem'],
  };

  for (let i = 0; i < processRows.length; i++) {
    const rowY = tableY + headerH2 + (i * rowH);
    x = margin;
    widths.forEach((w) => {
      drawBox(doc, x, rowY, w, rowH);
      x += w;
    });

    doc.text(`${i + 1}  ${processRows[i]}`, margin + 2, rowY + 4.5);

    // Tenta preencher início/término/responsável com base nos apontamentos
    const proc = processRows[i];
    const candidates = etapaCandidatesByProcess[proc] || [proc];
    const found = candidates.flatMap((k) => byEtapa.get(k) || []);
    const last = found[found.length - 1];
    if (last) {
      const inicio = last.horaInicio || last.iniciado_em;
      const fim = last.horaFim || last.finalizado_em;
      const operador = last.operador || last.apontado_por_nome || '';
      const obs = last.observacao || '';

      doc.text(fmtDateBR(inicio), margin + widths[0] + 2, rowY + 4.5);
      doc.text(fmtDateBR(fim), margin + widths[0] + widths[1] + 2, rowY + 4.5);
      doc.text(String(obs).slice(0, 32), margin + widths[0] + widths[1] + widths[2] + 2, rowY + 4.5);
      doc.text(String(operador).slice(0, 16), margin + widths[0] + widths[1] + widths[2] + widths[3] + 2, rowY + 4.5);
    }
  }

  y = tableY + tableH;

  // Controle de revisão de prazo
  const revTitleH = 10;
  const revH = 24;
  drawBox(doc, margin, y, pageW - margin * 2, revTitleH + revH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CONTROLE DE REVISÃO DE PRAZO O.P.', margin + 2, y + 6);

  const revY = y + revTitleH;
  const revHeaders = ['REVISÃO', 'DATA', 'NOVO PRAZO', 'MOTIVO / JUSTIFICATIVA'];
  const revWidths = [18, 28, 28, (pageW - margin * 2) - 18 - 28 - 28];
  x = margin;
  revHeaders.forEach((h, i) => {
    drawBox(doc, x, revY, revWidths[i], 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(h, x + 2, revY + 5);
    x += revWidths[i];
  });
  for (let i = 0; i < 2; i++) {
    const ry = revY + 8 + (i * 8);
    x = margin;
    revWidths.forEach((w) => {
      drawBox(doc, x, ry, w, 8);
      x += w;
    });
  }
  y += revTitleH + revH + 4;

  // Observação (linhas)
  const obsH = pageH - margin - y;
  drawBox(doc, margin, y, pageW - margin * 2, obsH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('OBSERVAÇÃO', margin + 2, y + 6);
  doc.setDrawColor(180, 180, 180);
  for (let i = 0; i < 8; i++) {
    const ly = y + 10 + i * 7;
    doc.line(margin + 2, ly, pageW - margin - 2, ly);
  }

  const outName = filename || `${safeText(op?.numero) || 'op'}.pdf`;
  finalizePdf(doc, outName, preview);
}
