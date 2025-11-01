import { Router, Request, Response } from 'express';
import { validateCampaignBrief } from '../../core/campaign';
import { CreativePipeline } from '../../core/pipeline';
import { logger } from '../../utils/logger';
import { CampaignBrief, ProgressEvent } from '../../types';
import { WebSocket } from 'ws';

const router = Router();

// Store active WebSocket connections by campaign ID
const activeConnections = new Map<string, WebSocket>();

export function setWebSocket(campaignId: string, ws: WebSocket) {
  activeConnections.set(campaignId, ws);
}

export function removeWebSocket(campaignId: string) {
  activeConnections.delete(campaignId);
}

/**
 * POST /api/campaigns/generate
 * Generate campaign assets
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    logger.info('Received campaign generation request');

    // Validate campaign brief
    const brief: CampaignBrief = validateCampaignBrief(req.body);

    // Set up progress callback to send via WebSocket
    const progressCallback = (event: ProgressEvent) => {
      const ws = activeConnections.get(brief.campaignId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    };

    // Execute pipeline asynchronously (uses cloud provider from environment)
    const pipeline = new CreativePipeline(undefined, progressCallback);

    // Start generation in background
    pipeline.execute(brief).catch(error => {
      logger.error('Pipeline execution error:', error);
      const ws = activeConnections.get(brief.campaignId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          campaignId: brief.campaignId,
          message: `Pipeline error: ${error}`,
          error: String(error)
        }));
      }
    });

    // Return immediately with accepted status
    res.status(202).json({
      message: 'Campaign generation started',
      campaignId: brief.campaignId
    });
  } catch (error) {
    logger.error('Error starting campaign generation:', error);
    res.status(400).json({
      error: 'Failed to start campaign generation',
      details: String(error)
    });
  }
});

/**
 * POST /api/campaigns/validate
 * Validate a campaign brief without generating
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const brief = validateCampaignBrief(req.body);
    res.json({
      valid: true,
      campaignId: brief.campaignId,
      productCount: brief.products.length
    });
  } catch (error) {
    res.status(400).json({
      valid: false,
      error: String(error)
    });
  }
});

export default router;
