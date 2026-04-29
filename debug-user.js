const { query } = require('./src/config/database');

async function debug() {
  const users = await query(`
    SELECT 
      u.id, u.email, u.password_hash, u.active,
      (SELECT JSON_ARRAYAGG(r.code) 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = u.id) as roles
    FROM users u 
    WHERE u.email = 'master@base44.com' AND u.active = TRUE
  `);

  console.log('Query result:', JSON.stringify(users[0], null, 2));
  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});