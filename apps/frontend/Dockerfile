# Frontend — Vite build + nginx (context: apps/frontend)
FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY vite.config.js ./
RUN npm ci --silent

COPY index.html ./
COPY jsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY components.json ./

COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
