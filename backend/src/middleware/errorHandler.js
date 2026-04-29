const { AuditLogger } = require('../services/auditLogger');

/**
 * Middleware de erro centralizado
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);

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
    ).catch(console.error);
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
