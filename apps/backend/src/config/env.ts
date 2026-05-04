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
  DATABASE_URL: optional('DATABASE_URL'),
  REDIS_URL: optional('REDIS_URL'),
  ALLOWED_ORIGINS: parseAllowedOrigins(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL),
  JWT_SECRET: requiredInProd('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SEED_ENABLED: process.env.SEED_ENABLED === 'true',
};

