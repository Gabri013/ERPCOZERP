/**
 * Análise heurística + opcional OpenAI (OPENAI_API_KEY).
 * Nunca altera código nem permissões — apenas texto para revisão humana / PR.
 */

export type AnalysisResult = {
  probableCause: string;
  suggestedFix: string;
  impact: string;
  reviewRequired: boolean;
  raw?: Record<string, unknown>;
};

function heuristicAnalysis(ctx: {
  type: string;
  severity: string;
  description: string;
  stackTrace: string | null;
  sourceFile: string | null;
  route: string | null;
}): AnalysisResult {
  const d = ctx.description;
  let probable = 'Erro genérico; rever stack e rota.';
  let fix = 'Reproduzir em dev, adicionar tratamento ou validação (Zod) conforme o caso.';
  if (/cannot read properties of undefined/i.test(d) || /Cannot read.*undefined/i.test(d)) {
    probable = 'Acesso a propriedade de valor `undefined` (falta de optional chaining ou guard).';
    fix = 'Validar objeto antes do acesso (`?.`, early return, default).';
  } else if (/null/i.test(d) && /read/i.test(d)) {
    probable = 'Possível `null` onde se esperava objeto.';
    fix = 'Null-check ou fallback antes de usar o valor.';
  } else if (/timeout|ETIMEDOUT/i.test(d)) {
    probable = 'Timeout de rede ou serviço lento.';
    fix = 'Aumentar timeout com critério, retry com backoff, ou otimizar chamada.';
  } else if (/Zod|invalid/i.test(d)) {
    probable = 'Validação de entrada falhou.';
    fix = 'Ajustar schema Zod e mensagens de erro; alinhar contrato API/UI.';
  }
  const reviewRequired = ctx.severity === 'critical' || ctx.type.includes('api');
  return {
    probableCause: probable,
    suggestedFix: fix,
    impact: reviewRequired
      ? 'Alto — pode afetar fluxo ou dados; exige revisão antes de merge.'
      : 'Moderado — rever em PR ou correção local.',
    reviewRequired,
    raw: { mode: 'heuristic', route: ctx.route, sourceFile: ctx.sourceFile },
  };
}

export async function runErrorQueueAnalysis(ctx: {
  type: string;
  severity: string;
  description: string;
  stackTrace: string | null;
  sourceFile: string | null;
  route: string | null;
}): Promise<AnalysisResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return heuristicAnalysis(ctx);
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const system = `És assistente técnico de um ERP (Node/Express, React, Prisma).
Responde APENAS com um objeto JSON válido, sem markdown, com chaves:
{"probableCause":"string","suggestedFix":"string","impact":"string","reviewRequired":boolean}
Regras: não sugerir alterar RBAC, permissões, regras de negócio nem fluxos críticos sem review_required=true.
Sugestões curtas em português de Portugal.`;

  const userPayload = JSON.stringify({
    type: ctx.type,
    severity: ctx.severity,
    description: ctx.description.slice(0, 8000),
    stackTrace: (ctx.stackTrace ?? '').slice(0, 8000),
    sourceFile: ctx.sourceFile,
    route: ctx.route,
  });

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPayload },
        ],
      }),
    });
    if (!res.ok) {
      return { ...heuristicAnalysis(ctx), raw: { mode: 'openai_error', status: res.status } };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const parsed = JSON.parse(text) as {
      probableCause?: string;
      suggestedFix?: string;
      impact?: string;
      reviewRequired?: boolean;
    };
    return {
      probableCause: String(parsed.probableCause ?? '').slice(0, 4000) || heuristicAnalysis(ctx).probableCause,
      suggestedFix: String(parsed.suggestedFix ?? '').slice(0, 8000) || heuristicAnalysis(ctx).suggestedFix,
      impact: String(parsed.impact ?? '').slice(0, 2000) || heuristicAnalysis(ctx).impact,
      reviewRequired: Boolean(parsed.reviewRequired),
      raw: { mode: 'openai', model },
    };
  } catch {
    return { ...heuristicAnalysis(ctx), raw: { mode: 'openai_exception' } };
  }
}
