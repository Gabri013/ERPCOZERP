const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ============================================
// RECURSOS HUMANOS — FUNCIONÁRIOS
// ============================================

// GET /api/rh/funcionarios — lista funcionários
router.get('/funcionarios', authenticateToken, requirePermission('ver_rh'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const entity = await query("SELECT id FROM entities WHERE code = 'funcionario'");
    
    if (!entity.length) return res.json({ success: true, data: [], pagination: { page: 1, total: 0 } });
    
    const entityId = entity[0].id;
    let sql = `SELECT id, data, created_at FROM entity_records WHERE entity_id = ? AND deleted_at IS NULL`;
    const params = [entityId];

    if (search) {
      sql += ` AND (JSON_UNQUOTE(JSON_EXTRACT(data, '$.nome')) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.matricula')) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY JSON_UNQUOTE(JSON_EXTRACT(data, "$.nome")) LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [funcs, count] = await Promise.all([
      query(sql, params),
      query('SELECT COUNT(*) as total FROM entity_records WHERE entity_id = ? AND deleted_at IS NULL', [entityId])
    ]);

    const parsed = funcs.map(f => ({
      id: f.id,
      ...JSON.parse(f.data || '{}'),
      created_at: f.created_at
    }));

    res.json({ 
      success: true, 
      data: parsed, 
      pagination: { 
        page: parseInt(page), 
        total: parseInt(count[0].total),
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rh/funcionarios — criar funcionário
router.post('/funcionarios', authenticateToken, requirePermission('cadastrar_funcionario'), async (req, res) => {
  try {
    const { data } = req.body;
    
    const entity = await query("SELECT id FROM entities WHERE code = 'funcionario'");
    if (!entity.length) {
      return res.status(404).json({ error: 'Entidade funcionário não configurada' });
    }

    // Gera matrícula automática
    const last = await query(`
      SELECT data->>'$.matricula' as matricula FROM entity_records 
      WHERE entity_id = ? AND data->>'$.matricula' IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `, [entity[0].id]);

    let nextMat = 1;
    if (last.length > 0) {
      const match = last[0].matricula.match(/(\D+)(\d+)/);
      if (match) nextMat = parseInt(match[2]) + 1;
    }
    data.matricula = `F${String(nextMat).padStart(5, '0')}`;
    data.data_admissao = data.data_admissao || new Date().toISOString().split('T')[0];

    const id = uuidv4();
    await query(
      'INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (?, ?, ?, ?)',
      [id, entity[0].id, JSON.stringify(data), req.user.userId]
    );

    res.status(201).json({ success: true, id, data: { id, ...data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PONTO — LANÇAMENTO DE HORAS
// ============================================

router.post('/ponto/lancamento', authenticateToken, requirePermission('registrar_ponto'), async (req, res) => {
  try {
    const { funcionario_id, data, hora_entrada, hora_saida, observacao } = req.body;

    if (!funcionario_id || !data || !hora_entrada) {
      return res.status(400).json({ error: 'Funcionário, data e entrada são obrigatórios' });
    }

    // Verifica se já existe lançamento para essa data
    const existente = await query(
      'SELECT id FROM ponto_lancamentos WHERE funcionario_id = ? AND data = ?',
      [funcionario_id, data]
    );

    if (existente.length > 0) {
      // Update
      await query(`
        UPDATE ponto_lancamentos 
        SET hora_saida = ?, observacao = ?, updated_at = NOW()
        WHERE funcionario_id = ? AND data = ?
      `, [hora_saida, observacao, funcionario_id, data]);

      res.json({ success: true, message: 'Ponto atualizado' });
    } else {
      // Insert
      const id = uuidv4();
      await query(`
        INSERT INTO ponto_lancamentos (id, funcionario_id, data, hora_entrada, hora_saida, observacao, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, funcionario_id, data, hora_entrada, hora_saida, observacao, req.user.userId]);

      res.status(201).json({ success: true, id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rh/ponto/relatorio — relatório de ponto
router.get('/ponto/relatorio', authenticateToken, requirePermission('ver_rh'), async (req, res) => {
  try {
    const { mes, ano, funcionario_id } = req.query;

    let sql = `
      SELECT 
        pl.id, pl.data, pl.hora_entrada, pl.hora_saida, pl.observacao,
        f.data as funcionario_data, f.nome, f.matricula
      FROM ponto_lancamentos pl
      JOIN funcionarios f ON pl.funcionario_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (funcionario_id) {
      sql += ' AND pl.funcionario_id = ?';
      params.push(funcionario_id);
    }

    if (mes && ano) {
      sql += ' AND MONTH(pl.data) = ? AND YEAR(pl.data) = ?';
      params.push(mes, ano);
    }

    sql += ' ORDER BY pl.data DESC';
    const lancamentos = await query(sql, params);

    // Processa horas
    const processado = lancamentos.map(l => {
      let horas = 0, minutos = 0;
      if (l.hora_entrada && l.hora_saida) {
        const [hE, mE] = l.hora_entrada.split(':').map(Number);
        const [hS, mS] = l.hora_saida.split(':').map(Number);
        const diff = (hS + mS/60) - (hE + mE/60);
        horas = Math.floor(diff);
        minutos = Math.round((diff - horas) * 60);
      }

      return {
        ...l,
        horas_trabalhadas: `${horas}h ${minutos}m`,
        horas_numerico: (horas + minutos/60).toFixed(2)
      };
    });

    res.json({ success: true, data: processado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FOLHA DE PAGAMENTO
// ============================================

router.get('/folha/calcular', authenticateToken, requirePermission('ver_folha'), async (req, res) => {
  try {
    const { mes, ano, funcionario_id } = req.query;

    // Busca funcionários
    let sqlFunc = 'SELECT * FROM funcionarios WHERE 1=1';
    const params = [];

    if (funcionario_id) {
      sqlFunc += ' AND id = ?';
      params.push(funcionario_id);
    }

    const funcionarios = await query(sqlFunc, params);

    const resultados = [];

    for (const func of funcionarios) {
      const salarioBase = parseFloat(func.salario_base) || 0;
      
      // Busca lançamentos de ponto do mês
      const lancamentos = await query(`
        SELECT * FROM ponto_lancamentos 
        WHERE funcionario_id = ? 
          AND MONTH(data) = ? 
          AND YEAR(data) = ?
      `, [func.id, mes, ano]);

      // Calcula horas
      let horasNormais = 0;
      let horasExtras = 0;
      let faltas = 0;

      lancamentos.forEach(lanc => {
        if (lanc.hora_entrada && lanc.hora_saida) {
          const [hE, mE] = lanc.hora_entrada.split(':').map(Number);
          const [hS, mS] = lanc.hora_saida.split(':').map(Number);
          const diff = (hS + mS/60) - (hE + mE/60);
          
          if (diff > 8) {
            horasNormais = 8;
            horasExtras = diff - 8;
          } else {
            horasNormais = diff;
          }
        } else {
          faltas++;
        }
      });

      // Cálculos
      const valorHora = salarioBase / 160; // 8h * 20d
      const salarioHoras = valorHora * horasNormais;
      const horasExtrasValor = valorHora * horasExtras * 1.5;
      const descontoFaltas = valorHora * faltas * 8;
      const salarioLiquido = salarioBase + salarioHoras + horasExtrasValor - descontoFaltas;

      resultados.push({
        funcionario: func.nome,
        salario_base: salarioBase,
        horas_normais: horasNormais.toFixed(1),
        horas_extras: horasExtras.toFixed(1),
        faltas,
        salario_liquido: salarioLiquido.toFixed(2)
      });
    }

    res.json({ success: true, data: resultados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
