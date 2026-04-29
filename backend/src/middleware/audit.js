const { AuditLogger } = require('../services/auditLogger');

/**
 * Middleware de auditoria — loga todas as requisições
 */
const auditMiddleware = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    
    try {
      const userId = req.user?.id || null;
      const endpoint = req.originalUrl || req.url;
      const method = req.method;
      const statusCode = res.statusCode;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Só loga se não for health check
      if (endpoint !== '/health') {
        await AuditLogger.logApiRequest(
          userId,
          endpoint,
          method,
          statusCode,
          ip,
          userAgent,
          duration,
          req.body ? JSON.stringify(req.body).substring(0, 500) : null
        );
      }
    } catch (err) {
      console.error('Erro ao logar auditoria:', err.message);
    }
  });
  
  next();
};

module.exports = { auditMiddleware };
