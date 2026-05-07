import { Resend } from 'resend';
import { logger } from './logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'ERP Cozinca <erp@cozinca.com.br>';

export async function enviarEmail(params: {
  para: string;
  assunto: string;
  html: string;
  texto?: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY não configurada — email não enviado', { para: params.para });
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.para,
      subject: params.assunto,
      html: params.html,
      text: params.texto,
    });
    logger.info('Email enviado', { para: params.para, assunto: params.assunto });
    return true;
  } catch (error) {
    logger.error('Falha ao enviar email', { error, para: params.para });
    return false;
  }
}

export function templateCotacao(params: {
  fornecedor: string;
  numero: string;
  itens: Array<{ produto: string; quantidade: number; unidade: string }>;
  prazo: string;
  observacao?: string;
}): string {
  const itensHtml = params.itens
    .map(
      (i) =>
        `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i.produto}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantidade} ${i.unidade}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">Solicitação de Cotação</h1>
        <p style="color:#bfdbfe;margin:4px 0 0">Cozinca Inox Equipamentos</p>
      </div>
      <div style="background:#f9fafb;padding:20px;border-radius:0 0 8px 8px">
        <p>Prezado(a) <strong>${params.fornecedor}</strong>,</p>
        <p>Solicitamos cotação dos seguintes itens (Cotação #${params.numero}):</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden">
          <thead>
            <tr style="background:#e5e7eb">
              <th style="padding:10px 8px;text-align:left">Produto</th>
              <th style="padding:10px 8px;text-align:center">Quantidade</th>
            </tr>
          </thead>
          <tbody>${itensHtml}</tbody>
        </table>
        <p><strong>Prazo para resposta:</strong> ${params.prazo}</p>
        ${params.observacao ? `<p><strong>Observações:</strong> ${params.observacao}</p>` : ''}
        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          Responda este email com seus preços e condições.<br>
          ERP Cozinca Inox — ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  `;
}
