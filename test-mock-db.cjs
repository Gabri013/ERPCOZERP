// Testa o mock database diretamente
const db = require('./backend/src/config/mockDatabase');

async function test() {
  const sql = `
    SELECT 
      u.*,
      (SELECT JSON_ARRAYAGG(r.code) 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = u.id) as roles
    FROM users u
    WHERE u.email = ? AND u.active = TRUE
  `;
  const email = 'admin@erpcoz.local';
  const result = await db.query(sql, [email]);
  console.log('Query result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
