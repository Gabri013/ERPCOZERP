# 🚀 Deploy do Frontend Base44 ERP na Vercel

Este projeto é um **monorepo** com frontend (React + Vite) e backend (Node.js) separados.

**Este guia cobre apenas o deploy do FRONTEND na Vercel.**

---

## 📦 Estrutura

```
ERPCOZERP/
├── src/              # Frontend React (Vite)
├── backend/          # Backend Node.js (Render)
├── index.html
├── vite.config.js
├── vercel.json       # Configuração da Vercel
└── package.json      # Dependências do frontend
```

---

## 🔧 Configuração

### Variáveis de Ambiente

No painel da Vercel → **Settings → Environment Variables**, adicione:

| Variable | Value | Type |
|----------|-------|------|
| `VITE_BACKEND_PROVIDER` | `api` | Plain Text |
| `VITE_BACKEND_URL` | `https://erp-backend-iwvv.onrender.com` | Plain Text |
| `VITE_AUTH_LOGIN_URL` | `/login` | Plain Text |

> **Nota**: O prefixo `VITE_` é obrigatório para que o Vite exponha as variáveis ao código frontend.

---

## 🚀 Criando o Projeto na Vercel

### Opção 1: Via CLI (recomendado)

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Faça login
vercel login

# Deploy do frontend (na raiz do projeto)
vercel --prod
```

A CLI vai detectar automaticamente:
- Framework: Vite
- Build: `npm run build`
- Output: `dist`

### Opção 2: Via Dashboard (GUI)

1. Vá para https://vercel.com/new
2. Conecte seu repositório GitHub
3. Configure:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `.` (raiz) |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm ci` |

4. Clique **Deploy**

---

## 🔗 Integração com Backend (Render)

### Backend CORS

No painel do Render (backend), certifique-se de que a variável `FRONTEND_URL` está configurada:

```
FRONTEND_URL=https://seu-frontend.vercel.app
```

Se você ainda não tem o domínio, pode usar:
```
FRONTEND_URL=*
```
⚠️ Isso permite qualquer origem — use apenas em desenvolvimento/teste.

### Proxy Reverso (Vercel → Render)

O `vercel.json` já está configurado para encaminhar todas as requisições `/api/*` para o backend:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://erp-backend-iwvv.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Vantagem**:
- Frontend faz fetch para `/api/auth/login` (caminho relativo)
- Vercel redireciona para backend automaticamente
- URL do backend fica escondida do código frontend

---

## ✅ Verificação pós-deploy

1. **Frontend acessível**:
   https://seu-frontend.vercel.app → deve carregar a tela de login

2. **Health check**:
   Abra console do navegador e verifique se não há erros CORS

3. **Login**:
   - Email: `master@base44.com`
   - Senha: (a definida no seed do backend)

4. **API calls**:
   - Network tab → requests para `/api/...` devem retornar 200

---

## 🛠️ Troubleshooting

### Erro: Failed to fetch /api/auth/login

**Causa**: Backend não está acessível ou CORS bloqueando.

**Solução**:
1. Verifique `FRONTEND_URL` no Render
2. Teste diretamente: https://erp-backend-iwvv.onrender.com/health
3. Se o backend exigir HTTPS, certifique-se de que a URL no proxy está com `https://`

---

### Erro no build: "Module not found"

**Causa**: Dependências não instaladas corretamente.

**Solução**: Force reinstall:
```bash
rm -rf node_modules package-lock.json
npm ci
```

---

### Variáveis de ambiente não disponíveis

**Causa**: variáveis Vercel não definidas ou nome errado.

**Solução**: Painel Vercel → Settings → Environment Variables
- Devem começar com `VITE_`
- Re-deploy após adicionar

---

## 🔄 Atualizações futuras

Cada commit na branch principal triggers auto-deploy na Vercel.

Para forçar novo deploy:
```bash
vercel --prod --force
```

---

## 📝 Notas

- O frontend é totalmente estático (SPA)
- Rotas cliente (React Router) são gerenciadas pelo rewrite para `/index.html`
- API requests são proxy-encaminhados para o backend
- Não use senhas ou segredos nas variáveis VITE_ (elas vão para o navegador)

---

## 🎯 Pronto!

Seu frontend agora está na Vercel, conectado ao backend no Render com banco TiDB Cloud.

Para suporte, consulte https://docs.vercel.com
