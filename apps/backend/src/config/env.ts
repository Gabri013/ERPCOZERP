import 'dotenv/config';

function requiredInProd(name: string): string {
  const v = process.env[name];
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production' && !v) throw new Error(`Missing env var in production: ${name}`);
  return v || '';
}

function optional(name: string): string {
  return process.env[name] || '';
}

function buildPostgresUrl(): string {
  const direct = optional('DATABASE_URL') || optional('POSTGRES_URL') || optional('DATABASE_PUBLIC_URL');
  if (direct) return direct;

  const host = optional('PGHOST') || optional('POSTGRES_HOST');
  const port = optional('PGPORT') || optional('POSTGRES_PORT') || '5432';
  const database = optional('PGDATABASE') || optional('POSTGRES_DB');
  const user = optional('PGUSER') || optional('POSTGRES_USER');
  const password = optional('PGPASSWORD') || optional('POSTGRES_PASSWORD');

  if (!host || !database || !user) return '';

  const auth = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
  return `postgresql://${auth}@${host}:${port}/${database}`;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const base = (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://erpcozerp.vercel.app',
    'https://erpcozerp-git-main-gabri013s-projects.vercel.app',
  ];

  return Array.from(new Set([...base, ...defaults]));
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: buildPostgresUrl(),
  REDIS_URL: optional('REDIS_URL'),
  ALLOWED_ORIGINS: parseAllowedOrigins(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL),
  JWT_SECRET: requiredInProd('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SEED_ENABLED: process.env.SEED_ENABLED === 'true',
};

if (env.DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}

