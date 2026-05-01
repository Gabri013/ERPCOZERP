import type { Prisma } from '@prisma/client';
import { getIO } from './io.js';

export async function emitAfterRecordSaved(params: {
  entityCode: string;
  verb: 'create' | 'update' | 'delete';
  record: { id: string; data?: Prisma.JsonValue | null };
}) {
  const io = getIO();
  if (!io) return;

  const payload = {
    entity: params.entityCode,
    verb: params.verb,
    id: params.record.id,
    data: params.record.data,
  };

  if (params.entityCode === 'apontamento_producao' && params.verb === 'create') {
    io.emit('novo_apontamento', payload);
    return;
  }

  io.emit('record_saved', payload);
}
