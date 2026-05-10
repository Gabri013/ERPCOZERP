#!/usr/bin/env node
/**
 * Script de Backup Automatizado - ERPCOZERP
 * Faz backup do banco PostgreSQL e arquivos importantes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logger } = require('../src/infra/logger.js');

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupDatabase() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'erpcozerp';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbPassword) {
    throw new Error('DB_PASSWORD não definida no .env');
  }

  const backupFile = path.join(BACKUP_DIR, `db_backup_${TIMESTAMP}.sql`);

  const pgDumpCmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupFile}"`;

  // Definir senha via variável de ambiente
  const env = { ...process.env, PGPASSWORD: dbPassword };

  logger.info('Iniciando backup do banco de dados', { file: backupFile });

  try {
    execSync(pgDumpCmd, { env, stdio: 'inherit' });
    logger.info('Backup do banco concluído', { file: backupFile });
    return backupFile;
  } catch (error) {
    logger.error('Erro no backup do banco', { error: error.message });
    throw error;
  }
}

function backupFiles() {
  const filesToBackup = [
    'storage/nfe',
    'logs',
    'uploads'
  ];

  const backupFile = path.join(BACKUP_DIR, `files_backup_${TIMESTAMP}.tar.gz`);

  logger.info('Iniciando backup de arquivos', { file: backupFile });

  const dirs = filesToBackup.filter(dir => fs.existsSync(dir)).join(' ');

  if (!dirs) {
    logger.info('Nenhum diretório de arquivos para backup');
    return null;
  }

  const tarCmd = `tar -czf "${backupFile}" ${dirs}`;

  try {
    execSync(tarCmd, { stdio: 'inherit' });
    logger.info('Backup de arquivos concluído', { file: backupFile });
    return backupFile;
  } catch (error) {
    logger.error('Erro no backup de arquivos', { error: error.message });
    throw error;
  }
}

function cleanupOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql') || file.endsWith('.tar.gz'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  // Manter apenas os últimos 30 backups
  const toDelete = files.slice(30);

  toDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      logger.info('Backup antigo removido', { file: file.name });
    } catch (error) {
      logger.error('Erro ao remover backup antigo', { file: file.name, error: error.message });
    }
  });
}

async function main() {
  try {
    logger.info('=== INICIANDO BACKUP AUTOMATIZADO ===');

    ensureBackupDir();

    const dbBackup = backupDatabase();
    const filesBackup = backupFiles();

    cleanupOldBackups();

    logger.info('=== BACKUP CONCLUÍDO COM SUCESSO ===', {
      dbBackup,
      filesBackup,
      timestamp: TIMESTAMP
    });

  } catch (error) {
    logger.error('=== BACKUP FALHOU ===', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backupDatabase, backupFiles, cleanupOldBackups };