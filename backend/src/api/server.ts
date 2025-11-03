import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import campaignRoutes, { setWebSocket, removeWebSocket } from './routes/campaigns';
import assetsRoutes from './routes/assets';
import complianceRoutes from './routes/compliance';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { generalLimiter } from './middleware/rate-limiter';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Request logging (skip asset file requests to reduce log noise)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/assets/file/')) {
    logger.info(`${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/compliance', complianceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const campaignId = url.searchParams.get('campaignId');

  if (campaignId) {
    logger.info(`WebSocket connected for campaign: ${campaignId}`);
    setWebSocket(campaignId, ws);

    ws.on('close', () => {
      logger.info(`WebSocket closed for campaign: ${campaignId}`);
      removeWebSocket(campaignId);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for campaign ${campaignId}:`, error);
    });
  } else {
    logger.warn('WebSocket connection without campaignId');
    ws.close();
  }
});

// Error handling - sanitized to prevent information leakage
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);

  // Don't expose detailed error messages in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isProduction ? {} : { details: err.stack })
  });
});

// Start server
const PORT = config.api.port;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📡 WebSocket available at ws://localhost:${PORT}/ws`);
  logger.info(`☁️  Cloud Provider: ${config.cloudProvider.toUpperCase()}`);
  logger.info(`💾 Storage: ${!config.aws.s3Bucket ? 'Local filesystem' : `S3 (${config.aws.s3Bucket})`}`);
});

export default app;
