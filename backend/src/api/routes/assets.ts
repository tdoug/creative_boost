import { Router, Request, Response } from 'express';
import { createCloudProviderFromEnv } from '../../services/cloud';
import { logger } from '../../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';

const router = Router();
const cloudProvider = createCloudProviderFromEnv();

/**
 * GET /api/assets
 * List all assets across all campaigns
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Listing all assets');

    // List all files in the storage
    const allFiles = await cloudProvider.list('');

    // Filter for image files and parse metadata
    const assets = allFiles
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .map(file => {
        // Parse path: campaign-id/product-id/aspectRatio_timestamp.png
        const parts = file.split('/');
        if (parts.length >= 3) {
          const campaignId = parts[0];
          const productId = parts[1];
          const filename = parts[2];

          // Extract aspect ratio from filename (e.g., "1x1_123456.png" -> "1:1")
          const aspectRatioMatch = filename.match(/^(\d+)x(\d+)_/);
          const aspectRatio = aspectRatioMatch ? `${aspectRatioMatch[1]}:${aspectRatioMatch[2]}` : 'unknown';

          // Get dimensions based on aspect ratio
          const dimensions = aspectRatio === '1:1' ? { width: 1080, height: 1080 } :
                           aspectRatio === '9:16' ? { width: 1080, height: 1920 } :
                           aspectRatio === '16:9' ? { width: 1920, height: 1080 } :
                           { width: 1080, height: 1080 };

          // Format product name (e.g., "prod-1" -> "Product 1")
          const productName = productId.replace('prod-', 'Product ');

          return {
            productId,
            productName,
            aspectRatio,
            path: file,
            metadata: {
              generatedAt: new Date().toISOString(),
              aspectRatio,
              dimensions
            }
          };
        }
        return null;
      })
      .filter(asset => asset !== null);

    res.json({ assets });
  } catch (error) {
    logger.error('Error listing all assets:', error);
    res.status(500).json({
      error: 'Failed to list assets',
      details: String(error)
    });
  }
});

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

    // Check if file exists
    const exists = await cloudProvider.exists(filePath);
    if (!exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // For local storage, serve directly from disk for better performance
    const storagePath = process.env.STORAGE_PATH || './output';
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
