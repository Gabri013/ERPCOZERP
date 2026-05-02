/**
 * Migra dados do dump MySQL/MariaDB (phpMyAdmin) para PostgreSQL via Prisma.
 * O ERP atual armazena domínio em Entity + EntityRecord (JSON), não em tabelas "parties/products".
 *
 * Uso:
 *   DATABASE_URL=... node scripts/migrate-legacy-data.js
 *   LEGACY_SQL_PATH=./127_0_0_1.sql (padrão: raiz do repositório)
 *
 * Idempotência: users.legacy_id; entity_records.data.legacy_key
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BACKEND = path.join(ROOT, 'apps', 'backend');

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvFile(path.join(ROOT, '.env'));
loadEnvFile(path.join(BACKEND, '.env'));

function loadModule(relToBackend) {
  return require(path.join(BACKEND, relToBackend));
}

const { PrismaClient } = loadModule('node_modules/@prisma/client');
const bcrypt = loadModule('node_modules/bcryptjs');

const prisma = new PrismaClient();

// --- MySQL INSERT parser (VALUES tuples) ---

function parseScalar(raw) {
  const s = raw.trim();
  if (s === 'NULL') return null;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return Number(s);
  return decodeEntities(s);
}

function parseTuple(sql, start) {
  if (sql[start] !== '(') throw new Error('parseTuple: esperado (');
  let i = start + 1;
  const parts = [];
  let buf = '';
  let inStr = false;
  for (; i < sql.length; i++) {
    const c = sql[i];
    if (inStr) {
      if (c === "'" && sql[i + 1] === "'") {
        buf += "'";
        i++;
        continue;
      }
      if (c === "'") {
        inStr = false;
        continue;
      }
      buf += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === ',' && !inStr) {
      parts.push(parseValueToken(buf.trim()));
      buf = '';
      continue;
    }
    if (c === ')' && !inStr) {
      if (buf.length || parts.length) parts.push(parseValueToken(buf.trim()));
      return { row: parts, next: i + 1 };
    }
    buf += c;
  }
  throw new Error('Tupla não fechada');
}

function parseValueToken(t) {
  if (t === 'NULL') return null;
  if (t === '') return '';
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t.trim())) return Number(t.trim());
  return decodeEntities(t);
}

function splitSqlRows(valuesSection) {
  const rows = [];
  let i = 0;
  while (i < valuesSection.length) {
    while (i < valuesSection.length && /\s/.test(valuesSection[i])) i++;
    if (i >= valuesSection.length) break;
    if (valuesSection[i] === ',') {
      i++;
      continue;
    }
    if (valuesSection[i] === '(') {
      const { row, next } = parseTuple(valuesSection, i);
      rows.push(row);
      i = next;
      continue;
    }
    break;
  }
  return rows;
}

function parseInsertStatements(sql) {
  const tables = {};
  const headerRe = /INSERT INTO `([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*/gi;
  let m;
  while ((m = headerRe.exec(sql)) !== null) {
    const table = m[1];
    const cols = m[2].split(',').map((c) => c.trim().replace(/^`/, '').replace(/`$/, ''));
    let i = headerRe.lastIndex;
    let inStr = false;
    const startChunk = i;
    while (i < sql.length) {
      const ch = sql[i];
      if (inStr) {
        if (ch === "'" && sql[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (ch === "'") inStr = false;
        i++;
        continue;
      }
      if (ch === "'") {
        inStr = true;
        i++;
        continue;
      }
      if (ch === ';') {
        const chunk = sql.slice(startChunk, i).trim();
        const rowArrays = splitSqlRows(chunk);
        const objs = rowArrays.map((vals) => {
          const o = {};
          cols.forEach((c, idx) => {
            o[c] = vals[idx];
          });
          return o;
        });
        if (!tables[table]) tables[table] = [];
        tables[table].push(...objs);
        headerRe.lastIndex = i + 1;
        break;
      }
      i++;
    }
  }
  return tables;
}

// --- Normalização ---

function decodeEntities(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

function normCpfCnpj(s) {
  const d = onlyDigits(s);
  if (!d) return '';
  return d;
}

function looksLikeAddress(s) {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  return /(?:(?:Rua|Av\.|Avenida|Rod\.|BR-|CEP|^\d{5}-?\d{3}))/i.test(t) || (t.length > 40 && /CEP|MG|SP|RJ|BA/i.test(t));
}

function mergeClienteRow(c) {
  let nomeFantasia = decodeEntities(String(c.nome_fantasia || '').trim());
  let endereco = decodeEntities(String(c.endereco || '').trim());
  if (!endereco && looksLikeAddress(nomeFantasia)) {
    endereco = nomeFantasia;
    nomeFantasia = '';
  }
  const cpf = normCpfCnpj(c.cnpj_cpf);
  const tipo = cpf.length === 11 ? 'PF' : cpf.length === 14 ? 'PJ' : '';
  return {
    codigo: `CLI-${String(c.id).padStart(5, '0')}`,
    razao_social: decodeEntities(String(c.razao_social || '').trim() || '(sem razão social)'),
    nome_fantasia: nomeFantasia || undefined,
    tipo: tipo || undefined,
    cnpj_cpf: cpf || String(c.cnpj_cpf || '').trim() || undefined,
    email: decodeEntities(String(c.email || '').trim().replace(/^:\s*/, '')) || undefined,
    telefone: String(c.telefone || '').trim() || undefined,
    cidade: decodeEntities(String(c.cidade || '').trim()) || undefined,
    estado: String(c.estado || '').trim().toUpperCase() || undefined,
    responsavel: decodeEntities(String(c.responsavel || '').trim()) || undefined,
    observacoes: decodeEntities(String(c.observacoes || '').trim()) || undefined,
    endereco_completo: endereco || undefined,
    status: 'Ativo',
  };
}

function mapTipoProduto(tp) {
  const m = {
    produto: 'Produto',
    servico: 'Serviço',
    mat_prima: 'Matéria-Prima',
    embalagem: 'Semi-Acabado',
    ativo_fixo: 'Produto',
  };
  return m[tp] || 'Produto';
}

function mapOsStatus(s) {
  const m = {
    pendente: 'aberta',
    em_projeto: 'em_andamento',
    em_revisao: 'em_andamento',
    em_producao: 'em_andamento',
    concluida: 'concluida',
    cancelada: 'cancelada',
  };
  return m[s] || 'em_andamento';
}

function mapPrioridade(p) {
  const m = { verde: 'Normal', amarelo: 'Alta', vermelho: 'Urgente' };
  return m[p] || 'Normal';
}

function mapVendaStatus(s) {
  const m = {
    em_andamento: 'Aprovado',
    concluida: 'Aprovado',
    cancelada: 'Cancelado',
  };
  return m[s] || 'Aprovado';
}

function mapFormaPag(fp) {
  const m = { avista: 'À vista', cartao: 'Cartão', boleto: 'Boleto' };
  return m[fp] || String(fp || '');
}

function mapContaStatus(s) {
  const m = {
    PENDENTE: 'aberto',
    PAGO: 'pago',
    ATRASADO: 'vencido',
    CANCELADO: 'cancelado',
  };
  return m[s] || 'aberto';
}

function mapUsuarioTipoToRoleCode(tipo) {
  const m = {
    master: 'master',
    gerente: 'gerente',
    vendedor: 'orcamentista_vendas',
    projetista: 'projetista',
    producao: 'gerente_producao',
    corte: 'corte_laser',
    dobra: 'dobra_montagem',
    solda: 'solda',
    acabamento: 'expedicao',
    finalizacao: 'expedicao',
    montagem: 'expedicao',
    dashboard_producao: 'gerente_producao',
  };
  return m[tipo] || 'user';
}

function mapGrupoIdToRoleCode(grupoId) {
  const m = {
    1: 'master',
    2: 'gerente',
    3: 'orcamentista_vendas',
    4: 'projetista',
    5: 'gerente_producao',
    6: 'gerente',
    7: 'gerente_producao',
  };
  return m[grupoId] || 'user';
}

function resolvePasswordHash(senha) {
  const s = String(senha || '');
  if (!s) return bcrypt.hashSync('LegacySemSenha!', 12);
  if (s.startsWith('$2a$') || s.startsWith('$2b$')) return s;
  if (s.startsWith('$2y$')) return s.replace(/^\$2y\$/, '$2a$');
  return bcrypt.hashSync(s, 12);
}

async function ensureEntity(prismaClient, code, name) {
  return prismaClient.entity.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function upsertEntityRecord(prismaClient, entityId, legacyKey, data, actorId) {
  const existing = await prismaClient.entityRecord.findFirst({
    where: {
      entityId,
      deletedAt: null,
      data: { path: ['legacy_key'], equals: legacyKey },
    },
  });
  const payload = { ...data, legacy_key: legacyKey };
  if (existing) {
    await prismaClient.entityRecord.update({
      where: { id: existing.id },
      data: { data: payload, updatedBy: actorId },
    });
    return { id: existing.id, created: false };
  }
  const row = await prismaClient.entityRecord.create({
    data: {
      entityId,
      data: payload,
      createdBy: actorId,
      updatedBy: actorId,
    },
  });
  return { id: row.id, created: true };
}

function permCodeFromLegacy(p) {
  const mod = String(p.modulo || 'x').replace(/\./g, '_');
  const rec = String(p.recurso || 'x').replace(/\./g, '_');
  const acao = String(p.acao || 'x').replace(/\./g, '_');
  return `legacy.${mod}.${rec}.${acao}`;
}

async function main() {
  const t0 = performance.now();
  const sqlPath = process.env.LEGACY_SQL_PATH || path.join(ROOT, '127_0_0_1.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`Arquivo não encontrado: ${sqlPath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const tables = parseInsertStatements(sql);

  const stats = {
    tables_parsed: Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length])),
    migrated: {},
    ignored: {},
    errors: [],
    notes: [],
  };

  const master = await prisma.user.findFirst({
    where: { email: process.env.DEFAULT_MASTER_EMAIL || 'master@Cozinha.com' },
  });
  const actorId = master?.id || null;

  // --- Users ---
  const userIdByLegacy = new Map();
  const usuarios = tables.usuarios || [];
  for (const u of usuarios) {
    try {
      const email = String(u.email || '')
        .trim()
        .toLowerCase();
      if (!email) {
        stats.ignored[`usuario_${u.id}`] = 'email vazio';
        continue;
      }
      const hash = resolvePasswordHash(u.senha);
      const active = u.status !== 'inativo';
      let user =
        (await prisma.user.findFirst({ where: { legacyId: u.id } })) ||
        (await prisma.user.findUnique({ where: { email } }));

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            legacyId: u.id,
            fullName: String(u.nome || '').trim() || user.fullName,
            passwordHash: hash,
            active,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            legacyId: u.id,
            fullName: String(u.nome || '').trim() || email,
            passwordHash: hash,
            active,
            emailVerified: false,
          },
        });
      }
      userIdByLegacy.set(u.id, user.id);
      stats.migrated.users = (stats.migrated.users || 0) + 1;
    } catch (e) {
      stats.errors.push(`usuario ${u.id}: ${e.message}`);
    }
  }

  const roles = await prisma.role.findMany({ where: { active: true } });
  const roleByCode = new Map(roles.map((r) => [r.code, r]));

  // Roles from usuarios_grupos
  const ug = tables.usuarios_grupos || [];
  const gruposByUsuario = new Map();
  for (const row of ug) {
    if (!gruposByUsuario.has(row.usuario_id)) gruposByUsuario.set(row.usuario_id, []);
    gruposByUsuario.get(row.usuario_id).push(row.grupo_id);
  }

  for (const u of usuarios) {
    const uid = userIdByLegacy.get(u.id);
    if (!uid) continue;
    const gids = gruposByUsuario.get(u.id);
    const codes = new Set();
    if (gids && gids.length) {
      for (const gid of gids) codes.add(mapGrupoIdToRoleCode(gid));
    } else {
      codes.add(mapUsuarioTipoToRoleCode(u.tipo));
    }
    for (const code of codes) {
      const role = roleByCode.get(code);
      if (!role) {
        stats.notes.push(`Role não encontrada para código ${code} (usuário legado ${u.id})`);
        continue;
      }
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: uid, roleId: role.id } },
        update: {},
        create: { userId: uid, roleId: role.id, assignedBy: actorId },
      });
    }
  }

  // Legacy permissions -> Permission + RolePermission
  const permRows = tables.permissoes || [];
  const permIdToUuid = new Map();
  for (const p of permRows) {
    const code = permCodeFromLegacy(p);
    const name = decodeEntities(String(p.descricao || code).slice(0, 200));
    const perm = await prisma.permission.upsert({
      where: { code },
      update: { name, active: true },
      create: {
        code,
        name,
        category: 'legacy.dbcozinca',
        description: `Legado id=${p.id} ${p.modulo}/${p.recurso}/${p.acao}`,
        type: 'action',
        active: true,
      },
    });
    permIdToUuid.set(p.id, perm.id);
  }
  stats.migrated.permissions_legacy = permRows.length;

  const gp = tables.grupos_permissoes || [];
  let rpCount = 0;
  for (const row of gp) {
    const permUuid = permIdToUuid.get(row.permissao_id);
    const roleCode = mapGrupoIdToRoleCode(row.grupo_id);
    const role = roleByCode.get(roleCode);
    if (!permUuid || !role) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permUuid } },
      update: { granted: true },
      create: { roleId: role.id, permissionId: permUuid, granted: true },
    });
    rpCount++;
  }
  stats.migrated.role_permissions_legacy = rpCount;

  // --- Entities ---
  const entCliente = await ensureEntity(prisma, 'cliente', 'Clientes');
  const entFornecedor = await ensureEntity(prisma, 'fornecedor', 'Fornecedores');
  const entProduto = await ensureEntity(prisma, 'produto', 'Produtos');
  const entPedido = await ensureEntity(prisma, 'pedido_venda', 'Pedidos de venda');
  const entOrc = await ensureEntity(prisma, 'orcamento', 'Orçamentos');
  const entOp = await ensureEntity(prisma, 'ordem_producao', 'Ordens de produção');
  const entCr = await ensureEntity(prisma, 'conta_receber', 'Contas a receber');
  const entAp = await ensureEntity(prisma, 'apontamento_producao', 'Apontamentos de produção');
  const entHist = await ensureEntity(prisma, 'historico_op', 'Histórico OP');

  // Clientes
  const clienteNomeById = new Map();
  for (const c of tables.clientes || []) {
    const row = mergeClienteRow(c);
    row.legacy_id = c.id;
    row.legacy_source = 'clientes';
    const lk = `clientes:${c.id}`;
    await upsertEntityRecord(prisma, entCliente.id, lk, row, actorId);
    clienteNomeById.set(c.id, row.razao_social);
    stats.migrated.cliente = (stats.migrated.cliente || 0) + 1;
  }

  // Pessoas (cliente / fornecedor)
  for (const p of tables.pessoas || []) {
    const cpf = normCpfCnpj(p.cnpj_cpf);
    const lk =
      p.tipo_pessoa === 'fornecedor' ? `pessoas:fornecedor:${p.id}` : `pessoas:cliente:${p.id}`;
    const base = {
      legacy_id: p.id,
      legacy_source: 'pessoas',
      razao_social: decodeEntities(String(p.razao_social || '').trim()) || '(sem nome)',
      nome_fantasia: decodeEntities(String(p.nome_fantasia || '').trim()) || undefined,
      cnpj_cpf: cpf || String(p.cnpj_cpf || '').trim() || undefined,
      email: decodeEntities(String(p.email || '').trim()) || undefined,
      telefone: String(p.telefone || '').trim() || undefined,
      cidade: decodeEntities(String(p.cidade || '').trim()) || undefined,
      estado: String(p.estado || '').trim().toUpperCase() || undefined,
      endereco_completo: [p.endereco, p.numero, p.complemento, p.bairro, p.cidade, p.estado, p.cep]
        .filter(Boolean)
        .map((x) => decodeEntities(String(x)))
        .join(' — ') || undefined,
      observacoes: decodeEntities(String(p.observacoes || '').trim()) || undefined,
      status: p.ativo ? 'Ativo' : 'Inativo',
    };
    if (p.tipo_pessoa === 'fornecedor') {
      await upsertEntityRecord(
        prisma,
        entFornecedor.id,
        lk,
        {
          codigo: `FOR-${String(p.id).padStart(5, '0')}`,
          nome: base.razao_social,
          razao_social: base.razao_social,
          cnpj_cpf: base.cnpj_cpf,
          telefone: base.telefone,
          cidade: base.cidade,
          estado: base.estado,
          ...base,
        },
        actorId,
      );
      stats.migrated.fornecedor = (stats.migrated.fornecedor || 0) + 1;
    } else {
      await upsertEntityRecord(
        prisma,
        entCliente.id,
        lk,
        {
          codigo: `PES-${String(p.id).padStart(5, '0')}`,
          tipo: p.tipo_cadastro === 'fisica' ? 'PF' : 'PJ',
          ...base,
        },
        actorId,
      );
      stats.migrated.pessoa_cliente = (stats.migrated.pessoa_cliente || 0) + 1;
    }
  }

  // Produtos
  const prodCodigoById = new Map();
  for (const pr of tables.produtos || []) {
    const codigo = String(pr.codigo || `PRD-${pr.id}`).trim();
    prodCodigoById.set(pr.id, codigo);
    const foto = pr.foto ? `/legacy-uploads/${String(pr.foto).replace(/^.*[\\/]/, '')}` : undefined;
    const data = {
      codigo,
      descricao: decodeEntities(String(pr.nome || '').trim()),
      tipo: mapTipoProduto(pr.tipo_produto),
      grupo: pr.grupo_id != null ? String(pr.grupo_id) : undefined,
      unidade: String(pr.unidade_medida || pr.uni || 'UN')
        .slice(0, 8)
        .toUpperCase(),
      preco_custo: Number(pr.custo_total || pr.custo_medio || 0),
      preco_venda: Number(pr.valor || pr.preco_sugerido || 0),
      estoque_atual: Number(pr.estoque ?? 0),
      estoque_minimo: Number(pr.estoque_minimo ?? 0),
      status: pr.status === 'ativo' ? 'Ativo' : 'Inativo',
      legacy_id: pr.id,
      legacy_source: 'produtos',
      ncm: pr.ncm || undefined,
      foto_ref: foto,
      observacoes_legacy: decodeEntities(String(pr.descricao || '').slice(0, 5000)) || undefined,
    };
    await upsertEntityRecord(prisma, entProduto.id, `produtos:${pr.id}`, data, actorId);
    stats.migrated.produto = (stats.migrated.produto || 0) + 1;
  }

  // Insumos → produto tipo Insumo
  for (const ins of tables.insumos || []) {
    const codigo = String(ins.codigo || `INS-${ins.id}`).trim();
    const data = {
      codigo,
      descricao: decodeEntities(String(ins.nome || '').trim()),
      tipo: 'Insumo',
      unidade: String(ins.unidade || 'un').slice(0, 8).toUpperCase(),
      preco_custo: Number(ins.custo_unitario || 0),
      preco_venda: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      status: 'Ativo',
      legacy_id: ins.id,
      legacy_source: 'insumos',
      fornecedor_insumo: ins.fornecedor || undefined,
    };
    await upsertEntityRecord(prisma, entProduto.id, `insumos:${ins.id}`, data, actorId);
    stats.migrated.insumo = (stats.migrated.insumo || 0) + 1;
  }

  // BOM (estrutura + componentes)
  const compByEstrutura = new Map();
  for (const comp of tables.componentes_produto || []) {
    if (!compByEstrutura.has(comp.estrutura_id)) compByEstrutura.set(comp.estrutura_id, []);
    compByEstrutura.get(comp.estrutura_id).push(comp);
  }
  for (const est of tables.estrutura_produto || []) {
    const pid = est.produto_id;
    const lk = `produtos:${pid}`;
    const existing = await prisma.entityRecord.findFirst({
      where: { entityId: entProduto.id, deletedAt: null, data: { path: ['legacy_key'], equals: lk } },
    });
    const bom = (compByEstrutura.get(est.id) || []).map((c) => ({
      insumo_legacy_id: c.insumo_id,
      nome: decodeEntities(String(c.componente_nome || '')),
      quantidade: Number(c.quantidade),
      unidade: String(c.unidade || 'un'),
      custo_unitario: Number(c.custo_unitario || 0),
    }));
    const prev = existing?.data || {};
    const merged = {
      ...prev,
      bom,
      estrutura_versao: est.versao,
      estrutura_obs: decodeEntities(String(est.observacoes || '').slice(0, 2000)) || undefined,
    };
    if (existing) {
      await prisma.entityRecord.update({
        where: { id: existing.id },
        data: { data: merged, updatedBy: actorId },
      });
    }
    stats.migrated.bom_estruturas = (stats.migrated.bom_estruturas || 0) + 1;
  }

  // Orçamentos + itens
  const oiByOrc = new Map();
  for (const it of tables.orcamentos_itens || []) {
    if (!oiByOrc.has(it.orcamento_id)) oiByOrc.set(it.orcamento_id, []);
    oiByOrc.get(it.orcamento_id).push(it);
  }
  for (const o of tables.orcamentos || []) {
    const items = (oiByOrc.get(o.id) || []).map((it) => ({
      produto_legacy_id: it.produto_id,
      descricao: decodeEntities(String(it.descricao_manual || '').slice(0, 500)),
      qtd: Number(it.quantidade),
      valor_unitario: Number(it.valor_unitario),
      valor_total: Number(it.valor_total),
    }));
    const statusMap = { pendente: 'Orçamento', aprovado: 'Aprovado', convertido: 'Aprovado', cancelado: 'Cancelado' };
    const nomeCliente = clienteNomeById.get(o.cliente_id) || `Cliente #${o.cliente_id}`;
    const data = {
      numero: String(o.numero),
      cliente_nome: nomeCliente,
      legacy_cliente_id: o.cliente_id,
      data_emissao: o.data_orcamento ? String(o.data_orcamento).slice(0, 10) : undefined,
      validade: o.validade ? String(o.validade).slice(0, 10) : undefined,
      valor_total: Number(o.valor_total || 0),
      status: statusMap[o.status] || 'Orçamento',
      observacoes: decodeEntities(String(o.observacoes || '').slice(0, 4000)) || undefined,
      legacy_id: o.id,
      itens: items,
    };
    await upsertEntityRecord(prisma, entOrc.id, `orcamentos:${o.id}`, data, actorId);
    stats.migrated.orcamento = (stats.migrated.orcamento || 0) + 1;
  }

  // Vendas + itens
  const viByVenda = new Map();
  for (const it of tables.vendas_itens || []) {
    if (!viByVenda.has(it.venda_id)) viByVenda.set(it.venda_id, []);
    viByVenda.get(it.venda_id).push(it);
  }
  for (const v of tables.vendas || []) {
    const nomeCliente = clienteNomeById.get(v.cliente_id) || `Cliente #${v.cliente_id}`;
    const items = (viByVenda.get(v.id) || []).map((it) => ({
      produto_legacy_id: it.produto_id,
      descricao: decodeEntities(String(it.descricao_manual || '').slice(0, 500)),
      quantidade: Number(it.quantidade),
      valor_unitario: Number(it.valor_unitario),
      valor_total: Number(it.valor_total),
    }));
    const data = {
      numero: String(v.numero),
      cliente_nome: nomeCliente,
      legacy_cliente_id: v.cliente_id,
      legacy_usuario_id: v.usuario_id,
      data_emissao: v.data_venda ? String(v.data_venda).slice(0, 10) : undefined,
      valor_total: Number(v.valor_total || 0),
      status: mapVendaStatus(v.status),
      forma_pagamento: mapFormaPag(v.forma_pagamento),
      observacoes: decodeEntities(String(v.observacoes || v.observacoes_venda || '').slice(0, 8000)) || undefined,
      legacy_id: v.id,
      num_parcelas: v.num_parcelas,
      taxa_antecipacao_percent: Number(v.taxa_antecipacao_percent || 0),
      itens: items,
    };
    await upsertEntityRecord(prisma, entPedido.id, `vendas:${v.id}`, data, actorId);
    stats.migrated.pedido_venda = (stats.migrated.pedido_venda || 0) + 1;
  }

  // Ordens de serviço
  const osItens = tables.os_itens || [];
  const osById = new Map((tables.ordens_servico || []).map((x) => [x.id, x]));
  const itensByOs = new Map();
  for (const it of osItens) {
    if (!itensByOs.has(it.os_id)) itensByOs.set(it.os_id, []);
    itensByOs.get(it.os_id).push(it);
  }
  const osArq = tables.os_arquivos || [];
  const arqByOs = new Map();
  for (const a of osArq) {
    if (!arqByOs.has(a.os_id)) arqByOs.set(a.os_id, []);
    arqByOs.get(a.os_id).push({
      tipo: a.tipo,
      nome_original: a.nome_original,
      nome_arquivo: a.nome_arquivo,
      descricao: a.descricao,
      legacy_usuario_id: a.usuario_id,
    });
  }

  for (const os of tables.ordens_servico || []) {
    const nomeCliente = clienteNomeById.get(os.cliente_id) || `Cliente #${os.cliente_id}`;
    const produtos = (itensByOs.get(os.id) || []).map((it) => ({
      produto_legacy_id: it.produto_id,
      descricao: decodeEntities(String(it.descricao_manual || '').slice(0, 300)),
      quantidade: Number(it.quantidade),
    }));
    const first = produtos[0];
    const data = {
      numero: String(os.numero),
      pedidoId: os.venda_id || undefined,
      clienteId: os.cliente_id,
      clienteNome: nomeCliente,
      codigoProduto: first && prodCodigoById.get(first.produto_legacy_id),
      produtoDescricao: first?.descricao || 'Ordem de serviço',
      quantidade: first ? first.quantidade : 1,
      unidade: 'UN',
      dataEmissao: os.data_inicio ? String(os.data_inicio).slice(0, 10) : undefined,
      prazo: os.data_termino ? String(os.data_termino).slice(0, 10) : undefined,
      status: mapOsStatus(os.status),
      prioridade: mapPrioridade(os.prioridade),
      observacao: decodeEntities(
        [os.observacoes_gerais, os.observacoes_corte_dobra, os.observacoes_solda].filter(Boolean).join('\n').slice(0, 8000),
      ),
      etapa_legacy: os.etapa_atual,
      arquivo_projeto_legacy: os.arquivo_projeto || undefined,
      produtos_os: produtos,
      arquivos_legacy: arqByOs.get(os.id) || [],
      legacy_id: os.id,
    };
    await upsertEntityRecord(prisma, entOp.id, `ordens_servico:${os.id}`, data, actorId);
    stats.migrated.ordem_producao = (stats.migrated.ordem_producao || 0) + 1;
  }

  // Apontamentos (etapas)
  const legacyUsers = await prisma.user.findMany({
    where: { legacyId: { not: null } },
    select: { id: true, legacyId: true, fullName: true },
  });
  const fullNameByLegacyId = new Map(legacyUsers.map((u) => [u.legacyId, u.fullName]));
  const nomeByLegacyUsuario = new Map((tables.usuarios || []).map((u) => [u.id, String(u.nome || '').trim()]));
  for (const e of tables.os_etapas_producao || []) {
    const op = osById.get(e.os_id);
    const operador =
      nomeByLegacyUsuario.get(e.usuario_id) ||
      fullNameByLegacyId.get(e.usuario_id) ||
      (e.usuario_id != null ? `usuário legado #${e.usuario_id}` : '');
    const data = {
      opId: op ? String(op.numero) : `OS-LEG-${e.os_id}`,
      legacy_os_id: e.os_id,
      etapa: String(e.etapa || ''),
      operador,
      setor: String(e.etapa || ''),
      horaInicio: e.data_inicio ? String(e.data_inicio) : undefined,
      horaFim: e.data_fim ? String(e.data_fim) : undefined,
      quantidade: undefined,
      refugo: undefined,
      status: e.status === 'concluida' ? 'Finalizado' : 'Em Andamento',
      observacao:
        e.tempo_total_segundos != null ? `tempo_total_segundos: ${e.tempo_total_segundos}` : undefined,
      legacy_id: e.id,
    };
    await upsertEntityRecord(prisma, entAp.id, `os_etapas_producao:${e.id}`, data, actorId);
    stats.migrated.apontamento = (stats.migrated.apontamento || 0) + 1;
  }

  // Histórico status OS
  for (const h of tables.os_historico_status || []) {
    const op = osById.get(h.os_id);
    const data = {
      opId: String(op?.numero || h.os_id),
      opNumero: op?.numero,
      statusAnterior: h.status_anterior,
      statusNovo: h.status_novo,
      usuario:
        nomeByLegacyUsuario.get(h.usuario_id) ||
        fullNameByLegacyId.get(h.usuario_id) ||
        (h.usuario_id != null ? `usuário legado #${h.usuario_id}` : ''),
      obs: decodeEntities(String(h.observacao || '').slice(0, 2000)) || undefined,
      data: h.created_at ? String(h.created_at) : undefined,
      legacy_id: h.id,
    };
    await upsertEntityRecord(prisma, entHist.id, `os_historico_status:${h.id}`, data, actorId);
    stats.migrated.historico_op = (stats.migrated.historico_op || 0) + 1;
  }

  // Pagamentos agrupados por conta_receber
  const pagByConta = new Map();
  for (const pg of tables.pagamentos || []) {
    if (!pagByConta.has(pg.conta_receber_id)) pagByConta.set(pg.conta_receber_id, []);
    pagByConta.get(pg.conta_receber_id).push(pg);
  }

  // Contas a receber
  for (const cr of tables.contas_receber || []) {
    const nomeCliente = clienteNomeById.get(cr.cliente_id) || `Cliente #${cr.cliente_id}`;
    const pags = (pagByConta.get(cr.id) || []).map((p) => ({
      legacy_id: p.id,
      valor_pago: Number(p.valor_pago),
      data_pagamento: p.data_pagamento ? String(p.data_pagamento) : undefined,
      forma_pagamento: p.forma_pagamento,
      usuario_legacy_id: p.usuario_id,
    }));
    const data = {
      descricao: `Parcela ${cr.parcela_numero}/${cr.total_parcelas} — Venda legado #${cr.venda_id}`,
      cliente_fornecedor: nomeCliente,
      categoria: 'Venda',
      valor: Number(cr.valor_liquido ?? cr.valor_bruto ?? 0),
      data_emissao: cr.created_at ? String(cr.created_at).slice(0, 10) : undefined,
      data_vencimento: cr.data_vencimento ? String(cr.data_vencimento).slice(0, 10) : undefined,
      status: mapContaStatus(cr.status),
      documento: `CR-${cr.id}`,
      observacoes: decodeEntities(String(cr.observacoes || '').slice(0, 4000)) || undefined,
      legacy_id: cr.id,
      legacy_venda_id: cr.venda_id,
      legacy_cliente_id: cr.cliente_id,
      forma_pagamento_legacy: cr.forma_pagamento,
      valor_bruto: Number(cr.valor_bruto || 0),
      valor_recebido: Number(cr.valor_recebido || 0),
      pagamentos: pags,
    };
    await upsertEntityRecord(prisma, entCr.id, `contas_receber:${cr.id}`, data, actorId);
    stats.migrated.conta_receber = (stats.migrated.conta_receber || 0) + 1;
  }

  // Notificações → user_notifications
  let notifOk = 0;
  for (const n of tables.notificacoes || []) {
    const uid = userIdByLegacy.get(n.usuario_id);
    if (!uid) continue;
    const prefix = `[legacy_notif:${n.id}]`;
    const body = `${decodeEntities(String(n.titulo || ''))}: ${decodeEntities(String(n.mensagem || '')).slice(0, 3800)}`;
    const text = `${prefix} ${body}`;
    const type = String(n.tipo || 'info').includes('atras') ? 'warning' : 'info';
    const exists = await prisma.userNotification.findFirst({
      where: { userId: uid, text: { startsWith: prefix } },
    });
    if (exists) continue;
    await prisma.userNotification.create({
      data: {
        userId: uid,
        type,
        text,
        readAt: n.lida ? (n.created_at ? new Date(n.created_at) : new Date()) : null,
        sector: n.referencia_tipo || null,
      },
    });
    notifOk++;
  }
  stats.migrated.user_notifications = notifOk;
  stats.notes.push(
    `notificacoes_envios: ${(tables.notificacoes_envios || []).length} registros conservados apenas no SQL legado (sem tabela dedicada no ERP atual).`,
  );

  // Logs sistema → audit_logs
  let logsOk = 0;
  for (const lg of tables.logs_sistema || []) {
    const uid = lg.usuario_id ? userIdByLegacy.get(lg.usuario_id) : null;
    try {
      const dup = await prisma.auditLog.findFirst({
        where: {
          action: `legacy.${lg.acao}`,
          metadata: { path: ['legacy_id'], equals: lg.id },
        },
      });
      if (dup) continue;
      await prisma.auditLog.create({
        data: {
          userId: uid || undefined,
          action: `legacy.${lg.acao}`,
          metadata: {
            legacy_id: lg.id,
            entidade: lg.entidade,
            entidade_id: lg.entidade_id,
            detalhe: decodeEntities(String(lg.detalhe || '').slice(0, 4000)),
          },
          createdAt: lg.created_at ? new Date(lg.created_at) : undefined,
        },
      });
      logsOk++;
    } catch {
      stats.ignored[`audit_${lg.id}`] = 'insert falhou';
    }
  }
  stats.migrated.audit_logs_legacy = logsOk;

  // Integridade básica
  const orphanChecks = [];
  const vendasIds = new Set((tables.vendas || []).map((v) => v.id));
  for (const v of tables.vendas || []) {
    if (!clienteNomeById.has(v.cliente_id)) orphanChecks.push(`venda ${v.id}: cliente_id ${v.cliente_id} não encontrado em clientes`);
  }
  for (const os of tables.ordens_servico || []) {
    if (!clienteNomeById.has(os.cliente_id)) orphanChecks.push(`os ${os.id}: cliente_id ${os.cliente_id}`);
    if (os.venda_id != null && !vendasIds.has(os.venda_id)) orphanChecks.push(`os ${os.id}: venda_id ${os.venda_id} órfã`);
  }
  stats.notes.push(...orphanChecks.slice(0, 50));
  if (orphanChecks.length > 50) stats.notes.push(`... +${orphanChecks.length - 50} avisos de integridade`);

  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);

  const entitiesDb = await prisma.entity.findMany({ select: { id: true, code: true } });
  const entityIdToCode = new Map(entitiesDb.map((e) => [e.id, e.code]));
  const grouped = await prisma.entityRecord.groupBy({
    by: ['entityId'],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const totalsByEntity = grouped
    .map((r) => ({ code: entityIdToCode.get(r.entityId) || String(r.entityId), n: r._count._all }))
    .sort((a, b) => b.n - a.n);
  const usersWithLegacy = await prisma.user.count({ where: { legacyId: { not: null } } });
  const auditLegacyTotal = await prisma.auditLog.count({ where: { action: { startsWith: 'legacy.' } } });
  const notifLegacyTotal = await prisma.userNotification.count({
    where: { text: { startsWith: '[legacy_notif:' } },
  });

  const reportPath = path.join(ROOT, 'MIGRATION_REPORT.md');
  const report = `# Relatório de migração legado → ERP Cozinha

Gerado em: ${new Date().toISOString()}
Dump: \`${path.relative(ROOT, sqlPath)}\`
Tempo total: **${elapsed}s**

> As contagens em **Contagens principais** referem-se a registros processados **nesta execução** (reexecuções idempotentes podem mostrar 0 em itens já importados). Os **totais no banco** abaixo refletem o estado após esta corrida.

## Modelo alvo

Os dados de negócio são gravados em **Entity / EntityRecord** (\`data\` JSON), com chave idempotente \`legacy_key\`. Usuários legados usam coluna \`users.legacy_id\`.

## Contagens principais (processamento)

${Object.entries(stats.migrated)
  .map(([k, v]) => `- **${k}**: ${v}`)
  .join('\n')}

## Tabelas detectadas no SQL (linhas parseadas)

${Object.entries(stats.tables_parsed)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40)
  .map(([k, v]) => `- \`${k}\`: ${v}`)
  .join('\n')}

## Ações especiais

- CNPJ/CPF: apenas dígitos em \`cnpj_cpf\` quando possível.
- Endereço em \`nome_fantasia\`: quando parecia endereço e \`endereco\` vazio, campos foram reorganizados.
- Senhas bcrypt PHP (\`$2y$\`) convertidas para \`$2a$\` (compatível com bcryptjs).
- Fotos de produto: referência salva em \`foto_ref\` como caminho lógico \`/legacy-uploads/<arquivo>\` (copiar arquivos manualmente se necessário).
- Permissões legadas: códigos \`legacy.<módulo>.<recurso>.<ação>\`, categoria \`legacy.dbcozinca\`.

## Ignorados / erros

${stats.errors.length ? stats.errors.map((e) => `- ${e}`).join('\n') : '- Nenhum erro fatal'}

## Notas

${stats.notes.map((n) => `- ${n}`).join('\n')}

## Totais no banco (após esta execução)

- Usuários com \`legacy_id\`: **${usersWithLegacy}**
- Logs de auditoria com ação \`legacy.*\`: **${auditLegacyTotal}**
- Notificações importadas (prefixo \`[legacy_notif:\`): **${notifLegacyTotal}**
- Registros dinâmicos por entidade (entity_records não excluídos):

${totalsByEntity.map((x) => `  - \`${x.code}\`: ${x.n}`).join('\n')}
`;
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`OK — relatório: ${reportPath} (${elapsed}s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
