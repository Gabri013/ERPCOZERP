import { Prisma } from '@prisma/client';

/**
 * Middleware de Prisma que adiciona automaticamente filtro de companyId
 * para usuários não-master.
 * 
 * Filtra automaticamente queries em modelos que têm campo companyId
 */
export const companyIsolationMiddleware = (userId?: string, userRoles?: string[], companyId?: string) => {
  const isMaster = userRoles?.includes('master');
  const hasCompanyId = companyId && companyId.length > 0;

  return async (params: any, next: (params: any) => Promise<unknown>) => {
    // Master user bypass - sem filtros
    if (isMaster) {
      return next(params);
    }

    // Usuários comuns - adicionar filtro de companyId
    if (hasCompanyId && params.args && typeof params.args === 'object') {
      const args = params.args as Record<string, unknown>;
      const modelName = params.model;

      // Modelos que têm companyId e precisam ser filtrados
      const modelsWithCompanyId = [
        'WorkOrder',
        'Machine',
        'Routing',
        'WorkOrderStatusHistory',
        'SaleOrder',
        'Customer',
        'Supplier',
        'Product',
        'StockMovement',
        'PurchaseOrder',
        'FiscalNfe',
        'Employee',
        'FinancialEntry',
        'InventoryCount',
        'Location',
        'SalesOpportunity',
      ];

      if (modelsWithCompanyId.includes(modelName)) {
        // Adicionar companyId ao where
        if (args.where && typeof args.where === 'object') {
          const whereClause = args.where as Record<string, unknown>;
          whereClause.companyId = companyId;
        } else if (args.data && typeof args.data === 'object' && params.action === 'create') {
          // Para creates, adicionar companyId aos dados
          const dataClause = args.data as Record<string, unknown>;
          dataClause.companyId = companyId;
        }
      }
    }

    return next(params);
  };
};
