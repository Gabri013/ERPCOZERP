import { FiscalNfe } from '@prisma/client';
import { recuperarXML } from './xml.storage.js';

export interface SpedRegistro {
  tipo: string;
  campos: Record<string, string | number>;
}

/**
 * Gera SPED Fiscal completo
 * @param ano Ano do SPED
 * @param mes Mês do SPED
 * @returns Texto do SPED
 */
export async function gerarSPED(ano: number, mes: number): Promise<string> {
  const registros: SpedRegistro[] = [];

  // |0000| - Abertura do arquivo
  registros.push({
    tipo: '0000',
    campos: {
      REG: '0000',
      COD_VER: '016',
      COD_FIN: '0', // Remessa original
      DT_INI: `${ano}${mes.toString().padStart(2, '0')}01`,
      DT_FIN: `${ano}${mes.toString().padStart(2, '0')}${new Date(ano, mes, 0).getDate().toString().padStart(2, '0')}`,
      NOME: 'ERPCOZERP LTDA',
      CNPJ: '12345678000123',
      CPF: '',
      UF: 'SP',
      IE: '123456789012',
      COD_MUN: '3550308', // São Paulo
      IM: '',
      SUFRAMA: '',
      IND_PERFIL: 'A', // Perfil A
      IND_ATIV: '1' // Industrial ou equiparado
    }
  });

  // |0001| - Abertura do bloco 0
  registros.push({
    tipo: '0001',
    campos: {
      REG: '0001',
      IND_MOV: '0' // Com dados
    }
  });

  // |0005| - Dados complementares
  registros.push({
    tipo: '0005',
    campos: {
      REG: '0005',
      FANTASIA: 'ERPCOZERP',
      CEP: '01234567',
      END: 'Rua Principal, 123',
      NUM: '123',
      COMPL: '',
      BAIRRO: 'Centro',
      FONE: '11999999999',
      FAX: '',
      EMAIL: 'contato@erpcozerp.com'
    }
  });

  // |0100| - Dados do contador
  registros.push({
    tipo: '0100',
    campos: {
      REG: '0100',
      NOME: 'CONTADOR EXEMPLO',
      CPF: '12345678901',
      CRC: '123456/SP',
      CNPJ: '',
      CEP: '01234567',
      END: 'Rua Contador, 456',
      NUM: '456',
      COMPL: '',
      BAIRRO: 'Centro',
      FONE: '11888888888',
      FAX: '',
      EMAIL: 'contador@exemplo.com',
      COD_MUN: '3550308'
    }
  });

  // |0150| - Tabela de participantes (clientes/fornecedores)
  // Aqui seria necessário buscar do banco de dados
  // Por simplicidade, adicionar alguns exemplos
  registros.push({
    tipo: '0150',
    campos: {
      REG: '0150',
      COD_PART: 'CLI001',
      NOME: 'CLIENTE EXEMPLO LTDA',
      COD_PAIS: '01058', // Brasil
      CNPJ: '98765432000198',
      CPF: '',
      IE: '987654321098',
      COD_MUN: '3550308',
      SUFRAMA: '',
      END: 'Rua Cliente, 789',
      NUM: '789',
      COMPL: '',
      BAIRRO: 'Bairro'
    }
  });

  // |0190| - Identificação das unidades de medida
  registros.push({
    tipo: '0190',
    campos: {
      REG: '0190',
      UNID: 'UN',
      DESCR: 'UNIDADE'
    }
  });

  registros.push({
    tipo: '0190',
    campos: {
      REG: '0190',
      UNID: 'KG',
      DESCR: 'QUILOGRAMA'
    }
  });

  // |0200| - Tabela de identificação do item
  // Produtos do estoque
  registros.push({
    tipo: '0200',
    campos: {
      REG: '0200',
      COD_ITEM: 'PROD001',
      DESCR_ITEM: 'PRODUTO EXEMPLO',
      COD_BARRA: '',
      COD_ANT_ITEM: '',
      UNID_INV: 'UN',
      TIPO_ITEM: '00', // Mercadoria para revenda
      COD_NCM: '73239300',
      EX_IPI: '',
      COD_GEN: '00',
      COD_LST: '',
      ALIQ_ICMS: '18.00'
    }
  });

  // |C100| - Nota Fiscal (modelo 55)
  // Aqui seria necessário buscar NF-es do período
  // Exemplo de uma NF-e autorizada
  registros.push({
    tipo: 'C100',
    campos: {
      REG: 'C100',
      IND_OPER: '0', // Entrada
      IND_EMIT: '0', // Emissão própria
      COD_PART: 'CLI001',
      COD_MOD: '55',
      COD_SIT: '00', // Documento regular
      SER: '001',
      NUM_DOC: '000001',
      CHV_NFE: '35100112345678000123550010000000011000000000', // Exemplo
      DT_DOC: `${ano}${mes.toString().padStart(2, '0')}15`,
      DT_E_S: `${ano}${mes.toString().padStart(2, '0')}15`,
      VL_DOC: '12500.00',
      IND_PGTO: '0', // À vista
      VL_DESC: '0.00',
      VL_ABAT_NT: '0.00',
      VL_MERC: '12500.00',
      IND_FRT: '0', // Por conta do emitente
      VL_FRT: '0.00',
      VL_SEG: '0.00',
      VL_OUT_DA: '0.00',
      VL_BC_ICMS: '12500.00',
      VL_ICMS: '2250.00',
      VL_BC_ICMS_ST: '0.00',
      VL_ICMS_ST: '0.00',
      VL_IPI: '0.00',
      VL_IPI_DEV: '0.00',
      VL_PIS: '81.25',
      VL_COFINS: '375.00',
      VL_PIS_ST: '0.00',
      VL_COFINS_ST: '0.00'
    }
  });

  // |C170| - Itens da NF-e
  registros.push({
    tipo: 'C170',
    campos: {
      REG: 'C170',
      NUM_ITEM: '001',
      COD_ITEM: 'PROD001',
      DESCR_COMPL: '',
      QTD: '1.000',
      UNID: 'UN',
      VL_ITEM: '12500.00',
      VL_DESC: '0.00',
      IND_MOV: '0',
      CST_ICMS: '000',
      CFOP: '1102',
      COD_NAT: '',
      VL_BC_ICMS: '12500.00',
      ALIQ_ICMS: '18.00',
      VL_ICMS: '2250.00',
      VL_BC_ICMS_ST: '0.00',
      ALIQ_ST: '0.00',
      VL_ICMS_ST: '0.00',
      IND_APUR: '0',
      CST_IPI: '99',
      COD_ENQ: '',
      VL_BC_IPI: '0.00',
      ALIQ_IPI: '0.00',
      VL_IPI: '0.00',
      CST_PIS: '01',
      VL_BC_PIS: '12500.00',
      ALIQ_PIS: '0.65',
      QUANT_BC_PIS: '0.000',
      ALIQ_PIS_QUANT: '0.000',
      VL_PIS: '81.25',
      CST_COFINS: '01',
      VL_BC_COFINS: '12500.00',
      ALIQ_COFINS: '3.00',
      QUANT_BC_COFINS: '0.000',
      ALIQ_COFINS_QUANT: '0.000',
      VL_COFINS: '375.00',
      COD_CTA: ''
    }
  });

  // |C990| - Encerramento do bloco C
  registros.push({
    tipo: 'C990',
    campos: {
      REG: 'C990',
      QTD_LIN_C: registros.filter(r => r.tipo.startsWith('C')).length.toString()
    }
  });

  // |D100| - Nota Fiscal de Serviço de Transporte
  // Exemplo simplificado
  registros.push({
    tipo: 'D100',
    campos: {
      REG: 'D100',
      IND_OPER: '0',
      IND_EMIT: '0',
      COD_PART: 'CLI001',
      COD_MOD: '07', // CT-e
      COD_SIT: '00',
      SER: '001',
      SUB: '',
      NUM_DOC: '000001',
      CHV_CTE: '',
      DT_DOC: `${ano}${mes.toString().padStart(2, '0')}20`,
      DT_A_P: `${ano}${mes.toString().padStart(2, '0')}20`,
      TP_CT_E: '0',
      CHV_CTE_REF: '',
      VL_DOC: '500.00',
      VL_DESC: '0.00',
      IND_FRT: '0',
      VL_SERV: '500.00',
      VL_BC_ICMS: '500.00',
      VL_ICMS: '90.00',
      VL_NT: '0.00',
      COD_INF: '',
      COD_CTA: ''
    }
  });

  // |D990| - Encerramento do bloco D
  registros.push({
    tipo: 'D990',
    campos: {
      REG: 'D990',
      QTD_LIN_D: registros.filter(r => r.tipo.startsWith('D')).length.toString()
    }
  });

  // |9990| - Encerramento de bloco
  const blocos = ['0', 'C', 'D'];
  blocos.forEach(bloco => {
    registros.push({
      tipo: '9990',
      campos: {
        REG: '9990',
        QTD_LIN: registros.filter(r => r.tipo.startsWith(bloco)).length.toString()
      }
    });
  });

  // |9999| - Encerramento do arquivo
  registros.push({
    tipo: '9999',
    campos: {
      REG: '9999',
      QTD_LIN: registros.length.toString()
    }
  });

  // Converter para texto SPED
  return registros.map(reg => {
    const campos = Object.values(reg.campos).join('|');
    return `|${campos}|`;
  }).join('\r\n');
}