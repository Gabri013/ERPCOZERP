import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import { runErrorQueueAnalysis } from './error-monitor-analyzer.js';

export type ErrorQueueType =
  | 'frontend_console_error'
  | 'frontend_console_warn'
  | 'frontend_render'
  | 'backend_exception'
  | 'api_invalid'
  | 'api_timeout'
  | 'api_500';

export type ErrorQueueSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ErrorQueueStatus =
  | 'pending'
  | 'analyzing'
  | 'fixed'
  | 'ignored'
  | 'review_required';

export type EnqueueInput = {
  type: ErrorQueueType;
  severity: ErrorQueueSeverity;
  description: string;
  sourceFile?: string | null;
  route?: string | null;
  userId?: string | null;
  stackTrace?: string | null;
  httpMethod?: string | null;
  httpStatus?: number | null;
  metadata?: Prisma.InputJsonValue;
};

function guessSourceFileFromStack(stack?: string | null): string | null {
  if (!stack) return null;
  const m = stack.match(/[/\\](src[/\\][^\s:.)]+)/);
  return m ? m[1].replace(/\\/g, '/') : null;
}

/** Regras conservadoras: nunca RBAC, negócio ou fluxo crítico — só sinaliza elegibilidade teórica para PR/CI. */
export function computeAutoFixEligible(input: {
  type: ErrorQueueType;
  severity: ErrorQueueSeverity;
  description: string;
}): boolean {
  if (input.severity !== 'critical' && input.severity !== 'high') return false;
  const d = input.description.toLowerCase();
  const safeHints =
    d.includes('cannot read') ||
    d.includes('undefined') ||
    d.includes('null') ||
    d.includes('is not a function') ||
    d.includes('validation') ||
    d.includes('zod');
  if (!safeHints) return false;
  if (input.type === 'frontend_render' || input.type === 'backend_exception') return true;
  return input.type === 'frontend_console_error' || input.type === 'api_500';
}

async function readEventLog(id: string): Promise<Prisma.JsonArray> {
  const row = await prisma.errorQueue.findUnique({
    where: { id },
    select: { eventLog: true },
  });
  const raw = row?.eventLog;
  return Array.isArray(raw) ? (raw as Prisma.JsonArray) : [];
}

export async function appendEventLog(
  id: string,
  entry: { action: string; detail?: string },
): Promise<void> {
  const prev = await readEventLog(id);
  const next = [
    ...prev,
    { at: new Date().toISOString(), action: entry.action, detail: entry.detail ?? null },
  ] as Prisma.InputJsonValue;
  await prisma.errorQueue.update({
    where: { id },
    data: { eventLog: next },
  });
}

export async function enqueueError(input: EnqueueInput) {
  const sourceFile = input.sourceFile ?? guessSourceFileFromStack(input.stackTrace);
  const autoFixEligible = computeAutoFixEligible({
    type: input.type,
    severity: input.severity,
    description: input.description,
  });

  const row = await prisma.errorQueue.create({
    data: {
      type: input.type,
      severity: input.severity,
      description: input.description.slice(0, 20_000),
      sourceFile: sourceFile?.slice(0, 512) ?? null,
      route: input.route?.slice(0, 512) ?? null,
      userId: input.userId ?? null,
      stackTrace: input.stackTrace?.slice(0, 50_000) ?? null,
      httpMethod: input.httpMethod ?? null,
      httpStatus: input.httpStatus ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
      autoFixEligible,
      status: 'pending',
    },
  });
  await appendEventLog(row.id, { action: 'enqueued', detail: input.type });
  return row;
}

export async function enqueueFromHttpError(req: Request, err: unknown, httpStatus: number) {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const severity: ErrorQueueSeverity = httpStatus >= 500 ? 'critical' : 'high';
  try {
    await enqueueError({
      type: 'api_500',
      severity,
      description: `${req.method} ${req.path}: ${msg}`,
      route: req.originalUrl?.slice(0, 512) ?? req.path,
      userId: req.user?.userId ?? null,
      stackTrace: stack,
      httpMethod: req.method,
      httpStatus,
      metadata: { path: req.path, query: req.query },
    });
  } catch {
    /* evita loop se a própria fila falhar */
  }
}

export async function listQueue(opts: { status?: string; take?: number }) {
  const take = Math.min(opts.take ?? 100, 500);
  return prisma.errorQueue.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    orderBy: { createdAt: 'desc' },
    take,
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });
}

export async function updateQueueStatus(
  id: string,
  status: ErrorQueueStatus,
  extra?: { pullRequestUrl?: string | null },
) {
  await appendEventLog(id, { action: 'status_change', detail: status });
  return prisma.errorQueue.update({
    where: { id },
    data: {
      status,
      pullRequestUrl: extra?.pullRequestUrl ?? undefined,
    },
  });
}

export async function runAnalyze(id: string) {
  await prisma.errorQueue.update({
    where: { id },
    data: { status: 'analyzing' },
  });
  await appendEventLog(id, { action: 'analyze_start' });
  const row = await prisma.errorQueue.findUnique({ where: { id } });
  if (!row) throw new Error('Registo não encontrado');

  const analysis = await runErrorQueueAnalysis({
    type: row.type,
    severity: row.severity,
    description: row.description,
    stackTrace: row.stackTrace,
    sourceFile: row.sourceFile,
    route: row.route,
  });

  const nextStatus: ErrorQueueStatus = analysis.reviewRequired ? 'review_required' : 'pending';

  await prisma.errorQueue.update({
    where: { id },
    data: {
      probableCause: analysis.probableCause,
      suggestedFix: analysis.suggestedFix,
      impact: analysis.impact,
      analysisJson: analysis.raw as Prisma.InputJsonValue,
      status: nextStatus,
    },
  });
  await appendEventLog(id, { action: 'analyze_done', detail: nextStatus });
  return prisma.errorQueue.findUnique({ where: { id }, include: { user: true } });
}

export async function recordTestResult(
  id: string,
  result: { passed: boolean; command?: string; output?: string },
) {
  await appendEventLog(id, {
    action: result.passed ? 'tests_passed' : 'tests_failed',
    detail: result.command,
  });
  return prisma.errorQueue.update({
    where: { id },
    data: {
      testResult: result as unknown as Prisma.InputJsonValue,
    },
  });
}
