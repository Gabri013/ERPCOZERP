# Dockerfile para frontend (build produção)
FROM node:18-alpine
WORKDIR /app
# Instala dependências e construtor
RUN npm ci --silent
# Copia o projeto para ô unico
COPY . .
# Limpa a pasta dist.
rm -rf dist
# Build da aplicação
npm run build
# Expose a porta 5173
EXPOSE 5173
# Servir o front end construído
CMD ["node","-r","webpack-dev-server"]