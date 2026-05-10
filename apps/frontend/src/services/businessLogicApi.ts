import { recordsServiceApi } from '@/services/recordsServiceApi';
import { listSaleOrders, patchSaleOrder } from '@/services/salesApi';

export const CONFIG = {
  LIMITE_APROVACAO: 20000,
};

function normStatus(v) {
  return String(v || '').toLowerCase();
}

/** Pedidos que exigem ação gerencial (mesmo texto de status dos registros seeded). */
export async function fetchPedidosAguardandoAp() {
  const rows = await listSaleOrders({ status: 'Aguardando Aprovação', take: 500 });
  return rows;
}

/**
 * PV em DRAFT com valor acima do limite de aprovação (mesma regra da tela de aprovação).
 * O backend já limita a lista ao comercial responsável quando aplicável.
 */
export async function fetchPedidosDraftParaAprovacaoPrisma() {
  const rows = await listSaleOrders({ status: 'DRAFT', take: 500 });
  return rows.filter((o) => Number(o.totalAmount ?? 0) >= CONFIG.LIMITE_APROVACAO);
}

export async function aprovarPedidoGerencialApi(id) {
  await patchSaleOrder(id, {
    status: 'Aprovado',
    data_aprovacao_gerencial: new Date().toISOString(),
  });
  return { status: 'Aprovado' };
}

export async function rejeitarPedidoApi(id, motivo = '') {
  await patchSaleOrder(id, {
    status: 'Cancelado',
    motivo_rejeicao: motivo,
    data_rejeicao: new Date().toISOString(),
  });
  return { status: 'Cancelado' };
}

export async function fetchEstoqueCriticoApi() {
  const produtos = await recordsServiceApi.list('produto');
  return produtos
    .filter(
      (p) =>
        Number(p.estoque_atual) < Number(p.estoque_minimo) &&
        String(p.tipo || '') !== 'Serviço',
    )
    .sort(
      (a, b) =>
        Number(a.estoque_atual) -
        Number(a.estoque_minimo) -
        (Number(b.estoque_atual) - Number(b.estoque_minimo)),
    );
}

/** Status em minúsculas (seed). */
export async function fetchSaldoFinanceiroApi() {
  const [receber, pagar] = await Promise.all([
    recordsServiceApi.list('conta_receber'),
    recordsServiceApi.list('conta_pagar'),
  ]);

  const receberAberto = (receber || []).filter((c) =>
    ['aberto', 'parcial', 'vencido'].includes(normStatus(c.status)),
  );
  const pagarAberto = (pagar || []).filter((c) =>
    ['aberto', 'parcial', 'vencido'].includes(normStatus(c.status)),
  );

  return {
    totalReceber: receberAberto.reduce((s, c) => s + Number(c.valor || 0), 0),
    totalPagar: pagarAberto.reduce((s, c) => s + Number(c.valor || 0), 0),
    totalVencidoReceber: receber
      .filter((c) => normStatus(c.status) === 'vencido')
      .reduce((s, c) => s + Number(c.valor || 0), 0),
    totalVencidoPagar: pagar
      .filter((c) => normStatus(c.status) === 'vencido')
      .reduce((s, c) => s + Number(c.valor || 0), 0),
  };
}

/** Projeção de fluxo usando datas `data_vencimento` (yyyy-mm-dd) dos lançamentos. */
export async function fetchFluxoCaixaProjetadoApi(dias = 30) {
  const [receber, pagar] = await Promise.all([
    recordsServiceApi.list('conta_receber'),
    recordsServiceApi.list('conta_pagar'),
  ]);

  const rec = receber.filter((c) =>
    ['aberto', 'parcial', 'vencido'].includes(normStatus(c.status)),
  );
  const pay = pagar.filter((c) =>
    ['aberto', 'parcial', 'vencido'].includes(normStatus(c.status)),
  );

  const hoje = new Date();
  const resultado = [];
  let saldoAcumulado = 0;

  for (let i = 0; i < dias; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    const dataStr = data.toISOString().slice(0, 10);
    const label = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const entradas = rec.filter((c) => c.data_vencimento === dataStr).reduce((s, c) => s + Number(c.valor || 0), 0);
    const saidas = pay.filter((c) => c.data_vencimento === dataStr).reduce((s, c) => s + Number(c.valor || 0), 0);
    saldoAcumulado += entradas - saidas;

    resultado.push({ data: dataStr, label, entradas, saidas, saldo: saldoAcumulado });
  }

  return resultado;
}
