import { prisma } from './src/infra/prisma.js';

async function fixMasterCompany() {
  console.log('🔍 Buscando ou criando empresa padrão...\n');
  
  // Buscar ou criar empresa padrão
  let company = await prisma.company.findFirst({
    where: { razaoSocial: 'COZINCA' }
  });
  
  if (!company) {
    console.log('❌ Empresa não encontrada. Criando...');
    company = await prisma.company.create({
      data: {
        cnpj: '00.000.000/0000-00',
        razaoSocial: 'COZINCA',
        fantasia: 'COZINCA ERP',
        ativo: true,
      },
      select: { id: true, razaoSocial: true }
    });
    console.log('✅ Empresa criada:', company.razaoSocial);
  } else {
    console.log('✅ Empresa encontrada:', company.razaoSocial);
  }
  
  // Atribuir empresa ao master
  const updated = await prisma.user.update({
    where: { email: 'master@cozinha.com' },
    data: { companyId: company.id },
    select: { 
      email: true,
      fullName: true,
      company: { select: { id: true, razaoSocial: true } }
    }
  });
  
  console.log('\n✅ Master atualizado:');
  console.log('   Email:', updated.email);
  console.log('   Nome:', updated.fullName);
  console.log('   Empresa:', updated.company?.razaoSocial);
}

fixMasterCompany().catch(console.error).finally(() => process.exit(0));
