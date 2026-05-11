import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../infra/prisma.js';
import { getCurrentCompanyId } from '../../infra/tenantContext.js';

/** INSS e IRRF tabelas oficiais 2025. */
export function calcularINSS(salario: number): number {
  const base = Math.min(salario, 8157.41); // teto INSS 2025
  if (base <= 1518.00) return base * 0.075;
  if (base <= 2793.88) return base * 0.09;
  if (base <= 4190.83) return base * 0.12;
  return base * 0.14;
}

export function calcularIRRF(base: number): number {
  if (base <= 2428.80) return 0;
  if (base <= 3751.05) return base * 0.075 - 182.16;
  if (base <= 4664.68) return base * 0.15 - 394.45;
  if (base <= 6101.06) return base * 0.225 - 744.80;
  return base * 0.275 - 1049.72;
}

/** INSS e IRRF simplificados (demonstração). */
export function calculateBrazilPayrollDeductions(gross: number) {
  const inss = calcularINSS(gross);
  const irrfBase = Math.max(0, gross - inss - 564.8); // dedução simplificada
  const irrf = Math.max(0, calcularIRRF(irrfBase));
  const net = gross - inss - irrf;
  return {
    gross,
    inss: Math.round(inss * 100) / 100,
    irrf: Math.round(irrf * 100) / 100,
    net: Math.round(net * 100) / 100,
  };
}

export async function listEmployees() {
  return prisma.employee.findMany({ orderBy: { code: 'asc' } });
}

export async function listTimeEntries(employeeId?: string) {
  return prisma.timeEntry.findMany({
    where: employeeId ? { employeeId } : undefined,
    orderBy: { workDate: 'desc' },
    take: 200,
    include: { employee: { select: { code: true, fullName: true } } },
  });
}

export async function createTimeEntry(input: { employeeId: string; workDate: string; hours: number; notes?: string }) {
  return prisma.timeEntry.create({
    data: {
      id: randomUUID(),
      employeeId: input.employeeId,
      workDate: new Date(input.workDate),
      hours: new Prisma.Decimal(input.hours),
      notes: input.notes,
    },
  });
}

export async function listLeaveRequests() {
  return prisma.leaveRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { employee: { select: { code: true, fullName: true } } },
  });
}

export async function createLeaveRequest(input: {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  return prisma.leaveRequest.create({
    data: {
      id: randomUUID(),
      employeeId: input.employeeId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      reason: input.reason,
    },
    include: { employee: true },
  });
}

export async function calculatePayroll(month: string) {
  const employees = await prisma.employee.findMany({ where: { active: true } });
  const run = await prisma.payrollRun.upsert({
    where: { referenceMonth: month },
    update: { status: 'CALCULADO', calculatedAt: new Date() },
    create: {
      id: randomUUID(),
      referenceMonth: month,
      status: 'CALCULADO',
      calculatedAt: new Date(),
    },
  });

  await prisma.payrollLine.deleteMany({ where: { payrollRunId: run.id } });

  const lines = [];
  for (const emp of employees) {
    const gross = emp.salaryBase?.toNumber() ?? 0;
    const calc = calculateBrazilPayrollDeductions(gross);
    const line = await prisma.payrollLine.create({
      data: {
        id: randomUUID(),
        payrollRunId: run.id,
        employeeId: emp.id,
        gross: new Prisma.Decimal(calc.gross),
        inss: new Prisma.Decimal(calc.inss),
        irrf: new Prisma.Decimal(calc.irrf),
        net: new Prisma.Decimal(calc.net),
      },
    });
    lines.push(line);
  }

  const accountEntity = await prisma.entity.upsert({
    where: { code: 'conta_pagar' },
    update: {},
    create: { code: 'conta_pagar', name: 'Contas a Pagar' },
  });

  const existingPayrollPayable = await prisma.entityRecord.findFirst({
    where: {
      entityId: accountEntity.id,
      deletedAt: null,
      data: { path: ['payrollMonth'], equals: month },
    },
  });

  const totalPayrollValue = lines.reduce((sum, line) => sum + (line.net?.toNumber() ?? 0), 0);
  const dueDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 5).toISOString().slice(0, 10);

  if (existingPayrollPayable) {
    await prisma.entityRecord.update({
      where: { id: existingPayrollPayable.id },
      data: {
        updatedBy: null,
        data: {
          ...(existingPayrollPayable.data as any),
          valor: totalPayrollValue,
          data_vencimento: dueDate,
          descricao: `Folha de pagamento ${month} — ${lines.length} funcionários`,
        },
      },
    });
  } else {
    await prisma.entityRecord.create({
      data: {
        entityId: accountEntity.id,
        createdBy: null,
        updatedBy: null,
        data: {
          origem: 'folha_pagamento',
          payrollMonth: month,
          valor: totalPayrollValue,
          status: 'aberto',
          data_vencimento: dueDate,
          descricao: `Folha de pagamento ${month} — ${lines.length} funcionários`,
        },
      },
    });
  }

  return prisma.payrollRun.findUnique({
    where: { id: run.id },
    include: { lines: { include: { employee: true } } },
  });
}

export async function getPayrollRun(month: string) {
  return prisma.payrollRun.findUnique({
    where: { referenceMonth: month },
    include: { lines: { include: { employee: true } } },
  });
}

export async function createEmployee(input: {
  code: string;
  fullName: string;
  email?: string | null;
  department?: string | null;
  hireDate?: string | null;
  salaryBase?: number | null;
  active?: boolean;
}) {
  const companyId = getCurrentCompanyId?.();
  const hire = input.hireDate ? new Date(input.hireDate) : null;
  return prisma.employee.create({
    data: {
      code: input.code.trim(),
      fullName: input.fullName.trim(),
      email: input.email ?? null,
      department: input.department ?? null,
      hireDate: hire && !Number.isNaN(hire.getTime()) ? hire : null,
      salaryBase: input.salaryBase != null ? new Prisma.Decimal(input.salaryBase) : null,
      active: input.active ?? true,
      ...(companyId ? { companyId } : {}),
    } as any,
  });
}

export async function updateEmployee(
  id: string,
  input: Partial<{
    code: string;
    fullName: string;
    email: string | null;
    department: string | null;
    hireDate: string | null;
    salaryBase: number | null;
    active: boolean;
  }>,
) {
  const data: Prisma.EmployeeUpdateInput = {};
  if (input.code !== undefined) data.code = input.code.trim();
  if (input.fullName !== undefined) data.fullName = input.fullName.trim();
  if (input.email !== undefined) data.email = input.email;
  if (input.department !== undefined) data.department = input.department;
  if (input.active !== undefined) data.active = input.active;
  if (input.hireDate !== undefined) {
    const hire = input.hireDate ? new Date(input.hireDate) : null;
    data.hireDate = hire && !Number.isNaN(hire.getTime()) ? hire : null;
  }
  if (input.salaryBase !== undefined) {
    data.salaryBase =
      input.salaryBase != null ? new Prisma.Decimal(input.salaryBase) : null;
  }
  return prisma.employee.update({ where: { id }, data });
}
