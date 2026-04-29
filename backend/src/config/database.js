require('dotenv').config();

// Database wrapper: MySQL is the primary target for this ERP.
const DB_CLIENT = (process.env.DB_CLIENT || 'mysql').toLowerCase();

if (DB_CLIENT === 'mysql') {
  const mysql = require('mysql2/promise');

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'erp',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    timezone: 'Z',
    charset: 'utf8mb4'
  });

  pool.on && pool.on('connection', () => {});

  module.exports = {
    query: async (sql, params) => {
      const [rows] = await pool.execute(sql, params);
      return rows;
    },
    getClient: async () => {
      const conn = await pool.getConnection();
      return {
        query: async (sql, params) => {
          const [rows] = await conn.execute(sql, params);
          return rows;
        },
        beginTransaction: async () => conn.beginTransaction(),
        commit: async () => conn.commit(),
        rollback: async () => conn.rollback(),
        release: () => conn.release(),
      };
    },
    pool
  };

} else {
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ Erro na conexão PostgreSQL:', err.message);
  });

  module.exports = {
    query: async (text, params) => {
      const res = await pool.query(text, params);
      return res.rows;
    },
    getClient: async () => {
      const conn = await pool.connect();
      return {
        query: async (text, params) => {
          const res = await conn.query(text, params);
          return res.rows;
        },
        beginTransaction: async () => conn.query('BEGIN'),
        commit: async () => conn.query('COMMIT'),
        rollback: async () => conn.query('ROLLBACK'),
        release: () => conn.release(),
      };
    },
    pool
  };
}
