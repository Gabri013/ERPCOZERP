import { prisma } from '../infra/prisma.js';
import { getIO } from './io.js';

let timer: NodeJS.Timeout | null = null;
let scanCount = 0;

async function scanOverdueOrders() {
  const io = getIO();
  if (!io) return;

  scanCount++;
  try {
    const entity = await prisma.entity.findUnique({ where: { code: 'ordem_producao' } });
    if (!entity) return;

    const rows = await prisma.entityRecord.findMany({
      where: { entityId: entity.id, deletedAt: null },
      take: 500,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, data: true },
    });

    const now = Date.now();
    const overdue: Array<{ id: string; numero?: string }> = [];

    for (const r of rows) {
      const d = (r.data as Record<string, unknown>) || {};
      const prazoRaw = d.prazo ?? d.prazoLimite ?? d.prazoLimiteEtapaAtual;
      if (!prazoRaw) continue;

      let prazoMs: number | null = null;
      try {
        prazoMs = new Date(String(prazoRaw)).getTime();
      } catch {
        prazoMs = null;
      }
      if (!prazoMs || !Number.isFinite(prazoMs) || prazoMs >= now) continue;

      const st = String(d.status ?? d.statusNome ?? '').toLowerCase();
      if (['concluida', 'concluída', 'cancelada', 'encerrada'].some((x) => st.includes(x))) continue;

      overdue.push({ id: r.id, numero: d.numero != null ? String(d.numero) : undefined });
    }

    if (overdue.length > 0) {
      io.emit('op_atrasada', {
        scan: scanCount,
        count: overdue.length,
        ordens: overdue.slice(0, 50),
        emited_at: new Date().toISOString(),
      });
    }
  } catch {
    // silenciar scan periódico
  }
}

export function scheduleOverdueProductionScan(intervalMs = 180_000) {
  if (timer) clearInterval(timer);
  void scanOverdueOrders();
  timer = setInterval(() => void scanOverdueOrders(), intervalMs);
}
