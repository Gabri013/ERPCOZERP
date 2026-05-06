import puppeteer from 'puppeteer-core';
import { Readable } from 'stream';

export interface PDFOptions {
  html: string;
  format?: 'A4' | 'A3' | 'Letter';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export async function generatePDF(options: PDFOptions): Promise<Buffer> {
  let browser;

  try {
    // Usar puppeteer-core para serverless
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      // Em produção, pode precisar de executablePath para Railway/Vercel
      // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();

    await page.setContent(options.html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha na geração do PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Templates HTML para relatórios comuns
export function generateSaleOrderHTML(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pedido de Venda ${order.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .info { margin-bottom: 20px; }
        .info div { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; text-align: right; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pedido de Venda</h1>
        <h2>Número: ${order.number}</h2>
      </div>

      <div class="info">
        <div><strong>Cliente:</strong> ${order.customer?.name || 'N/A'}</div>
        <div><strong>Data do Pedido:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
        <div><strong>Data de Entrega:</strong> ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Observações:</strong> ${order.notes || 'N/A'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Desconto (%)</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items?.map((item: any) => `
            <tr>
              <td>${item.product?.name || item.productId}</td>
              <td>${item.quantity}</td>
              <td>R$ ${item.unitPrice?.toFixed(2) || '0.00'}</td>
              <td>${item.discountPct || 0}%</td>
              <td>R$ ${item.lineTotal?.toFixed(2) || '0.00'}</td>
            </tr>
          `).join('') || ''}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="total">Total do Pedido:</td>
            <td class="total">R$ ${order.totalAmount?.toFixed(2) || '0.00'}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}

export function generatePurchaseOrderHTML(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Compra ${order.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .info { margin-bottom: 20px; }
        .info div { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ordem de Compra</h1>
        <h2>Número: ${order.number}</h2>
      </div>

      <div class="info">
        <div><strong>Fornecedor:</strong> ${order.supplier?.name || 'N/A'}</div>
        <div><strong>Data Prevista:</strong> ${order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Observações:</strong> ${order.notes || 'N/A'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items?.map((item: any) => `
            <tr>
              <td>${item.product?.name || item.productId}</td>
              <td>${item.quantity}</td>
              <td>R$ ${item.unitPrice?.toFixed(2) || '0.00'}</td>
              <td>R$ ${(item.quantity * item.unitPrice)?.toFixed(2) || '0.00'}</td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>

      <div class="footer">
        <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}