# 🚀 DEPLOY NA VERCEL — GUIA DEFINITIVO

## 📍 IMPORTANTE: Frontend APENAS na Vercel

Este projeto é **monorepo**:
- `frontend/` (ou raiz) → Vercel
- `backend/` → Render (já está lá)

---

## 🔧 CONFIGURAÇÃO ATUAL

```
Root Directory: ./
Build Command: npm run build
Output: dist
Framework: Vite
```

---

## 🎯 PASSO A PASSO GARANTIDO

### 1. Prepare localmente

```bash
# Na raiz do projeto
git checkout main
git pull

# Limpa e instala
rm -rf node_modules dist
npm ci

# Testa build LOCAL
npm run build

# Deve criar pasta dist/ com index.html
ls dist  # 🆘 Se falhar aqui, não funciona na Vercel
```

Se `npm run build` falhar local, **não funciona na Vercel**. Me avise.

---

### 2. Deploy via CLI (recomendado)

```bash
# Instale a CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Primeiro deploy (produção)
vercel --prod
```

A CLI vai perguntar:
- **Set up and deploy?** → `Y`
- **Which scope?** → sua conta
- **Link to existing project?** → `N` (cria novo)
- **Project name?** → `erpcozerp-frontend` (ou outro)
- **Root Directory?** → `.` (ENTER)
- **Build command?** → `npm run build` (ENTER)
- **Output directory?** → `dist` (ENTER)

 Aguarde finalizar.

---

### 3. Variáveis de ambiente

Após deploy, vá no dashboard Vercel:

**Project → Settings → Environment Variables** → Add:

| Name | Value |
|------|--------|
| `VITE_BACKEND_PROVIDER` | `api` |
| `VITE_BACKEND_URL` | `https://erp-backend-iwvv.onrender.com` |
| `VITE_AUTH_LOGIN_URL` | `/login` |

**IMPORTANTE**: Adicione em **Production** (não apenas Preview).

---

### 4. Trigger novo deploy

Após adicionar variáveis, faça:

```bash
vercel --prod --force
```

---

## 🐛 SE O DEPLOY CANCELAR SOZINHO

### Causa: Build travando/timeout

**Solução**: Aumente timeout no `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "timeout": 300
      }
    }
  ],
  "routes": [...]
}
```

---

### Causa: Framework não detectado

Força com `@vercel/static-build` (já está no `vercel.json` acima).

---

### Causa: backend/ sendo considerado

Certifique-se de que `.vercelignore` contains:

```
backend/
node_modules/
```

E que **Root Directory** é `./` (não `backend/`).

---

## ✅ PÓS-DEPLOY

1. Acesse: `https://erpcozerp-frontend.vercel.app` (ou URL gerada)
2. Deve aparecer tela de login
3. Use credenciais do backend:
   - master@base44.com
   - (senha do seed)
4. Teste uma requisição API (ex: abrir lista de usuários)

---

## 🔄WORKFLOW FUTURO

Toda vez que fizer `git push` na main, a Vercel auto-deploy.

Para forçar:
```bash
vercel --prod --force
```

---

## 📞 SE AINDA FALHAR

Me envie:
1. Saída completa do `npm run build` local
2. Print do dashboard Vercel (tópico "Deployments")
3. Qual mensagem exata aparece?

Vou ajudar a debugar.
