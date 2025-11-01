import { Router, Request, Response } from 'express';
import { validateCampaignBrief } from '../../core/campaign';
import { CreativePipeline } from '../../core/pipeline';
import { logger } from '../../utils/logger';
import { CampaignBrief, ProgressEvent } from '../../types';
import { WebSocket } from 'ws';
import { createCloudProviderFromEnv } from '../../services/cloud';

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
 * POST /api/campaigns/enhance-prompt
 * Use AI to enhance campaign message for better targeting
 */
router.post('/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { message, targetRegion, targetAudience } = req.body;

    if (!message || !targetRegion || !targetAudience) {
      return res.status(400).json({
        error: 'Missing required fields: message, targetRegion, targetAudience'
      });
    }

    logger.info('Enhancing prompt with AI assistance');

    const cloudProvider = createCloudProviderFromEnv();

    const enhancementPrompt = `You are a cultural marketing expert. Enhance the following campaign message to better resonate with the target demographic and region.

Original Message: "${message}"
Target Region: ${targetRegion}
Target Demographic: ${targetAudience}

Provide an enhanced version that:
1. Incorporates culturally relevant themes and values for the region
2. Uses language that resonates with the demographic
3. Maintains the core message intent
4. Is concise and impactful (maximum 8 words)
5. Uses professional advertising language

IMPORTANT: Return ONLY the enhanced message text, nothing else. No explanations, no quotes, no preamble. Just the enhanced message.`;

    const enhancedMessage = await cloudProvider.generateText(enhancementPrompt);
    const trimmedMessage = enhancedMessage.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present

    logger.info(`Original: "${message}" -> Enhanced: "${trimmedMessage}"`);

    res.json({
      originalMessage: message,
      enhancedMessage: trimmedMessage
    });
  } catch (error) {
    logger.error('Error enhancing prompt:', error);
    res.status(500).json({
      error: 'Failed to enhance prompt',
      details: String(error)
    });
  }
});

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
