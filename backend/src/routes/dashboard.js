const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

async function getEntityCount(entityCode) {
  const rows = await query(
    `SELECT COUNT(*) as total
     FROM entity_records er
     JOIN entities e ON er.entity_id = e.id
     WHERE e.code = ? AND er.deleted_at IS NULL`,
    [entityCode]
  );

  return parseInt(rows?.[0]?.total, 10) || 0;
}

router.get('/', authenticateToken, requirePermission('ver_dashboard'), async (req, res) => {
  try {
    const totalClientes = await getEntityCount('cliente');
    const totalProdutos = await getEntityCount('produto');
    const totalOPs = await getEntityCount('ordem_producao');
    const totalFornecedores = await getEntityCount('fornecedor');

    const vendasMes = await query(
      `SELECT COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.valor_total')) AS DECIMAL(15,2))), 0) as total
       FROM entity_records er
       JOIN entities e ON er.entity_id = e.id
       WHERE e.code = 'pedido_venda'
         AND JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status')) = 'aprovado'
         AND MONTH(er.created_at) = MONTH(CURRENT_DATE())
         AND YEAR(er.created_at) = YEAR(CURRENT_DATE())`
    );

    res.json({
      success: true,
      data: {
        totalClientes,
        totalProdutos,
        totalOPs,
        totalFornecedores,
        totalVendas: parseFloat(vendasMes?.[0]?.total) || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/producao', authenticateToken, requirePermission('ver_dashboard'), async (req, res) => {
  try {
    const rows = await query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status')) as status, COUNT(*) as total
       FROM entity_records er
       JOIN entities e ON er.entity_id = e.id
       WHERE e.code = 'ordem_producao' AND er.deleted_at IS NULL
       GROUP BY JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status'))`
    );

    res.json({
      success: true,
      data: rows.map(row => ({
        status: row.status || 'desconhecido',
        total: parseInt(row.total, 10) || 0
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/financeiro', authenticateToken, requirePermission('ver_dashboard'), async (req, res) => {
  try {
    const contasReceber = await query(
      `SELECT COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.valor')) AS DECIMAL(15,2))), 0) as total
       FROM entity_records er
       JOIN entities e ON er.entity_id = e.id
       WHERE e.code = 'conta_receber'
         AND JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status')) IN ('aberto', 'vencido')`
    );

    const contasPagar = await query(
      `SELECT COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.valor')) AS DECIMAL(15,2))), 0) as total
       FROM entity_records er
       JOIN entities e ON er.entity_id = e.id
       WHERE e.code = 'conta_pagar'
         AND JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status')) IN ('aberto', 'vencido')`
    );

    res.json({
      success: true,
      data: {
        receber: parseFloat(contasReceber?.[0]?.total) || 0,
        pagar: parseFloat(contasPagar?.[0]?.total) || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alertas', authenticateToken, requirePermission('ver_dashboard'), async (req, res) => {
  try {
    const alertas = [];

    const estoqueCritico = await query(
      `SELECT COUNT(*) as total
       FROM entity_records er
       JOIN entities e ON er.entity_id = e.id
       WHERE e.code = 'produto'
         AND CAST(JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.estoque_atual')) AS DECIMAL(15,2)) < CAST(JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.estoque_minimo')) AS DECIMAL(15,2))`
    );

    if ((parseInt(estoqueCritico?.[0]?.total, 10) || 0) > 0) {
      alertas.push({
        tipo: 'estoque_critico',
        prioridade: 'alta',
        total: parseInt(estoqueCritico[0].total, 10) || 0
      });
    }

    const opsAtrasadas = await query(
      `SELECT COUNT(*) as total
       FROM entity_records er
       JOIN entities e ON er.entity_id = e.id
       WHERE e.code = 'ordem_producao'
         AND JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status')) NOT IN ('concluida', 'cancelada')
         AND JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.prazo')) < CURDATE()`
    );

    if ((parseInt(opsAtrasadas?.[0]?.total, 10) || 0) > 0) {
      alertas.push({
        tipo: 'op_atrasada',
        prioridade: 'alta',
        total: parseInt(opsAtrasadas[0].total, 10) || 0
      });
    }

    res.json({ success: true, data: alertas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
