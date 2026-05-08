import { prisma } from './src/infra/prisma.js';

async function main() {
  const master = await prisma.user.findUnique({
    where: { email: 'master@Cozinha.com' },
    select: { 
      id: true,
      email: true, 
      fullName: true,
      active: true,
      passwordHash: true,
      roles: true
    },
  });
  
  console.log('Master user details:');
  console.log(JSON.stringify(master, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
