import { describe, it, expect } from 'vitest';
import { migrateLegacyLayout } from '../../lib/defaultDashboardLayout.js';

describe('migrateLegacyLayout', () => {
  it('retorna array vazio se entrada for vazia', () => {
    expect(migrateLegacyLayout([])).toEqual([]);
  });

  it('remove IDs legados que têm mapeamento para novos', () => {
    const result = migrateLegacyLayout(['grafico_producao', 'grafico_vendas']);
    // grafico_producao → chart_producao_mes, grafico_vendas → chart_vendas_mes
    expect(result).not.toContain('grafico_producao');
    expect(result).not.toContain('grafico_vendas');
    expect(result).toContain('chart_producao_mes');
    expect(result).toContain('chart_vendas_mes');
  });

  it('não duplica IDs', () => {
    const result = migrateLegacyLayout(['kpi_vendas', 'kpi_vendas', 'kpi_producao']);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it('mantém IDs válidos conhecidos sem modificação', () => {
    const result = migrateLegacyLayout(['kpi_vendas', 'kpi_producao']);
    expect(result).toContain('kpi_vendas');
    expect(result).toContain('kpi_producao');
  });

  it('converte kpi_pedidos legado para kpi_vendas', () => {
    const result = migrateLegacyLayout(['kpi_pedidos']);
    expect(result).toContain('kpi_vendas');
    expect(result).not.toContain('kpi_pedidos');
  });

  it('converte alertas legado para alertas_estoque', () => {
    const result = migrateLegacyLayout(['alertas']);
    expect(result).toContain('alertas_estoque');
    expect(result).not.toContain('alertas');
  });

  it('retorna input original se nenhum ID for conhecido', () => {
    const unknown = ['id_desconhecido_1', 'id_desconhecido_2'];
    const result = migrateLegacyLayout(unknown);
    // sem IDs conhecidos, retorna o array original sem modificação
    expect(result).toEqual(unknown);
  });
});
