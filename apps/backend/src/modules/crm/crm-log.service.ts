import { prisma } from '../../infra/prisma.js';

export async function appendCrmLog(params: {
  eventType: string;
  entityCode: string;
  entityRecordId: string;
  userId?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  return prisma.crmLog.create({
    data: {
      eventType: params.eventType,
      entityCode: params.entityCode,
      entityRecordId: params.entityRecordId,
      userId: params.userId ?? undefined,
      payload: params.payload === undefined || params.payload === null ? undefined : (params.payload as object),
    },
  });
}
