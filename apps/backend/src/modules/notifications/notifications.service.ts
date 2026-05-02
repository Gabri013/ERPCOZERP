import { rolesCanSeeNotificationSector } from '../../lib/notificationVisibility.js';

type NotifRow = {
  sector: string | null;
  targetRoles?: unknown;
  targetModule?: string | null;
};

/**
 * Filtra notificações pelo setor e, opcionalmente, `targetRoles` / `targetModule`.
 */
export function filterNotificationsByUserRole<T extends NotifRow>(
  notifications: T[],
  userRoles: string[],
  opts?: { module?: string | null },
): T[] {
  return notifications.filter((n) => {
    if (!rolesCanSeeNotificationSector(n.sector, userRoles)) return false;
    if (opts?.module && n.targetModule && n.targetModule !== opts.module) return false;
    if (n.targetRoles != null && Array.isArray(n.targetRoles) && (n.targetRoles as unknown[]).length > 0) {
      const codes = (n.targetRoles as unknown[]).map(String);
      if (!codes.some((c) => userRoles.includes(c))) return false;
    }
    return true;
  });
}
