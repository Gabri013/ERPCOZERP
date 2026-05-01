import { recordsServiceApi } from '@/services/recordsServiceApi';

function nextNumeroFromExisting(ops) {
  const nums = ops
    .map((o) => String(o.numero || ''))
    .map((n) => n.match(/OP-(\d+)/)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max ? max + 1 : 1;
  return `OP-${String(next).padStart(5, '0')}`;
}

export const opService = {
  getAll: async () => ({ success: true, data: await recordsServiceApi.list('ordem_producao') }),

  getById: async (id) => {
    const all = await recordsServiceApi.list('ordem_producao');
    const op = all.find(o => o.id === id);
    return { success: true, data: op };
  },

  create: async (data) => {
    const ops = await recordsServiceApi.list('ordem_producao');
    const numero = data?.numero || nextNumeroFromExisting(ops);
    const payload = {
      ...data,
      numero,
      status: data?.status || 'aberta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await recordsServiceApi.create('ordem_producao', payload);
    return { success: true, data: created };
  },

  update: async (id, data) => {
    const updated = await recordsServiceApi.update(id, { ...data, updatedAt: new Date().toISOString() });
    return { success: true, data: updated };
  },

  delete: async (id) => {
    await recordsServiceApi.remove(id);
    return { success: true };
  },

  getData: () => [],
};