/**
 * Sincroniza emails/nomes/roles da equipa Cozinca e padroniza a senha.
 *
 * Uso: carrega `.env` da raiz do monorepo e `apps/backend/.env` (nesta ordem).
 *   npm run sync:cozinca-team
 *   cd apps/backend && npm run sync:cozinca-team
 *
 * Se `DATABASE_URL` estiver ausente e NODE_ENV !== 'production`, usa o padrão
 * local (Postgres em 127.0.0.1:5432, user/db erpcoz).
 *
 * Senha padrão: 123456 (ou COZINCA_SYNC_PASSWORD)
 *
 * Remove: admin2@sistema.com (pedido "EXCLUIR USUARIO")
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Raiz monorepo: apps/backend/scripts → ../../.. */
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

/** Defaults para Postgres local (mesmos valores sugeridos no README / `.env.example`). */
function resolveDatabaseUrl(): string {
  const explicit = process.env.DATABASE_URL?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === 'production') {
    console.error(
      'DATABASE_URL é obrigatória em production. Defina em `.env` na raiz ou em `apps/backend/.env`.'
    );
    process.exit(1);
  }

  const user = process.env.POSTGRES_USER || 'erpcoz';
  const password = process.env.POSTGRES_PASSWORD || 'erpcozpass';
  const db = process.env.POSTGRES_DB || 'erpcoz';
  const host = process.env.POSTGRES_HOST || '127.0.0.1';
  const port =
    process.env.POSTGRES_PUBLISH_PORT?.trim() ||
    process.env.POSTGRES_PORT?.trim() ||
    '5432';

  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  const masked = url.replace(/:[^:@]+@/, ':****@');
  // eslint-disable-next-line no-console
  console.warn(
    `[sync-cozinca-team] DATABASE_URL não definida; usando fallback de desenvolvimento (host):\n  ${masked}\n` +
      '  Copie `.env.example` → `.env` e defina DATABASE_URL se quiser outro banco.'
  );
  return url;
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

const DEFAULT_PASSWORD = process.env.COZINCA_SYNC_PASSWORD || '123456';

/** role = código em `roles.code` (deve existir após seed / migrate) */
const ENTRIES: Array<{ email: string; fullName: string; role: string }> = [
  { email: 'guilherme@cozinca.com.br', fullName: 'Guilherme Aguiar', role: 'master' },
  { email: 'paulinho@cozinca.com.br', fullName: 'Paulinho', role: 'corte_laser' },
  { email: 'marcos@cozinca.com.br', fullName: 'Marcos Antonio', role: 'gerente' },
  /** Conta genérica de painel — permissão mínima; ajuste no ERP se precisar de mais módulos */
  { email: 'dashboard@cozinca.com.br', fullName: 'Dashboard', role: 'user' },
  { email: 'andre@cozinca.com.br', fullName: 'Andre', role: 'dobra_montagem' },
  { email: 'pc@cozinca.com.br', fullName: 'Paulo Cesar', role: 'qualidade' },
  { email: 'finalizacao@cozinca.com.br', fullName: 'Finalizacao', role: 'expedicao' },
  { email: 'solda@cozinca.com.br', fullName: 'Solda', role: 'solda' },
  { email: 'dobra@cozinca.com.br', fullName: 'Dobra', role: 'dobra_montagem' },
  { email: 'corte@cozinca.com.br', fullName: 'Corte', role: 'corte_laser' },
  { email: 'nilton@cozinca.com.br', fullName: 'Nilton', role: 'orcamentista_vendas' },
  { email: 'projetista@cozinca.com.br', fullName: 'Projetista', role: 'projetista' },
  { email: 'camile@cozinca.com.br', fullName: 'Camile', role: 'orcamentista_vendas' },
  { email: 'jose@cozinca.com.br', fullName: 'Jose', role: 'gerente_producao' },
];

const EMAIL_TO_REMOVE = 'admin2@sistema.com';

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const row of ENTRIES) {
    const role = await prisma.role.findUnique({ where: { code: row.role } });
    if (!role) {
      throw new Error(`Role não encontrada no banco: "${row.role}". Rode o seed/migrations antes.`);
    }

    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {
        fullName: row.fullName,
        passwordHash: hash,
        active: true,
        emailVerified: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: row.email,
        fullName: row.fullName,
        passwordHash: hash,
        active: true,
        emailVerified: true,
      },
    });

    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });

    // eslint-disable-next-line no-console
    console.log(`OK ${row.email} → ${row.role}`);
  }

  const removed = await prisma.user.deleteMany({ where: { email: EMAIL_TO_REMOVE } });
  // eslint-disable-next-line no-console
  console.log(`Removidos (${EMAIL_TO_REMOVE}): ${removed.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
