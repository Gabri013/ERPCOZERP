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
  return prisma.$extends({
    query: {
      $allModels: {
        $allOperations: async (args: any) => {
          const companyId = getCurrentCompanyId();
          if (!companyId) return args.query(args.args);
          if (!args.model) return args.query(args.args);
          if (!modelHasCompanyId(prisma, args.model)) return args.query(args.args);

          const updatedArgs = { ...(args.args || {}) } as Record<string, any>;

          if (ACTIONS_ADD_WHERE.has(args.operation)) {
            const where = updatedArgs.where;
            if (!where || (typeof where === 'object' && !Object.prototype.hasOwnProperty.call(where, 'companyId'))) {
              updatedArgs.where = { ...(where || {}), companyId };
            }
          }

          if (args.operation === 'update' || args.operation === 'delete' || args.operation === 'upsert') {
            const where = updatedArgs.where;
            if (where && !Object.prototype.hasOwnProperty.call(where, 'companyId')) {
              updatedArgs.where = { ...(where || {}), companyId };
            }
          }

          if (ACTIONS_DATA_COMPANY.has(args.operation)) {
            const data = updatedArgs.data;
            if (data && !Object.prototype.hasOwnProperty.call(data, 'companyId')) {
              updatedArgs.data = { ...data, companyId };
            }
          }

          return args.query(updatedArgs);
        },
      },
    },
  }) as PrismaClient;
}
