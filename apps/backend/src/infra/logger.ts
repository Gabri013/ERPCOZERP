import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    });
  })
);

// Logger principal
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'erpcozerp-backend' },
  transports: [
    // Console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // Arquivo de erro
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Arquivo combinado
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),

    // Arquivo específico para auditoria
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 30,
    })
  ],
});

// Logger para requisições HTTP
export const httpLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 7,
    })
  ]
});

// Função helper para logs de auditoria
export function logAudit(action: string, userId?: string, details?: any) {
  logger.info('AUDIT', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
}

// Função helper para logs de erro
export function logError(error: Error, context?: any) {
  logger.error('ERROR', {
    message: error.message,
    stack: error.stack,
    context
  });
}

// Manter compatibilidade com funções antigas
const prod = process.env.NODE_ENV === 'production';

/** Log apenas em desenvolvimento (evita poluir stdout em produção). */
export function logDebug(message: string, meta?: unknown) {
  if (prod) return;
  logger.debug(message, meta);
}

export function logInfo(message: string, meta?: unknown) {
  if (prod) return;
  logger.info(message, meta);
}
