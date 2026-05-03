import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function requiredInProd(name: string): string {
  const v = process.env[name];
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production' && !v) throw new Error(`Missing env var in production: ${name}`);
  return v || '';
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: requiredInProd('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SEED_ENABLED: process.env.SEED_ENABLED === 'true',
};

