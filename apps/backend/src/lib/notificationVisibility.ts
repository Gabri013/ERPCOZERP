/**
 * Filtra notificações por setor de acordo com os papéis do usuário.
 * Master vê tudo; demais perfis só veem setores permitidos.
 */

const CAN_SEE_ALL = new Set(['master']);

/** Gerente geral enxerga todos os setores listados abaixo (visão global). */
const GERENTE_SEES_ALL_SECTORS = true;

const SECTOR_KEY_ALIASES: Record<string, string> = {
  vendas: 'vendas',
  estoque: 'estoque',
  producao: 'producao',
  produção: 'producao',
  financeiro: 'financeiro',
  rh: 'rh',
  engenharia: 'engenharia',
  expedição: 'expedicao',
  expedicao: 'expedicao',
  compras: 'compras',
  crm: 'crm',
  fiscal: 'fiscal',
  sistema: 'sistema',
};

/** Chave normalizada → códigos de role que podem ver alertas desse setor. */
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

export function normalizeNotificationSector(sector: string | null | undefined): string {
  if (!sector || typeof sector !== 'string') return '';
  const t = sector
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return SECTOR_KEY_ALIASES[t] ?? t;
}

export function rolesCanSeeNotificationSector(sector: string | null | undefined, roleCodes: string[]): boolean {
  const roles = new Set(roleCodes || []);
  if ([...roles].some((r) => CAN_SEE_ALL.has(r))) return true;
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
