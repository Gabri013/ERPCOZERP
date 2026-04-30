const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// GET /api/financeiro/contas-receber
router.get('/contas-receber', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const limitValue = parseInt(limit, 10);
    const offsetValue = (parseInt(page, 10) - 1) * limitValue;
    
    let sql = `SELECT * FROM contas_receber WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }

    sql += ` ORDER BY data_vencimento ASC LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const contas = await query(sql, params);
    res.json({ success: true, data: contas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/financeiro/contas-pagar
router.get('/contas-pagar', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const limitValue = parseInt(limit, 10);
    const offsetValue = (parseInt(page, 10) - 1) * limitValue;
    
    let sql = `SELECT * FROM contas_pagar WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }

    sql += ` ORDER BY data_vencimento ASC LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const contas = await query(sql, params);
    res.json({ success: true, data: contas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/financeiro/fluxo-caixa
router.get('/fluxo-caixa', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const hoje = new Date();
    const projecao = [];
    
    for (let i = 0; i < parseInt(dias); i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().slice(0, 10);
      
      const receber = await query(`
        SELECT COALESCE(SUM(valor), 0) as total 
        FROM contas_receber 
        WHERE data_vencimento = ? AND status != 'recebido'
      `, [dataStr]);
      
      const pagar = await query(`
        SELECT COALESCE(SUM(valor), 0) as total 
        FROM contas_pagar 
        WHERE data_vencimento = ? AND status != 'pago'
      `, [dataStr]);

      projecao.push({
        data: dataStr,
        label: data.toLocaleDateString('pt-BR'),
        entradas: receber[0].total,
        saidas: pagar[0].total,
        saldo: receber[0].total - pagar[0].total
      });
    }

    res.json({ success: true, data: projecao });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
