#!/usr/bin/env node
/**
 * Regras de negócio estáticas (documentação executável — não ligadas ao runtime do ERP).
 * Expande gradualmente conforme migrações.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.join(__dirname, '../../apps/backend/prisma/schema.prisma');

export function scan() {
  const warnings = [];
  if (!fs.existsSync(SCHEMA)) {
    warnings.push({ severity: 'warn', rule: 'schema-present', message: 'schema.prisma não encontrado' });
    return { warnings };
  }
  const text = fs.readFileSync(SCHEMA, 'utf8');

  /** Modelos esperados para fluxos mestres documentados pelo produto */
  const mustHave = ['model WorkOrder', 'model SaleOrder', 'model User'];
  for (const needle of mustHave) {
    if (!text.includes(needle)) {
      warnings.push({
        severity: 'warn',
        rule: 'business-models-present',
        message: `Esperado no schema: "${needle}".`,
        suggestion: 'Revertir ou corrigir schema se remoção não for intencional.',
      });
    }
  }

  /** Comentário de política (exemplos do prompt utilizador — evoluir para Zod nos services) */
  const policies = [
    {
      id: 'op-needs-product',
      desc: 'OP deve referenciar produto/código válido antes de iniciar — validar ao criar work order no service.',
      check: () => text.includes('model WorkOrder'),
    },
    {
      id: 'sale-order-needs-customer',
      desc: 'Pedido sem cliente deve ser rejeitado na API de vendas.',
      check: () => text.includes('model SaleOrder') && text.includes('customerId'),
    },
  ];

  const policyReport = policies.map((p) => ({
    id: p.id,
    ok: p.check(),
    description: p.desc,
  }));

  return { warnings, policyReport };
}

const strict = process.argv.includes('--strict');
const isMainNode = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainNode) {
  const { warnings, policyReport } = scan();
  const report = {
    target: 'business-rules-static',
    warnCount: warnings.length,
    warnings,
    policyReport,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(strict && warnings.length ? 1 : 0);
}
