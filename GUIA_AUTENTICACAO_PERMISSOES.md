# Guia de Autenticação Persistida e Permissões

## ✅ O que foi implementado

### 1. **Autenticação Persistida** 
- Token salvo em `localStorage` automaticamente
- Sessão mantida ao recarregar a página
- Auto-logout se token expirar

### 2. **Sistema de Roles (Papéis)**
Cada usuário tem um role que define suas permissões:

#### **Admin** (admin@erpcoz.local / admin123)
- Acesso total ao sistema
- Gestão de usuários, roles e permissões
- Visualizar auditoria

#### **Master** (master@erpcoz.local / admin123)
- Acesso total com auditoria
- Não pode deletar usuários
- Criação e edição de usuários

#### **Operador** (operador@erpcoz.local / admin123)
- Gestão de estoque
- Visualizar produtos
- Criar pedidos

#### **Vendedor** (vendedor@erpcoz.local / admin123)
- Criar e editar pedidos
- Gerenciar clientes
- Visualizar relatórios


## 🧪 Testando as Permissões

### Local de Testes
```bash
# Terminal 1: Backend (já rodando em :3001)
npm run dev

# Terminal 2: Frontend (já rodando em :5173)
npm run dev
```

### Teste 1: Login Persistido
1. Acesse http://localhost:5173
2. Faça login com `admin@erpcoz.local` / `admin123`
3. **Recarregue a página** (F5 ou Ctrl+R)
4. ✅ Você **continua logado** sem fazer login novamente
5. Abra DevTools (F12) → **Application → LocalStorage**
6. Veja as chaves: `access_token`, `refresh_token`

### Teste 2: Verificar Permissões Carregadas
1. Abra DevTools (F12) → **Console**
2. Faça login e veja:
```
[Backend Permissões] Carregado: {
  roles: ["admin"],
  modules: { dashboard: true, usuarios: true, ... },
  permissionCount: 18
}
```

### Teste 3: Diferentes Roles
1. Logout (botão no topo)
2. Faça login com `vendedor@erpcoz.local` / `admin123`
3. Compare os módulos visíveis no Console
4. O Vendedor vê menos opções (apenas Pedidos, Clientes, Relatórios)

### Teste 4: API de Permissões
```bash
# Terminal PowerShell - Chamar endpoint de permissões
$headers = @{
  'Content-Type' = 'application/json'
  'Authorization' = 'Bearer SEU_TOKEN_AQUI'
}

Invoke-WebRequest http://localhost:3001/api/permissions/me `
  -Method GET `
  -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "1",
    "email": "admin@erpcoz.local",
    "name": "Administrador",
    "roles": ["admin"]
  },
  "permissions": [
    "dashboard:view",
    "users:manage",
    "clientes:view",
    "clientes:create",
    ...
  ],
  "modules": {
    "dashboard": true,
    "clientes": true,
    "produtos": true,
    "estoque": true,
    ...
  }
}
```


## 📝 Estrutura de Permissões

### Formato Padrão
```
modulo:acao
```

Exemplos:
- `dashboard:view` - Visualizar dashboard
- `clientes:create` - Criar novo cliente
- `estoque:edit` - Editar estoque
- `usuarios:manage` - Gerenciar usuários (CRUD completo)

### Ações Comuns
- `:view` - Visualizar/Ler
- `:create` - Criar novo
- `:edit` - Editar
- `:delete` - Deletar
- `:manage` - Gerenciamento completo


## 🛡️ Como Usar as Permissões no Frontend

### Componente com Verificação
```jsx
import { usePermissoes } from '@/lib/PermissaoContext';

export function ClientesPage() {
  const { canViewClientes, hasPermission } = usePermissoes();

  if (!canViewClientes) {
    return <div>Você não tem acesso a este módulo</div>;
  }

  return (
    <div>
      <h1>Clientes</h1>
      {hasPermission('clientes:create') && (
        <button>+ Novo Cliente</button>
      )}
    </div>
  );
}
```

### Hook Customizado
```jsx
import { usePermissao } from '@/lib/PermissaoContext';

export function MinhaComponent() {
  const { pode, podeVerModulo } = usePermissao();

  return (
    <>
      {pode('usuarios:manage') && <AdminPanel />}
      {podeVerModulo('estoque') && <EstoqueView />}
    </>
  );
}
```


## 🔧 Configurar Novas Permissões

### 1. Backend (`backend/src/routes/permissions.js`)
```javascript
const PERMISSIONS = {
  meuRole: [
    'novo:modulo',
    'outro:acesso'
  ]
};
```

### 2. Frontend - Adicionar Shortcut
```javascript
// Em PermissaoContext.jsx
canViewMeuModulo: modules.meumodulo,
```

### 3. Usar no Componente
```jsx
const { canViewMeuModulo } = usePermissoes();
```


## 📊 Fluxo de Autenticação

```
Login
  ↓
API retorna: { user, accessToken, refreshToken }
  ↓
Frontend salva tokens em localStorage
  ↓
Recarregar página
  ↓
AuthContext lê localStorage
  ↓
PermissaoContext carrega `/api/permissions/me`
  ↓
Componentes renderizam conforme permissões
```


## ⚠️ Notas Importantes

- **Token expira em 7 dias** (configurável em `.env`)
- **Refresh token expira em 30 dias**
- **localStorage** é acessível a XSS - em produção usar HTTP-only cookies
- **Permissões são sincronizadas** a cada login ou reload
- **Mock Database** - Permissões armazenadas em memória (será banco de dados em produção)


## 🐛 Troubleshooting

### Problema: "Acesso negado" logo após login
**Solução:** Recarregue a página (F5). As permissões carregam após autenticação.

### Problema: Token não persiste após recarregar
**Solução:** Limpe localStorage:
```javascript
localStorage.clear()
// Faça login novamente
```

### Problema: Módulo não aparece mas tem permissão
**Solução:** Verifique o Console (F12) para logs de permissões:
```javascript
[Backend Permissões] Carregado: { ... }
```

### Problema: API retorna 401 Unauthorized
**Solução:** Token expirou. Faça logout e login novamente.


## 📝 Próximas Implementações

- [ ] Refresh token automático
- [ ] Salvar permissões em cache local
- [ ] UI de Gestão de Permissões por Usuário
- [ ] Auditoria de quem acessou o quê
- [ ] Two-Factor Authentication (2FA)
- [ ] Permissões por Filial/Departamento
