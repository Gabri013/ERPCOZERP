import bcrypt from 'bcryptjs';

const password = 'master123_dev';
const hash = '$2b$12$JbMahRr.43O84jtz9zpYKui556m9JLES4VbGF2SL6jA9A6bYxyhW.';

async function verify() {
  const match = await bcrypt.compare(password, hash);
  console.log('Password match:', match);
  
  // Generate a new hash to see what it would be
  const newHash = await bcrypt.hash(password, 12);
  console.log('New hash:', newHash);
  
  // Test that new hash works
  const newMatch = await bcrypt.compare(password, newHash);
  console.log('New hash match:', newMatch);
}

verify().catch(console.error).finally(() => process.exit(0));
