import { prisma } from '../../infra/prisma.js';
import { assertPedidoItensBomCompleto } from '../products/industrial-guards.js';
import { linkProductTechnicalFilesToOp } from '../products/products.service.js';
import { Prisma } from '@prisma/client';

type Json = Record<string, unknown>;
/** Registro de entidade (JSON + id) — tipagem ampla para dados dinâmicos */
export type EntityRow = Record<string, any> & { id: string };

const ETAPA_KANBAN_ORDER = [
  'a_fazer',
  'corte',
  'dobra',
  'solda',
  'acabamento',
  'qc',
  'concluido',
] as const;

async function getEntity(code: string) {
  return prisma.entity.findUnique({ where: { code } });
}

async function listRecords(entityCode: string): Promise<EntityRow[]> {
  const entity = await getEntity(entityCode);
  if (!entity) return [];
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });
  return rows.map((r) => {
    const raw = (r.data as Record<string, any>) || {};
    const { id: _drop, ...rest } = raw;
    return { id: r.id, ...rest } as EntityRow;
  });
}

async function getRecordById(entityCode: string, id: string): Promise<EntityRow | null> {
  const entity = await getEntity(entityCode);
  if (!entity) return null;
  const row = await prisma.entityRecord.findFirst({
    where: { id, entityId: entity.id, deletedAt: null },
  });
  if (!row) return null;
  const raw = (row.data as Record<string, any>) || {};
  const { id: _drop, ...rest } = raw;
  return { id: row.id, ...rest } as EntityRow;
}

async function updateRecord(entityCode: string, id: string, data: EntityRow | Json, userId?: string) {
  const entity = await getEntity(entityCode);
  if (!entity) throw new Error(`Entidade ${entityCode} não encontrada`);
  await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: userId,
    },
  });
  const d = data as Record<string, any>;
  const { id: _rid, ...rest } = d;
  return { id, ...rest } as EntityRow;
}

async function createRecord(entityCode: string, data: EntityRow | Json, userId?: string) {
  const entity = await getEntity(entityCode);
  if (!entity) throw new Error(`Entidade ${entityCode} não encontrada`);
  const payload = { ...(data as Record<string, unknown>) };
  try {
    const { applyIndustrialCodeOnPayload } = await import('../meta-code/meta-code.service.js');
    await applyIndustrialCodeOnPayload(prisma, entityCode, payload);
  } catch {
    /* opcional */
  }
  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: payload as Prisma.InputJsonValue,
      createdBy: userId,
      updatedBy: userId,
    },
  });
  const raw = (created.data as Record<string, any>) || {};
  const { id: _cid, ...rest } = raw;
  return { id: created.id, ...rest } as EntityRow;
}

function nextNumero(prefix: string, existing: { numero?: string }[], regex: RegExp) {
  const nums = existing
    .map((r) => String(r.numero || ''))
    .map((n) => {
      const m = n.match(regex);
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(5, '0')}`;
}

function nextKanbanEtapa(current?: string): string {
  const cur = (
    current && ETAPA_KANBAN_ORDER.includes(current as (typeof ETAPA_KANBAN_ORDER)[number])
      ? current
      : 'a_fazer'
  ) as (typeof ETAPA_KANBAN_ORDER)[number];
  const idx = ETAPA_KANBAN_ORDER.indexOf(cur);
  if (idx < 0) return 'corte';
  if (idx >= ETAPA_KANBAN_ORDER.length - 1) return 'concluido';
  return ETAPA_KANBAN_ORDER[idx + 1];
}

function parseBom(raw: unknown): Array<{ codigo: string; qtd: number; perda_pct?: number }> {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as any;
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getUserDisplayName(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true },
  });
  return u?.fullName || u?.email || userId;
}

/** Consome insumos da BOM proporcional à quantidade boa produzida. */
export async function consumirBomInsumos(params: {
  opNumero: string;
  codigoProduto: string;
  qtdBoa: number;
  userId?: string;
}) {
  const { opNumero, codigoProduto, qtdBoa, userId } = params;
  if (qtdBoa <= 0) return { movimentos: [] as Json[], skipped: 'quantidade zero' };

  const produtos = await listRecords('produto');
  const produto = produtos.find((p) => String(p.codigo) === String(codigoProduto));
  if (!produto) return { movimentos: [], skipped: 'produto não encontrado' };

  const bom = parseBom((produto as any).bom_json);
  if (!bom.length) return { movimentos: [], skipped: 'sem BOM' };

  const movs: Json[] = [];
  const allMov = await listRecords('movimentacao_estoque');

  for (const line of bom) {
    const qtdBase = Number(line.qtd || 0) * qtdBoa;
    const perda = Number(line.perda_pct || 0) / 100;
    const qtdCons = qtdBase * (1 + perda);
    if (qtdCons <= 0) continue;

    const comp = produtos.find((p) => String(p.codigo) === String(line.codigo));
    if (!comp) continue;

    const estAtual = Number(comp.estoque_atual || 0);
    const novo = Math.max(0, estAtual - qtdCons);
    await updateRecord(
      'produto',
      String(comp.id),
      { ...comp, estoque_atual: novo },
      userId,
    );

    const numero = nextNumero('MOV', allMov as any, /^MOV-(\d+)/i);
    allMov.unshift({ numero } as any);

    const mov = await createRecord(
      'movimentacao_estoque',
      {
        numero,
        tipo: 'Saída',
        produto_descricao: String(comp.descricao || line.codigo),
        quantidade: Number(qtdCons.toFixed(4)),
        unidade: String(comp.unidade || 'UN'),
        custo_unitario: Number(comp.preco_custo || 0),
        custo_total: Number((Number(comp.preco_custo || 0) * qtdCons).toFixed(2)),
        data: new Date().toISOString().slice(0, 10),
        origem: `Apontamento ${opNumero}`,
        responsavel: userId ? await getUserDisplayName(userId) : '',
        motivo: 'Consumo BOM — produção',
      },
      userId,
    );
    movs.push(mov);
  }

  return { movimentos: movs };
}

export async function entradaProdutoAcabado(params: {
  codigoProduto: string;
  qtd: number;
  opNumero: string;
  userId?: string;
}) {
  const { codigoProduto, qtd, opNumero, userId } = params;
  if (qtd <= 0) return null;
  const produtos = await listRecords('produto');
  const comp = produtos.find((p) => String(p.codigo) === String(codigoProduto));
  if (!comp) return null;

  const estAtual = Number(comp.estoque_atual || 0);
  await updateRecord(
    'produto',
    String(comp.id),
    { ...comp, estoque_atual: estAtual + qtd },
    userId,
  );

  const allMov = await listRecords('movimentacao_estoque');
  const numero = nextNumero('MOV', allMov as any, /^MOV-(\d+)/i);
  return createRecord(
    'movimentacao_estoque',
    {
      numero,
      tipo: 'Entrada',
      produto_descricao: String(comp.descricao || codigoProduto),
      quantidade: qtd,
      unidade: String(comp.unidade || 'UN'),
      custo_unitario: Number(comp.preco_custo || 0),
      custo_total: Number((Number(comp.preco_custo || 0) * qtd).toFixed(2)),
      data: new Date().toISOString().slice(0, 10),
      origem: `OP ${opNumero} concluída`,
      responsavel: userId ? await getUserDisplayName(userId) : '',
      motivo: 'Produto acabado — OP',
    },
    userId,
  );
}

export async function registrarApontamentoIntegrado(body: {
  opId: string;
  etapa: string;
  setor: string;
  operador: string;
  horaInicio?: string;
  horaFim?: string;
  quantidade?: number;
  refugo?: number;
  observacao?: string;
  status?: string;
  consumir_bom?: boolean;
  finalizar_etapa?: boolean;
}, userId: string) {
  const op = await getRecordById('ordem_producao', body.opId);
  if (!op) throw new Error('OP não encontrada');

  const qtdBoa = Number(body.quantidade || 0);
  const refugo = Number(body.refugo || 0);
  const opNumero = String(op.numero || '');
  const codigoProduto = String(op.codigoProduto || '');

  const horaInicio = body.horaInicio || new Date().toISOString();
  const horaFim = body.horaFim || (body.status === 'Finalizado' ? new Date().toISOString() : '');
  const status = body.status || (qtdBoa > 0 ? 'Finalizado' : 'Em Andamento');

  const apData = {
    opId: opNumero,
    etapa: body.etapa,
    operador: body.operador || (await getUserDisplayName(userId)),
    setor: body.setor,
    horaInicio,
    horaFim: horaFim || null,
    quantidade: qtdBoa || null,
    refugo: refugo || null,
    status,
    observacao: body.observacao || '',
  };

  const created = await createRecord('apontamento_producao', apData, userId);

  let bomResult: Awaited<ReturnType<typeof consumirBomInsumos>> | null = null;
  if (body.consumir_bom !== false && status === 'Finalizado' && qtdBoa > 0 && codigoProduto) {
    bomResult = await consumirBomInsumos({
      opNumero,
      codigoProduto,
      qtdBoa,
      userId,
    });
  }

  const etapaKanbanAtual = String((op as any).etapaKanban || 'a_fazer');
  let novaEtapaKanban = etapaKanbanAtual;
  if (body.finalizar_etapa !== false && status === 'Finalizado') {
    novaEtapaKanban = nextKanbanEtapa(etapaKanbanAtual);
  }

  let novoStatusOp = String(op.status || 'aberta');
  if (novaEtapaKanban === 'concluido') {
    novoStatusOp = 'concluida';
  } else if (novoStatusOp === 'aberta' && status === 'Finalizado') {
    novoStatusOp = 'em_andamento';
  }

  const opUpdate: Json = {
    ...op,
    etapaKanban: novaEtapaKanban,
    status: novoStatusOp,
  };

  if (novaEtapaKanban === 'concluido' && codigoProduto && qtdBoa > 0) {
    await entradaProdutoAcabado({ codigoProduto, qtd: qtdBoa, opNumero, userId });
  }

  await updateRecord('ordem_producao', body.opId, opUpdate, userId);

  await createRecord(
    'historico_op',
    {
      opId: body.opId,
      opNumero,
      statusAnterior: String(op.status || ''),
      statusNovo: String(opUpdate.status || ''),
      usuario: await getUserDisplayName(userId),
      obs: `Apontamento: ${body.etapa} (${status})`,
      data: new Date().toISOString(),
    },
    userId,
  );

  return { apontamento: created, bom: bomResult, op: opUpdate };
}

export async function gerarPedidoDeOrcamento(orcamentoId: string, userId: string) {
  const orc = await getRecordById('orcamento', orcamentoId);
  if (!orc) throw new Error('Orçamento não encontrado');

  const pedidos = await listRecords('pedido_venda');
  const numero = nextNumero('PV', pedidos as any, /^PV-(\d+)/i);

  const oppLinkedId = String((orc as Record<string, unknown>).oportunidade_id ?? '').trim();

  const pedido = await createRecord(
    'pedido_venda',
    {
      numero,
      cliente_nome: orc.cliente_nome,
      data_emissao: new Date().toISOString().slice(0, 10),
      data_entrega: orc.validade || orc.data_emissao,
      vendedor: orc.vendedor,
      valor_total: orc.valor_total,
      status: 'Em aprovação',
      forma_pagamento: 'A definir',
      observacoes: `Gerado do ${orc.numero}`,
      orcamento_id: orcamentoId,
      oportunidade_id: oppLinkedId || undefined,
      itens: orc.itens || [],
    },
    userId,
  );

  await updateRecord(
    'orcamento',
    orcamentoId,
    { ...orc, status: 'Aprovado', pedido_gerado_id: pedido.id },
    userId,
  );

  const oportunidades = await listRecords('crm_oportunidade');
  const opMatch = oportunidades.find(
    (o) =>
      String((o as Record<string, unknown>).orcamento_id || '') === String(orcamentoId) ||
      (oppLinkedId && String((o as { id?: string }).id) === oppLinkedId),
  );
  if (opMatch) {
    await updateRecord(
      'crm_oportunidade',
      String(opMatch.id),
      {
        ...opMatch,
        estagio: 'Fechado ganho',
        stage: 'Fechado ganho',
        pedido_id: pedido.id,
        orcamento_id: orcamentoId,
      },
      userId,
    );
  }

  return pedido;
}

export async function reservarEstoquePedido(pedidoId: string, userId: string) {
  const pedido = await getRecordById('pedido_venda', pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado');
  const itens = Array.isArray((pedido as any).itens) ? (pedido as any).itens : [];
  await assertPedidoItensBomCompleto(itens);
  if (!itens.length) {
    return { ok: true, message: 'Pedido sem itens — nada a reservar', movimentos: [] };
  }

  const produtos = await listRecords('produto');
  const movs: Json[] = [];
  const allMov = await listRecords('movimentacao_estoque');

  for (const it of itens) {
    const cod = String(it.codigo || '');
    const qtd = Number(it.quantidade || it.qtd || 0);
    if (!cod || qtd <= 0) continue;
    const p = produtos.find((x) => String(x.codigo) === cod);
    if (!p) continue;
    const est = Number(p.estoque_atual || 0);
    if (est < qtd) throw new Error(`Estoque insuficiente para ${cod}`);
    await updateRecord('produto', String(p.id), { ...p, estoque_atual: est - qtd }, userId);

    const numero = nextNumero('MOV', allMov as any, /^MOV-(\d+)/i);
    allMov.unshift({ numero } as any);
    const m = await createRecord(
      'movimentacao_estoque',
      {
        numero,
        tipo: 'Saída',
        produto_descricao: String(p.descricao || cod),
        quantidade: qtd,
        unidade: String(p.unidade || 'UN'),
        custo_unitario: Number(p.preco_custo || 0),
        custo_total: Number((Number(p.preco_custo || 0) * qtd).toFixed(2)),
        data: new Date().toISOString().slice(0, 10),
        origem: `Reserva ${pedido.numero}`,
        responsavel: await getUserDisplayName(userId),
        motivo: 'Reserva pedido de venda',
      },
      userId,
    );
    movs.push(m);
  }

  await updateRecord(
    'pedido_venda',
    pedidoId,
    { ...pedido, estoque_reservado: true, status: pedido.status || 'Produção' },
    userId,
  );

  return { ok: true, movimentos: movs };
}

export async function gerarOpDoPedido(pedidoId: string, userId: string) {
  const pedido = await getRecordById('pedido_venda', pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado');

  const itens = Array.isArray((pedido as any).itens) ? (pedido as any).itens : [];
  await assertPedidoItensBomCompleto(itens);
  const produtos = await listRecords('produto');

  const createdOps: Json[] = [];

  if (itens.length) {
    for (const it of itens) {
      const cod = String(it.codigo || '');
      const qtd = Number(it.quantidade || it.qtd || 0);
      if (!cod || qtd <= 0) continue;
      const p = produtos.find((x) => String(x.codigo) === cod);
      const tipo = String(p?.tipo || '');
      if (!['Produto', 'Semi-Acabado'].includes(tipo) && tipo !== '') continue;

      const op = await createRecord(
        'ordem_producao',
        {
          categoria_codigo: (p as any)?.categoria_industrial ?? (p as any)?.categoria_codigo,
          pedidoId: pedido.id,
          clienteNome: pedido.cliente_nome,
          codigoProduto: cod,
          produtoDescricao: p?.descricao || cod,
          quantidade: qtd,
          unidade: p?.unidade || 'UN',
          dataEmissao: new Date().toISOString(),
          prazo: pedido.data_entrega,
          status: 'aberta',
          prioridade: 'normal',
          responsavel: '',
          observacao: `Gerado automaticamente do pedido ${pedido.numero}`,
          etapaKanban: 'a_fazer',
        },
        userId,
      );
      try {
        if (p?.id) await linkProductTechnicalFilesToOp(String(p.id), String((op as any).id));
      } catch {
        /* não bloqueia geração da OP */
      }
      createdOps.push(op);
    }
  } else {
    const existingOps = await listRecords('ordem_producao');
    const numero = nextNumero('OP', existingOps as any, /^OP-(\d+)/i);
    const op = await createRecord(
      'ordem_producao',
      {
        numero,
        pedidoId: pedido.id,
        clienteNome: pedido.cliente_nome,
        codigoProduto: 'GEN',
        produtoDescricao: `Pedido ${pedido.numero} (sem itens)`,
        quantidade: 1,
        unidade: 'UN',
        dataEmissao: new Date().toISOString(),
        prazo: pedido.data_entrega,
        status: 'aberta',
        prioridade: 'Normal',
        etapaKanban: 'a_fazer',
        observacao: 'OP genérica — complemente o produto',
      },
      userId,
    );
    createdOps.push(op);
  }

  await updateRecord(
    'pedido_venda',
    pedidoId,
    { ...pedido, status: 'Produção', ops_geradas: createdOps.map((o: any) => o.numero) },
    userId,
  );

  return createdOps;
}

export async function gerarContasReceberDoPedido(pedidoId: string, userId: string) {
  const pedido = await getRecordById('pedido_venda', pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado');

  const valor = Number((pedido as any).valor_total || 0);
  const venc = (pedido as any).data_entrega || new Date().toISOString().slice(0, 10);

  const cr = await createRecord(
    'conta_receber',
    {
      descricao: `Pedido ${pedido.numero}`,
      cliente_fornecedor: pedido.cliente_nome,
      categoria: 'Venda',
      valor,
      data_emissao: (pedido as any).data_emissao || new Date().toISOString().slice(0, 10),
      data_vencimento: venc,
      status: 'aberto',
      documento: String(pedido.numero),
      observacoes: 'Gerado automaticamente do pedido',
      pedido_id: pedidoId,
    },
    userId,
  );

  return cr;
}

export async function fluxoPedidoVenda(pedidoId: string, userId: string) {
  await reservarEstoquePedido(pedidoId, userId);
  const ops = await gerarOpDoPedido(pedidoId, userId);
  const cr = await gerarContasReceberDoPedido(pedidoId, userId);
  return { ops, contaReceber: cr };
}

export async function recebimentoEntradaEstoque(recebimentoId: string, divergenciaAjuste: number, userId: string) {
  const rec = await getRecordById('compras_recebimento', recebimentoId);
  if (!rec) throw new Error('Recebimento não encontrado');

  const valor = Number((rec as any).valor || 0) + Number(divergenciaAjuste || 0);
  const ocNome = String((rec as any).ordem_compra || '');

  await updateRecord(
    'compras_recebimento',
    recebimentoId,
    {
      ...rec,
      status: 'Conferido',
      valor_ajustado: valor,
      divergencia: divergenciaAjuste,
    },
    userId,
  );

  const movs: Json[] = [];
  if (ocNome) {
    const ocs = await listRecords('ordem_compra');
    const oc = ocs.find((o) => String(o.numero) === ocNome);
    if (oc) {
      await createRecord(
        'conta_pagar',
        {
          descricao: `OC ${ocNome}`,
          cliente_fornecedor: oc.fornecedor_nome,
          categoria: 'Compra',
          valor,
          data_emissao: new Date().toISOString().slice(0, 10),
          data_vencimento: oc.data_entrega_prevista || new Date().toISOString().slice(0, 10),
          status: 'aberto',
          documento: ocNome,
          observacoes: 'Gerado do recebimento de mercadoria',
        },
        userId,
      );
    }
  }

  return { recebimento: rec, movimentos: movs, contaPagarCriada: true };
}

export async function snapshotChaoFabrica() {
  const maquinas = await listRecords('producao_maquina');
  const ops = (await listRecords('ordem_producao')).filter(
    (o) => o.status === 'em_andamento' || o.status === 'aberta',
  );

  const ativas = maquinas.filter((m: any) => String(m.status) === 'Ativo');
  const cards = ativas.map((m: any, i: number) => {
    const op = ops[i % Math.max(ops.length, 1)] || null;
    return {
      id: m.codigo,
      nome: m.descricao,
      status: op ? 'Em Andamento' : m.status === 'Manutenção' ? 'Manutenção' : 'Disponível',
      op: op?.numero || null,
      produto: op?.produtoDescricao || null,
      operador: op?.responsavel || null,
      inicio: op?.dataEmissao || null,
      progresso: op ? 50 : 0,
    };
  });

  return { maquinas, ops_ativas: ops, cards };
}

export async function kpisDashboard(sector: string) {
  const produtos = await listRecords('produto');
  const estoqueCritico = produtos.filter(
    (p: any) => Number(p.estoque_atual) < Number(p.estoque_minimo),
  ).length;

  const ops = await listRecords('ordem_producao');
  const opsPendentes = ops.filter((o: any) => o.status === 'aberta' || o.status === 'em_andamento').length;

  const apts = await listRecords('apontamento_producao');
  const seven = Date.now() - 7 * 86400000;
  const apts7 = apts.filter((a: any) => {
    const t = new Date(a.horaInicio || a.createdAt || 0).getTime();
    return t >= seven;
  });
  const produtividade = apts7.reduce((acc: Record<string, number>, a: any) => {
    const op = String(a.operador || '—');
    acc[op] = (acc[op] || 0) + Number(a.quantidade || 0);
    return acc;
  }, {});

  const ocs = await listRecords('ordem_compra');
  const ocAtrasadas = ocs.filter((o: any) => {
    if (!o.data_entrega_prevista) return false;
    return new Date(o.data_entrega_prevista) < new Date() && String(o.status) !== 'Recebido';
  }).length;

  const [receber, pagar] = await Promise.all([listRecords('conta_receber'), listRecords('conta_pagar')]);
  const hoje = new Date().toISOString().slice(0, 10);
  const aVencer = receber.filter(
    (c: any) => ['aberto', 'parcial'].includes(String(c.status)) && c.data_vencimento >= hoje,
  ).length;
  const vencidas = receber.filter((c: any) => String(c.status) === 'vencido').length;

  const crm = await listRecords('crm_oportunidade');
  const funil = crm.reduce((acc: Record<string, number>, o: any) => {
    const e = String(o.estagio || '—');
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});

  const base = {
    estoqueCritico,
    opsPendentes,
    produtividadePorOperador: produtividade,
    ocAtrasadas,
    contasAVencer: aVencer,
    contasVencidas: vencidas,
    funilOportunidades: funil,
  };

  if (sector.toLowerCase().includes('produ')) {
    return { ...base, focus: 'producao' };
  }
  if (sector.toLowerCase().includes('compra')) {
    return { ...base, focus: 'compras' };
  }
  if (sector.toLowerCase().includes('finance')) {
    return {
      ...base,
      focus: 'financeiro',
      totalEmAbertoReceber: receber.filter((c: any) => ['aberto', 'parcial', 'vencido'].includes(String(c.status || '').toLowerCase())).length,
      totalEmAbertoPagar: pagar.filter((c: any) => ['aberto', 'parcial', 'vencido'].includes(String(c.status || '').toLowerCase())).length,
    };
  }
  return { ...base, focus: 'geral' };
}

export async function calcularCustoBom(codigoProduto: string) {
  const produtos = await listRecords('produto');
  const p = produtos.find((x) => String(x.codigo) === codigoProduto);
  if (!p) throw new Error('Produto não encontrado');
  const bom = parseBom((p as any).bom_json);
  let custo = 0;
  const detalhes: Json[] = [];
  for (const line of bom) {
    const comp = produtos.find((c) => String(c.codigo) === String(line.codigo));
    const qtd = Number(line.qtd || 0);
    const perda = 1 + Number(line.perda_pct || 0) / 100;
    const preco = Number(comp?.preco_custo || 0);
    const sub = qtd * perda * preco;
    custo += sub;
    detalhes.push({
      codigo: line.codigo,
      subtotal: sub,
      qtd,
      preco_unitario: preco,
    });
  }
  const mdo = Number((p as any).custo_mao_obra || 0);
  return { codigo: codigoProduto, custo_materiais: Number(custo.toFixed(2)), custo_mao_obra: mdo, custo_total: Number((custo + mdo).toFixed(2)), detalhes };
}

export function emitirNFeXmlMock(pedidoId: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><NFe><infNFe Id="NFe${pedidoId}"><emit/><dest/><det nItem="1"><prod><xProd>COZINCA INOX</xProd></prod></det></infNFe></NFe>`;
}

export function sefazStatusMock(chave: string) {
  return { cStat: '100', xMotivo: 'Autorizado o uso da NF-e (mock homologação)', chave };
}

export function spedArquivoSintetico(competencia: string) {
  const linhas = [
    '|0000|LEIAUTE|01012026|31012026|COZINCA INOX|',
    `|C100|${competencia}|SINTÉTICO|`,
    '|9999|1|',
  ];
  return linhas.join('\n');
}

/** Peso aproximado chapa inox (kg): dimensões em mm, densidade 7850 kg/m³ */
export function calcularPesoChapaInoxKg(xMm: number, yMm: number, espessuraMm: number) {
  const volM3 = (Number(xMm) * Number(yMm) * Number(espessuraMm)) / 1e9;
  return Number((volM3 * 7850).toFixed(4));
}

/** Importação simples de BOM (CSV/TSV: codigo;qtd;perda_pct opcional). Comentários # ou ; no início da linha são ignorados. */
export async function importarBomCsv(
  csvText: string,
  produtoCodigo: string,
  userId: string,
  criarInsumosFaltantes = false,
) {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim());
  const items: Array<{ codigo: string; qtd: number; perda_pct?: number }> = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || /^[#;]/.test(t)) continue;
    const p = t.split(/[;\t,]/).map((s) => s.trim());
    if (p.length < 2) continue;
    const q = Number(String(p[1]).replace(',', '.'));
    items.push({
      codigo: p[0],
      qtd: Number.isFinite(q) ? q : 0,
      perda_pct: p[2] !== undefined ? Number(String(p[2]).replace(',', '.')) : undefined,
    });
  }

  let produtos = await listRecords('produto');
  const alvo = produtos.find((x) => String(x.codigo) === String(produtoCodigo));
  if (!alvo) throw new Error('Produto alvo não encontrado');

  if (criarInsumosFaltantes) {
    for (const it of items) {
      const ex = produtos.find((x) => String(x.codigo) === String(it.codigo));
      if (!ex) {
        await createRecord(
          'produto',
          {
            codigo: it.codigo,
            descricao: `Insumo ${it.codigo} (auto BOM)`,
            tipo: 'Matéria-Prima',
            unidade: 'UN',
            preco_custo: 0,
            preco_venda: 0,
            estoque_atual: 0,
            estoque_minimo: 0,
            status: 'Ativo',
          },
          userId,
        );
      }
    }
    produtos = await listRecords('produto');
    const again = produtos.find((x) => String(x.codigo) === String(produtoCodigo));
    if (!again) throw new Error('Produto alvo perdido após criação de insumos');
    Object.assign(alvo, again);
  }

  const merged = { ...alvo, bom_json: items };
  await updateRecord('produto', String(alvo.id), merged, userId);
  return { itens: items, produtoId: alvo.id };
}
