// Seed de dados iniciais — popula banco com dados de exemplo
// Execute: npm run seed

const db = require('../config/database');
const { query } = db;
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Seed só executa se SEED_ENABLED=true (segurança para produção)
if (process.env.SEED_ENABLED !== 'true' && process.env.NODE_ENV === 'production') {
  console.log('⚠️  Seed desabilitado em produção. Defina SEED_ENABLED=true para executar.');
  process.exit(0);
}

async function seed() {
  console.log('🌱 Iniciando seed...\n');

  try {
    // 1. Cria usuário master
    console.log('👤 Criando usuário master...');
    let masterId = uuidv4();
    const masterPassword = process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev';
    console.log('[DEBUG] DEFAULT_MASTER_PASSWORD env:', JSON.stringify(process.env.DEFAULT_MASTER_PASSWORD));
    console.log('[DEBUG] masterPassword usado:', JSON.stringify(masterPassword));
    const masterHash = await bcrypt.hash(masterPassword, 12);

    await query(`
      INSERT IGNORE INTO users (id, email, password_hash, full_name, email_verified, active)
      VALUES (?, 'master@Cozinha.com', ?, 'Master / Owner', TRUE, TRUE)
    `, [masterId, masterHash]);

    const masterUser = await query("SELECT id FROM users WHERE email = 'master@Cozinha.com'");
    masterId = masterUser[0].id;

    // Atribui role master
    const masterRole = await query("SELECT id FROM roles WHERE code = 'master'");
    if (masterRole.length > 0) {
      await query(`
        INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [masterId, masterRole[0].id, masterId]);
    }

    console.log(`✅ Usuário master criado (master@Cozinha.com / ${process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev'})`);

    // 2. Cria usuário admin
    console.log('👤 Criando usuário admin...');
    let adminId = uuidv4();
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123_dev';
    const adminHash = await bcrypt.hash(adminPassword, 12);

    await query(`
      INSERT IGNORE INTO users (id, email, password_hash, full_name, email_verified, active)
      VALUES (?, 'admin@Cozinha.com', ?, 'Administrador', TRUE, TRUE)
    `, [adminId, adminHash]);

    const adminUser = await query("SELECT id FROM users WHERE email = 'admin@Cozinha.com'");
    adminId = adminUser[0].id;

    const adminRole = await query("SELECT id FROM roles WHERE code = 'admin'");
    if (adminRole.length > 0) {
      await query(`
        INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [adminId, adminRole[0].id, masterId]);
    }

    console.log('✅ Usuário admin criado (admin@Cozinha.com / ' + (process.env.DEFAULT_ADMIN_PASSWORD || 'admin123_dev') + ')');

    // 3. Dados de exemplo — Produtos (se não existirem)
    console.log('📦 Populando produtos de exemplo...');
    const entityProduto = await query("SELECT id FROM entities WHERE code = 'produto'");
    
    if (entityProduto.length > 0) {
      const produtos = [
        { codigo: 'PRD-001', descricao: 'Eixo Transmissão 25mm', tipo: 'Produto', unidade: 'UN', preco_custo: 45.50, preco_venda: 89.90, estoque_atual: 120, estoque_minimo: 50, status: 'Ativo' },
        { codigo: 'PRD-002', descricao: 'Rolamento 6205-ZZ', tipo: 'Produto', unidade: 'UN', preco_custo: 8.20, preco_venda: 18.50, estoque_atual: 15, estoque_minimo: 30, status: 'Ativo' },
        { codigo: 'PRD-003', descricao: 'Chapa Aço 3mm 1000x2000', tipo: 'Matéria-Prima', unidade: 'PC', preco_custo: 320.00, preco_venda: 480.00, estoque_atual: 45, estoque_minimo: 10, status: 'Ativo' },
        { codigo: 'SRV-001', descricao: 'Usinagem CNC por hora', tipo: 'Serviço', unidade: 'H', preco_custo: 0, preco_venda: 120.00, estoque_atual: 0, estoque_minimo: 0, status: 'Ativo' },
      ];

      for (const prod of produtos) {
        const exists = await query(
          'SELECT id FROM entity_records WHERE entity_id = ? AND JSON_EXTRACT(data, "$.codigo") = ?',
          [entityProduto[0].id, prod.codigo]
        );
        
        if (exists.length === 0) {
          await query(
            'INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (UUID(), ?, ?, ?)',
            [entityProduto[0].id, JSON.stringify(prod), adminId]
          );
          console.log(`   ✓ Produto ${prod.codigo}`);
        }
      }
    }

    // 4. Dados — Clientes
    console.log('👥 Populando clientes de exemplo...');
    const entityCliente = await query("SELECT id FROM entities WHERE code = 'cliente'");
    
    if (entityCliente.length > 0) {
      const clientes = [
        { codigo: 'CLI-001', razao_social: 'Metalúrgica ABC Ltda', nome_fantasia: 'Metalúrgica ABC', cnpj_cpf: '12.345.678/0001-90', cidade: 'São Paulo', estado: 'SP', limite_credito: 50000, status: 'Ativo' },
        { codigo: 'CLI-002', razao_social: 'Ind. XYZ S/A', nome_fantasia: 'XYZ Indústria', cnpj_cpf: '98.765.432/0001-11', cidade: 'Campinas', estado: 'SP', limite_credito: 80000, status: 'Ativo' },
      ];

      for (const cli of clientes) {
        const exists = await query(
          'SELECT id FROM entity_records WHERE entity_id = ? AND JSON_EXTRACT(data, "$.codigo") = ?',
          [entityCliente[0].id, cli.codigo]
        );
        
        if (exists.length === 0) {
          await query(
            'INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (UUID(), ?, ?, ?)',
            [entityCliente[0].id, JSON.stringify(cli), adminId]
          );
          console.log(`   ✓ Cliente ${cli.codigo}`);
        }
      }
    }

    // 5. Workflow padrão — OP
    console.log('🔄 Configurando workflow padrão para OP...');
    const entityOP = await query("SELECT id FROM entities WHERE code = 'ordem_producao'");
    
    if (entityOP.length > 0) {
      // Verifica se já existe workflow
      const wfExists = await query(
        "SELECT id FROM workflows WHERE entity_id = ? AND code = 'op_padrao'",
        [entityOP[0].id]
      );

      if (wfExists.length === 0) {
        const wfId = uuidv4();
        await query(`
          INSERT INTO workflows (id, entity_id, code, name, is_active, trigger_type, config, created_by)
          VALUES (?, ?, 'op_padrao', 'Fluxo Padrão de OP', TRUE, 'manual', '{"requireApproval":false}', ?)
        `, [wfId, entityOP[0].id, masterId]);

        // Etapas
        const steps = [
          { code: 'aberta', label: 'Aberta', sort_order: 0, is_initial: true, approver_roles: JSON.stringify(['pcp']), can_edit_fields: JSON.stringify(['responsavel', 'prazo', 'observacao']) },
          { code: 'em_andamento', label: 'Em Andamento', sort_order: 1, approver_roles: JSON.stringify(['producao']), can_edit_fields: JSON.stringify(['observacao']) },
          { code: 'pausada', label: 'Pausada', sort_order: 2, approver_roles: JSON.stringify(['supervisor']), can_edit_fields: JSON.stringify(['observacao']) },
          { code: 'concluida', label: 'Concluída', sort_order: 3, is_final: true, approver_roles: JSON.stringify(['gerente_producao']), can_edit_fields: JSON.stringify([]) },
          { code: 'cancelada', label: 'Cancelada', sort_order: 4, is_final: true, approver_roles: JSON.stringify(['gerente_geral']), can_edit_fields: JSON.stringify([]) },
        ];

        for (const step of steps) {
          await query(`
            INSERT INTO workflow_steps (id, workflow_id, code, label, sort_order, is_initial, is_final, approver_roles, can_edit_fields)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
          `, [wfId, step.code, step.label, step.sort_order, step.is_initial || false, step.is_final || false, step.approver_roles, step.can_edit_fields]);
        }

        console.log('✅ Workflow OP criado');
      }
    }

    // 6. Regras de negócio padrão
    console.log('⚙️ Criando regras padrão...');
    const entityPedido = await query("SELECT id FROM entities WHERE code = 'pedido_venda'");
    
    if (entityPedido.length > 0) {
      // Regra: Aprovação de pedido acima do limite
      const regra1 = await query(
        "SELECT id FROM business_rules WHERE code = 'rule_approve_over_limit'"
      );
      
      if (regra1.length === 0) {
        await query(`
          INSERT INTO business_rules 
          (id, entity_id, code, name, is_active, priority, trigger_event, 
           trigger_conditions, actions, created_by)
          VALUES (?, ?, 'rule_approve_over_limit', 'Aprovação automática de pedidos aprovados', TRUE, 10, 'on_update',
            '[{"field":"status","operator":"==","value":"Aprovado"}]',
            '[{"type":"set_field","field":"data_aprovacao","value":"{created_at}"}]',
            ?)
        `, [uuidv4(), entityPedido[0].id, masterId]);
      }

      // Regra: Estoque crítico
      const entityProd = await query("SELECT id FROM entities WHERE code = 'produto'");
      if (entityProd.length > 0) {
        const regra2 = await query(
          "SELECT id FROM business_rules WHERE code = 'rule_estoque_critico'"
        );

        if (regra2.length === 0) {
          await query(`
            INSERT INTO business_rules 
            (id, entity_id, code, name, is_active, priority, trigger_event,
             trigger_conditions, actions, created_by)
            VALUES (?, ?, 'rule_estoque_critico', 'Alerta estoque crítico', TRUE, 20, 'on_update',
              '[{"field":"estoque_atual","operator":"<","value":"{estoque_minimo}"}]',
              '[{"type":"send_notification","message":"Estoque crítico: {codigo} - {descricao}. Atual: {estoque_atual}, Mín: {estoque_minimo}"}]',
              ?)
          `, [uuidv4(), entityProd[0].id, masterId]);
        }
      }
    }

    // 7. Config padrão
    console.log('⚙️ Configurando parâmetros do sistema...');
    await query(`
      INSERT INTO system_config (config_key, value, description, updated_by)
      VALUES 
        ('notifications.email_enabled', 'true', 'Habilitar notificações por email', ?),
        ('stock.auto_reorder', 'true', 'Compra automática quando estoque baixo', ?),
        ('production.wip_limit', '50', 'Limite máximo de OP em andamento', ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value)
    `, [masterId, masterId, masterId]);

    console.log('✅ Configurações padrão criadas');

    // 8. Dados — Máquinas (Entidade: maquina)
    console.log('🏭 Populando máquinas de exemplo...');
    const entityMaquina = await query("SELECT id FROM entities WHERE code = 'maquina'");
    
    if (entityMaquina.length > 0) {
      const maquinas = [
        { codigo: 'TNC-01', descricao: 'Torno CNC 1', tipo: 'Torno CNC', fabricante: 'Romi', modelo: 'Sprint 32', ano: 2019, setor: 'Usinagem', status: 'Ativo', ultima_manutencao: '2026-03-10', proxima_manutencao: '2026-06-10' },
        { codigo: 'TNC-02', descricao: 'Torno CNC 2', tipo: 'Torno CNC', fabricante: 'Romi', modelo: 'Sprint 32', ano: 2020, setor: 'Usinagem', status: 'Ativo', ultima_manutencao: '2026-03-12', proxima_manutencao: '2026-06-12' },
        { codigo: 'CUS-01', descricao: 'Centro de Usinagem', tipo: 'Fresadora CNC', fabricante: 'Mazak', modelo: 'Variaxis 500', ano: 2021, setor: 'Usinagem', status: 'Manutenção', ultima_manutencao: '2026-04-18', proxima_manutencao: '2026-04-25' },
        { codigo: 'RET-01', descricao: 'Retífica CIL-01', tipo: 'Retífica', fabricante: 'Jones', modelo: 'J-412', ano: 2015, setor: 'Acabamento', status: 'Ativo', ultima_manutencao: '2026-02-20', proxima_manutencao: '2026-05-20' },
        { codigo: 'FRE-01', descricao: 'Fresadora Conv.', tipo: 'Fresadora', fabricante: 'Dmáquinas', modelo: 'FV-1', ano: 2010, setor: 'Usinagem', status: 'Ativo', ultima_manutencao: '2026-01-15', proxima_manutencao: '2026-04-15' },
      ];

      for (const maq of maquinas) {
        const exists = await query(
          'SELECT id FROM entity_records WHERE entity_id = ? AND JSON_EXTRACT(data, "$.codigo") = ?',
          [entityMaquina[0].id, maq.codigo]
        );
        
        if (exists.length === 0) {
          await query(
            'INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (UUID(), ?, ?, ?)',
            [entityMaquina[0].id, JSON.stringify(maq), adminId]
          );
          console.log(`   ✓ Máquina ${maq.codigo}`);
        }
      }
    } else {
      console.log('   ⚠️ Entidade "maquina" não encontrada, pulando...');
    }

    // 8B. Dados — Ordens de Produção (se não existirem)
    console.log('🔧 Criando ordens de produção de exemplo...');
    if (entityOP && entityOP.length > 0) {
      const existingOPs = await query(
        'SELECT COUNT(*) as cnt FROM entity_records WHERE entity_id = ?',
        [entityOP[0].id]
      );
      
      if (existingOPs[0].cnt === 0) {
        const produtos = await query('SELECT id, data->>"$.codigo" as codigo, data->>"$.descricao" as descricao FROM entity_records WHERE entity_id = (SELECT id FROM entities WHERE code = "produto") LIMIT 3');
        const clientes = await query('SELECT id, data->>"$.codigo" as codigo, data->>"$.razao_social" as razao FROM entity_records WHERE entity_id = (SELECT id FROM entities WHERE code = "cliente") LIMIT 3');
        
        for (let i = 0; i < 3; i++) {
          const produto = produtos[i % produtos.length];
          const cliente = clientes[i % clientes.length];
          const opNum = `OP-${String(i + 1).padStart(5, '0')}`;
          
          await query(`
            INSERT INTO entity_records (id, entity_id, data, created_by)
            VALUES (UUID(), ?, ?, ?)
          `, [entityOP[0].id, JSON.stringify({
            numero: opNum,
            produtoId: produto?.id,
            produtoCodigo: produto?.codigo || 'PRD-001',
            produtoDescricao: produto?.descricao || 'Produto Teste',
            clienteId: cliente?.id,
            clienteCodigo: cliente?.codigo || 'CLI-001',
            clienteNome: cliente?.razao || 'Cliente Teste',
            quantidade: 100 + (i * 50),
            quantidadeProduzida: 0,
            status: 'aberta',
            prioridade: i === 0 ? 'alta' : 'media',
            prazo: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observacao: 'OP gerada automaticamente no seed'
          }), adminId]);
          console.log(`   ✓ Ordem de Produção ${opNum} criada`);
        }
      } else {
        console.log(`   ℹ️ ${existingOPs[0].cnt} OPs já existem, pulando criação`);
      }
    }

    // 9. Dados — Apontamentos (via tabela dedicada)
    console.log('📝 Criando apontamentos de exemplo...');
    // entityOP já foi declarado anteriormente (seção workflow)
    if (entityOP && entityOP.length > 0) {
      const ops = await query(
        'SELECT id, data->>"$.numero" as numero FROM entity_records WHERE entity_id = ? LIMIT 3',
        [entityOP[0].id]
      );
      
      if (ops.length > 0) {
        const SETORES = ['Laser', 'Rebarbação', 'Dobra', 'Solda', 'Montagem', 'Acabamento', 'Qualidade', 'Expedição'];
        const ETAPAS = ['Programação','Engenharia','Corte a Laser','Retirada','Rebarbação','Dobra','Solda','Montagem','Acabamento','Qualidade','Embalagem','Expedição'];
        const OPERADORES = ['José Pereira','Marcos Lima','Carlos Silva','Ana Souza','Roberto F.'];
        
        for (let i = 0; i < ops.length; i++) {
          const op = ops[i];
          const qtdApontamentos = 2 + Math.floor(Math.random() * 3);
          
          for (let j = 0; j < qtdApontamentos; j++) {
            const etapa = ETAPAS[j % ETAPAS.length];
            const setor = SETORES[j % SETORES.length];
            const operador = OPERADORES[j % OPERADORES.length];
            const qtdProd = 20 + Math.floor(Math.random() * 80);
            
            await query(`
              INSERT INTO apontamentos 
              (id, op_id, usuario_id, descricao, quantidade, status, refugo, observacao, iniciado_em, finalizado_em)
              VALUES (UUID(), ?, ?, ?, ?, 'Finalizado', 0, 'Apontamento automático seed', 
                      DATE_SUB(NOW(), INTERVAL ? HOUR), NOW())
            `, [op.id, ops[0].id === op.id ? '2' : '3', etapa, qtdProd, (j + 1) * 2]);
          }
          console.log(`   ✓ OP ${op.numero}: ${qtdApontamentos} apontamentos criados`);
        }
      } else {
        console.log('   ⚠️ Nenhuma OP para criar apontamentos');
      }
    }

    // 9. Logs iniciais (renumerado)
    await query(`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES (?, 'system.seed', ?)
    `, [masterId, JSON.stringify({ timestamp: new Date().toISOString() })]);

    console.log('\n✨ Seed concluído com sucesso!');
    console.log('\n📌 Logins iniciais:');
    console.log(`   Master: master@Cozinha.com / ${process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev'}`);
    console.log(`   Admin:  admin@Cozinha.com  / ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123_dev'}`);
    console.log('\n⚠️  IMPORTANTE: Altere as senhas em produção!');
    console.log('💡 Dica: Use variáveis de ambiente DEFAULT_MASTER_PASSWORD e DEFAULT_ADMIN_PASSWORD');

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

async function closePool() {
  if (db.pool && typeof db.pool.end === 'function') {
    try {
      await db.pool.end();
    } catch (err) {
      console.warn('⚠️ Falha ao encerrar pool do banco:', err.message);
    }
  }
}

async function main() {
  try {
    await seed();
  } finally {
    await closePool();
  }
}

main().catch(err => {
  console.error('❌ Seed falhou de forma inesperada:', err.message);
  process.exit(1);
});
