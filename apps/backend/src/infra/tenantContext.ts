import { AsyncLocalStorage } from 'async_hooks';

const als = new AsyncLocalStorage<Record<string, any>>();

export function runWithTenant<T>(tenant: { companyId: string }, fn: () => T) {
  return als.run({ companyId: tenant.companyId }, fn);
}

export function getCurrentCompanyId(): string | undefined {
  const store = als.getStore();
  return store?.companyId;
}
