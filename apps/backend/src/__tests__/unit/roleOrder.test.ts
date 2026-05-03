import { describe, it, expect } from 'vitest';
import { ROLE_PRIORITY_ORDER, sortRolesByPriority } from '../../lib/roleOrder.js';

describe('roleOrder — Unidade', () => {
  it('ROLE_PRIORITY_ORDER é um array não vazio', () => {
    expect(Array.isArray(ROLE_PRIORITY_ORDER)).toBe(true);
    expect(ROLE_PRIORITY_ORDER.length).toBeGreaterThan(0);
  });

  it('master é o primeiro na ordem de prioridade', () => {
    expect(ROLE_PRIORITY_ORDER[0]).toBe('master');
  });

  it('sortRolesByPriority → master vem antes de gerente', () => {
    const sorted = sortRolesByPriority(['gerente', 'master']);
    expect(sorted[0]).toBe('master');
  });

  it('sortRolesByPriority → gerente vem antes de user', () => {
    const sorted = sortRolesByPriority(['user', 'gerente']);
    expect(sorted[0]).toBe('gerente');
  });

  it('sortRolesByPriority → role desconhecido vai para o final', () => {
    const sorted = sortRolesByPriority(['role_inexistente', 'gerente']);
    expect(sorted[sorted.length - 1]).toBe('role_inexistente');
  });

  it('sortRolesByPriority → deduplica roles', () => {
    const sorted = sortRolesByPriority(['gerente', 'gerente', 'master']);
    expect(sorted.length).toBe(2);
  });

  it('sortRolesByPriority → array vazio retorna []', () => {
    expect(sortRolesByPriority([])).toEqual([]);
  });
});
