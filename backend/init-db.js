const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

function splitSqlStatements(sql) {
  const statements = [];
  let buffer = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        buffer += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === '-' && next === '-' && (index === 0 || /\s/.test(sql[index - 1]))) {
        inLineComment = true;
        index += 1;
        continue;
      }

      if (char === '/' && next === '*') {
        inBlockComment = true;
        index += 1;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      buffer += char;
      if (inSingleQuote && next === "'") {
        buffer += next;
        index += 1;
      } else {
        inSingleQuote = !inSingleQuote;
      }
      continue;
    }

    if (char === '"' && !inSingleQuote && !inBacktick) {
      buffer += char;
      if (inDoubleQuote && next === '"') {
        buffer += next;
        index += 1;
      } else {
        inDoubleQuote = !inDoubleQuote;
      }
      continue;
    }

    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      buffer += char;
      if (inBacktick && next === '`') {
        buffer += next;
        index += 1;
      } else {
        inBacktick = !inBacktick;
      }
      continue;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const statement = buffer.trim();
      if (statement) {
        statements.push(statement);
      }
      buffer = '';
      continue;
    }

    buffer += char;
  }

  const tail = buffer.trim();
  if (tail) {
    statements.push(tail);
  }

  return statements;
}

function isDuplicateTableError(error) {
  const message = String(error?.message || '');
  return error?.code === 'ER_TABLE_EXISTS_ERROR' || /duplicate table|already exists/i.test(message);
}

async function initDatabase() {
  console.log('Initializing database...');
  
  // Run migrations
  const migrationsDir = path.join(__dirname, 'src/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of migrationFiles) {
    console.log('Running migration:', file);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = splitSqlStatements(sql);
    for (const stmt of statements) {
      try {
        await db.query(stmt + ';');
      } catch (e) {
        if (isDuplicateTableError(e)) {
          console.warn('Migration statement skipped because the table already exists:', stmt);
          continue;
        }

        console.error('Migration statement failed:', stmt, e);
      }
    }
  }
  
  // Run seed
  console.log('Running seed...');
  const seedFile = fs.readFileSync(path.join(__dirname, 'src/seed/seed-complete.sql'), 'utf8');
  const seedStatements = splitSqlStatements(seedFile);
  for (const stmt of seedStatements) {
    try {
      await db.query(stmt + ';');
    } catch (e) {
      console.warn('seed statement failed:', stmt, e);
    }
  }
  
  console.log('Database setup complete!');
}

initDatabase().catch(console.error);
