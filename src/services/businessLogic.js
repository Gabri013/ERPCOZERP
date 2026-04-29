// Lógica de negócio central — funções reutilizáveis entre páginas
// Troque as chamadas de storage por chamadas de API quando tiver backend

import { storage } from './storage';

// ─── Configurações ──────────────────────────────────────────────────────────
export const CONFIG = {
  LIMITE_APROVACAO: 20000, // Pedidos acima deste valor requerem aprovação gerencial
};

// ─── Pedidos de Venda ────────────────────────────────────────────────────────

/**
 * Aprova um Pedido de Venda.
 * Se valor_total > CONFIG.LIMITE_APROVACAO → status vira 'Aguardando Aprovação'
 * Senão → status vira 'Aprovado' e subtrai estoque automaticamente.
 */
export function aprovarPedido(pedidoId) {
  const pedidos = storage.get('pedidos', []);
  const pedido = pedidos.find(p => p.id === pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado');

  const precisaAprovacao = (pedido.valor_total || 0) > CONFIG.LIMITE_APROVACAO;

  const novoStatus = precisaAprovacao ? 'Aguardando Aprovação' : 'Aprovado';
  const pedidosAtualizados = pedidos.map(p =>
    p.id === pedidoId
      ? { ...p, status: novoStatus, data_aprovacao: new Date().toISOString() }
      : p
  );
  storage.set('pedidos', pedidosAtualizados);

  // Se aprovado diretamente, baixa o estoque
  if (!precisaAprovacao) {
    _baixarEstoque(pedido);
  }

  return { status: novoStatus, precisaAprovacao };
}

/**
 * Aprovação gerencial (para pedidos acima do limite).
 * Só pode ser chamada por usuário com perfil Gerente/Admin.
 */
export function aprovarPedidoGerencial(pedidoId) {
  const pedidos = storage.get('pedidos', []);
  const pedido = pedidos.find(p => p.id === pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado');

  const pedidosAtualizados = pedidos.map(p =>
    p.id === pedidoId
      ? { ...p, status: 'Aprovado', data_aprovacao_gerencial: new Date().toISOString() }
      : p
  );
  storage.set('pedidos', pedidosAtualizados);
  _baixarEstoque(pedido);

  return { status: 'Aprovado' };
}

/**
 * Rejeita um pedido que estava aguardando aprovação gerencial.
 */
export function rejeitarPedido(pedidoId, motivo = '') {
  const pedidos = storage.get('pedidos', []);
  const pedidosAtualizados = pedidos.map(p =>
    p.id === pedidoId
      ? { ...p, status: 'Cancelado', motivo_rejeicao: motivo, data_rejeicao: new Date().toISOString() }
      : p
  );
  storage.set('pedidos', pedidosAtualizados);
  return { status: 'Cancelado' };
}

// ─── Estoque ─────────────────────────────────────────────────────────────────

/**
 * Subtrai o estoque de cada item do pedido e cria movimentações de saída vinculadas.
 */
function _baixarEstoque(pedido) {
  if (!pedido.itens || pedido.itens.length === 0) return;

  const produtos = storage.get('produtos', []);
  const movimentacoes = storage.get('movimentacoes', []);
  const novasMovs = [];

  const produtosAtualizados = produtos.map(prod => {
    const item = pedido.itens.find(it =>
      it.produto_codigo === prod.codigo || it.produto_descricao === prod.descricao
    );
    if (!item) return prod;

    const qtdSaida = Number(item.quantidade) || 0;
    const estoqueNovo = Math.max(0, (Number(prod.estoque_atual) || 0) - qtdSaida);

    // Cria registro de movimentação de saída
    novasMovs.push({
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      numero: `MOV-${String(movimentacoes.length + novasMovs.length + 1).padStart(3, '0')}`,
      tipo: 'Saída',
      produto_descricao: prod.descricao,
      produto_codigo: prod.codigo,
      quantidade: qtdSaida,
      unidade: prod.unidade || 'UN',
      custo_unitario: prod.preco_custo || 0,
      custo_total: qtdSaida * (prod.preco_custo || 0),
      data: new Date().toISOString().slice(0, 10),
      origem: pedido.numero || pedido.id,
      documento_ref: pedido.numero,
      responsavel: pedido.vendedor || 'Sistema',
      observacoes: `Saída automática — aprovação PV ${pedido.numero}`,
    });

    return { ...prod, estoque_atual: estoqueNovo };
  });

  storage.set('produtos', produtosAtualizados);
  storage.set('movimentacoes', [...movimentacoes, ...novasMovs]);
}

// ─── Helpers de dados para relatórios ────────────────────────────────────────

export function getPedidosAguardando() {
  return storage.get('pedidos', []).filter(p => p.status === 'Aguardando Aprovação');
}

export function getEstoqueCritico() {
  return storage.get('produtos', [])
    .filter(p => Number(p.estoque_atual) < Number(p.estoque_minimo) && p.tipo !== 'Serviço')
    .sort((a, b) => (Number(a.estoque_atual) - Number(a.estoque_minimo)) - (Number(b.estoque_atual) - Number(b.estoque_minimo)));
}

export function getSaldoFinanceiro() {
  const receber = storage.get('contas_receber', []);
  const pagar = storage.get('contas_pagar', []);
  return {
    totalReceber: receber.filter(c => c.status === 'Aberto' || c.status === 'Vencido').reduce((s, c) => s + (c.valor || 0), 0),
    totalPagar: pagar.filter(c => c.status === 'Aberto' || c.status === 'Vencido').reduce((s, c) => s + (c.valor || 0), 0),
    totalVencidoReceber: receber.filter(c => c.status === 'Vencido').reduce((s, c) => s + (c.valor || 0), 0),
    totalVencidoPagar: pagar.filter(c => c.status === 'Vencido').reduce((s, c) => s + (c.valor || 0), 0),
  };
}

/** Gera projeção de fluxo de caixa para os próximos N dias */
export function getFluxoCaixaProjetado(dias = 30) {
  const receber = storage.get('contas_receber', []).filter(c => c.status === 'Aberto' || c.status === 'Vencido');
  const pagar = storage.get('contas_pagar', []).filter(c => c.status === 'Aberto' || c.status === 'Vencido');

  const hoje = new Date();
  const resultado = [];
  let saldoAcumulado = 0;

  for (let i = 0; i < dias; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    const dataStr = data.toISOString().slice(0, 10);
    const label = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const entradas = receber.filter(c => c.data_vencimento === dataStr).reduce((s, c) => s + (c.valor || 0), 0);
    const saidas = pagar.filter(c => c.data_vencimento === dataStr).reduce((s, c) => s + (c.valor || 0), 0);
    saldoAcumulado += entradas - saidas;

    resultado.push({ data: dataStr, label, entradas, saidas, saldo: saldoAcumulado });
  }

  return resultado;
}