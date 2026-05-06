import { prisma } from '../../infra/prisma.js';

async function entityRecords(code: string) {
  const ent = await prisma.entity.findUnique({ where: { code } });
  if (!ent) return [];
  return prisma.entityRecord.findMany({
    where: { entityId: ent.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function cashflow(from?: Date, to?: Date) {
  const [rec, pay] = await Promise.all([entityRecords('conta_receber'), entityRecords('conta_pagar')]);
  const rows: Array<{ date: string; tipo: 'ENTRADA' | 'SAIDA'; valor: number; desc: string }> = [];

  const inRange = (d: Date) => {
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  for (const r of rec) {
    const d = r.data as Record<string, unknown>;
    const raw = d.data_vencimento || d.vencimento;
    const dt = raw ? new Date(String(raw)) : r.createdAt;
    if (!inRange(dt)) continue;
    const status = String(d.status || '').toLowerCase();
    const valor = num(d.valor);
    if (status === 'recebido' || status === 'pago') {
      rows.push({
        date: dt.toISOString().slice(0, 10),
        tipo: 'ENTRADA',
        valor,
        desc: String(d.descricao || 'Receita'),
      });
    }
  }
  for (const r of pay) {
    const d = r.data as Record<string, unknown>;
    const raw = d.data_vencimento || d.vencimento;
    const dt = raw ? new Date(String(raw)) : r.createdAt;
    if (!inRange(dt)) continue;
    const status = String(d.status || '').toLowerCase();
    const valor = num(d.valor);
    if (status === 'pago') {
      rows.push({
        date: dt.toISOString().slice(0, 10),
        tipo: 'SAIDA',
        valor,
        desc: String(d.descricao || 'Despesa'),
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const series = rows.map((x) => {
    running += x.tipo === 'ENTRADA' ? x.valor : -x.valor;
    return { ...x, saldo: running };
  });
  return { rows: series };
}

export async function dre(from?: Date, to?: Date) {
  const cf = await cashflow(from, to);
  let receita = 0;
  let despesa = 0;
  for (const r of cf.rows) {
    if (r.tipo === 'ENTRADA') receita += r.valor;
    else despesa += r.valor;
  }
  const resultado = receita - despesa;
  return {
    receita,
    despesa,
    resultado,
    periodo: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
  };
}

export async function conciliation(bankAccount?: string) {
  const pay = await entityRecords('conta_pagar');
  const rec = await entityRecords('conta_receber');
  const pendente = [...pay, ...rec].filter((r) => {
    const st = String((r.data as any)?.status || '').toLowerCase();
    return st === 'aberto' || st === 'vencido';
  });
  return {
    bankAccount: bankAccount ?? 'Principal',
    pendencias: pendente.length,
    items: pendente.slice(0, 100).map((r) => ({
      id: r.id,
      tipo: (r.data as any)?.tipo || '—',
      valor: num((r.data as any)?.valor),
      vencimento: (r.data as any)?.data_vencimento,
    })),
  };
}

export async function getCostCenters() {
  return prisma.costCenter.findMany({ where: { ativo: true }, orderBy: { codigo: 'asc' } });
}

export async function createCostCenter(data: { codigo: string; nome: string; descricao?: string }) {
  return prisma.costCenter.create({
    data: {
      codigo: data.codigo,
      nome: data.nome,
      descricao: data.descricao,
    },
  });
}
