import axios from 'axios';
import { env } from '../../config/env.js';
import { calcularImpostos, ItemImposto } from './tax.service.js';
import { salvarXML, recuperarXML } from './xml.storage.js';
import { getHttpsAgent, validateCertificate } from '../../lib/ssl/certificate.loader.js';

const BASE_URL = env.FOCUS_NFE_ENV === 'producao'
  ? 'https://api.focusnfe.com.br/v2'
  : 'https://homologacao.focusnfe.com.br/v2';

const TOKEN = env.FOCUS_NFE_TOKEN || '';

export async function emitirNFe(dadosNota: any) {
  // Calcular impostos para cada item se não estiverem presentes
  if (dadosNota.items && !dadosNota.items[0]?.impostos) {
    const regime = dadosNota.natureza_operacao?.includes('Simples') ? 'SIMPLES' : 'LUCRO_PRESUMIDO';
    const ufDestino = dadosNota.destinatario?.endereco?.uf || 'SP';

    dadosNota.items = dadosNota.items.map((item: any) => {
      const itemImposto: ItemImposto = {
        valor: item.valor_total || (item.quantidade * item.valor_unitario),
        cfop: item.cfop || '5102',
        ncm: item.ncm || '84145900',
        origem: item.origem || 0
      };

      const impostos = calcularImpostos(itemImposto, ufDestino, regime);

      return {
        ...item,
        impostos: {
          icms: {
            modo: '0', // Tributação normal
            aliquota: impostos.icms.aliquota,
            base_calculo: impostos.icms.base,
            valor: impostos.icms.valor
          },
          pis: {
            aliquota: impostos.pis.aliquota,
            base_calculo: impostos.pis.base,
            valor: impostos.pis.valor
          },
          cofins: {
            aliquota: impostos.cofins.aliquota,
            base_calculo: impostos.cofins.base,
            valor: impostos.cofins.valor
          },
          ...(impostos.ipi && {
            ipi: {
              aliquota: impostos.ipi.aliquota,
              base_calculo: impostos.ipi.base,
              valor: impostos.ipi.valor
            }
          })
        }
      };
    });
  }

  // validate certificate if present
  const certCheck = validateCertificate();
  if (certCheck && certCheck.valid === false) {
    throw new Error(`Certificado invalido: ${certCheck.reason || 'invalid'}`);
  }
  if (certCheck?.cnpj && dadosNota.emitente?.cnpj) {
    const certCnpj = certCheck.cnpj.replace(/\D/g, '');
    const emitenteCnpj = String(dadosNota.emitente.cnpj || '').replace(/\D/g, '');
    if (certCnpj && emitenteCnpj && certCnpj !== emitenteCnpj) {
      throw new Error('CNPJ do certificado difere do emitente da nota');
    }
  }

  const httpsAgent = getHttpsAgent();
  const axiosOpts: any = { auth: { username: TOKEN, password: '' } };
  if (httpsAgent) axiosOpts.httpsAgent = httpsAgent;

  const response = await axios.post(`${BASE_URL}/nfe`, dadosNota, axiosOpts);

  // Salvar XML se disponível na resposta
  if (response.data.xml) {
    await salvarXML(response.data.referencia, response.data.xml);
  }

  return response.data;
}

export async function consultarNFe(referencia: string) {
  const httpsAgent = getHttpsAgent();
  const axiosOpts: any = { auth: { username: TOKEN, password: '' } };
  if (httpsAgent) axiosOpts.httpsAgent = httpsAgent;
  const response = await axios.get(`${BASE_URL}/nfe/${referencia}`, axiosOpts);

  // Salvar XML se disponível
  if (response.data.xml) {
    await salvarXML(referencia, response.data.xml);
  }

  return response.data;
}

export async function cancelarNFe(referencia: string, justificativa: string) {
  const httpsAgent = getHttpsAgent();
  const axiosOpts: any = { data: { justificativa }, auth: { username: TOKEN, password: '' } };
  if (httpsAgent) axiosOpts.httpsAgent = httpsAgent;
  const response = await axios.delete(`${BASE_URL}/nfe/${referencia}`, axiosOpts);
  return response.data;
}

export async function downloadXML(referencia: string) {
  // Primeiro tentar recuperar do storage local
  const xmlLocal = await recuperarXML(referencia);
  if (xmlLocal) {
    return xmlLocal;
  }

  // Se não estiver local, baixar da API
  const httpsAgent = getHttpsAgent();
  const axiosOpts: any = { auth: { username: TOKEN, password: '' } };
  if (httpsAgent) axiosOpts.httpsAgent = httpsAgent;
  const response = await axios.get(`${BASE_URL}/nfe/${referencia}?completo=1`, axiosOpts);

  // Salvar para cache local
  if (response.data) {
    await salvarXML(referencia, response.data);
  }

  return response.data;
}