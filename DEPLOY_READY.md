# Deploy Vercel + Render

Este projeto esta preparado para:

- Frontend: Vercel
- Backend: Render
- Banco: MySQL ou MySQL compativel em plano gratis separado

## Importante Sobre Custo Zero

Para ficar R$0:

- Use Vercel Hobby no frontend.
- Use Render Free Web Service no backend.
- Use um banco MySQL/MySQL-compativel com free tier externo, como TiDB Cloud Serverless ou Aiven Free MySQL.

Render e Vercel nao fornecem MySQL gerenciado gratis dentro da propria plataforma. O banco precisa ser criado em outro provedor gratuito e conectado ao backend do Render pelas variaveis `MYSQL_*`.

Limites esperados no free:

- Render Free Web Service hiberna apos inatividade; o primeiro acesso pode demorar.
- O plano gratis nao e ideal para producao comercial com trafego alto.
- Vercel Hobby e indicado para projeto pessoal/hobby e tem limites de uso.

## Vercel

Configurar o projeto apontando para a raiz do repositorio.

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Variaveis:

```env
VITE_BACKEND_PROVIDER=api
VITE_AUTH_LOGIN_URL=/login
```

O arquivo `vercel.json` redireciona `/api/*` para:

```text
https://erp-backend.onrender.com/api/*
```

Se o servico no Render tiver outro nome/URL, atualizar `vercel.json`.

## Render

Usar o `render.yaml` na raiz do repositorio.

O servico usa:

- `rootDir: backend`
- `buildCommand: npm ci`
- `startCommand: npm run migrate && npm run seed && npm start`
- `healthCheckPath: /health`

Variaveis obrigatorias:

```env
NODE_ENV=production
DB_CLIENT=mysql
MYSQL_HOST=seu-host-mysql
MYSQL_PORT=3306
MYSQL_USER=seu-usuario
MYSQL_PASSWORD=sua-senha
MYSQL_DATABASE=erp
JWT_SECRET=troque-por-uma-chave-grande-e-secreta
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
FRONTEND_URL=https://seu-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
```

## Banco MySQL Gratis

Opcao recomendada para custo zero:

1. Criar um banco MySQL-compativel no TiDB Cloud Serverless ou Aiven Free MySQL.
2. Copiar host, porta, usuario, senha e database.
3. Colocar esses dados nas variaveis do Render:

```env
MYSQL_HOST=...
MYSQL_PORT=3306
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=...
```

O backend vai rodar automaticamente:

```bash
npm run migrate
npm run seed
```

Isso cria as tabelas e os usuarios iniciais.

## Primeiro Acesso

O seed cria os usuarios iniciais se eles ainda nao existirem:

```text
master@base44.com / master123
admin@base44.com / admin123
```

Trocar essas senhas imediatamente depois do primeiro login em producao.

## Validacao Local

Comandos usados para validar:

```bash
npm run build
cd backend && npm test -- --runInBand
```
