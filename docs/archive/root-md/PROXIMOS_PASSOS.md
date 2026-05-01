# ⚡ PRÓXIMOS PASSOS - O Que Fazer Agora

## 🎯 OBJETIVO IMEDIATO

Conectar os 6 serviços restantes ao Firestore (3-4 horas de trabalho).

---

## 📋 TAREFAS SEQUENCIAIS

### 1️⃣ TESTAR SISTEMA ATUAL (30 min)

```bash
cd d:\ERP

# Instalar se não fez ainda
npm install

# Rodar em modo local
npm run dev
```

**Verificar**:
- [ ] App inicia sem erros
- [ ] Login automático funciona
- [ ] Dashboard carrega
- [ ] Pode criar/editar/deletar produtos
- [ ] Dados persistem após recarregar (localStorage)

---

### 2️⃣ IMPLEMENTAR PRÓXIMO SERVIÇO (45 min cada)

**Use como referência**: `src/services/clientesService.js`

**Próximos a implementar**:

```javascript
// 1. fornecedoresService.js
// 2. pedidosService.js (ou pedidos_vendas)
// 3. estoqueMovimentacoesService.js
// 4. financeiro Service.js (contas a receber/pagar)
// 5. producaoService.js (ordens de produção)
// 6. rhService.js (funcionários)
```

**Padrão**:
1. Copiar `clientesService.js`
2. Renomear para novo serviço
3. Mudar:
   - Nome da coleção
   - Campos do MOCK_* (copiar de FIRESTORE_SCHEMA.js)
   - Métodos específicos do negócio
4. Exportar: `export const meuService = { ... }`
5. Testar criar/editar em modo local

---

### 3️⃣ CONECTAR PÁGINAS (2h por página)

**Ordem sugerida**:
1. `src/pages/estoque/Produtos.jsx` ← Já parcialmente pronto
2. `src/pages/vendas/Clientes.jsx`
3. `src/pages/compras/Fornecedores.jsx`
4. ... continuar com todas

**Padrão para cada página**:

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { seuService } from '@/services/seuService';
import toast from 'react-hot-toast';

export default function SuaPagina() {
  const queryClient = useQueryClient();

  // 1. READ
  const { data = [], isLoading } = useQuery({
    queryKey: ['seu-service'],
    queryFn: () => seuService.getAll(),
  });

  // 2. CREATE
  const { mutate: criar } = useMutation({
    mutationFn: (dados) => seuService.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seu-service'] });
      toast.success('Criado!');
    },
  });

  // 3. UPDATE (similar)
  // 4. DELETE (similar)

  // 5. RENDER com table/modal/form
  return (
    <div>
      <h1>Sua Página</h1>
      {/* Tabela, modal, botões */}
    </div>
  );
}
```

---

### 4️⃣ TESTAR MODO FIREBASE (30 min)

#### Preparar Firebase
1. Acessar https://console.firebase.google.com
2. Criar projeto "nomus-erp" (ou nome escolhido)
3. Habilitar Authentication (Email/Password)
4. Criar Firestore Database
5. Copiar credenciais para `.env.local`

#### Configurar `.env.local`
```env
VITE_BACKEND_PROVIDER=firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### Testar
```bash
npm run dev
```

- [ ] Acesse http://localhost:5173/login
- [ ] Crie conta (signup)
- [ ] Faça login
- [ ] Crie um produto
- [ ] Verifique no Firestore Console que salvou em `produtos`
- [ ] Abra em outra aba → verifique sincronização em tempo real

---

### 5️⃣ PUBLICAR FIRESTORE RULES (10 min)

1. Firebase Console → Firestore Database → Rules
2. Cole conteúdo de `FIRESTORE_RULES.txt`
3. Clique "Publicar"

---

### 6️⃣ BUILD & DEPLOY (1h)

```bash
# Build
npm run build

# Instalar Firebase CLI (uma vez)
npm install -g firebase-tools
firebase login

# Setup (uma vez)
firebase init hosting
# Responder:
# - Projeto: seu-projeto
# - Public directory: dist
# - Redirecionar 404: sim
# - Sobrescrever: não

# Deploy
firebase deploy --only hosting
```

**Resultado**: App em produção em `https://seu-projeto.web.app`

---

## ✅ CHECKLIST DE CONCLUSÃO

### Antes de Começar
- [ ] Ter Node.js 20+ instalado
- [ ] Ter npm 10+ instalado
- [ ] Estar em d:\ERP
- [ ] `.env.local` configurado

### Fase de Implementação
- [ ] Testar sistema atual (local)
- [ ] Implementar 6 serviços (fornecedores, pedidos, etc)
- [ ] Conectar todas as 40+ páginas
- [ ] Testar cada página com CRUD completo
- [ ] Validar dados em localStorage (local mode)

### Fase Firebase
- [ ] Criar projeto Firebase
- [ ] Copiar credenciais
- [ ] Testar modo Firebase
- [ ] Publicar Firestore Rules
- [ ] Testar sincronização tempo real

### Deploy
- [ ] `npm run build` sem erros
- [ ] `npm run lint` 0 erros
- [ ] Preview funciona: `npm run preview`
- [ ] Firebase CLI instalado
- [ ] Deploy realizado: `firebase deploy`
- [ ] App funciona em produção

---

## 🚨 PROBLEMAS COMUNS & SOLUÇÕES

### Erro: "Firebase não está ativo"
**Solução**: Verificar `.env.local`
```bash
# Verificar conteúdo
cat .env.local
# Deve ter: VITE_BACKEND_PROVIDER=firebase
```

### Erro: "Permission denied" no Firestore
**Solução**: Publicar Firestore Rules
```
Firebase Console → Firestore → Rules → Publicar
```

### Dados não sincronizam em tempo real
**Solução**: Verificar listeners
```javascript
// Em seu serviço, validar onColecaoChange está retornando unsubscribe
const unsub = firestoreRepository.onCollectionChange(...);
// E no useEffect: return unsub; // Cleanup
```

### Build falha
**Solução**: Reinstalar deps
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase deploy falha
**Solução**: Verificar autenticação
```bash
firebase logout
firebase login
firebase deploy --only hosting
```

---

## 📊 ESTIMATIVA DE TEMPO

| Tarefa | Tempo | Prioridade |
|--------|-------|-----------|
| Testar atual | 30 min | 🔴 CRÍTICO |
| 6 serviços | 4h | 🔴 CRÍTICO |
| 40+ páginas | 30h | 🔴 CRÍTICO |
| Testes Firebase | 2h | 🟡 ALTO |
| Deploy | 1h | 🟡 ALTO |
| **TOTAL** | **~37h** | **~1 semana** |

---

## 🎓 RECURSOS

📖 [EXEMPLOS_USO.md](./EXEMPLOS_USO.md) - Copiar/colar código
📖 [DEPLOY_FIREBASE.md](./DEPLOY_FIREBASE.md) - Setup Firebase detalhado
📖 [GUIA_TESTES.md](./GUIA_TESTES.md) - Checklist de testes
📖 [FIRESTORE_SCHEMA.js](./FIRESTORE_SCHEMA.js) - Estrutura de dados
📖 [FIRESTORE_RULES.txt](./FIRESTORE_RULES.txt) - Regras de segurança

---

## 💡 DICAS DE PRODUTIVIDADE

1. **Use Copilot/ChatGPT**: "Cria um serviço híbrido para [entidade] seguindo o padrão de clientesService"
2. **Batch de edições**: Faça todas as páginas de um módulo antes de passar para outro
3. **Teste enquanto implementa**: Não espere tudo pronto para testar
4. **Use modo local**: Desenvolvimento ~10x mais rápido que Firebase
5. **Commit frequente**: `git commit` a cada serviço novo

---

## 🚀 COMEÇAR AGORA

**Execute imediatamente**:

```bash
cd d:\ERP
npm install
npm run dev
```

Abra http://localhost:5173 e **veja a magia acontecer**! ✨

---

**Próxima Milestone**: Ter 50% das páginas conectadas ao novo serviço

**Timeline**: Começar hoje, término em 3-5 dias com trabalho concentrado

**Você consegue! 💪**
