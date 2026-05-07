import { Prisma, StockMovementType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../infra/prisma.js';
import { applyStockMovement, getOrCreateDefaultLocation } from '../stock/stock.service.js';

type Db = Prisma.TransactionClient | typeof prisma;

/** UI labels ↔ valores persistidos */
const STATUS_UI_TO_DB: Record<string, string> = {
  rascunho: 'DRAFT',
  aberta: 'DRAFT',
  planejada: 'PLANNED',
  liberada: 'RELEASED',
  em_andamento: 'IN_PROGRESS',
  pausada: 'PAUSED',
  concluida: 'DONE',
  cancelada: 'CANCELLED',
};

const STATUS_DB_TO_UI: Record<string, string> = {
  DRAFT: 'aberta',
  PLANNED: 'aberta',
  RELEASED: 'em_andamento',
  IN_PROGRESS: 'em_andamento',
  PAUSED: 'pausada',
  DONE: 'concluida',
  COMPLETED: 'concluida',
  CANCELLED: 'cancelada',
};

export function uiStatusFromDb(db: string): string {
  return STATUS_DB_TO_UI[db] ?? db.toLowerCase();
}

export function dbStatusFromUi(ui: string): string {
  const k = ui.toLowerCase();
  return STATUS_UI_TO_DB[k] ?? ui.toUpperCase();
}

function mapWoRow(wo: {
  id: string;
  number: string;
  status: string;
  saleOrderId: string | null;
  productId: string | null;
  routingId: string | null;
  quantityPlanned: Prisma.Decimal;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  dueDate: Date | null;
  kanbanColumn: string;
  kanbanOrder: number;
  priority: string;
  notes: string | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  saleOrder?: { customer?: { name: string } | null } | null;
  product?: { name: string; code: string } | null;
  responsible?: { fullName: string } | null;
  items?: Array<{ quantity: Prisma.Decimal; product: { name: string; code: string } }>;
  categoryCode?: string | null;
  categoryLabel?: string | null;
}) {
  const custName = wo.saleOrder?.customer?.name ?? '';
  const prod =
    wo.product ??
    (wo.items?.length ? { name: wo.items[0].product.name, code: wo.items[0].product.code } : null);
  const pri = String(wo.priority || 'normal').toLowerCase();
  const prioridadeLabel = pri === 'urgente' ? 'Urgente' : pri === 'alta' ? 'Alta' : pri === 'baixa' ? 'Baixa' : 'Normal';

  return {
    id: wo.id,
    numero: wo.number,
    number: wo.number,
    status: uiStatusFromDb(wo.status),
    statusRaw: wo.status,
    saleOrderId: wo.saleOrderId,
    productId: wo.productId,
    routingId: wo.routingId,
    quantityPlanned: wo.quantityPlanned.toNumber(),
    quantidade: wo.quantityPlanned.toNumber(),
    scheduledStart: wo.scheduledStart?.toISOString() ?? null,
    scheduledEnd: wo.scheduledEnd?.toISOString() ?? null,
    dueDate: wo.dueDate?.toISOString() ?? null,
    prazo: wo.dueDate?.toISOString() ?? null,
    kanbanColumn: wo.kanbanColumn,
    kanbanOrder: wo.kanbanOrder,
    priority: wo.priority,
    prioridade: prioridadeLabel,
    categoria_codigo: wo.categoryCode ?? null,
    categoria_label: wo.categoryLabel ?? null,
    notes: wo.notes,
    finishedAt: wo.finishedAt?.toISOString() ?? null,
    createdAt: wo.createdAt.toISOString(),
    updatedAt: wo.updatedAt.toISOString(),
    dataEmissao: wo.createdAt.toISOString(),
    clienteNome: custName,
    produtoDescricao: prod ? `${prod.code} — ${prod.name}` : '',
    produtoCodigo: prod?.code,
    responsavel: wo.responsible?.fullName ?? '',
    items: wo.items,
  };
}

const woInclude = {
  saleOrder: { include: { customer: true } },
  product: true,
  responsible: { select: { fullName: true } },
  items: { include: { product: true } },
} satisfies Prisma.WorkOrderInclude;

export async function listWorkOrders() {
  const rows = await prisma.workOrder.findMany({
    orderBy: [{ kanbanColumn: 'asc' }, { kanbanOrder: 'asc' }, { createdAt: 'desc' }],
    include: woInclude,
  });
  return rows.map((w) => mapWoRow(w));
}

export async function getWorkOrder(id: string) {
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      ...woInclude,
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { fullName: true } } } },
      appointments: {
        include: { machine: true, routingStage: true },
        orderBy: { scheduledStart: 'asc' },
      },
      routing: { include: { stages: { orderBy: { sortOrder: 'asc' }, include: { machine: true } } } },
    },
  });
  if (!wo) return null;
  return {
    ...mapWoRow(wo),
    statusHistory: wo.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
      userName: h.user?.fullName ?? null,
    })),
    appointments: wo.appointments.map((a) => ({
      id: a.id,
      scheduledStart: a.scheduledStart?.toISOString() ?? null,
      scheduledEnd: a.scheduledEnd?.toISOString() ?? null,
      status: a.status,
      machine: a.machine,
      routingStage: a.routingStage,
    })),
    routing: wo.routing,
  };
}

async function nextWorkOrderNumber(tx: Db): Promise<string> {
  const last = await tx.workOrder.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } });
  const m = last?.number?.match(/-(\d+)$/);
  const n = m ? Number(m[1]) + 1 : 1;
  return `OP-${String(n).padStart(5, '0')}`;
}

export async function createWorkOrder(
  input: {
    number?: string;
    saleOrderId?: string | null;
    productId: string;
    routingId?: string | null;
    quantityPlanned: number;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    dueDate?: string | null;
    kanbanColumn?: string;
    priority?: string;
    notes?: string | null;
    responsibleUserId?: string | null;
  },
  userId?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    let priority = String(input.priority ?? 'normal').toLowerCase();
    if (priority.includes('urg')) priority = 'urgente';
    else if (['alta', 'baixa', 'normal'].includes(priority)) {
      /* mantém */
    } else priority = 'normal';

    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { code: true, group: true, productType: true },
    });

    let number = input.number?.trim() || '';
    let categoryCode: string | undefined;
    let categoryLabel: string | undefined;
    if (!number) {
      try {
        const { allocateWorkOrderIndustrial } = await import('../meta-code/meta-code.service.js');
        const gen = await allocateWorkOrderIndustrial(tx, {
          group: product?.group,
          productType: product?.productType,
          productCode: product?.code,
          codigoProduto: product?.code,
        });
        if (gen) {
          number = gen.number;
          categoryCode = gen.categoryCode;
          categoryLabel = gen.categoryLabel;
        }
      } catch {
        /* meta-code opcional */
      }
      if (!number) number = await nextWorkOrderNumber(tx);
    }

    const wo = await tx.workOrder.create({
      data: {
        id: randomUUID(),
        number,
        status: 'DRAFT',
        saleOrderId: input.saleOrderId ?? undefined,
        productId: input.productId,
        routingId: input.routingId ?? undefined,
        quantityPlanned: new Prisma.Decimal(input.quantityPlanned),
        scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
        scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        kanbanColumn: input.kanbanColumn ?? 'BACKLOG',
        priority,
        categoryCode,
        categoryLabel,
        notes: input.notes ?? undefined,
        responsibleUserId: input.responsibleUserId ?? undefined,
        statusHistory: {
          create: {
            id: randomUUID(),
            fromStatus: null,
            toStatus: 'DRAFT',
            userId: userId ?? undefined,
            note: 'Criação',
          },
        },
        items: {
          create: {
            id: randomUUID(),
            productId: input.productId,
            quantity: new Prisma.Decimal(input.quantityPlanned),
          },
        },
      },
      include: woInclude,
    });
    return mapWoRow(wo);
  });
}

function isFinishedWorkOrderStatus(status: string) {
  return status === 'DONE' || status === 'COMPLETED';
}

async function applyFinishMovementsForWorkOrder(
  tx: Db,
  wo: {
    id: string;
    number: string;
    productId: string | null;
    quantityPlanned: Prisma.Decimal;
    items: Array<{ productId: string; quantity: Prisma.Decimal }>;
    product?: { id: string; entityRecordId?: string | null } | null;
  },
  locationId: string,
  userId?: string | null,
) {
  const mainProductId = wo.productId ?? wo.items[0]?.productId;
  if (!mainProductId) throw new Error('Produto acabado não definido na OP');

  const qty = wo.quantityPlanned;

  await applyStockMovement(
    {
      productId: mainProductId,
      locationId,
      type: StockMovementType.ENTRADA,
      quantity: qty,
      userId: userId ?? undefined,
      reference: wo.number,
      notes: 'Entrada acabado — conclusão OP',
    },
    tx,
  );

  const product = await tx.product.findUnique({
    where: { id: mainProductId },
    select: { id: true, entityRecordId: true },
  });

  if (product?.entityRecordId) {
    const bom = await tx.billOfMaterialLine.findMany({
      where: { productRecordId: product.entityRecordId },
    });
    for (const line of bom) {
      const comp = await tx.product.findFirst({ where: { code: line.componentCode } });
      if (!comp) continue;
      const need = new Prisma.Decimal(line.quantity).mul(qty);
      await applyStockMovement(
        {
          productId: comp.id,
          locationId,
          type: StockMovementType.SAIDA,
          quantity: need,
          userId: userId ?? undefined,
          reference: wo.number,
          notes: `Consumo BOM — ${line.componentCode}`,
        },
        tx,
      );
    }
  }
}

export async function updateWorkOrder(
  id: string,
  patch: Partial<{
    saleOrderId: string | null;
    productId: string;
    routingId: string | null;
    quantityPlanned: number;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    dueDate: string | null;
    kanbanColumn: string;
    kanbanOrder: number;
    priority: string;
    notes: string | null;
    responsibleUserId: string | null;
    status: string;
  }>,
  userId?: string | null,
) {
  const existing = await prisma.workOrder.findUnique({ where: { id } });
  if (!existing) throw new Error('Ordem de produção não encontrada');

  let nextStatus = existing.status;
  if (patch.status) {
    nextStatus = dbStatusFromUi(patch.status);
  }

  const data: Prisma.WorkOrderUpdateInput = {};
  if (patch.saleOrderId !== undefined) data.saleOrder = patch.saleOrderId ? { connect: { id: patch.saleOrderId } } : { disconnect: true };
  if (patch.productId) data.product = { connect: { id: patch.productId } };
  if (patch.routingId !== undefined) data.routing = patch.routingId ? { connect: { id: patch.routingId } } : { disconnect: true };
  if (patch.quantityPlanned !== undefined) data.quantityPlanned = new Prisma.Decimal(patch.quantityPlanned);
  if (patch.scheduledStart !== undefined) data.scheduledStart = patch.scheduledStart ? new Date(patch.scheduledStart) : null;
  if (patch.scheduledEnd !== undefined) data.scheduledEnd = patch.scheduledEnd ? new Date(patch.scheduledEnd) : null;
  if (patch.dueDate !== undefined) data.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
  if (patch.kanbanColumn !== undefined) data.kanbanColumn = patch.kanbanColumn;
  if (patch.kanbanOrder !== undefined) data.kanbanOrder = patch.kanbanOrder;
  if (patch.priority !== undefined) {
    let p = String(patch.priority).toLowerCase();
    if (p.includes('urg')) p = 'urgente';
    else if (!['alta', 'baixa', 'normal', 'urgente'].includes(p)) p = 'normal';
    data.priority = p;
  }
  if (patch.notes !== undefined) data.notes = patch.notes;
  if (patch.responsibleUserId !== undefined) {
    data.responsible = patch.responsibleUserId ? { connect: { id: patch.responsibleUserId } } : { disconnect: true };
  }
  const willFinish = patch.status && !isFinishedWorkOrderStatus(existing.status) && isFinishedWorkOrderStatus(nextStatus);
  const location = willFinish ? await getOrCreateDefaultLocation() : undefined;
  if (patch.status && !willFinish) data.status = nextStatus;

  return prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.update({
      where: { id },
      data: {
        ...data,
        ...(patch.status && !willFinish
          ? {
              statusHistory: {
                create: {
                  id: randomUUID(),
                  fromStatus: existing.status,
                  toStatus: nextStatus,
                  userId: userId ?? undefined,
                },
              },
            }
          : {}),
      },
      include: woInclude,
    });

    if (willFinish) {
      await applyFinishMovementsForWorkOrder(tx, wo, location!.id, userId);
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          finishedAt: new Date(),
          kanbanColumn: 'DONE',
          statusHistory: {
            create: {
              id: randomUUID(),
              fromStatus: existing.status,
              toStatus: nextStatus,
              userId: userId ?? undefined,
              note: 'Finalização com movimentação de estoque',
            },
          },
        },
        include: woInclude,
      });
      return mapWoRow(updated);
    }

    return mapWoRow(wo);
  });
}

export async function reorderKanban(column: string, orderedIds: string[]) {
  await prisma.$transaction(async (tx) => {
    for (let idx = 0; idx < orderedIds.length; idx += 1) {
      await tx.workOrder.update({
        where: { id: orderedIds[idx] },
        data: { kanbanColumn: column, kanbanOrder: idx },
      });
    }
  });
  return listWorkOrders();
}

export async function finishWorkOrder(
  id: string,
  userId?: string | null,
  completionData?: Array<{ workOrderItemId: string; quantidadeProduzida?: number; quantidadeRefugo?: number }>,
) {
  const loc = await getOrCreateDefaultLocation();

  return prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.findUnique({
      where: { id },
      include: { items: true, product: { include: { entityRecord: true } } },
    });
    if (!wo) throw new Error('Ordem de produção não encontrada');
    if (wo.status === 'DONE' || wo.status === 'COMPLETED') throw new Error('OP já concluída');

    const mainProductId = wo.productId ?? wo.items[0]?.productId;
    if (!mainProductId) throw new Error('Produto acabado não definido na OP');

    const qty = wo.quantityPlanned;

    // Atualiza WorkOrderItems com quantidades produzidas e refugo, se fornecidas
    if (completionData && completionData.length > 0) {
      const dataMap = new Map(completionData.map((d) => [d.workOrderItemId, d]));
      for (const item of wo.items) {
        const data = dataMap.get(item.id);
        if (data) {
          await tx.workOrderItem.update({
            where: { id: item.id },
            data: {
              quantidadeProduzida: data.quantidadeProduzida ? new Prisma.Decimal(data.quantidadeProduzida) : undefined,
              quantidadeRefugo: data.quantidadeRefugo ? new Prisma.Decimal(data.quantidadeRefugo) : undefined,
            },
          });
        }
      }
    }

    await applyStockMovement(
      {
        productId: mainProductId,
        locationId: loc.id,
        type: StockMovementType.ENTRADA,
        quantity: qty,
        userId: userId ?? undefined,
        reference: wo.number,
        notes: 'Entrada acabado — conclusão OP',
      },
      tx,
    );

    const product = await tx.product.findUnique({
      where: { id: mainProductId },
      select: { id: true, entityRecordId: true },
    });
    if (product?.entityRecordId) {
      const bom = await tx.billOfMaterialLine.findMany({
        where: { productRecordId: product.entityRecordId },
      });
      for (const line of bom) {
        const comp = await tx.product.findFirst({ where: { code: line.componentCode } });
        if (!comp) continue;
        const need = new Prisma.Decimal(line.quantity).mul(qty);
        await applyStockMovement(
          {
            productId: comp.id,
            locationId: loc.id,
            type: StockMovementType.SAIDA,
            quantity: need,
            userId: userId ?? undefined,
            reference: wo.number,
            notes: `Consumo BOM — ${line.componentCode}`,
          },
          tx,
        );
      }
    }

    const updated = await tx.workOrder.update({
      where: { id },
      data: {
        status: 'DONE',
        finishedAt: new Date(),
        kanbanColumn: 'DONE',
        statusHistory: {
          create: {
            id: randomUUID(),
            fromStatus: wo.status,
            toStatus: 'DONE',
            userId: userId ?? undefined,
            note: 'Finalização com movimentação de estoque',
          },
        },
      },
      include: woInclude,
    });

    return mapWoRow(updated);
  });
}

export async function listMachines() {
  return prisma.machine.findMany({ orderBy: { code: 'asc' } });
}

export async function calcularOEE(machineId: string, mes: number, ano: number) {
  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0, 23, 59, 59)

  const machine = await prisma.machine.findUnique({
    where: { id: machineId }
  })
  if (!machine) throw new Error('Máquina não encontrada')

  // Busca apontamentos da máquina no período
  const apontamentos = await prisma.productionAppointment.findMany({
    where: {
      machineId: machineId,
      createdAt: { gte: inicio, lte: fim }
    }
  })

  // Calcula horas trabalhadas
  const horasTrabalhadas = apontamentos.reduce((total, ap) => {
    if (ap.inicio && ap.fim) {
      return total + (new Date(ap.fim).getTime() - new Date(ap.inicio).getTime()) / 3600000
    }
    return total + (ap.horasTrabalhadas || 0)
  }, 0)

  // Dias úteis do mês × turno (8h)
  const diasUteis = calcularDiasUteis(inicio, fim)
  const tempoPlanejado = diasUteis * 8

  // Quantidades
  const qtdBoa = apontamentos.reduce((s, ap) => s + (ap.quantidadeBoa || ap.quantidade || 0), 0)
  const qtdRefugo = apontamentos.reduce((s, ap) => s + (ap.quantidadeRefugo || 0), 0)
  const qtdTotal = qtdBoa + qtdRefugo

  // Componentes OEE
  const disponibilidade = tempoPlanejado > 0 ? horasTrabalhadas / tempoPlanejado : 0
  const capacHoraria = machine.capacidadeHoraria || 10
  const desempenho = horasTrabalhadas > 0
    ? Math.min(qtdBoa / (horasTrabalhadas * capacHoraria), 1)
    : 0
  const qualidade = qtdTotal > 0 ? qtdBoa / qtdTotal : 1

  const oee = disponibilidade * desempenho * qualidade * 100

  const ranking =
    oee >= 85 ? 'excelente' :
    oee >= 75 ? 'bom' :
    oee >= 65 ? 'regular' : 'ruim'

  return {
    maquina: { id: machine.id, nome: machine.name },
    periodo: { mes, ano },
    disponibilidade: Math.round(disponibilidade * 1000) / 10,
    desempenho: Math.round(desempenho * 1000) / 10,
    qualidade: Math.round(qualidade * 1000) / 10,
    oee: Math.round(oee * 10) / 10,
    horasTrabalhadas: Math.round(horasTrabalhadas * 10) / 10,
    tempoPlanejado,
    ranking
  }
}

function calcularDiasUteis(inicio: Date, fim: Date): number {
  let dias = 0
  const data = new Date(inicio)
  while (data <= fim) {
    const diaSemana = data.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) dias++
    data.setDate(data.getDate() + 1)
  }
  return dias
}

export async function listRoutings() {
  return prisma.routing.findMany({
    orderBy: { code: 'asc' },
    include: { stages: { orderBy: { sortOrder: 'asc' }, include: { machine: true } }, product: { select: { code: true, name: true } } },
  });
}

export async function getPcpSchedule(from?: Date, to?: Date) {
  const start = from ?? new Date();
  const end = to ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return prisma.productionAppointment.findMany({
    where: {
      scheduledStart: { gte: start, lte: end },
    },
    orderBy: { scheduledStart: 'asc' },
    include: {
      workOrder: { include: { product: true } },
      machine: true,
      routingStage: true,
    },
  });
}

export async function listFloorSnapshot() {
  const ops = await prisma.workOrder.findMany({
    where: { status: { in: ['RELEASED', 'IN_PROGRESS', 'PAUSED', 'DRAFT', 'PLANNED'] } },
    orderBy: { updatedAt: 'desc' },
    take: 80,
    include: {
      saleOrder: { include: { customer: true } },
      product: true,
      responsible: { select: { fullName: true } },
      items: { include: { product: true } },
      appointments: {
        where: { status: { not: 'DONE' } },
        orderBy: { scheduledStart: 'asc' },
        take: 3,
        include: { machine: true },
      },
    },
  });
  return ops.map((o) => ({
    ...mapWoRow(o),
    nextAppointments: o.appointments,
  }));
}

export async function createMachine(data: { code: string; name: string; sector?: string | null; active?: boolean }) {
  return prisma.machine.create({
    data: {
      id: randomUUID(),
      code: data.code,
      name: data.name,
      sector: data.sector ?? undefined,
      active: data.active ?? true,
    },
  });
}

export async function createRouting(data: {
  code: string;
  name: string;
  productId?: string | null;
  active?: boolean;
  stages?: Array<{
    sortOrder?: number;
    name: string;
    machineId?: string | null;
    durationMinutes?: number | null;
  }>;
}) {
  return prisma.routing.create({
    data: {
      id: randomUUID(),
      code: data.code,
      name: data.name,
      productId: data.productId ?? undefined,
      active: data.active ?? true,
      stages: data.stages?.length
        ? {
            create: data.stages.map((s, i) => ({
              id: randomUUID(),
              sortOrder: s.sortOrder ?? i,
              name: s.name,
              machineId: s.machineId ?? undefined,
              durationMinutes: s.durationMinutes ?? undefined,
            })),
          }
        : undefined,
    },
    include: { stages: { orderBy: { sortOrder: 'asc' }, include: { machine: true } } },
  });
}

export async function getRefugoSummary(params?: { mes?: number; ano?: number; groupBy?: string }) {
  const mes = params?.mes ?? new Date().getMonth() + 1;
  const ano = params?.ano ?? new Date().getFullYear();
  
  const startDate = new Date(ano, mes - 1, 1);
  const endDate = new Date(ano, mes, 0, 23, 59, 59);

  const apontamentos = await prisma.productionAppointment.findMany({
    where: {
      scheduledStart: { gte: startDate, lte: endDate },
    },
    include: {
      workOrder: { include: { product: true } },
      machine: true,
      employee: true,
    },
  });

  type Produto = { produto: string; qtdBoa: number; qtdRefugo: number; eficiencia: number };
  type Operador = { operador: string; qtdBoa: number; qtdRefugo: number; eficiencia: number };

  const porProduto: Record<string, Produto> = {};
  const porOperador: Record<string, Operador> = {};
  let totaisBoa = 0;
  let totaisRefugo = 0;

  for (const apt of apontamentos) {
    const qtdBoa = Number(apt.quantityGood ?? apt.quantityPlanned ?? 0);
    const qtdRefugo = Number(apt.quantityDefective ?? 0);
    totaisBoa += qtdBoa;
    totaisRefugo += qtdRefugo;

    const nomeProduto = apt.workOrder?.product?.name ?? 'Desconhecido';
    if (!porProduto[nomeProduto]) {
      porProduto[nomeProduto] = { produto: nomeProduto, qtdBoa: 0, qtdRefugo: 0, eficiencia: 0 };
    }
    porProduto[nomeProduto].qtdBoa += qtdBoa;
    porProduto[nomeProduto].qtdRefugo += qtdRefugo;

    const nomeOperador = apt.employee?.name ?? apt.employee?.email ?? 'Desconhecido';
    if (!porOperador[nomeOperador]) {
      porOperador[nomeOperador] = { operador: nomeOperador, qtdBoa: 0, qtdRefugo: 0, eficiencia: 0 };
    }
    porOperador[nomeOperador].qtdBoa += qtdBoa;
    porOperador[nomeOperador].qtdRefugo += qtdRefugo;
  }

  // Calcula eficiência: qtdBoa / (qtdBoa + qtdRefugo)
  Object.values(porProduto).forEach((p) => {
    const total = p.qtdBoa + p.qtdRefugo;
    p.eficiencia = total > 0 ? Math.round((p.qtdBoa / total) * 1000) / 10 : 100;
  });
  Object.values(porOperador).forEach((o) => {
    const total = o.qtdBoa + o.qtdRefugo;
    o.eficiencia = total > 0 ? Math.round((o.qtdBoa / total) * 1000) / 10 : 100;
  });

  const totalGeral = totaisBoa + totaisRefugo;
  const eficienciaGeral = totalGeral > 0 ? Math.round((totaisBoa / totalGeral) * 1000) / 10 : 100;

  return {
    periodo: { mes, ano },
    totais: { qtdBoa: totaisBoa, qtdRefugo: totaisRefugo, eficiencia: eficienciaGeral },
    porProduto: Object.values(porProduto).sort((a, b) => b.qtdRefugo - a.qtdRefugo),
    porOperador: Object.values(porOperador).sort((a, b) => b.qtdRefugo - a.qtdRefugo),
  };
}
