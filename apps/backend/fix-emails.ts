import { prisma } from './src/infra/prisma.js';

async function fixEmails() {
  console.log('Atualizando emails para minúsculo...\n');
  
  // Update master
  const master = await prisma.user.update({
    where: { id: 'b31bb2ef-e467-4078-aa29-bd4d3b7e69c5' },
    data: { email: 'master@cozinha.com' },
    select: { email: true, fullName: true },
  });
  
  console.log('✅ Master:', master.email);
  
  const others = await prisma.user.updateMany({
    where: {
      email: {
        contains: '@Cozinha.com'
      }
    },
    data: {}
  });
  
  console.log(`\n✅ Total de usuários com @Cozinha.com: ${others.count}`);
  
  // Listar todos
  const allUsers = await prisma.user.findMany({
    select: { email: true, fullName: true }
  });
  
  console.log('\n📧 Todos os emails:');
  allUsers.forEach(u => console.log(`   ${u.email} - ${u.fullName}`));
}

fixEmails().catch(console.error).finally(() => process.exit(0));
