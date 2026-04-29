const { AuditLogger } = require('../services/auditLogger');
const logger = require('../services/logger');

/**
 * Middleware de erro centralizado
 */
const errorHandler = (err, req, res, next) => {
  logger.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id
  });

  // Status code default
  const statusCode = err.statusCode || 500;
  
  // Monta resposta segura
  const response = {
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Log do erro no sistema de auditoria
  if (req.user) {
    AuditLogger.logError(
      req.user.id,
      err.message,
      {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        ip: req.ip
      }
    ).catch(error => logger.error('Falha ao logar erro no AuditLogger:', error.message));
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
