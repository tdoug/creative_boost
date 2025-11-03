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
      error: 'Failed to list assets'
    });
  }
});

/**
 * Validate and sanitize file path to prevent path traversal attacks
 */
function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  // Reject paths with null bytes
  if (filePath.includes('\0')) {
    return { valid: false, error: 'Invalid file path' };
  }

  // Reject paths with path traversal sequences
  if (filePath.includes('..') || filePath.includes('./') || filePath.includes('.\\')) {
    return { valid: false, error: 'Invalid file path' };
  }

  // Reject absolute paths (should be relative to storage)
  if (path.isAbsolute(filePath)) {
    return { valid: false, error: 'Invalid file path' };
  }

  // Only allow alphanumeric, hyphens, underscores, dots, and forward slashes
  if (!/^[a-zA-Z0-9\-_./]+$/.test(filePath)) {
    return { valid: false, error: 'Invalid file path characters' };
  }

  // Ensure the path doesn't escape the storage directory
  const storagePath = process.env.STORAGE_PATH || './output';
  const normalizedPath = path.normalize(path.resolve(storagePath, filePath));
  const normalizedStorage = path.normalize(path.resolve(storagePath));

  if (!normalizedPath.startsWith(normalizedStorage)) {
    return { valid: false, error: 'Invalid file path' };
  }

  return { valid: true };
}

/**
 * GET /api/assets/file/:filePath
 * Serve a specific asset file
 * NOTE: This route MUST come BEFORE /:campaignId to prevent route conflicts
 */
router.get('/file/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0];

    // Validate and sanitize file path
    const validation = validateFilePath(filePath);
    if (!validation.valid) {
      logger.warn(`Invalid file path attempted: ${filePath}`);
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Check if file exists
    const exists = await cloudProvider.exists(filePath);
    if (!exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // For local storage, serve directly from disk for better performance
    const storagePath = process.env.STORAGE_PATH || './output';
    const useLocal = !process.env.AWS_S3_BUCKET &&
                     !process.env.AZURE_STORAGE_CONTAINER &&
                     !process.env.GCP_BUCKET;

    if (useLocal) {
      const fullPath = path.join(storagePath, filePath);
      const resolvedPath = path.resolve(fullPath);
      const resolvedStorage = path.resolve(storagePath);

      // Double-check the resolved path is within storage (defense in depth)
      if (!resolvedPath.startsWith(resolvedStorage)) {
        logger.error(`Path traversal attempt blocked: ${filePath}`);
        return res.status(400).json({ error: 'Invalid file path' });
      }

      res.sendFile(resolvedPath);
    } else {
      // For cloud storage, download and serve
      const buffer = await cloudProvider.download(filePath);
      res.contentType('image/png');
      res.send(buffer);
    }
  } catch (error) {
    logger.error('Error serving asset:', error);
    res.status(404).json({ error: 'Asset not found' });
  }
});

/**
 * GET /api/assets/:campaignId
 * List all assets for a campaign
 * NOTE: This route MUST come AFTER /file/* to prevent route conflicts
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
      error: 'Failed to list assets'
    });
  }
});

export default router;
