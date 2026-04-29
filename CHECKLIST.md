# 📋 Checklist de Implementação - Nomus ERP Firebase

## ✅ COMPLETO (Fase 1)

### Infraestrutura
- [x] Autenticação Firebase integrada (authService.js)
- [x] Cliente Firebase configurado (firebase/client.js)
- [x] AppConfig com validação de runtime
- [x] AuthContext preparado para Firebase e local
- [x] Login Page criada (páginas públicas/autenticadas)
- [x] Roteamento estruturado (público vs protegido)

### Firestore & Dados
- [x] FirestoreRepository expandido com mais operações:
  - [x] CRUD básico (create, read, update, delete)
  - [x] Filtros e buscas
  - [x] Listeners em tempo real
  - [x] Operações em batch
  - [x] Timestamps automáticos
  - [x] Export/backup
- [x] Schema Firestore documentado (FIRESTORE_SCHEMA.js)
- [x] Security Rules prontas (FIRESTORE_RULES.txt)
- [x] Exemplo de serviço híbrido (produtoService.js)

### Documentação & Deploy
- [x] Guia completo de deploy Firebase (DEPLOY_FIREBASE.md)
- [x] Configuração Firebase (firebase.json)
- [x] Arquivo .env.local de referência
- [x] Regras de segurança Firestore
- [x] Schema de coleções e documentos

---

## 🔄 PRÓXIMAS FASES

### Fase 2: Conectar Serviços ao Firestore
- [ ] usuarios_service.js (híbrido)
- [ ] clientes_service.js (híbrido)
- [ ] fornecedores_service.js (híbrido)
- [ ] pedidos_service.js (híbrido)
- [ ] estoque_service.js (híbrido)
- [ ] financeiro_service.js (híbrido)
- [ ] producao_service.js (híbrido)
- [ ] rh_service.js (híbrido)
- [ ] crm_service.js (híbrido)

**Padrão**: Cada serviço deve:
1. Usar `firestoreRepository` em modo Firebase
2. Usar `storage` em modo local
3. Implementar operações CRUD
4. Ter métodos de negócio (busca, filtros, cálculos)
5. Suportar listeners em tempo real

### Fase 3: Paginas - Integração com Serviços
- [ ] Dashboard.jsx - conectar KPIs aos dados reais
- [ ] Produtos.jsx - CRUD completo
- [ ] Clientes.jsx - CRUD completo
- [ ] PedidosVenda.jsx - CRUD completo
- [ ] Fornecedores.jsx - CRUD + buscas
- [ ] OrdensCompra.jsx - CRUD completo
- [ ] OrdensProducao.jsx - CRUD + status
- [ ] ContasReceber.jsx - CRUD + simulação de pagamento
- [ ] ContasPagar.jsx - CRUD + simulação de pagamento
- [ ] Usuarios.jsx - Gestão de usuários
- [ ] Demais páginas...

**Padrão**: Cada página deve:
1. Usar React Query para cache
2. Carregar dados do serviço
3. Suportar CRUD (Create, Read, Update, Delete)
4. Validar permissões antes de operações
5. Mostrar loading/erro states

### Fase 4: Upload de Arquivos
- [ ] Integrar Firebase Storage
- [ ] Upload de imagens de produtos
- [ ] Upload de anexos (pedidos, OPs)
- [ ] Preview de arquivos

### Fase 5: Testes e Validação
- [ ] Testar modo local completamente
- [ ] Testar modo Firebase:
  - [ ] Login/signup/logout
  - [ ] CRUD em cada módulo
  - [ ] Permissões por role
  - [ ] Sincronização em tempo real
  - [ ] Offline mode
- [ ] Validar build sem erros
- [ ] Smoke tests em produção

### Fase 6: Deploy
- [ ] Build final: `npm run build`
- [ ] Setup Firebase Hosting
- [ ] Deploy: `firebase deploy`
- [ ] Configurar domínio customizado
- [ ] Monitoramento e alertas

---

## 🚀 COMO COMEÇAR

### Opção A: Teste Rápido (Modo Local)
```bash
cd d:\ERP
npm install
# Configure .env.local com VITE_BACKEND_PROVIDER=local
npm run dev
# Abra http://localhost:5173
```

### Opção B: Teste com Firebase (Recomendado)
```bash
# 1. Criar projeto Firebase (ver DEPLOY_FIREBASE.md)
# 2. Copiar credenciais para .env.local
# 3. Instalar deps
npm install

# 4. Build e testar
npm run build
npm run preview

# 5. Deploy
firebase deploy --only hosting
```

---

## 📊 PROGRESSO ESTIMADO

| Fase | Descrição | Status | Esforço |
|------|-----------|--------|---------|
| 1 | Infraestrutura Firebase | ✅ 100% | 🟢 Completo |
| 2 | Serviços híbridos | 🟡 10% | ~20h |
| 3 | Páginas com dados | 🟡 5% | ~30h |
| 4 | Storage/Upload | ⚪ 0% | ~8h |
| 5 | Testes | ⚪ 0% | ~10h |
| 6 | Deploy | ⚪ 0% | ~4h |

**Total Estimado**: ~72 horas de trabalho

---

## 📚 ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos
- `src/pages/Login.jsx` - Página de login/signup
- `FIRESTORE_SCHEMA.js` - Documentação de schema
- `FIRESTORE_RULES.txt` - Regras de segurança
- `DEPLOY_FIREBASE.md` - Guia de deployment
- `.env.local` - Configuração local
- `firebase.json` - Configuração Firebase Hosting
- `src/services/produtoService.js` - Exemplo de serviço híbrido

### Modificados
- `src/App.jsx` - Estrutura de rotas pública/protegida
- `src/services/firestoreRepository.js` - Operações expandidas
- `src/lib/AuthContext.jsx` - Suporte a ambos os modos

---

## 🔑 PONTOS-CHAVE

1. **Modo Híbrido**: Funciona tanto localmente quanto com Firebase
2. **Segurança**: Regras Firestore por role/perfil
3. **Offline**: localStorage como fallback
4. **Real-time**: Listeners do Firestore para sincronização automática
5. **Escalabilidade**: Pronto para produção no Firebase Hosting

---

## ⚠️ IMPORTANTE

- Nunca commitar `.env.local` com credenciais reais no Git
- Usar variáveis de ambiente diferentes para staging vs produção
- Testar regras Firestore completamente antes de produção
- Configurar backups automatizados no Firestore
- Monitorar custos do Firebase (especialmente Firestore reads/writes)

---

## 📞 PRÓXIMOS PASSOS

1. **Hoje**: Escolher serviço para conectar primeiro (Ex: Produtos)
2. **Dia 1-2**: Implementar todos os serviços híbridos
3. **Dia 3-5**: Conectar páginas aos serviços
4. **Dia 6-7**: Testes e validação
5. **Dia 8**: Deploy em Firebase Hosting

Estimado: **1-2 semanas de trabalho concentrado**
