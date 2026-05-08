import { prisma } from './src/infra/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'master' } },
        { email: { contains: 'Master' } },
      ],
    },
    select: { id: true, email: true, fullName: true },
  });
  
  console.log('Users with "master" in email:');
  console.log(JSON.stringify(users, null, 2));
  
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true },
  });
  
  console.log('\nAll users:');
  console.log(JSON.stringify(allUsers, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
