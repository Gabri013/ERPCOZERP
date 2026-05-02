import { PERFIS_LABELS } from '@/lib/perfis';

/**
 * Código em `roles.code` (API) → chave em PERFIS_LABELS (UI).
 * Quando o código e a chave coincidem (setores: corte_laser, solda, …), usa identidade.
 */
const ROLE_CODE_TO_PERFIL_UX = {
  master:             'dono',
  gerente:            'gerente_geral',
  gerente_producao:   'gerente_producao',
  orcamentista_vendas: 'vendas',
  projetista:         'projetista',
  compras:            'compras',
  corte_laser:        'corte_laser',
  dobra_montagem:     'dobra_montagem',
  solda:              'solda',
  expedicao:          'expedicao',
  qualidade:          'qualidade',
  financeiro:         'financeiro',
  rh:                 'rh',
  user:               'visualizador',
};

/** Converte o papel principal do usuário para a chave de perfil exibida na UI. */
export function roleCodeToPerfilUxKey(roleCode) {
  const code = typeof roleCode === 'string' ? roleCode.trim() : '';
  if (!code) return ROLE_CODE_TO_PERFIL_UX.user;

  const mapped = ROLE_CODE_TO_PERFIL_UX[code];
  if (mapped) return mapped;

  if (PERFIS_LABELS[code]) return code;

  return ROLE_CODE_TO_PERFIL_UX.user;
}
