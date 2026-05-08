import { prisma } from './src/infra/prisma.js';
import bcrypt from 'bcryptjs';

async function resetMaster() {
  // Use a mesma senha que o gerente que funciona
  const password = 'demo123_dev';
  const hash = await bcrypt.hash(password, 12);
  
  const updated = await prisma.user.update({
    where: { email: 'master@Cozinha.com' },
    data: { 
      passwordHash: hash,
      active: true,
      emailVerified: true 
    },
    select: { 
      id: true,
      email: true, 
      fullName: true,
      active: true,
      emailVerified: true,
    },
  });
  
  console.log('✅ Master user reset to demo123_dev:');
  console.log(JSON.stringify(updated, null, 2));
}

resetMaster().catch(console.error).finally(() => process.exit(0));
