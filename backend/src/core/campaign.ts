import { CampaignBrief, CampaignBriefSchema } from '../types';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Load and validate a campaign brief from a file
 */
export async function loadCampaignBrief(filePath: string): Promise<CampaignBrief> {
  try {
    logger.info(`Loading campaign brief from: ${filePath}`);

    const content = await fs.readFile(filePath, 'utf-8');
    let brief: any;

    // Parse based on file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.json') {
      brief = JSON.parse(content);
    } else {
      // Default to JSON parsing
      brief = JSON.parse(content);
    }

    // Validate the brief
    const validated = CampaignBriefSchema.parse(brief);
    logger.info(`Campaign brief validated successfully: ${validated.campaignId}`);

    return validated;
  } catch (error) {
    logger.error('Error loading campaign brief:', error);
    throw new Error(`Failed to load campaign brief: ${error}`);
  }
}

/**
 * Validate a campaign brief object
 */
export function validateCampaignBrief(brief: any): CampaignBrief {
  try {
    return CampaignBriefSchema.parse(brief);
  } catch (error) {
    logger.error('Campaign brief validation failed:', error);
    throw new Error(`Invalid campaign brief: ${error}`);
  }
}

/**
 * Generate a prompt for image generation based on campaign brief
 */
export function generateImagePrompt(
  brief: CampaignBrief,
  productName: string,
  productDescription: string
): string {
  const prompt = `Professional product photography of ${productName}. ${productDescription}.
High quality commercial image for ${brief.targetRegion} market, targeting ${brief.targetAudience}.
Clean background, well-lit, studio quality, photorealistic, detailed, sharp focus, 8k resolution.`;

  return prompt.trim();
}

/**
 * Generate negative prompt for better image quality
 */
export function generateNegativePrompt(): string {
  return 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, signature, amateur';
}
