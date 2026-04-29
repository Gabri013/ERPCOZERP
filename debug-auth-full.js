const { query } = require('./src/config/database');

async function debugAuth() {
  const email = 'master@base44.com';
  
  const users = await query(`
    SELECT 
      u.*,
      (SELECT JSON_ARRAYAGG(r.code) 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = u.id) as roles
    FROM users u
    WHERE u.email = ? AND u.active = TRUE
  `, [email]);

  console.log('Users found:', users.length);
  if (users.length > 0) {
    const user = users[0];
    console.log('User:', { id: user.id, email: user.email, active: user.active });
    console.log('Roles raw:', user.roles);
    console.log('Roles type:', typeof user.roles);
    console.log('Password hash:', user.password_hash);
  }
}

debugAuth().catch(e => console.error(e));