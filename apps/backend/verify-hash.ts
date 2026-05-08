import bcrypt from 'bcryptjs';

const password = 'master123_dev';
const newHash = '$2b$12$13yIV2oG.NoRUtMGxgVrIeE4CudLUGLlZRGEjRuBN7dwbKFdHkKni';

async function verify() {
  const match = await bcrypt.compare(password, newHash);
  console.log('Password matches new hash:', match);
  
  if (!match) {
    console.log('\n❌ Hash não corresponde à senha!');
    console.log('Gerando nova senha corretamente...');
    const correctHash = await bcrypt.hash(password, 12);
    console.log('Novo hash:', correctHash);
  }
}

verify().catch(console.error).finally(() => process.exit(0));
