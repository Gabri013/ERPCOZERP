import { prisma } from './src/infra/prisma.js';
import bcrypt from 'bcryptjs';

async function debugMaster() {
  const email = 'master@Cozinha.com';
  const password = 'demo123_dev';
  
  console.log('\n🔍 Testando login do master...\n');
  
  // 1. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });
  
  if (!user) {
    console.log('❌ Usuário NÃO encontrado');
    process.exit(1);
  }
  
  console.log('✅ Usuário encontrado:', { email: user.email, fullName: user.fullName });
  console.log('   Active:', user.active);
  console.log('   EmailVerified:', user.emailVerified);
  console.log('   Roles:', user.roles.map(r => r.role.code));
  
  // 2. Verificar senha
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  console.log('\n✅ Senha válida:', passwordMatch);
  
  if (!passwordMatch) {
    console.log('❌ Senha NÃO corresponde ao hash!');
    process.exit(1);
  }
  
  // 3. Checks
  if (!user.active) {
    console.log('❌ Usuário NÃO está ativo');
    process.exit(1);
  }
  
  console.log('\n✅ Todos os checks passaram!');
  console.log('   O usuário DEVERIA conseguir fazer login');
}

debugMaster().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}).finally(() => process.exit(0));
