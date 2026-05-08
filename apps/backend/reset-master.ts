import { prisma } from './src/infra/prisma.js';
import bcrypt from 'bcryptjs';

async function resetMasterPassword() {
  const newPassword = 'master123_dev';
  const hash = await bcrypt.hash(newPassword, 12);
  
  const updated = await prisma.user.update({
    where: { email: 'master@Cozinha.com' },
    data: { 
      passwordHash: hash,
      active: true 
    },
    select: { 
      id: true,
      email: true, 
      fullName: true,
      active: true,
    },
  });
  
  console.log('Master user password reset:');
  console.log(JSON.stringify(updated, null, 2));
}

resetMasterPassword().catch(console.error).finally(() => process.exit(0));
