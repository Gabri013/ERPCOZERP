const { query } = require('./config/database');
const bcrypt = require('bcrypt');

async function fixPassword() {
  const newPassword = 'master123_dev';
  const hash = await bcrypt.hash(newPassword, 12);
  console.log('New hash:', hash);
  
  await query(
    "UPDATE users SET password_hash = ? WHERE email = 'master@base44.com'",
    [hash]
  );
  
  console.log('Password updated');
  process.exit(0);
}

fixPassword().catch(err => {
  console.error(err);
  process.exit(1);
});