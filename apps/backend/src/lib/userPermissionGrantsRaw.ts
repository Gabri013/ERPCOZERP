import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../infra/prisma.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Lista códigos de permissão extra. `null` = tabela inexistente / erro irrecuperável. */
export async function listUserGrantCodesRaw(userId: string): Promise<string[] | null> {
  if (!UUID_RE.test(userId)) return [];
  try {
    const rows = await prisma.userPermissionGrant.findMany({
      where: { userId, permission: { active: true } },
      include: { permission: { select: { code: true } } },
    });
    return rows.map((r) => r.permission.code);
  } catch {
    try {
      const rows = await prisma.$queryRaw<Array<{ code: string }>>`
        SELECT p.code
        FROM user_permission_grants g
        INNER JOIN permissions p ON p.id = g.permission_id
        WHERE g.user_id = ${userId}::uuid
          AND p.active = true
      `;
      return rows.map((r) => r.code);
    } catch {
      return null;
    }
  }
}

export type GrantOpResult = { ok: true } | { ok: false; message: string };

/** Remove todas as permissões extra do utilizador. */
export async function deleteAllUserGrantsRaw(userId: string): Promise<GrantOpResult> {
  if (!UUID_RE.test(userId)) return { ok: false, message: 'userId inválido (esperado UUID).' };
  try {
    await prisma.userPermissionGrant.deleteMany({ where: { userId } });
    return { ok: true };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[userPermissionGrants] deleteMany ORM falhou, a tentar SQL:', errMsg(e));
    }
    try {
      await prisma.$executeRaw`
        DELETE FROM user_permission_grants
        WHERE user_id = ${userId}::uuid
      `;
      return { ok: true };
    } catch (e2) {
      return { ok: false, message: errMsg(e2) };
    }
  }
}

/** Apaga e reinsere extras (transação). ORM primeiro; SQL bruto como contingência. */
export async function replaceUserGrantCodesRaw(
  userId: string,
  permissionIds: string[],
  assignedBy: string | null,
): Promise<GrantOpResult> {
  if (!UUID_RE.test(userId)) return { ok: false, message: 'userId inválido (esperado UUID).' };
  const validIds = [...new Set(permissionIds.filter((pid) => UUID_RE.test(pid)))];
  const assign = assignedBy && UUID_RE.test(assignedBy) ? assignedBy : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userPermissionGrant.deleteMany({ where: { userId } });
      if (validIds.length > 0) {
        await tx.userPermissionGrant.createMany({
          data: validIds.map((permissionId) => ({
            id: randomUUID(),
            userId,
            permissionId,
            ...(assign ? { assignedBy: assign } : {}),
          })),
        });
      }
    });
    return { ok: true };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[userPermissionGrants] replace ORM falhou, a tentar SQL:', errMsg(e));
    }
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          DELETE FROM user_permission_grants
          WHERE user_id = ${userId}::uuid
        `;
        for (const pid of validIds) {
          if (assign) {
            await tx.$executeRaw`
              INSERT INTO user_permission_grants (id, user_id, permission_id, assigned_by, created_at)
              VALUES (gen_random_uuid(), ${userId}::uuid, ${pid}::uuid, ${assign}::uuid, NOW())
            `;
          } else {
            await tx.$executeRaw`
              INSERT INTO user_permission_grants (id, user_id, permission_id, created_at)
              VALUES (gen_random_uuid(), ${userId}::uuid, ${pid}::uuid, NOW())
            `;
          }
        }
      });
      return { ok: true };
    } catch (e2) {
      return { ok: false, message: errMsg(e2) };
    }
  }
}

/** `true` = tabela existe e respondeu. */
export async function userPermissionGrantsTableExists(): Promise<boolean> {
  try {
    await prisma.userPermissionGrant.findFirst({ take: 1 });
    return true;
  } catch {
    try {
      await prisma.$queryRawUnsafe('SELECT 1 FROM "user_permission_grants" LIMIT 1');
      return true;
    } catch {
      try {
        await prisma.$queryRaw(Prisma.sql`SELECT 1 FROM user_permission_grants LIMIT 1`);
        return true;
      } catch {
        return false;
      }
    }
  }
}
