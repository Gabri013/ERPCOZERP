const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ============================================
// FISCAL — NOTA FISCAL ELETRÔNICA
// ============================================

// GET /api/fiscal/nfe — lista NFe
router.get('/nfe', authenticateToken, requirePermission('ver_fiscal'), async (req, res) => {
  try {
    const { 
      status, 
      tipo = 'saida',
      periodo_inicio, 
      periodo_fim, 
      page = 1, 
      limit = 50 
    } = req.query;

    let sql = `
      SELECT nf.id, nf.numero, nf.serie, nf.emitido_em, nf.valor_total, nf.status, nf.tipo,
             c.razao_social as cliente_nome,
             u.full_name as usuario_nome
      FROM nfe nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
      LEFT JOIN users u ON nf.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND nf.status = ?';
      params.push(status);
    }

    if (tipo) {
      sql += ' AND nf.tipo = ?';
      params.push(tipo);
    }

    if (periodo_inicio) {
      sql += ' AND nf.emitido_em >= ?';
      params.push(periodo_inicio);
    }

    if (periodo_fim) {
      sql += ' AND nf.emitido_em <= ?';
      params.push(periodo_fim + ' 23:59:59');
    }

    sql += ' ORDER BY nf.emitido_em DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [nfes, count] = await Promise.all([
      query(sql, params),
      query('SELECT COUNT(*) as total FROM nfe WHERE 1=1' + 
        (status ? ' AND status = ?' : '') + 
        (tipo ? ' AND tipo = ?' : ''), 
        params.slice(0, -2) // remove limit/offset
      )
    ]);

    const parsed = nfes.map(nf => ({
      ...nf,
      itens: nf.itens ? JSON.parse(nf.itens) : []
    }));

    res.json({
      success: true,
      data: parsed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count[0].total),
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fiscal/nfe/emitir — emitir nova NFe
router.post('/nfe/emitir', authenticateToken, requirePermission('emitir_nfe'), async (req, res) => {
  try {
    const { cliente_id, itens, valor_total, natureza_operacao = 'venda' } = req.body;

    if (!cliente_id || !itens || !valor_total) {
      return res.status(400).json({ 
        error: 'Cliente, itens e valor total são obrigatórios' 
      });
    }

    // Valida cliente
    const cliente = await query('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
    if (cliente.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Gera número
    const ultima = await query('SELECT numero FROM nfe ORDER BY emitido_em DESC LIMIT 1');
    let seq = 1;
    if (ultima.length > 0) {
      const match = ultima[0].numero.match(/(\D+)(\d+)/);
      if (match) seq = parseInt(match[2]) + 1;
    }
    const numero = `NFe${String(seq).padStart(9, '0')}`;

    const nfeData = {
      id: uuidv4(),
      numero,
      serie: '1',
      emitido_em: new Date().toISOString(),
      cliente_id,
      valor_total: Number(valor_total),
      status: 'pendente',
      tipo: 'saida',
      natureza_operacao,
      itens: JSON.stringify(itens),
      created_by: req.user.userId
    };

    await query(`
      INSERT INTO nfe (id, numero, serie, emitido_em, cliente_id, valor_total, status, tipo, natureza_operacao, itens, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nfeData.id, nfeData.numero, nfeData.serie, nfeData.emitido_em,
      nfeData.cliente_id, nfeData.valor_total, nfeData.status,
      nfeData.tipo, nfeData.natureza_operacao, nfeData.itens, nfeData.created_by
    ]);

    // Log
    await query(`
      INSERT INTO audit_logs (user_id, action, entity_id, record_id, metadata)
      VALUES (?, 'nfe.emitir', ?, ?, ?)
    `, [req.user.userId, nfeData.id, nfeData.id, JSON.stringify({ numero })]);

    res.status(201).json({ success: true, id: nfeData.id, numero });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fiscal/nfe/:id/cancelar — cancelar NFe
router.post('/nfe/:id/cancelar', authenticateToken, requirePermission('cancelar_nfe'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const nf = await query('SELECT * FROM nfe WHERE id = ?', [id]);
    if (!nf.length) {
      return res.status(404).json({ error: 'NFe não encontrada' });
    }

    const data = JSON.parse(nf[0].data || '{}');
    if (data.status === 'cancelada') {
      return res.status(400).json({ error: 'NFe já está cancelada' });
    }

    data.status = 'cancelada';
    data.data_cancelamento = new Date().toISOString();
    data.motivo_cancelamento = motivo;

    await query(
      'UPDATE nfe SET data = ? WHERE id = ?',
      [JSON.stringify(data), id]
    );

    // Log
    await query(`
      INSERT INTO audit_logs (user_id, action, entity_id, record_id, metadata)
      VALUES (?, 'nfe.cancelar', ?, ?, ?)
    `, [req.user.userId, nf[0].entity_id, id, JSON.stringify({ numero: data.numero, motivo })]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fiscal/sped/contribuintes — lista para SPED
router.get('/sped/contribuintes', authenticateToken, requirePermission('ver_fiscal'), async (req, res) => {
  try {
    const contribuintes = await query(`
      SELECT 
        c.id, c.codigo, c.razao_social, c.cnpj_cpf, c.inscricao_estadual,
        c.regime_tributario, c.ativo
      FROM clientes c
      WHERE c.cnpj_cpf IS NOT NULL AND c.cnpj_cpf != ''
      ORDER BY c.razao_social
      LIMIT 1000
    `);

    res.json({ success: true, data: contribuintes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
