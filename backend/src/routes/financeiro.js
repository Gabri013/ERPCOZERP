const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

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

// POST /api/financeiro/contas-receber
router.post('/contas-receber', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { cliente_id = null, descricao = null, valor, data_vencimento, status = 'aberto' } = req.body || {};
    if (valor === undefined || valor === null || data_vencimento == null) {
      return res.status(400).json({ error: 'valor e data_vencimento são obrigatórios' });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO contas_receber (id, cliente_id, descricao, valor, data_vencimento, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, cliente_id, descricao, Number(valor), data_vencimento, status]
    );

    const rows = await query('SELECT * FROM contas_receber WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/financeiro/contas-receber/:id
router.put('/contas-receber/:id', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_id, descricao, valor, data_vencimento, status } = req.body || {};

    const existing = await query('SELECT id FROM contas_receber WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Conta a receber não encontrada' });

    const updates = [];
    const params = [];
    if (cliente_id !== undefined) { updates.push('cliente_id = ?'); params.push(cliente_id); }
    if (descricao !== undefined) { updates.push('descricao = ?'); params.push(descricao); }
    if (valor !== undefined) { updates.push('valor = ?'); params.push(Number(valor)); }
    if (data_vencimento !== undefined) { updates.push('data_vencimento = ?'); params.push(data_vencimento); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    params.push(id);
    await query(`UPDATE contas_receber SET ${updates.join(', ')} WHERE id = ?`, params);

    const rows = await query('SELECT * FROM contas_receber WHERE id = ?', [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/financeiro/contas-receber/:id
router.delete('/contas-receber/:id', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM contas_receber WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Conta a receber não encontrada' });
    await query('DELETE FROM contas_receber WHERE id = ?', [id]);
    res.json({ success: true });
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

// POST /api/financeiro/contas-pagar
router.post('/contas-pagar', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { fornecedor_id = null, descricao = null, valor, data_vencimento, status = 'aberto' } = req.body || {};
    if (valor === undefined || valor === null || data_vencimento == null) {
      return res.status(400).json({ error: 'valor e data_vencimento são obrigatórios' });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO contas_pagar (id, fornecedor_id, descricao, valor, data_vencimento, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, fornecedor_id, descricao, Number(valor), data_vencimento, status]
    );

    const rows = await query('SELECT * FROM contas_pagar WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/financeiro/contas-pagar/:id
router.put('/contas-pagar/:id', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { id } = req.params;
    const { fornecedor_id, descricao, valor, data_vencimento, status } = req.body || {};

    const existing = await query('SELECT id FROM contas_pagar WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Conta a pagar não encontrada' });

    const updates = [];
    const params = [];
    if (fornecedor_id !== undefined) { updates.push('fornecedor_id = ?'); params.push(fornecedor_id); }
    if (descricao !== undefined) { updates.push('descricao = ?'); params.push(descricao); }
    if (valor !== undefined) { updates.push('valor = ?'); params.push(Number(valor)); }
    if (data_vencimento !== undefined) { updates.push('data_vencimento = ?'); params.push(data_vencimento); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    params.push(id);
    await query(`UPDATE contas_pagar SET ${updates.join(', ')} WHERE id = ?`, params);

    const rows = await query('SELECT * FROM contas_pagar WHERE id = ?', [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/financeiro/contas-pagar/:id
router.delete('/contas-pagar/:id', requirePermission('ver_financeiro'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM contas_pagar WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    await query('DELETE FROM contas_pagar WHERE id = ?', [id]);
    res.json({ success: true });
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
