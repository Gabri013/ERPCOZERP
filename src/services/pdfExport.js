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
