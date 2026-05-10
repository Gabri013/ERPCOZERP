import { api } from '@/services/api';

function unwrap(res) {
  return res?.data?.data ?? res?.data;
}

export const cozincaApi = {
  async registrarApontamento(body) {
    const res = await api.post('/api/cozinca/apontamento/registrar', body);
    return unwrap(res);
  },

  async gerarPedidoDeOrcamento(orcamentoId) {
    const res = await api.post(`/api/cozinca/orcamentos/${orcamentoId}/gerar-pedido`);
    return unwrap(res);
  },

  async reservarEstoquePedido(pedidoId) {
    const res = await api.post(`/api/cozinca/pedidos/${pedidoId}/reservar-estoque`);
    return unwrap(res);
  },

  async gerarOpPedido(pedidoId) {
    const res = await api.post(`/api/cozinca/pedidos/${pedidoId}/gerar-op`);
    return unwrap(res);
  },

  async gerarContasReceberPedido(pedidoId) {
    const res = await api.post(`/api/cozinca/pedidos/${pedidoId}/gerar-contas-receber`);
    return unwrap(res);
  },

  async fluxoPedidoVenda(pedidoId) {
    const res = await api.post(`/api/cozinca/pedidos/${pedidoId}/fluxo-venda`);
    return unwrap(res);
  },

  async chaoFabricaSnapshot() {
    const res = await api.get('/api/cozinca/chao-fabrica/snapshot');
    return unwrap(res);
  },

  async dashboardKpis(sector = 'Geral') {
    const res = await api.get(`/api/cozinca/dashboard/kpis?sector=${encodeURIComponent(sector)}`);
    return unwrap(res);
  },

  async custoBom(codigoProduto) {
    const res = await api.get(`/api/cozinca/produtos/${encodeURIComponent(codigoProduto)}/custo-bom`);
    return unwrap(res);
  },

  async importarBomCsv(body) {
    const res = await api.post('/api/cozinca/engenharia/bom-import', body);
    return unwrap(res);
  },

  async pesoChapaInox(xMm, yMm, eMm) {
    const q = new URLSearchParams({
      xMm: String(xMm),
      yMm: String(yMm),
      eMm: String(eMm),
    });
    const res = await api.get(`/api/cozinca/engenharia/peso-chapa?${q}`);
    return unwrap(res);
  },
};
