import { PrismaClient } from '@prisma/client';
import { getCurrentCompanyId } from './tenantContext.js';

const ACTIONS_ADD_WHERE = new Set(['findUnique', 'findFirst', 'findMany', 'updateMany', 'deleteMany', 'count']);
const ACTIONS_DATA_COMPANY = new Set(['create', 'createMany']);

function modelHasCompanyId(prisma: PrismaClient, model: string) {
  try {
    const map = (prisma as any)._dmmf?.modelMap;
    const m = map?.[model];
    if (!m) return false;
    return m.fields.some((f: any) => f.name === 'companyId');
  } catch (err) {
    return false;
  }
}

export function applyPrismaMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params: any, next: any) => {
    const companyId = getCurrentCompanyId();
    if (!companyId) return next(params);

    const model = params.model;
    if (!model) return next(params);

    if (!modelHasCompanyId(prisma, model)) return next(params);

    // Never override existing where
    if (ACTIONS_ADD_WHERE.has(params.action)) {
      params.args = params.args || {};
      const where = params.args.where;
      // if where exists and already filters by companyId, leave it
      if (!where || (typeof where === 'object' && !(Object.prototype.hasOwnProperty.call(where, 'companyId')))) {
        params.args.where = { ...(where || {}), companyId };
      }
    }

    // For update/delete by unique where
    if (params.action === 'update' || params.action === 'delete' || params.action === 'upsert') {
      params.args = params.args || {};
      const where = params.args.where;
      if (where && !Object.prototype.hasOwnProperty.call(where, 'companyId')) {
        params.args.where = { ...(where || {}), companyId };
      }
    }

    // For create operations, ensure data has companyId if model expects it and not present
    if (ACTIONS_DATA_COMPANY.has(params.action)) {
      params.args = params.args || {};
      const data = params.args.data;
      if (data && !Object.prototype.hasOwnProperty.call(data, 'companyId')) {
        params.args.data = { ...data, companyId };
      }
    }

    return next(params);
  });
}
