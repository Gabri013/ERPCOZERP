# 🔵 Deploy do Frontend na Vercel

Este guia cobre o deploy do **frontend** (React + Vite) na Vercel, conectado ao **backend no Render** e **banco TiDB Cloud**.

---

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Backend já deployado no Render (https://erp-backend-iwvv.onrender.com)
- Banco TiDB Cloud configurado e acessível pelo backend

---

## 🚀 Passo a passo

### 1. Prepare o repositório

O projeto já está configurado para Vercel com:
- `vercel.json` — configuração de SSR/SPA e headers
- `vite.config.js` — build otimizado
- `.env.vercel.example` — variáveis de ambiente de exemplo

### 2. Crie um novo projeto na Vercel

1. Acesse https://vercel.com/new
2. Conecte seu repositório (GitHub/GitLab/Bitbucket)
3. Selecione o repositório `ERPCOZERP`
4. Configure:

**Framework Preset**: Vite
**Root Directory**: `.` (raiz do projeto)
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm ci`

### 3. Environment Variables (Vercel)

No painel da Vercel, em **Settings → Environment Variables**, adicione:

| Key | Value | Type |
|-----|-------|------|
| `VITE_BACKEND_URL` | `https://erp-backend-iwvv.onrender.com` | Plain Text |
| `VITE_BACKEND_PROVIDER` | `api` | Plain Text |
| `VITE_AUTH_LOGIN_URL` | `/login` | Plain Text |
| *(opcional)* `VITE_BASE44_APP_ID` | *(seu app id)* | Plain Text |

> **Importante**: Variáveis VITE_ são expostas ao navegador. Não coloque segredos aqui (JWT_SECRET, senhas de DB, etc).

### 4. Deploy

Clique **Deploy**. A Vercel vai:
1. Instalar dependências (`npm ci`)
2. Build do frontend (`npm run build`)
3. Servir estático da pasta `dist`

---

## 🔗 Integração Backend ⇄ Frontend

### Backend (Render)

No painel do Render, em **Environment Variables**, certifique-se de ter:

```env
FRONTEND_URL=https://seu-frontend.vercel.app
# ou, se usar domínio custom:
# FRONTEND_URL=https://erp.base44.com
```

Isso permite que o backend aceite requisições CORS do frontend.

---

## 🔄 Workflow de atualização

- **Frontend**: commit na branch principal → Vercel auto-deploy
- **Backend**: commit na branch principal → Render auto-deploy

---

## 🧪 Teste após deploy

1. Acesse `https://seu-frontend.vercel.app`
2. Faça login com `master@base44.com` / (senha definida no seed)
3. Verifique se as APIs respondem:
   - `/health` do backend: https://erp-backend-iwvv.onrender.com/health
   - Frontend deve carregar dados

---

## ⚠️ Troubleshooting

### Erro CORS
Se o frontend bloquear requisições:
- Verifique `FRONTEND_URL` no Render
- Certifique-se de que a URL está exata (com https, sem trailing slash)

### Build falha
- `npm ci` pode variar — use `npm install` se necessario
- Verifique Node.js version no Render (20+ recomendado)

### API retorna 404
- Confirme que `VITE_BACKEND_URL` está correta
- Frontend faz fetch para `${VITE_BACKEND_URL}/api/...`

---

## 📁 Estrutura do projeto

```
ERPCOZERP/
├── backend/          # Node.js API (Render)
│   ├── src/
│   └── package.json
├── src/              # React frontend (Vercel)
├── index.html
├── vite.config.js
├── vercel.json       # Config Vercel
└── package.json      # Root (frontend)
```

---

## 🎯 Status atual

- ✅ Backend no Render: online
- ✅ Banco TiDB: conectado
- ✅ Frontend configurado para Vercel
- ✅ VITE_BACKEND_URL aponta para Render
- ✅ CORS configurado no backend

**Pronto para deploy na Vercel!**
