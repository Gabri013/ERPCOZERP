# 🔧 RECOMENDAÇÕES: FLUXO DE OPERAÇÃO E PERMISSÕES DO ERP

## 📋 Resumo Executivo

O sistema de permissões está **funcional e bem estruturado**, mas há **5 áreas críticas de melhoria** que precisam ser implementadas para garantir:
- ✅ Isolamento de dados por empresa
- ✅ Auditoria de ações sensíveis
- ✅ Sincronização consistente de permissões
- ✅ Validação rigorosa de companyId
- ✅ Fluxo de usuário otimizado

**Tempo estimado de implementação**: 3-5 horas

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. ❌ Isolamento de Dados por Empresa (CRÍTICO)

**Problema**: APIs retornam dados sem filtrar por companyId do usuário

**Localização**: Toda query no banco que busca dados da empresa
- `apps/backend/src/modules/*/[recurso].routes.ts`

**Exemplo do problema**:
```typescript
// ❌ ERRADO: Retorna produtos de TODAS as empresas
router.get('/api/produtos', authenticate, async (req, res) => {
  const produtos = await prisma.produto.findMany();
  res.json(produtos);
});

// ✅ CORRETO: Retorna apenas produtos da empresa do usuário
router.get('/api/produtos', authenticate, async (req, res) => {
  const produtos = await prisma.produto.findMany({
    where: { companyId: req.user.companyId }
  });
  res.json(produtos);
});
```

**Impacto**: Alto - Segurança de dados

**Ação Recomendada**:
1. Auditar TODAS as queries no backend
2. Adicionar `where: { companyId: req.user.companyId }` em queries que buscam dados da empresa
3. Criar um helper function `getUserCompanyFilter()` para reusar
4. Testar com dois usuários de empresas diferentes

---

### 2. ❌ Validação de companyId Ausente (CRÍTICO)

**Problema**: JWT pode conter companyId inválido ou inexistente

**Localização**: `apps/backend/src/middleware/auth.ts` - linha 50-60

**Atual**:
```typescript
// ❌ Só valida se é null, não valida se existe
companyId: String(decoded.companyId || ''),
```

**Recomendado**:
```typescript
// ✅ Valida existência da empresa
const companyId = String(decoded.companyId || '');
if (!companyId) {
  return res.status(400).json({ error: 'Token inválido - companyId ausente' });
}

// Validar se empresa existe (cache por 1 hora)
const company = await prisma.company.findUnique({ 
  where: { id: companyId },
  select: { id: true, ativo: true }
});
if (!company || !company.ativo) {
  return res.status(403).json({ error: 'Empresa inativa ou não existe' });
}

req.user.companyId = companyId;
```

**Impacto**: Alto - Segurança

---

### 3. ❌ Sem Audit Log de Impersonation (IMPORTANTE)

**Problema**: Master pode impersonar usuários sem registro/rastreamento

**Localização**: `apps/frontend/src/contexts/ImpersonationContext.jsx`

**Recomendação**:
```typescript
// Backend: POST /api/impersonate (Master only)
router.post('/api/impersonate',
  authenticate,
  requireRole('master'),
  async (req, res) => {
    const { targetUserId, reason } = req.body;
    
    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        action: 'IMPERSONATE_START',
        masterId: req.user.userId,
        targetUserId,
        reason,
        companyId: req.user.companyId,
        timestamp: new Date()
      }
    });
    
    // Gera novo token para usuário impersonado
    const newToken = jwt.sign(
      { sub: targetUserId, ... },
      secret
    );
    
    res.json({ token: newToken });
  }
);
```

**Impacto**: Médio - Compliance/Auditoria

---

### 4. ⚠️ Sincronização de Permissões Inconsistente (IMPORTANTE)

**Problema**: 3 fontes de verdade para permissões:
1. Token JWT (estático até logout)
2. Banco de dados (roles)
3. Banco de dados (grants extras)

Pode ficar dessincronizado se permissões mudarem sem re-login.

**Localização**: `apps/frontend/src/lib/PermissaoContext.jsx` - linha 20-30

**Recomendação**:
```javascript
// Revalidar permissões a cada 5 minutos
useEffect(() => {
  const interval = setInterval(() => {
    loadPermissionsFromBackend();
  }, 5 * 60 * 1000); // 5 minutos
  
  return () => clearInterval(interval);
}, []);

// Revalidar quando volta do background
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      loadPermissionsFromBackend();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

**Impacto**: Baixo - Usabilidade

---

### 5. ⚠️ Menu Sidebar Não Filtra Dinâmicamente (MÉDIO)

**Problema**: Sidebar hardcoda módulos, não filtra por `modules{}` do backend

**Localização**: `apps/frontend/src/components/layout/Sidebar.jsx` - linha 40-60

**Atual**:
```jsx
// ❌ Item sempre visível se usuário tem a permissão
{ label: 'Vendas', path: '/vendas', required: 'ver_vendas' }
```

**Recomendado**:
```jsx
// ✅ Filtra por módulo também
<MenuItem 
  label="Vendas"
  path="/vendas"
  required="ver_vendas"
  module="vendas"  // Novo
/>

// No componente:
{podeVerModulo('vendas') && pode('ver_vendas') && <Link>...</Link>}
```

**Impacto**: Baixo - UX/Organização

---

## 📝 PLANO DE AÇÃO (Prioridade)

### FASE 1: CRÍTICA (fazer hoje)
- [ ] **1.1** Auditar queries e adicionar filtro `companyId` em todos os módulos
- [ ] **1.2** Implementar validação de companyId no middleware de auth
- [ ] **1.3** Testar isolamento de dados com 2+ usuários de empresas diferentes

### FASE 2: IMPORTANTE (hoje ou amanhã)
- [ ] **2.1** Criar tabela AuditLog no Prisma
- [ ] **2.2** Implementar endpoint POST /api/impersonate com audit
- [ ] **2.3** Adicionar revalidação periódica de permissões no frontend

### FASE 3: MELHORIAS (semana)
- [ ] **3.1** Implementar cache de company validation
- [ ] **3.2** Adicionar filtro dinâmico de módulos na Sidebar
- [ ] **3.3** Criar testes de RBAC com diferentes perfis

---

## 🔧 IMPLEMENTAÇÃO DETALHADA

### Task 1.1: Auditar e Corrigir Queries

**Script para encontrar queries afetadas**:
```bash
# No apps/backend/src/modules/*/
grep -r "prisma\." --include="*.ts" | grep -v "where: {" | head -20
```

**Padrão de correção**:
```typescript
// ANTES
const items = await prisma.produto.findMany({});

// DEPOIS
const items = await prisma.produto.findMany({
  where: { companyId: req.user.companyId }
});
```

**Módulos mais críticos**:
- vendas/ (pedidos, clientes, orçamentos)
- producao/ (OPs, apontamentos)
- estoque/ (produtos, movimentações)
- compras/ (OCs, fornecedores)
- financeiro/ (contas, lançamentos)

---

### Task 1.2: Melhorar Middleware

**Arquivo**: `apps/backend/src/middleware/auth.ts`

Adicionar após linha 60:

```typescript
// Validar se company existe e está ativa
if (req.user.companyId && req.user.companyId.length > 0) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { id: true, ativo: true }
    });
    
    if (!company || !company.ativo) {
      return res.status(403).json({ 
        error: 'Empresa inativa ou não existe' 
      });
    }
  } catch (e) {
    // Log erro mas não bloqueia (pode ser durante migração)
    console.error('Erro validando company:', e);
  }
}
```

---

### Task 2.1: Criar Tabela AuditLog

**Arquivo**: `apps/backend/prisma/schema.prisma`

Adicionar modelo:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // IMPERSONATE_START, IMPERSONATE_END, LOGIN, etc
  masterId  String?  // User ID de quem fez a ação
  targetId  String?  // User ID afetado
  companyId String?
  details   Json?    // Dados adicionais
  createdAt DateTime @default(now())
  
  @@index([masterId])
  @@index([targetId])
  @@index([createdAt])
}
```

Depois rodar:
```bash
npx prisma migrate dev --name add_audit_log
```

---

### Task 2.2: Implementar Impersonation com Audit

**Arquivo**: `apps/backend/src/modules/auth/impersonate.routes.ts` (novo arquivo)

```typescript
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../infra/prisma.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/impersonate/:userId', 
  authenticate,
  requireRole('master'),
  async (req, res) => {
    const targetUserId = req.params.userId;
    const { reason = '' } = req.body;
    
    // Validar que usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { 
        roles: { include: { role: true } },
        company: true 
      }
    });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        action: 'IMPERSONATE_START',
        masterId: req.user.userId,
        targetId: targetUserId,
        companyId: req.user.companyId,
        details: { reason }
      }
    });
    
    // Gerar novo token para usuário alvo
    const permissions = await getEffectivePermissionCodesForUserId(targetUserId);
    const token = jwt.sign(
      {
        sub: targetUser.id,
        email: targetUser.email,
        roles: targetUser.roles.map(r => r.role.code),
        permissions,
        companyId: targetUser.companyId
      },
      process.env.JWT_SECRET || 'dev_change_me',
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: targetUser });
  }
);

router.post('/impersonate/stop', 
  authenticate,
  requireRole('master'),
  async (req, res) => {
    // Log de parada
    await prisma.auditLog.create({
      data: {
        action: 'IMPERSONATE_END',
        masterId: req.user.userId,
        companyId: req.user.companyId
      }
    });
    
    res.json({ success: true });
  }
);

export default router;
```

---

### Task 2.3: Revalidação de Permissões

**Arquivo**: `apps/frontend/src/lib/PermissaoContext.jsx`

Adicionar após useEffect de loadPermissionsFromBackend:

```javascript
// Revalidar permissões a cada 5 minutos
useEffect(() => {
  if (!token) return;
  
  const interval = setInterval(() => {
    loadPermissionsFromBackend();
  }, 5 * 60 * 1000); // 5 minutos
  
  return () => clearInterval(interval);
}, [token, loadPermissionsFromBackend]);

// Revalidar quando volta do background
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      loadPermissionsFromBackend();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [loadPermissionsFromBackend]);
```

---

## ✅ CHECKLIST DE TESTES

Após implementar as mudanças, testar:

- [ ] **Isolamento de Dados**
  - [ ] Criar 2 empresas diferentes
  - [ ] Criar usuário em cada empresa
  - [ ] Login com usuário A, verificar que vê apenas dados da empresa A
  - [ ] Login com usuário B, verificar que vê apenas dados da empresa B
  - [ ] Tentar acessar dados da empresa B via API direto (deve 403)

- [ ] **Validação de companyId**
  - [ ] Fazer login normalmente
  - [ ] Editar JWT manualmente para companyId inválido
  - [ ] Fazer request com JWT alterado (deve 403)

- [ ] **Auditoria**
  - [ ] Master impersona outro usuário
  - [ ] Verificar AuditLog contém o registro
  - [ ] Verificar master pode ver ações do usuário impersonado

- [ ] **Sincronização de Permissões**
  - [ ] Usuário logado
  - [ ] Admin muda permissões do usuário no painel
  - [ ] Aguardar 5 minutos
  - [ ] Verificar que novo menu aparece para usuário

---

## 📊 IMPACTO DA IMPLEMENTAÇÃO

| Área | Antes | Depois | Ganho |
|------|-------|--------|-------|
| **Segurança de Dados** | Risco alto | Isolamento garantido | ✅ Crítico |
| **Conformidade** | Sem audit | Rastreado | ✅ Importante |
| **Sincronização** | Possível desincronização | Revalidação periódica | ✅ Médio |
| **UX** | Menu estático | Dinâmico por módulo | ✅ Baixo |

---

## 🚀 PRÓXIMOS PASSOS

1. **Hoje**: Implementar Task 1.1, 1.2, 1.3 (CRÍTICO)
2. **Amanhã**: Implementar Task 2.1, 2.2, 2.3
3. **Semana**: Implementar Task 3.1, 3.2, 3.3 + Testes completos

Após implementação completa, o sistema terá:
- ✅ Isolamento de dados por empresa
- ✅ Auditoria de ações sensíveis
- ✅ Sincronização consistente
- ✅ Validação rigorosa
- ✅ Pronto para produção

