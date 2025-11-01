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
  productDescription: string,
  includeText: boolean = false
): string {
  // Concise professional advertisement prompt (max 512 chars for Amazon Titan)
  const maxLength = 512;

  // Build prompt with quality keywords
  let prompt = `Award-winning premium advertisement photography, luxury commercial editorial. Professional product: ${productName}. ${productDescription}. Clean studio background, impeccable lighting, photorealistic, ultra-sharp, 8k, professional grading, cinematic, premium showcase.`;

  // Add text requirement if requested (for AI models that support text rendering)
  if (includeText && brief.message) {
    prompt = `${prompt} Include bold Helvetica text overlay at bottom saying: "${brief.message}"`;
  }

  // Truncate if needed while preserving quality keywords
  if (prompt.length > maxLength) {
    const prefix = `Premium advertisement photography. Professional product: ${productName}. ${productDescription}`;
    const textPart = includeText && brief.message ? `. Bold text: "${brief.message}"` : '';
    const suffix = `${textPart}. Studio lighting, photorealistic, 8k, cinematic.`;
    const availableLength = maxLength - suffix.length;

    if (prefix.length > availableLength) {
      prompt = prefix.substring(0, availableLength) + suffix;
    } else {
      prompt = prefix + suffix;
    }
  }

  return prompt.trim();
}

/**
 * Generate negative prompt for better image quality
 */
export function generateNegativePrompt(): string {
  return 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, amateur, unprofessional, poor lighting, oversaturated, undersaturated, grainy, pixelated, artifacts, cluttered, messy background, low resolution, poor composition, cheap-looking, stock photo aesthetic';
}
