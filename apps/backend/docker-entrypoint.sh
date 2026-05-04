#!/bin/sh
set -e

echo "> Running database migrations (prisma migrate deploy)"
npx prisma migrate deploy

echo "> Generating Prisma client"
npx prisma generate || true

if [ "$SEED_ENABLED" = "true" ]; then
  echo "> SEED_ENABLED=true — running seed script"
  npm run prisma:seed
fi

echo "> Starting application"
exec npm start
