import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infra/prisma.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { getEffectivePermissionCodesForUserId } from '../../lib/effectivePermissions.js';
import { logImpersonationStart, logImpersonationEnd } from '../../services/auditService.js';

export const impersonateRouter = Router();

impersonateRouter.use(authenticate);

/**
 * POST /api/auth/impersonate/:userId
 * Master impersona outro usuário — requer role 'master'
 */
impersonateRouter.post('/:userId', requireRole('master'), async (req, res) => {
  const { userId } = req.params;
  const { reason = 'Impersonation para debug/support' } = req.body;

  try {
    // Validar que usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        company: {
          select: { id: true, razaoSocial: true, ativo: true },
        },
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!targetUser.active) {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    // Obter permissões efetivas do usuário alvo
    const permissions = await getEffectivePermissionCodesForUserId(userId);
    const roles = targetUser.roles.map((r) => r.role.code);

    // Gerar novo token para usuário alvo
    const secret = process.env.JWT_SECRET || 'dev_change_me';
    const token = jwt.sign(
      {
        sub: targetUser.id,
        email: targetUser.email,
        roles,
        permissions,
        companyId: targetUser.companyId,
      },
      secret,
      { expiresIn: '7d' }
    );

    // Registrar auditoria de impersonation
    await logImpersonationStart(
      req.user!.userId,
      userId,
      reason,
      req.user!.companyId,
      req.ip || req.socket.remoteAddress,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        roles,
        companyId: targetUser.companyId,
        company: targetUser.company
          ? { id: targetUser.company.id, name: targetUser.company.razaoSocial }
          : null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    // eslint-disable-next-line no-console
    console.error('[impersonate] Erro:', msg);
    res.status(500).json({ error: 'Erro ao impersonar usuário' });
  }
});

/**
 * POST /api/auth/impersonate/stop
 * Parar impersonation — logs auditoria
 */
impersonateRouter.post('/stop', async (req, res) => {
  const { impersonatedUserId } = req.body;

  if (!impersonatedUserId) {
    return res.status(400).json({ error: 'impersonatedUserId obrigatório' });
  }

  try {
    // Registrar auditoria de fim de impersonation
    await logImpersonationEnd(
      req.user!.userId,
      impersonatedUserId,
      req.user!.companyId,
      req.ip || req.socket.remoteAddress
    );

    res.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    // eslint-disable-next-line no-console
    console.error('[impersonate/stop] Erro:', msg);
    res.status(500).json({ error: 'Erro ao finalizar impersonation' });
  }
});

/**
 * GET /api/auth/impersonate/logs
 * Ver logs de impersonation — master only
 */
impersonateRouter.get('/logs', requireRole('master'), async (_req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['IMPERSONATE_START', 'IMPERSONATE_END'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      action: log.action,
      masterId: log.masterId,
      masterEmail: log.user?.email,
      masterName: log.user?.fullName,
      targetUserId: log.targetId,
      reason: log.reason,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress,
    }));

    res.json({ success: true, data: formatted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    // eslint-disable-next-line no-console
    console.error('[impersonate/logs] Erro:', msg);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});
