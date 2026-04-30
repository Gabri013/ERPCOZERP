const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { AuthService } = require('./services/authService');
const logger = require('./services/logger');

// Rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const entityRoutes = require('./routes/entities');
const recordRoutes = require('./routes/records');
const workflowRoutes = require('./routes/workflows');
const rulesRoutes = require('./routes/rules');
const permissionsRoutes = require('./routes/permissions');
const auditRoutes = require('./routes/audit');
const configRoutes = require('./routes/config');
const productionRoutes = require('./routes/production');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const comprasRoutes = require('./routes/compras');
const financeiroRoutes = require('./routes/financeiro');
const rhRoutes = require('./routes/rh');
const fiscalRoutes = require('./routes/fiscal');
const estoqueRoutes = require('./routes/estoque');

// Middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { auditMiddleware } = require('./middleware/audit');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }
});

// Logger request middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    query: req.query,
  });
  next();
});

// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.VERCEL_FRONTEND_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'http://localhost:3000',
      /\.vercel\.app$/, // Any Vercel preview/production domain
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// MIDDLEWARES
// ============================================

app.use(auditMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'Base44 ERP API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/docs',
    health: '/health'
  });
});

// TEST: simplified login endpoint that bypasses body parser issues
app.post('/api/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const result = await require('./services/authService').AuthService.authenticate(email, password, '127.0.0.1', 'test');
    res.json(result);
  } catch (err) {
    console.error('Test login error:', err);
    res.status(401).json({ error: err.message });
   }
 });
 
 // Health check under /api (for nginx proxy)
 app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'Base44 ERP API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/docs',
    health: '/health'
  });
});

// DEBUG: echo endpoint
app.post('/api/debug/echo', (req, res) => {
  res.json({ body: req.body, headers: req.headers });
});

// ============================================
// ROTAS PÚBLICAS
// ============================================

app.use('/api/auth', authRoutes);

// ============================================
// ROTAS PROTEGIDAS
// ============================================

app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/entities', authenticateToken, entityRoutes);
app.use('/api/records', authenticateToken, recordRoutes);
app.use('/api/workflows', authenticateToken, workflowRoutes);
app.use('/api/rules', authenticateToken, rulesRoutes);
app.use('/api/permissions', authenticateToken, permissionsRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/config', authenticateToken, configRoutes);
app.use('/api/production', authenticateToken, productionRoutes);
app.use('/api/estoque', authenticateToken, estoqueRoutes);
app.use('/api/compras', authenticateToken, comprasRoutes);
app.use('/api/financeiro', authenticateToken, financeiroRoutes);
app.use('/api/rh', authenticateToken, rhRoutes);
app.use('/api/fiscal', authenticateToken, fiscalRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// ============================================
// WEBSOCKETS
// ============================================

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = await AuthService.verifyToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`User ${socket.user.userId} connected to WebSocket`);
  
  socket.join(`user:${socket.user.userId}`);
  socket.join(`role:${socket.user.roles?.join(',')}`);

  socket.on('disconnect', () => {
    logger.info(`User ${socket.user.userId} disconnected`);
  });

  socket.on('subscribe-workflow', (workflowId) => {
    socket.join(`workflow:${workflowId}`);
  });

  socket.on('subscribe-entity', (entityId) => {
    socket.join(`entity:${entityId}`);
  });
});

app.get('/socket.io/*', (req, res) => {
  res.status(200).send('OK');
});

// ============================================
// ERRO
// ============================================

app.use(errorHandler);

// ============================================
// INICIALIZAÇÃO
// ============================================

const PORT = process.env.PORT || 3001;

const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.EXTERNAL_URL || `http://localhost:${PORT}`;

server.listen(PORT, () => {
  logger.info(`Base44 ERP Backend rodando na porta ${PORT}`);
  logger.info(`API: ${BASE_URL}/api`);
  logger.info(`Health: ${BASE_URL}/health`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io, logger };
