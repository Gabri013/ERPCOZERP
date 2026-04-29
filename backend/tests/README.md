# Base44 ERP — Testes

## Configurar banco de testes

```bash
# Criar banco de testes
mysql -u root -p -e "CREATE DATABASE base44_erp_test"

# Exportar schema
mysql -u root -p base44_erp_test < schema.sql

# Popular dados de teste
mysql -u root -p base44_erp_test < tests/fixtures/seed.sql
```

## Rodar testes

```bash
# Unitários
npm test

# Com watch
npm run test:watch

# Coverage
npm run test:coverage
```

## Testes unitários (Jest)

```javascript
const request = require('supertest');
const app = require('../src/index');

describe('Auth API', () => {
  it('deve login com sucesso', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: '123456' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});
```

## Validação FASE 1 (Fundação)

 checklist:

- [ ] Login funciona (bcrypt + JWT)
- [ ] Refresh token funciona
- [ ] Logout invalida sessão
- [ ] Middleware bloqueia sem token
- [ ] Permissões bloqueiam rotas
- [ ] Master bypass everything
- [ ] Auditoria loga todas ações
- [ ] Audit log armazena before/after
- [ ] Workflow bloqueia transição ilegal
- [ ] Regra executa ação
- [ ] Cache funciona (Redis)
- [ ] Rate limiting ativo
