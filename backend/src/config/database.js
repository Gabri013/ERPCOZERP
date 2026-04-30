require('dotenv').config();
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'Cozinha-backend-db' },
  transports: [new winston.transports.Console()]
});

// Database wrapper: MySQL is the primary target for this ERP.
const DB_CLIENT = (process.env.DB_CLIENT || process.env.DB_TYPE || 'mysql').toLowerCase();

if (DB_CLIENT === 'mock' || DB_CLIENT === 'memory') {
  logger.info('Using in-memory mock database for development/testing');
  module.exports = require('./mockDatabase');

} else if (DB_CLIENT === 'sqlite') {
  const sql = require('sql.js');
  const fs = require('fs');
  const path = require('path');

  let db = null;
  const dbPath = process.env.DB_PATH || '/app/data/erpcoz.db';
  const dbDir = path.dirname(dbPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize SQLite in async context
  const initDB = async () => {
    const SQL = await sql();
    
    // Load existing DB or create new
    let data;
    try {
      data = fs.readFileSync(dbPath);
    } catch {
      data = null;
    }
    
    const database = new SQL.Database(data);
    return database;
  };

  module.exports = {
    query: async (sqlQuery, params = []) => {
      if (!db) db = await initDB();
      try {
        const stmt = db.prepare(sqlQuery);
        if (params.length > 0) {
          stmt.bind(params);
        }
        const result = [];
        while (stmt.step()) {
          result.push(stmt.getAsObject());
        }
        stmt.free();
        
        // Save to file
        const data = db.export();
        fs.writeFileSync(dbPath, data);
        
        return result;
      } catch (err) {
        logger.error('SQLite query error:', err);
        throw err;
      }
    },
    getClient: async () => {
      if (!db) db = await initDB();
      return {
        query: async (sqlQuery, params = []) => {
          const stmt = db.prepare(sqlQuery);
          if (params.length > 0) {
            stmt.bind(params);
          }
          const result = [];
          while (stmt.step()) {
            result.push(stmt.getAsObject());
          }
          stmt.free();
          return result;
        },
        beginTransaction: async () => db.run('BEGIN TRANSACTION'),
        commit: async () => db.run('COMMIT'),
        rollback: async () => db.run('ROLLBACK'),
        release: () => {},
      };
    },
    pool: null
  };

} else if (DB_CLIENT === 'mysql') {
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
    charset: 'utf8mb4',
    ssl: getMysqlSslConfig()
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
     logger.info('Conectado ao PostgreSQL');
   });

   pool.on('error', (err) => {
     logger.error('Erro na conexão PostgreSQL:', err.message);
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
