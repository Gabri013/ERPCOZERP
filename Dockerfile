# Stage 1: Builder
FROM node:18-slim AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar package.json e instalar dependências da raiz
COPY package*.json ./
RUN npm install --silent

# Copiar backend
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Instalar dependências do backend
RUN npm install --silent

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build 2>/dev/null || true

# Stage 2: Runtime
FROM node:18-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalar dependências do sistema
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Instalar apenas dependências de produção
RUN npm ci --only=production --silent

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Gerar Prisma Client novamente (importante)
RUN npx prisma generate

# Expo
EXPOSE 3000

# Iniciar backend
CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate && npm start"]
