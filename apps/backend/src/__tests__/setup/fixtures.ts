import { prisma } from '../../infra/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_jwt_secret_min_32_chars_change_in_prod';

export async function getOrCreateTestUser(role = 'gerente') {
  // Prefere usuários demo existentes
  const demoEmails: Record<string, string> = {
    gerente: 'gerente@cozinha.com',
    gerente_producao: 'gerente.producao@cozinha.com',
    financeiro: 'financeiro@cozinha.com',
    qualidade: 'qualidade@cozinha.com',
    expedicao: 'expedicao@cozinha.com',
  };

  const email = demoEmails[role] ?? `test.${role}@cozinca.test`;
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash('demo123_dev', 10);
    const dbRole = await prisma.role.findFirst({ where: { code: role } });
    user = await prisma.user.create({
      data: { email, fullName: `Teste ${role}`, passwordHash, active: true, emailVerified: true },
    });
    if (dbRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: dbRole.id } },
        update: {},
        create: { userId: user.id, roleId: dbRole.id },
      });
    }
  }
  return user;
}

export function generateTestToken(userId: string, email = 'test@cozinca.test', roles: string[] = ['gerente']) {
  return jwt.sign({ sub: userId, email, roles, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
}

export async function generateTokenForUser(user: { id: string; email: string }, role = 'gerente') {
  return generateTestToken(user.id, user.email, [role]);
}

export async function getAuthHeaders(role = 'gerente') {
  const user = await getOrCreateTestUser(role);
  // Inclui 'master' no JWT para bypassar requirePermission no middleware
  const token = generateTestToken(user.id, user.email, ['master', role]);
  return { Authorization: `Bearer ${token}` };
}

export async function cleanupTestUsers() {
  await prisma.user.deleteMany({ where: { email: { endsWith: '@cozinca.test' } } });
}
