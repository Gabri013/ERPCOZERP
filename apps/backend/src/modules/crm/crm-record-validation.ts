import { prisma } from '../../infra/prisma.js';
import {
  CLOSED_OPPORTUNITY_STAGES,
  assertValidOpportunityStage,
  normalizeOpportunityStage,
} from './crm-constants.js';
import {
  opportunityHasFuturePendingActivity,
  opportunityHasLinkedOrcamento,
  opportunityHasRecentTouchWithinDays,
} from './crm-opportunity-activity.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Aceita `responsavelId` (UUID) ou texto legado `responsavel`. */
export function hasResponsibleUser(d: Record<string, unknown>): boolean {
  const id = String(d.responsavelId ?? d.responsavel_id ?? '').trim();
  if (UUID_RE.test(id)) return true;
  const leg = String(d.responsavel ?? '').trim();
  return leg.length > 0;
}

export function validateCrmLeadWrite(merged: Record<string, unknown>, roles: string[]): void {
  if (roles.includes('master')) return;
  if (!hasResponsibleUser(merged)) {
    throw new Error('CRM: informe o responsável (responsavelId do usuário ou nome no campo responsável).');
  }
}

/**
 * Regras de oportunidade (Fase A):
 * - Estágio sempre no conjunto canônico.
 * - Responsável obrigatório.
 * - Estágios abertos exceto "Novo" exigem ao menos uma atividade pendente com data >= hoje (vínculo oportunidade_id).
 */
export async function validateCrmOpportunityWrite(params: {
  merged: Record<string, unknown>;
  recordId: string | null;
  roles: string[];
}): Promise<void> {
  const { merged, recordId, roles } = params;

  const raw = String(merged.estagio ?? merged.stage ?? '');
  const stage = normalizeOpportunityStage(raw);
  merged.estagio = stage;
  merged.stage = stage;
  assertValidOpportunityStage(stage);

  if (stage === 'Fechado perdido') {
    const mp = String(merged.motivo_perda ?? merged.motivoPerda ?? '').trim();
    if (!mp) {
      throw new Error('CRM: informe motivo_perda ao marcar como Fechado perdido.');
    }
  }

  if (roles.includes('master')) return;

  if (!hasResponsibleUser(merged)) {
    throw new Error('CRM: informe o responsável (responsavelId do usuário ou nome no campo responsável).');
  }

  if (CLOSED_OPPORTUNITY_STAGES.has(stage)) return;

  if (!recordId) {
    if (stage !== 'Novo') {
      throw new Error(
        'CRM: nova oportunidade deve iniciar no estágio "Novo". Depois cadastre uma atividade futura e avance o estágio.',
      );
    }
    return;
  }

  if (stage === 'Novo') return;

  let prevStage = '';
  if (recordId) {
    const row = await prisma.entityRecord.findUnique({ where: { id: recordId } });
    const prevData =
      row?.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {};
    prevStage = normalizeOpportunityStage(String(prevData.estagio ?? prevData.stage ?? ''));
  }
  const stageTransition = prevStage !== stage;

  if (stageTransition && !roles.includes('master')) {
    if (stage === 'Negociação') {
      const recent = await opportunityHasRecentTouchWithinDays(recordId, 2);
      if (!recent) {
        throw new Error(
          'CRM: para avançar a "Negociação" é necessária atividade (pendente) com data nos últimos 2 dias, vinculada à oportunidade.',
        );
      }
    }
    if (stage === 'Proposta enviada') {
      const hasQuote = await opportunityHasLinkedOrcamento(recordId, merged);
      if (!hasQuote) {
        throw new Error(
          'CRM: para "Proposta enviada" vincule um orçamento (campo orcamento_id ou registo em Orçamentos com esta oportunidade).',
        );
      }
    }
  }

  const ok = await opportunityHasFuturePendingActivity(recordId);
  if (!ok) {
    throw new Error(
      'CRM: oportunidades fora do estágio "Novo" precisam de atividade pendente com data a partir de hoje, vinculada por oportunidade_id.',
    );
  }
}
