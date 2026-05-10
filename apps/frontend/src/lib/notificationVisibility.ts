/**
 * Espelha apps/backend/src/lib/notificationVisibility.ts — manter regras alinhadas.
 */
const CAN_SEE_ALL: Set<string> = new Set(['master']);
const GERENTE_SEES_ALL_SECTORS: boolean = true;

const SECTOR_KEY_ALIASES: Record<string, string> = {
  vendas: 'vendas',
  estoque: 'estoque',
  producao: 'producao',
  produção: 'producao',
  financeiro: 'financeiro',
  rh: 'rh',
  engenharia: 'engenharia',
  expedicao: 'expedicao',
  expedição: 'expedicao',
  compras: 'compras',
  crm: 'crm',
  fiscal: 'fiscal',
  sistema: 'sistema',
};

const SECTOR_VISIBLE_ROLES: Record<string, string[]> = {
  vendas: ['gerente', 'orcamentista_vendas', 'gerente_producao'],
  estoque: ['gerente', 'gerente_producao', 'projetista', 'qualidade', 'corte_laser', 'dobra_montagem', 'solda'],
  producao: ['gerente', 'gerente_producao', 'corte_laser', 'dobra_montagem', 'solda', 'expedicao', 'qualidade'],
  financeiro: ['gerente', 'financeiro'],
  rh: ['gerente', 'rh'],
  engenharia: ['gerente', 'projetista'],
  expedicao: ['gerente', 'gerente_producao', 'expedicao'],
  compras: ['gerente', 'orcamentista_vendas'],
  crm: ['gerente', 'orcamentista_vendas'],
  fiscal: ['gerente', 'financeiro'],
  sistema: ['gerente', 'gerente_producao'],
};

export function normalizeNotificationSector(sector: string | undefined | null): string {
  if (!sector || typeof sector !== 'string') return '';
  const t = sector
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return SECTOR_KEY_ALIASES[t] ?? t;
}

/** @param {string[]|undefined} roleCodes */
export function rolesCanSeeNotificationSector(sector: string, roleCodes: string[] | undefined): boolean {
  const roles = new Set(roleCodes || []);
  for (const r of roles) {
    if (CAN_SEE_ALL.has(r)) return true;
  }
  if (GERENTE_SEES_ALL_SECTORS && roles.has('gerente')) return true;

  const key = normalizeNotificationSector(sector);
  if (!key) {
    return roles.has('master') || roles.has('gerente');
  }

  const allowed = SECTOR_VISIBLE_ROLES[key];
  if (!allowed || allowed.length === 0) {
    return roles.has('gerente') || roles.has('gerente_producao');
  }
  return allowed.some((code) => roles.has(code));
}
