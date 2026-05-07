#!/bin/bash
# Script para configurar Let's Encrypt no nginx
# Execute no servidor de produção APÓS o deploy inicial

DOMAIN=${1:-"seu-dominio.com.br"}
EMAIL=${2:-"admin@seu-dominio.com.br"}

echo "🔒 Configurando SSL para $DOMAIN"

# Instala certbot se necessário
which certbot || apt-get install -y certbot python3-certbot-nginx

# Obtém certificado
certbot --nginx -d $DOMAIN -d www.$DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --non-interactive \
  --redirect

# Configura renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "✅ SSL configurado. Renovação automática ativada."