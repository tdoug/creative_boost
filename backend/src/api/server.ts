import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import campaignRoutes, { setWebSocket, removeWebSocket } from './routes/campaigns';
import assetsRoutes from './routes/assets';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
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
