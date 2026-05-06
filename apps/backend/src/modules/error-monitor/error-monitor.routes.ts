import { Router } from 'express';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth.js';
import {
  enqueueError,
  listQueue,
  recordTestResult,
  runAnalyze,
  updateQueueStatus,
} from './error-monitor.service.js';
import type { ErrorQueueSeverity, ErrorQueueStatus, ErrorQueueType } from './error-monitor.service.js';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export const errorMonitorRouter = Router();

const typeEnum = z.enum([
  'frontend_console_error',
  'frontend_console_warn',
  'frontend_render',
  'backend_exception',
  'api_invalid',
  'api_timeout',
  'api_500',
]);
const severityEnum = z.enum(['critical', 'high', 'medium', 'low']);

const ingestSchema = z.object({
  type: typeEnum,
  severity: severityEnum.optional(),
  description: z.string().min(1).max(20_000),
  sourceFile: z.string().max(512).optional().nullable(),
  route: z.string().max(512).optional().nullable(),
  stackTrace: z.string().max(50_000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Qualquer utilizador autenticado pode reportar erros do browser. */
errorMonitorRouter.post('/ingest', async (req, res) => {
  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  const body = parsed.data;
  const severity: ErrorQueueSeverity =
    body.severity ??
    (body.type === 'frontend_console_error' || body.type === 'frontend_render' || body.type === 'api_500'
      ? 'high'
      : 'medium');
  try {
    const row = await enqueueError({
      type: body.type as ErrorQueueType,
      severity,
      description: body.description,
      sourceFile: body.sourceFile ?? null,
      route: body.route ?? null,
      userId: req.user?.userId ?? null,
      stackTrace: body.stackTrace ?? null,
      metadata: (body.metadata as any) ?? undefined,
    });
    res.status(201).json({ success: true, id: row.id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro ao gravar fila' });
  }
});

const adminGate = requirePermission(['editar_config']);

errorMonitorRouter.get('/queue', adminGate, async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  try {
    const rows = await listQueue({ status, take: Number(req.query.take) || 100 });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const statusSchema = z.object({
  status: z.enum(['pending', 'analyzing', 'fixed', 'ignored', 'review_required']),
  pullRequestUrl: z.string().max(512).optional().nullable(),
});

errorMonitorRouter.patch('/queue/:id', adminGate, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const row = await updateQueueStatus(req.params.id, parsed.data.status as ErrorQueueStatus, {
      pullRequestUrl: parsed.data.pullRequestUrl,
    });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

errorMonitorRouter.post('/queue/:id/analyze', adminGate, async (req, res) => {
  try {
    const row = await runAnalyze(req.params.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

/** Opcional: corre testes rápidos no monorepo (desativado por defeito em produção). */
errorMonitorRouter.post('/queue/:id/validate-tests', adminGate, async (req, res) => {
  if (process.env.ENABLE_ERROR_QUEUE_VALIDATE_TESTS !== '1') {
    return res.status(403).json({
      error: 'Defina ENABLE_ERROR_QUEUE_VALIDATE_TESTS=1 para permitir execução de testes a partir da API.',
    });
  }
  const root = join(process.cwd(), '..', '..');
  const be = spawnSync('npm', ['run', 'test', '--', '--run', 'src/__tests__/audit/api-surface.test.ts'], {
    cwd: join(root, 'apps', 'backend'),
    shell: true,
    encoding: 'utf8',
  });
  const passed = be.status === 0;
  try {
    const row = await recordTestResult(req.params.id, {
      passed,
      command: 'vitest api-surface',
      output: (be.stdout ?? '').slice(-4000) + (be.stderr ?? '').slice(-4000),
    });
    res.json({ success: true, passed, data: row });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
