import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../infra/prisma.js';

/** INSS e IRRF simplificados (demonstração). */
export function calculateBrazilPayrollDeductions(gross: number) {
  const inssCap = 7507.49;
  const base = Math.min(gross, inssCap);
  let inss = 0;
  if (base <= 1412) inss = base * 0.075;
  else if (base <= 2666.68) inss = base * 0.09;
  else if (base <= 4000.03) inss = base * 0.12;
  else inss = base * 0.14;

  const irrfBase = Math.max(0, gross - inss - 564.8);
  let irrf = 0;
  if (irrfBase <= 2259.2) irrf = 0;
  else if (irrfBase <= 2826.65) irrf = irrfBase * 0.075 - 169.44;
  else if (irrfBase <= 3751.05) irrf = irrfBase * 0.15 - 381.44;
  else if (irrfBase <= 4664.68) irrf = irrfBase * 0.225 - 662.77;
  else irrf = irrfBase * 0.275 - 896;

  const net = gross - inss - Math.max(0, irrf);
  return {
    gross,
    inss: Math.round(inss * 100) / 100,
    irrf: Math.round(Math.max(0, irrf) * 100) / 100,
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
    },
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
