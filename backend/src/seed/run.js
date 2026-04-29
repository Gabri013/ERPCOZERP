// Seed de dados iniciais — popula banco com dados de exemplo
// Execute: npm run seed

const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Iniciando seed...\n');

  try {
    // 1. Cria usuário master
    console.log('👤 Criando usuário master...');
    let masterId = uuidv4();
    const masterHash = await bcrypt.hash('master123', 12); // Senha: master123

    await query(`
      INSERT IGNORE INTO users (id, email, password_hash, full_name, email_verified, active)
      VALUES (?, 'master@base44.com', ?, 'Master / Owner', TRUE, TRUE)
    `, [masterId, masterHash]);

    const masterUser = await query("SELECT id FROM users WHERE email = 'master@base44.com'");
    masterId = masterUser[0].id;

    // Atribui role master
    const masterRole = await query("SELECT id FROM roles WHERE code = 'master'");
    if (masterRole.length > 0) {
      await query(`
        INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [masterId, masterRole[0].id, masterId]);
    }

    console.log('✅ Usuário master criado (master@base44.com / master123)');

    // 2. Cria usuário admin
    console.log('👤 Criando usuário admin...');
    let adminId = uuidv4();
    const adminHash = await bcrypt.hash('admin123', 12);

    await query(`
      INSERT IGNORE INTO users (id, email, password_hash, full_name, email_verified, active)
      VALUES (?, 'admin@base44.com', ?, 'Administrador', TRUE, TRUE)
    `, [adminId, adminHash]);

    const adminUser = await query("SELECT id FROM users WHERE email = 'admin@base44.com'");
    adminId = adminUser[0].id;

    const adminRole = await query("SELECT id FROM roles WHERE code = 'admin'");
    if (adminRole.length > 0) {
      await query(`
        INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [adminId, adminRole[0].id, masterId]);
    }

    console.log('✅ Usuário admin criado (admin@base44.com / admin123)');

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

    // 8. Logs iniciais
    await query(`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES (?, 'system.seed', ?)
    `, [masterId, JSON.stringify({ timestamp: new Date().toISOString() })]);

    console.log('\n✨ Seed concluído com sucesso!');
    console.log('\n📌 Logins iniciais:');
    console.log('   Master: master@base44.com / master123');
    console.log('   Admin:  admin@base44.com  / admin123');
    console.log('\n⚠️  IMPORTANTE: Altere as senhas em produção!');

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
