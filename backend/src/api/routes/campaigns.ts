import { Router, Request, Response } from 'express';
import multer from 'multer';
import { validateCampaignBrief } from '../../core/campaign';
import { CreativePipeline } from '../../core/pipeline';
import { logger } from '../../utils/logger';
import { CampaignBrief, ProgressEvent } from '../../types';
import { WebSocket } from 'ws';
import { createCloudProviderFromEnv } from '../../services/cloud';
import { generationLimiter, aiLimiter } from '../middleware/rate-limiter';
import { validateUploadedFile } from '../../utils/file-validator';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
router.post('/enhance-prompt', aiLimiter, async (req: Request, res: Response) => {
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
      error: 'Failed to enhance prompt'
    });
  }
});

/**
 * POST /api/campaigns/generate
 * Generate campaign assets
 * Accepts multipart/form-data with 'brief' (JSON) and optional 'logo' (image file)
 */
router.post('/generate', generationLimiter, upload.single('logo'), async (req: Request, res: Response) => {
  try {
    logger.info('Received campaign generation request');

    // Parse campaign brief from form data or JSON body
    let briefData = req.body.brief ? JSON.parse(req.body.brief) : req.body;

    // Validate campaign brief (this strips extra fields)
    const brief: CampaignBrief = validateCampaignBrief(briefData);

    // If logo file was uploaded, validate and add it AFTER validation
    // (Zod validation strips fields not in schema)
    if (req.file) {
      logger.info(`Logo uploaded: ${req.file.originalname} (${req.file.size} bytes)`);

      // Validate the uploaded file using magic number verification
      const fileValidation = validateUploadedFile(req.file.buffer, {
        maxSizeMB: 10,
        allowedTypes: ['png', 'jpeg', 'webp', 'gif']
      });

      if (!fileValidation.valid) {
        return res.status(400).json({
          error: 'Invalid logo file',
          details: fileValidation.error
        });
      }

      logger.info(`Logo file validated: type=${fileValidation.type}`);

      if (!brief.brandAssets) {
        (brief as any).brandAssets = {};
      }
      // Store the logo as a Buffer for now (will be uploaded to storage in pipeline)
      (brief.brandAssets as any).logoBuffer = req.file.buffer;
      (brief.brandAssets as any).logoFilename = req.file.originalname;
    }

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
    const response: any = {
      message: 'Campaign generation started',
      campaignId: brief.campaignId
    };

    // If logo was uploaded, include the path where it will be stored
    if (req.file) {
      response.logoPath = `logos/${brief.campaignId}-logo.png`;
    }

    res.status(202).json(response);
  } catch (error) {
    logger.error('Error starting campaign generation:', error);
    res.status(400).json({
      error: 'Failed to start campaign generation. Please check your campaign brief.'
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
