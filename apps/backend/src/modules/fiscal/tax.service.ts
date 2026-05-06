import { Decimal } from '@prisma/client/runtime/library';

export interface ItemImposto {
  valor: number;
  cfop: string;
  ncm: string;
  origem: number; // 0=nacional, 1=importado
}

export interface ImpostosCalculados {
  icms: {
    base: number;
    aliquota: number;
    valor: number;
  };
  ipi?: {
    base: number;
    aliquota: number;
    valor: number;
  };
  pis: {
    base: number;
    aliquota: number;
    valor: number;
  };
  cofins: {
    base: number;
    aliquota: number;
    valor: number;
  };
  totalImpostos: number;
}

/**
 * Calcula impostos para um item de NF-e
 * @param item Item com valor, cfop, ncm, origem
 * @param uf_destino UF de destino
 * @param regime 'SIMPLES' ou 'LUCRO_PRESUMIDO'
 * @returns Impostos calculados
 */
export function calcularImpostos(
  item: ItemImposto,
  uf_destino: string,
  regime: 'SIMPLES' | 'LUCRO_PRESUMIDO'
): ImpostosCalculados {
  const baseICMS = item.valor;
  const basePIS = item.valor;
  const baseCOFINS = item.valor;

  let icmsAliq = 0;
  let icmsValor = 0;
  let ipiAliq = 0;
  let ipiValor = 0;
  let pisAliq = 0;
  let pisValor = 0;
  let cofinsAliq = 0;
  let cofinsValor = 0;

  // ICMS - Simples Nacional (alíquotas aproximadas por UF)
  if (regime === 'SIMPLES') {
    const aliquotasSimples: Record<string, number> = {
      'SP': 18, 'RJ': 18, 'MG': 18, 'RS': 18, 'PR': 18, 'SC': 17,
      'DF': 18, 'GO': 17, 'MS': 17, 'MT': 17, 'BA': 18, 'CE': 18,
      'PE': 18, 'PB': 18, 'RN': 18, 'PI': 18, 'MA': 18, 'PA': 18,
      'AP': 18, 'AM': 18, 'RR': 17, 'AC': 17, 'RO': 17.5, 'TO': 18
    };
    icmsAliq = aliquotasSimples[uf_destino] || 18;
    icmsValor = (baseICMS * icmsAliq) / 100;

    // PIS/COFINS Simples: 0.65% cada
    pisAliq = 0.65;
    cofinsAliq = 0.65;
  } else {
    // Lucro Presumido
    const aliquotasLP: Record<string, number> = {
      'SP': 18, 'RJ': 20, 'MG': 18, 'RS': 17.5, 'PR': 18, 'SC': 17,
      'DF': 18, 'GO': 17, 'MS': 17, 'MT': 17, 'BA': 20.5, 'CE': 18,
      'PE': 20, 'PB': 18, 'RN': 18, 'PI': 18, 'MA': 18, 'PA': 18,
      'AP': 18, 'AM': 18, 'RR': 17, 'AC': 17, 'RO': 17.5, 'TO': 18
    };
    icmsAliq = aliquotasLP[uf_destino] || 18;
    icmsValor = (baseICMS * icmsAliq) / 100;

    // PIS/COFINS LP: 1.65% cada
    pisAliq = 1.65;
    cofinsAliq = 7.6;
  }

  pisValor = (basePIS * pisAliq) / 100;
  cofinsValor = (baseCOFINS * cofinsAliq) / 100;

  // IPI para produtos industrializados (simplificado)
  if (item.ncm.startsWith('84') || item.ncm.startsWith('85')) {
    ipiAliq = 10; // Exemplo
    ipiValor = (item.valor * ipiAliq) / 100;
  }

  const totalImpostos = icmsValor + ipiValor + pisValor + cofinsValor;

  return {
    icms: {
      base: baseICMS,
      aliquota: icmsAliq,
      valor: icmsValor
    },
    ipi: ipiAliq > 0 ? {
      base: item.valor,
      aliquota: ipiAliq,
      valor: ipiValor
    } : undefined,
    pis: {
      base: basePIS,
      aliquota: pisAliq,
      valor: pisValor
    },
    cofins: {
      base: baseCOFINS,
      aliquota: cofinsAliq,
      valor: cofinsValor
    },
    totalImpostos
  };
}