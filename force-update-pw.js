const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function forceUpdate() {
  const hash = await bcrypt.hash('master123_dev', 12);
  console.log('Generated hash:', hash);
  
  const pool = mysql.createPool({
    host: 'db',
    port: 3306,
    user: 'root',
    password: 'secret',
    database: 'erpcoz',
    waitForConnections: true,
    connectionLimit: 10
  });
  
  const [result] = await pool.query(
    "UPDATE users SET password_hash = ? WHERE email = 'master@base44.com'",
    [hash]
  );
  console.log('Rows affected:', result.affectedRows);
  pool.end();
  process.exit(0);
}

forceUpdate().catch(e => console.error(e));