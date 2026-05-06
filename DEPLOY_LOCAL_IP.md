# Deploy Local com Acesso via IP

Este guia explica como fazer um deploy local da aplicação com acesso remoto via IP.

## 🎯 O Problema

Por padrão, aplicações locais escutam em **localhost (127.0.0.1)**, o que permite acesso apenas na própria máquina. Se você quiser que outras pessoas acessem sua aplicação compartilhando o IP, precisa de uma configuração especial.

## ✅ Solução Implementada

### Modificações Realizadas

1. **Backend** (`apps/backend/src/server.ts`):
   - Agora escuta em `0.0.0.0` ao invés de `localhost`
   - Isso permite aceitar conexões de qualquer IP

2. **Frontend** (`apps/frontend/vite.config.js`):
   - Já estava configurado com `host: true`
   - Funciona perfeitamente para acesso remoto

### Como Usar

#### Opção 1: Script Automático (Recomendado)

```powershell
.\deploy-local-with-ip.ps1
```

Este script vai:
- ✓ Verificar PostgreSQL e Redis
- ✓ Instalar dependências se necessário
- ✓ Executar migrações do banco
- ✓ **Mostrar seu IP local**
- ✓ Iniciar backend e frontend
- ✓ Fornecer URLs prontas para compartilhar

#### Opção 2: Manualmente

```powershell
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend  
cd apps/frontend
npm run dev
```

## 🌐 Como Acessar

### Localmente (sua máquina)
```
Frontend:  http://localhost:5173
Backend:   http://localhost:3001
```

### Remotamente (outro computador)
```
Frontend:  http://YOUR_IP:5173
Backend:   http://YOUR_IP:3001
```

**Exemplo:**
Se seu IP é `192.168.1.100`, compartilhe:
```
http://192.168.1.100:5173
```

## 🔒 Segurança

⚠️ **ATENÇÃO**: Ao compartilhar seu IP, você está expondo a aplicação na rede local. 

**Recomendações:**
- Use apenas em redes privadas confiáveis (WiFi pessoal)
- Não compartilhe em redes públicas
- Em produção, use autenticação forte
- Configure firewall se necessário

## 🐳 Alternativa: Docker

Se preferir containerizar, use:

```powershell
docker-compose up -d
```

Acesse:
```
http://localhost:5173     (local)
http://YOUR_IP:5173       (remoto)
```

## 📝 Requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm

## 🚀 Troubleshooting

### Erro: "PostgreSQL não encontrado"
- Instale: https://www.postgresql.org/download/windows/
- Crie o banco: `createdb -U postgres erpcoz`

### Erro: "Redis não acessível"
- Instale Redis: https://github.com/microsoftarchive/redis/releases
- Inicie: `redis-server`

### Erro: "Porta já em uso"
- `PORT=3002 npm run dev` (backend)
- `PORT=5174 npm run dev` (frontend)

### Não consigo acessar via IP
- Verifique se ambos na mesma rede
- Verifique firewall do Windows
- Teste: `ping YOUR_IP` de outro computador

## 📚 Mais Informações

- Backend docs: [README_LOCAL.md](../README_LOCAL.md)
- Dockerfile: [docker-compose.yml](../docker-compose.yml)
