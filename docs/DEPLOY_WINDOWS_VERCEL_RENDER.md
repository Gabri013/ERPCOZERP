# Deploy prático (Windows) — Frontend Vercel + Backend Render

## 1. Frontend no Vercel

1. Importar repositório no Vercel.
2. Root Directory: `apps/frontend`.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Definir variável:
   - `VITE_BACKEND_URL=https://SEU-BACKEND.onrender.com`

Arquivo de suporte: `apps/frontend/vercel.json`.

## 2. Backend no Render

1. Conectar repositório no Render.
2. Criar **Web Service** Node.
3. O Render pode usar automaticamente `render.yaml` da raiz.
4. Configurar variáveis obrigatórias:
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS=https://SEU-FRONTEND.vercel.app`
5. Opcional recomendado:
   - `REDIS_URL`

Arquivo de suporte: `render.yaml`.

## 3. Pós-deploy (checklist)

- [ ] Backend responde `GET /health` com 200.
- [ ] Login funciona no frontend hospedado.
- [ ] CORS aceita domínio do Vercel.
- [ ] Socket.IO conecta sem erro de CORS/JWT.
- [ ] `npm run preflight:enterprise` e `npm run test:production:full` rodaram no ambiente de validação.

## 4. Comandos úteis no Windows (PowerShell)

```powershell
npm run preflight:enterprise
npm run test:production:full
```
