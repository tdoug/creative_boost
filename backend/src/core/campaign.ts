import { CampaignBrief, CampaignBriefSchema } from '../types';
import { logger } from '../utils/logger';
import { sanitizeCampaignBrief, validateNoScriptInjection } from '../utils/sanitize';
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
    // Check for script injection attempts in critical fields
    const fieldsToCheck = [
      brief.message,
      brief.targetRegion,
      brief.targetAudience,
      ...(brief.products?.map((p: any) => p.name) || []),
      ...(brief.products?.map((p: any) => p.description) || [])
    ];

    for (const field of fieldsToCheck) {
      if (field && !validateNoScriptInjection(field)) {
        throw new Error('Potentially malicious content detected in campaign brief');
      }
    }

    // Validate schema
    const validated = CampaignBriefSchema.parse(brief);

    // Sanitize text fields to prevent XSS
    const sanitized = sanitizeCampaignBrief(validated);

    return sanitized;
  } catch (error) {
    logger.error('Campaign brief validation failed:', error);
    throw new Error(`Invalid campaign brief: ${error}`);
  }
}

/**
 * Convert hex color to descriptive color name for AI understanding
 */
function hexToColorName(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '').toLowerCase();

  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Determine hue and saturation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Check for grayscale
  if (diff < 30) {
    if (max < 50) return 'black';
    if (max < 100) return 'dark gray';
    if (max < 150) return 'gray';
    if (max < 200) return 'light gray';
    return 'white';
  }

  // Determine base hue
  let hue = '';
  if (r > g && r > b) {
    if (g > b + 30) hue = 'orange';
    else if (b > g + 30) hue = 'magenta';
    else hue = 'red';
  } else if (g > r && g > b) {
    if (r > b + 30) hue = 'yellow';
    else if (b > r + 30) hue = 'cyan';
    else hue = 'green';
  } else if (b > r && b > g) {
    if (r > g + 30) hue = 'purple';
    else if (g > r + 30) hue = 'teal';
    else hue = 'blue';
  }

  // Determine lightness/darkness
  const lightness = (max + min) / 2;
  const saturation = diff / max;

  let modifier = '';
  if (lightness < 80) modifier = 'dark ';
  else if (lightness > 200) modifier = 'light ';

  if (saturation < 0.3) modifier += 'muted ';
  else if (saturation > 0.8) modifier += 'vibrant ';

  return (modifier + hue).trim();
}

/**
 * Get style-specific prompt modifiers
 */
function getStyleModifiers(style: string): string {
  const styleMap: { [key: string]: string } = {
    'photorealistic': 'photorealistic, ultra-sharp, 8k, professional photography',
    'minimalist': 'minimalist design, clean lines, simple composition, negative space, modern aesthetic',
    'vintage': 'vintage style, retro aesthetic, aged look, nostalgic atmosphere, film grain',
    'modern': 'modern contemporary design, sleek, clean, sophisticated aesthetic',
    'luxury': 'luxury high-end aesthetic, premium materials, elegant, sophisticated, polished',
    'playful': 'playful cartoon style, bright colors, fun whimsical aesthetic, illustrated',
    'watercolor': 'watercolor painting style, soft flowing colors, artistic brushstrokes, painted texture',
    'oil-painting': 'oil painting style, rich colors, visible brushstrokes, classic art aesthetic',
    'sketch': 'hand-drawn sketch style, pencil drawing, artistic linework, illustration',
    'neon': 'neon cyberpunk aesthetic, glowing lights, futuristic, vibrant electric colors',
    'pastel': 'soft pastel colors, gentle tones, dreamy aesthetic, light and airy',
    'bold-graphic': 'bold graphic design, strong shapes, high contrast, vector style',
    'retro': 'retro 80s style, synthwave aesthetic, vintage futuristic, nostalgic',
    'art-deco': 'art deco style, geometric patterns, elegant 1920s aesthetic, ornate details',
    'pop-art': 'pop art style, bold colors, comic book aesthetic, Andy Warhol inspired'
  };

  return styleMap[style] || 'photorealistic, professional photography';
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

  // Get style modifiers if art style is enabled
  const styleModifiers = (brief.useArtStyle && brief.artStyle)
    ? getStyleModifiers(brief.artStyle)
    : 'photorealistic, ultra-sharp, 8k, professional grading';

  // Build brand color elements string with descriptive color names
  let brandElements = '';
  if (brief.brandAssets) {
    const { primaryColor, secondaryColor } = brief.brandAssets;

    if (primaryColor && secondaryColor) {
      const primaryName = hexToColorName(primaryColor);
      const secondaryName = hexToColorName(secondaryColor);
      brandElements += ` Dominant color scheme: ${primaryName} and ${secondaryName}. Product and background must feature ${primaryName} prominently with ${secondaryName} accents.`;
    } else if (primaryColor) {
      const primaryName = hexToColorName(primaryColor);
      brandElements += ` Color scheme: ${primaryName}. Product and background must prominently feature ${primaryName}.`;
    }
  }

  // Build prompt with quality keywords and style
  let prompt = `Award-winning premium advertisement, luxury commercial editorial. Professional product: ${productName}. ${productDescription}.${brandElements} Clean studio background, impeccable lighting, ${styleModifiers}, cinematic, premium showcase.`;

  // Add text requirement if requested (for AI models that support text rendering)
  // Otherwise, explicitly request no text
  if (includeText && brief.message) {
    prompt = `${prompt} Include bold Helvetica text overlay at bottom saying: "${brief.message}"`;
  } else {
    prompt = `${prompt} No text, no words, no letters in image.`;
  }

  // Truncate if needed while preserving quality keywords
  if (prompt.length > maxLength) {
    const prefix = `Premium advertisement. Professional product: ${productName}. ${productDescription}`;
    const textPart = includeText && brief.message ? `. Bold text: "${brief.message}"` : '. No text in image';
    const suffix = `${brandElements}${textPart}. Studio lighting, ${styleModifiers}, cinematic.`;
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
  return 'text, words, letters, writing, typography, captions, labels, signs, watermark, logo text, blurry, low quality, distorted, deformed, ugly, bad anatomy, amateur, unprofessional, poor lighting, oversaturated, undersaturated, grainy, pixelated, artifacts, cluttered, messy background, low resolution, poor composition, cheap-looking, stock photo aesthetic';
}
