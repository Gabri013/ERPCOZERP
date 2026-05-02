import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './cozinca.service.js';

export const cozincaRouter = Router();

cozincaRouter.post(
  '/apontamento/registrar',
  authenticate,
  requirePermission('apontar'),
  async (req, res) => {
    try {
      const data = await svc.registrarApontamentoIntegrado(req.body, req.user!.userId);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao registrar apontamento';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.post(
  '/orcamentos/:id/gerar-pedido',
  authenticate,
  requirePermission(['criar_orcamentos', 'criar_pedidos']),
  async (req, res) => {
    try {
      const data = await svc.gerarPedidoDeOrcamento(req.params.id, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.post(
  '/pedidos/:id/reservar-estoque',
  authenticate,
  requirePermission('movimentar_estoque'),
  async (req, res) => {
    try {
      const data = await svc.reservarEstoquePedido(req.params.id, req.user!.userId);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.post(
  '/pedidos/:id/gerar-op',
  authenticate,
  requirePermission('criar_op'),
  async (req, res) => {
    try {
      const data = await svc.gerarOpDoPedido(req.params.id, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.post(
  '/pedidos/:id/gerar-contas-receber',
  authenticate,
  requirePermission('editar_financeiro'),
  async (req, res) => {
    try {
      const data = await svc.gerarContasReceberDoPedido(req.params.id, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.post(
  '/pedidos/:id/fluxo-venda',
  authenticate,
  requirePermission('aprovar_pedidos'),
  async (req, res) => {
    try {
      const data = await svc.fluxoPedidoVenda(req.params.id, req.user!.userId);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.post(
  '/recebimentos/:id/entrada',
  authenticate,
  requirePermission('ver_compras'),
  async (req, res) => {
    try {
      const div = Number(req.body?.divergencia || 0);
      const data = await svc.recebimentoEntradaEstoque(req.params.id, div, req.user!.userId);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.get('/chao-fabrica/snapshot', authenticate, requirePermission('ver_chao_fabrica'), async (req, res) => {
  try {
    const data = await svc.snapshotChaoFabrica();
    res.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    res.status(500).json({ error: msg });
  }
});

cozincaRouter.get('/dashboard/kpis', authenticate, async (req, res) => {
  const sector = String(req.query.sector || 'Geral');
  try {
    const data = await svc.kpisDashboard(sector);
    res.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    res.status(500).json({ error: msg });
  }
});

cozincaRouter.get(
  '/produtos/:codigo/custo-bom',
  authenticate,
  requirePermission('ver_estoque'),
  async (req, res) => {
    try {
      const data = await svc.calcularCustoBom(req.params.codigo);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.get(
  '/fiscal/nfe/pedido/:pedidoId/xml-mock',
  authenticate,
  requirePermission('ver_fiscal'),
  async (req, res) => {
    const xml = svc.emitirNFeXmlMock(req.params.pedidoId);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  },
);

cozincaRouter.get('/fiscal/sefaz/mock-status/:chave', authenticate, requirePermission('ver_fiscal'), (req, res) => {
  res.json({ success: true, data: svc.sefazStatusMock(req.params.chave) });
});

cozincaRouter.post(
  '/engenharia/bom-import',
  authenticate,
  requirePermission('editar_produtos'),
  async (req, res) => {
    try {
      const csvText = String(req.body?.csvText || req.body?.text || '');
      const produtoCodigo = String(req.body?.produtoCodigo || '');
      const criar = Boolean(req.body?.criarInsumosFaltantes);
      if (!csvText || !produtoCodigo) {
        return res.status(400).json({ error: 'csvText e produtoCodigo são obrigatórios' });
      }
      const data = await svc.importarBomCsv(csvText, produtoCodigo, req.user!.userId, criar);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

cozincaRouter.get('/engenharia/peso-chapa', authenticate, requirePermission('ver_estoque'), (req, res) => {
  const x = Number(req.query.xMm);
  const y = Number(req.query.yMm);
  const e = Number(req.query.eMm);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(e)) {
    return res.status(400).json({ error: 'Informe xMm, yMm, eMm numéricos' });
  }
  const kg = svc.calcularPesoChapaInoxKg(x, y, e);
  res.json({ success: true, data: { pesoKg: kg, xMm: x, yMm: y, espessuraMm: e } });
});

cozincaRouter.get('/fiscal/sped/export.txt', authenticate, requirePermission('ver_fiscal'), (req, res) => {
  const comp = String(req.query.competencia || '012026');
  const body = svc.spedArquivoSintetico(comp);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="sped-sintetico-${comp}.txt"`);
  res.send(body);
});
