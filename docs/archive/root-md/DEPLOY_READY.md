# 🚨 DEPLOY CANCELANDO SOZINHO — SOLUÇÃO IMEDIATA

## 🔴 CAUSA MAIS COMUM

A Vercel detectou **DOIS frameworks** no mesmo repo:
- `backend/` com Express
- `./` com Vite

Isso causa conflito — a Vercel tenta buildar ambos e falha.

---

## ✅ SOLUÇÃO PASSO-A-PASSO

### 1. Crie `.vercel/project.json` para FORçar frontend-only

```bash
mkdir -p .vercel
```

Crie `.vercel/project.json`:

```json
{
  "framework": "vite",
  "output": "dist",
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
```

---

### 2. **Apague** a configuração de `backend/` da Vercel

No dashboard Vercel:
1. Vá em **Project Settings → Git**
2. Em **"Ignored Build Step"**, adicione:
   ```
   test -d backend && echo "Backend exists — skipping" || exit 0
   ```
3. OU simplesmente **delete** o projeto atual e recrie APENAS com o frontend

---

### 3. Re-crie o projeto do ZERO (mais seguro)

**Passo a passo limpo**:

1. **Delete** o projeto atual na Vercel (ou cancele e espere)
2. Clique **"New Project"**
3. Importe do GitHub: `Gabri013/ERPCOZERP`
4. **IMPORTANTE**: Na tela de configuração:

```
Root Directory: ./
Framework: Vite (auto-detect)
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

5. **NÃO** adicione outro projeto para `backend/`
6. Clique **Deploy**

---

### 4. Variáveis de ambiente (IMPORTANTE)

Após criar, vá em **Settings → Environment Variables** e adicione **APENAS**:

| Key | Value |
|-----|-------|
| `VITE_BACKEND_PROVIDER` | `api` |
| `VITE_BACKEND_URL` | `https://erp-backend-iwvv.onrender.com` |
| `VITE_AUTH_LOGIN_URL` | `/login` |

---

### 5. Se ainda falhar, use este `vercel.json` **simplificado**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://erp-backend-iwvv.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

Substitua seu `vercel.json` por isso.

---

## 🧪 TESTE LOCAL ANTES

Na raiz do projeto:

```bash
# Limpa
rm -rf node_modules dist

# Instala só frontend
npm ci

# Build
npm run build

# Deve criar dist/ com index.html
ls dist
```

Se funcionar local, funciona na Vercel.

---

## 📋 CHECKLIST RÁPIDO

- [ ] `.vercelignore` existe (ignora backend/)
- [ ] `vercel.json` está na raiz
- [ ] `package.json` tem script `build` → `vite build`
- [ ] `vite.config.js` existe e está correto
- [ ] Root Directory = `./` (NÃO `backend/`)
- [ ] Apenas UM projeto na Vercel (o frontend)
- [ ] Backend já está no Render (separado)

---

## 🎯 EXPECTATIVA

Após deploy, URL deve ser: `https://erpcozerp.vercel.app`

E ao acessar, deve carregar o frontend e conectar ao backend no Render.

---

**Faça os passos acima e me avise o resultado.**
