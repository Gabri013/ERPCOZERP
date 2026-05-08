import { prisma } from '../infra/prisma.js';

/**
 * Serviço de auditoria para registrar ações sensíveis
 * Impersonation, logins, modificações críticas, etc.
 */

export interface AuditLogData {
  action: string; // LOGIN, LOGOUT, IMPERSONATE_START, IMPERSONATE_END, CREATE, UPDATE, DELETE, etc.
  userId?: string; // User que fez a ação
  targetId?: string; // User afetado (ex: impersonation)
  masterId?: string; // Master que fez impersonation
  entityId?: string; // Entidade afetada
  recordId?: string; // Registro afetado
  fieldName?: string; // Campo modificado
  oldValue?: string; // Valor anterior
  newValue?: string; // Valor novo
  reason?: string; // Descrição/motivo
  ipAddress?: string; // IP do usuário
  userAgent?: string; // User-Agent do browser
  metadata?: Record<string, unknown>; // Dados adicionais
  companyId?: string; // Empresa afetada
}

/**
 * Registrar ação de auditoria no banco
 */
export async function logAuditAction(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        targetId: data.targetId,
        masterId: data.masterId,
        entityId: data.entityId,
        recordId: data.recordId,
        fieldName: data.fieldName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        reason: data.reason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        companyId: data.companyId,
      },
    });
  } catch (e) {
    // Log erro mas não bloqueia a operação
    // eslint-disable-next-line no-console
    console.error('[auditService] Erro ao registrar auditoria:', e instanceof Error ? e.message : e);
  }
}

/**
 * Log de impersonação iniciada
 */
export async function logImpersonationStart(
  masterId: string,
  targetUserId: string,
  reason: string,
  companyId?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  return logAuditAction({
    action: 'IMPERSONATE_START',
    masterId,
    targetId: targetUserId,
    reason,
    companyId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log de impersonação finalizada
 */
export async function logImpersonationEnd(
  masterId: string,
  targetUserId: string,
  companyId?: string,
  ipAddress?: string,
) {
  return logAuditAction({
    action: 'IMPERSONATE_END',
    masterId,
    targetId: targetUserId,
    companyId,
    ipAddress,
  });
}

/**
 * Log de login
 */
export async function logLogin(
  userId: string,
  email: string,
  companyId?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  return logAuditAction({
    action: 'LOGIN',
    userId,
    reason: `Login via ${email}`,
    companyId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log de logout
 */
export async function logLogout(userId: string, ipAddress?: string) {
  return logAuditAction({
    action: 'LOGOUT',
    userId,
    ipAddress,
  });
}

/**
 * Buscar logs de auditoria (com paginação)
 */
export async function getAuditLogs(
  filters: {
    action?: string;
    userId?: string;
    targetId?: string;
    companyId?: string;
    limit?: number;
    skip?: number;
  } = {},
) {
  const { action, userId, targetId, companyId, limit = 100, skip = 0 } = filters;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (targetId) where.targetId = targetId;
  if (companyId) where.companyId = companyId;

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 500), // Limite máximo 500
    skip,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  });
}

/**
 * Logs de impersonação para um master
 */
export async function getImpersonationLogs(masterId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: {
      masterId,
      action: { in: ['IMPERSONATE_START', 'IMPERSONATE_END'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
