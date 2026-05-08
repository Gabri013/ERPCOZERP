import { describe, expect, it } from 'vitest';
import '../helpers/prisma.mock.js';
import { calcularINSS, calcularIRRF } from '../../modules/hr/hr.service.js';

describe('calcularINSS', () => {
  it('faixa 1: ate R$ 1.518,00 = 7,5%', () => {
    expect(calcularINSS(1518)).toBeCloseTo(113.85, 2);
  });

  it('faixa 2: R$ 2.793,88 = 9%', () => {
    expect(calcularINSS(2793.88)).toBeCloseTo(251.45, 2);
  });

  it('faixa 3: R$ 4.190,83 = 12%', () => {
    expect(calcularINSS(4190.83)).toBeCloseTo(502.9, 2);
  });

  it('faixa 4: R$ 8.157,41 = 14%', () => {
    expect(calcularINSS(8157.41)).toBeCloseTo(1142.04, 2);
  });

  it('salario zero = INSS zero', () => {
    expect(calcularINSS(0)).toBe(0);
  });

  it('salario negativo = INSS zero', () => {
    expect(calcularINSS(-100)).toBeLessThanOrEqual(0);
  });
});

describe('calcularIRRF', () => {
  it('isento: ate R$ 2.428,80', () => {
    expect(calcularIRRF(2428.8)).toBe(0);
  });

  it('faixa 7,5%: R$ 3.000,00', () => {
    const resultado = calcularIRRF(3000);
    expect(resultado).toBeGreaterThan(0);
    expect(resultado).toBeLessThan(200);
  });

  it('faixa 27,5%: R$ 10.000,00', () => {
    const resultado = calcularIRRF(10000);
    expect(resultado).toBeGreaterThan(1000);
  });

  it('base negativa = IRRF zero', () => {
    expect(calcularIRRF(-100)).toBe(0);
  });
});
