/** Estágios canônicos do funil (Pipeline, validação e API). */
export const CRM_OPPORTUNITY_STAGES = [
  'Novo',
  'Qualificado',
  'Em orçamento',
  'Proposta enviada',
  'Negociação',
  'Aguardando cliente',
  'Fechado ganho',
  'Fechado perdido',
] as const;

export type CrmOpportunityStage = (typeof CRM_OPPORTUNITY_STAGES)[number];

export const CLOSED_OPPORTUNITY_STAGES = new Set<string>(['Fechado ganho', 'Fechado perdido']);

/** Estágios do funil até fechamento (exclui apenas “perdido” para métricas de progresso). */
export const CRM_FUNNEL_PROGRESS_STAGES = CRM_OPPORTUNITY_STAGES.filter((s) => s !== 'Fechado perdido');

/** Próximo estágio na ordem canónica (null se fechado ou último). */
export function nextStageInCrmPipeline(stage: string): string | null {
  const s = normalizeOpportunityStage(stage);
  if (CLOSED_OPPORTUNITY_STAGES.has(s)) return null;
  const idx = (CRM_OPPORTUNITY_STAGES as readonly string[]).indexOf(s);
  if (idx < 0 || idx >= CRM_OPPORTUNITY_STAGES.length - 1) return null;
  const nxt = CRM_OPPORTUNITY_STAGES[idx + 1] as string;
  return CLOSED_OPPORTUNITY_STAGES.has(nxt) && nxt !== 'Fechado ganho' ? null : nxt;
}

/** Mapeia estágios antigos / UI legada para o padrão atual. */
export const LEGACY_STAGE_TO_CANONICAL: Record<string, string> = {
  Lead: 'Novo',
  Qualificação: 'Qualificado',
  Engenharia: 'Em orçamento',
  Orçamento: 'Em orçamento',
  'Proposta Enviada': 'Proposta enviada',
  Proposta: 'Proposta enviada',
  Negociação: 'Negociação',
  'Aprovação Financeira': 'Aguardando cliente',
  Fechado: 'Negociação',
  Ganho: 'Fechado ganho',
  Perdido: 'Fechado perdido',
  'Fechado Ganho': 'Fechado ganho',
  'Fechado Perdido': 'Fechado perdido',
};

const STAGE_SET = new Set(CRM_OPPORTUNITY_STAGES as readonly string[]);
const STAGE_LOWER_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  CRM_OPPORTUNITY_STAGES.map((stage) => [stage.toLowerCase(), stage]),
);
const LEGACY_STAGE_TO_CANONICAL_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_STAGE_TO_CANONICAL).map(([key, value]) => [key.toLowerCase(), value]),
);

export function normalizeOpportunityStage(raw: string | null | undefined): string {
  const s = String(raw || '').trim();
  if (!s) return 'Novo';
  if (STAGE_SET.has(s)) return s;
  const normalized = s.toLowerCase();
  const mapped =
    LEGACY_STAGE_TO_CANONICAL[s] ??
    LEGACY_STAGE_TO_CANONICAL_LOWER[normalized] ??
    STAGE_LOWER_TO_CANONICAL[normalized];
  if (mapped && STAGE_SET.has(mapped)) return mapped;
  return 'Novo';
}

export function assertValidOpportunityStage(stage: string): void {
  if (!STAGE_SET.has(String(stage || '').trim())) {
    throw new Error(
      `Estágio inválido. Use um dos valores: ${CRM_OPPORTUNITY_STAGES.join(', ')}`,
    );
  }
}
