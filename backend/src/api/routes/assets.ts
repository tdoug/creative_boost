import { Router, Request, Response } from 'express';
import { createCloudProviderFromEnv } from '../../services/cloud';
import { logger } from '../../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';

const router = Router();
const cloudProvider = createCloudProviderFromEnv();

/**
 * GET /api/assets/:campaignId
 * List all assets for a campaign
 */
router.get('/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    logger.info(`Listing assets for campaign: ${campaignId}`);

    const files = await cloudProvider.list(campaignId);

    const assets = files.map(file => ({
      path: file,
      url: `/api/assets/file/${encodeURIComponent(file)}`
    }));

    res.json({ assets });
  } catch (error) {
    logger.error('Error listing assets:', error);
    res.status(500).json({
      error: 'Failed to list assets',
      details: String(error)
    });
  }
});

/**
 * GET /api/assets/file/:filePath
 * Serve a specific asset file
 */
router.get('/file/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0];
    logger.info(`Serving asset: ${filePath}`);

    // Check if file exists
    const exists = await cloudProvider.exists(filePath);
    if (!exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // For local storage, serve directly from disk for better performance
    const storagePath = process.env.STORAGE_PATH || './backend/output';
    if (process.env.AWS_S3_BUCKET === 'local' ||
        process.env.AZURE_STORAGE_CONTAINER === 'local' ||
        process.env.GCP_BUCKET === 'local') {
      const fullPath = path.join(storagePath, filePath);
      res.sendFile(path.resolve(fullPath));
    } else {
      // For cloud storage, download and serve
      const buffer = await cloudProvider.download(filePath);
      res.contentType('image/png');
      res.send(buffer);
    }
  } catch (error) {
    logger.error('Error serving asset:', error);
    res.status(404).json({
      error: 'Asset not found',
      details: String(error)
    });
  }
});

export default router;
