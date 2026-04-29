# 🧪 GUIA DE TESTES - Nomus ERP

## Objetivo
Validar que o sistema funciona 100% em ambos os modos: Local e Firebase.

---

## TESTE 1: Modo Local (Sem Firebase)

### Passo 1: Configurar Modo Local

Edite `.env.local`:
```env
VITE_BACKEND_PROVIDER=local
VITE_AUTH_LOGIN_URL=/login
```

### Passo 2: Iniciar Servidor

```bash
cd d:\ERP
npm install
npm run dev
```

Navegue para: `http://localhost:5173`

### Passo 3: Testar Login
- [ ] Clique em "Entrar"
- [ ] Verifique que acessa o Dashboard sem pedir senha
- [ ] Verifique que localStorage contém dados

### Passo 4: Testar Produtos (CRUD)

**CREATE**:
- [ ] Vá para Estoque > Produtos
- [ ] Clique em "+ Novo Produto"
- [ ] Preencha: Nome, SKU, Preço, Estoque
- [ ] Clique em "Salvar"
- [ ] Verifique que produto aparece na lista
- [ ] Abra DevTools (F12) → Application → localStorage → nomus_erp_produtos
- [ ] Verifique que JSON contém o novo produto

**READ**:
- [ ] Recarregue a página (F5)
- [ ] Verifique que produtos ainda estão lá
- [ ] Teste busca/filtro

**UPDATE**:
- [ ] Clique em "Editar" em um produto
- [ ] Mude o preço
- [ ] Clique em "Salvar"
- [ ] Verifique que lista foi atualizada
- [ ] Recarregue (F5) e confirme que mudança persiste

**DELETE**:
- [ ] Clique em "Deletar" em um produto
- [ ] Clique em "Confirmar"
- [ ] Verifique que produto desapareceu
- [ ] Recarregue (F5) e confirme que deletação persiste

### Passo 5: Testar Clientes
- [ ] Vá para Vendas > Clientes
- [ ] Teste CRUD completo (criar, editar, deletar)
- [ ] Teste busca por nome/email

### Passo 6: Testar Navegação
- [ ] Clique em todos os módulos (Vendas, Estoque, etc)
- [ ] Verifique que nenhuma página quebra
- [ ] Verifique que não há erros no console (F12 → Console)

### Passo 7: Logout
- [ ] Clique em seu avatar (canto superior direito)
- [ ] Clique em "Logout"
- [ ] Verifique que volta para login

**Resultado Esperado**: ✅ Tudo funciona perfeitamente

---

## TESTE 2: Modo Firebase (Com Banco Real)

### Pré-requisitos
1. Conta no Gmail/Google
2. Criar projeto Firebase (ver DEPLOY_FIREBASE.md)
3. Ter as credenciais Firebase

### Passo 1: Configurar Firebase

No arquivo `.env.local`:
```env
VITE_BACKEND_PROVIDER=firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Passo 2: Iniciar Servidor
```bash
npm run dev
```

### Passo 3: Testar Login
- [ ] Navegue para `http://localhost:5173/login`
- [ ] Você deve ver página de login (não mais auto-login)
- [ ] Clique em "Criar uma conta"
- [ ] Preencha Email e Senha
- [ ] Clique em "Criar Conta"
- [ ] Verifique mensagem de sucesso
- [ ] Volte ao login
- [ ] Faça login com email/senha criado
- [ ] Verifique que acessou o Dashboard

### Passo 4: Verificar Firestore

No console Firebase:
1. Vá para `Firestore Database`
2. Clique em `Coleção` → `usuarios`
3. Verifique que seu usuário está lá:
   ```json
   {
     "uid": "...",
     "email": "seu@email.com",
     "displayName": "seu@email.com",
     "role": "user",
     "createdAt": "timestamp",
     "updatedAt": "timestamp"
   }
   ```

### Passo 5: Testar Produtos com Firestore

**CREATE**:
- [ ] Vá para Estoque > Produtos
- [ ] Clique em "+ Novo Produto"
- [ ] Preencha dados
- [ ] Clique em "Salvar"
- [ ] Verifique toast "Produto criado com sucesso"
- [ ] Verifique no Firestore Console que apareceu em `produtos`

**READ**:
- [ ] Recarregue a página
- [ ] Verifique que produto ainda está lá (vindo do Firestore)

**UPDATE**:
- [ ] Edite o produto
- [ ] Mude algum campo
- [ ] Salve
- [ ] Verifique no Firestore que mudança apareceu

**DELETE**:
- [ ] Deletar o produto
- [ ] Verifique no Firestore que foi removido

### Passo 6: Testar Sincronização em Tempo Real

**Em 2 abas do navegador**:

1. **Aba 1**: Vá para Estoque > Produtos
2. **Aba 2**: Abra também Estoque > Produtos
3. **Aba 1**: Crie um novo produto
4. **Aba 2**: Verifique que o produto apareça automaticamente (sincronização em tempo real)
5. **Aba 2**: Edite o produto
6. **Aba 1**: Verifique que viu a alteração

**Resultado Esperado**: ✅ Mudanças sincronizam instantaneamente

### Passo 7: Testar Clientes

- [ ] Vá para Vendas > Clientes
- [ ] Teste CRUD completo
- [ ] Verifique no Firestore que dados estão lá
- [ ] Teste sincronização em tempo real (como acima)

### Passo 8: Testar Permissões (Opcional)

No Firestore Console:
1. Vá para `usuarios/{seu-uid}`
2. Mude `role` para `vendas`
3. No app, tente criar uma ordem de compra
4. Verifique que mostra erro de permissão

### Passo 9: Logout
- [ ] Clique em logout
- [ ] Verifique que volta para login
- [ ] No Firestore Console, verifique que session foi limpa

**Resultado Esperado**: ✅ Firebase funciona perfeitamente

---

## TESTE 3: Build de Produção

### Passo 1: Gerar Build
```bash
npm run build
```

Deve gerar pasta `dist/` sem erros.

### Passo 2: Preview do Build
```bash
npm run preview
```

Deve iniciar servidor em `http://localhost:4173`

### Passo 3: Testar Build
- [ ] Teste login e CRUD em modo preview
- [ ] Verifique que funciona igual ao dev
- [ ] Verifique que não há erros no console

**Resultado Esperado**: ✅ Build pronto para produção

---

## TESTE 4: Linting

```bash
npm run lint
```

Deve retornar 0 erros e 0 warnings.

Se houver erros:
```bash
npm run lint:fix
```

---

## TESTE 5: TypeCheck (Opcional)

```bash
npm run typecheck
```

Verifique que não há erros de tipo.

---

## TESTE 6: Deploy no Firebase Hosting

### Passo 1: Setup Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### Passo 2: Deploy
```bash
npm run build
firebase deploy --only hosting
```

### Passo 3: Testar Produção
1. Abra `https://seu-projeto.web.app`
2. Teste login/logout
3. Teste CRUD
4. Verifique no Firestore Console que dados estão sendo salvos

**Resultado Esperado**: ✅ App funcionando em produção

---

## CHECKLIST FINAL

### Funcionalidades
- [ ] Login/Signup/Logout funciona
- [ ] CRUD Produtos funciona
- [ ] CRUD Clientes funciona
- [ ] CRUD Usuários funciona
- [ ] Dashboard carrega dados
- [ ] Busca/Filtro funciona
- [ ] Sincronização em tempo real funciona
- [ ] Permissões são respeitadas

### Modo Local
- [ ] Modo local funciona sem Firebase
- [ ] Dados persistem em localStorage
- [ ] Recarregar página mantém dados

### Modo Firebase
- [ ] Login autêntico funciona
- [ ] Dados salvam no Firestore
- [ ] Dados sincronizam em tempo real
- [ ] Logout limpa sessão
- [ ] Firestore Rules funcionam

### Build & Deploy
- [ ] `npm run build` sucede
- [ ] `npm run lint` retorna 0 erros
- [ ] Preview funciona
- [ ] Firebase deploy sucede
- [ ] App funciona em produção

### Console
- [ ] Nenhum erro no console (F12)
- [ ] Nenhum warning importante
- [ ] Performance aceitável (DevTools → Network)

---

## 🐛 Troubleshooting Testes

### Erro: "Firebase não está ativo"
→ Verificar `.env.local` tem `VITE_BACKEND_PROVIDER=firebase`

### Erro: "Permission denied"
→ Publicar FIRESTORE_RULES.txt no console Firebase

### Dados não sincronizam
→ Verificar Firestore listeners estão ativos
→ Verificar internet conectada
→ Recarregar página

### Build falha
→ `rm -rf node_modules && npm install`
→ `npm run build`

### Erro de autenticação
→ Verificar credenciais Firebase corretas
→ Verificar Authentication ativado no console Firebase

---

## 📊 Relatório de Teste

**Data**: _______________
**Testador**: _______________

| Teste | Resultado | Observações |
|-------|-----------|-------------|
| Modo Local | ✅ ⚠️ ❌ | _____________ |
| Modo Firebase | ✅ ⚠️ ❌ | _____________ |
| Build | ✅ ⚠️ ❌ | _____________ |
| Deploy | ✅ ⚠️ ❌ | _____________ |
| Linting | ✅ ⚠️ ❌ | _____________ |

**Status Final**: ✅ PRONTO PARA PRODUÇÃO

---

**Próximo Passo**: Após todos os testes passarem com ✅, o sistema está pronto para uso em produção.
