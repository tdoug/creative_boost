import sharp from 'sharp';
import { TextOverlayOptions } from '../types';
import { logger } from './logger';

/**
 * Professional advertising fonts pool
 * These are the most commonly used typefaces in premium advertising
 */
const PROFESSIONAL_FONTS = [
  // Sans-serif - Modern, clean
  "'Helvetica Neue', Helvetica, Arial, sans-serif",
  "Futura, 'Trebuchet MS', Arial, sans-serif",
  "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  "'Avenir Next', Avenir, 'Century Gothic', sans-serif",
  "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",

  // Serif - Classic, elegant
  "Garamond, 'Times New Roman', serif",
  "'Bodoni MT', Didot, 'Didot LT STD', serif",
  "Georgia, 'Times New Roman', serif",
  "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
  "'Baskerville', 'Baskerville Old Face', 'Hoefler Text', Garamond, serif"
];

/**
 * Text positions for variety in ad layouts
 */
const TEXT_POSITIONS = ['top', 'center', 'bottom'] as const;

/**
 * Professional background styles for text overlays
 * All maintain excellent readability while providing visual variety
 */
const BACKGROUND_STYLES = [
  // Dark backgrounds - classic, high contrast
  { bg: 'rgba(0, 0, 0, 0.65)', color: '#FFFFFF' },       // Semi-opaque black
  { bg: 'rgba(0, 0, 0, 0.50)', color: '#FFFFFF' },       // Medium black
  { bg: 'rgba(0, 0, 0, 0.75)', color: '#FFFFFF' },       // Strong black
  { bg: 'rgba(20, 20, 30, 0.70)', color: '#FFFFFF' },    // Dark charcoal

  // Light backgrounds - modern, airy
  { bg: 'rgba(255, 255, 255, 0.85)', color: '#000000' }, // Strong white
  { bg: 'rgba(255, 255, 255, 0.70)', color: '#1a1a1a' }, // Semi-opaque white
  { bg: 'rgba(250, 250, 250, 0.80)', color: '#222222' }, // Off-white

  // Colored backgrounds - brand-forward
  { bg: 'rgba(10, 10, 40, 0.75)', color: '#FFFFFF' },    // Deep navy
  { bg: 'rgba(60, 60, 80, 0.70)', color: '#FFFFFF' },    // Slate gray
  { bg: 'rgba(40, 40, 40, 0.80)', color: '#FFFFFF' }     // Charcoal
];

/**
 * Get a random professional font from the pool
 */
function getRandomFont(): string {
  return PROFESSIONAL_FONTS[Math.floor(Math.random() * PROFESSIONAL_FONTS.length)];
}

/**
 * Get a random text position
 */
function getRandomPosition(): 'top' | 'center' | 'bottom' {
  return TEXT_POSITIONS[Math.floor(Math.random() * TEXT_POSITIONS.length)];
}

/**
 * Get a random background style
 */
function getRandomBackgroundStyle(): { bg: string; color: string } {
  return BACKGROUND_STYLES[Math.floor(Math.random() * BACKGROUND_STYLES.length)];
}

/**
 * Resize an image to specified dimensions
 */
export async function resizeImage(
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  try {
    logger.info(`Resizing image to ${width}x${height}`);

    const resized = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();

    return resized;
  } catch (error) {
    logger.error('Error resizing image:', error);
    throw new Error(`Image resize failed: ${error}`);
  }
}

/**
 * Add text overlay to an image
 */
export async function addTextOverlay(
  imageBuffer: Buffer,
  options: TextOverlayOptions
): Promise<Buffer> {
  try {
    // Randomly select font, position, and background style
    const selectedFont = getRandomFont();
    const selectedPosition = options.position || getRandomPosition();
    const selectedBgStyle = getRandomBackgroundStyle();

    const {
      text,
      fontSize = 48,
      fontColor = selectedBgStyle.color,      // Use color from background style
      backgroundColor = selectedBgStyle.bg,   // Use background from style
      padding = 20,
      position = selectedPosition
    } = options;

    logger.info(`Adding text overlay: "${text}" | Font: ${selectedFont.split(',')[0]} | Position: ${position} | BG: ${backgroundColor}`);

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width!;
    const imageHeight = metadata.height!;

    // Calculate text box dimensions (approximately)
    const textWidth = imageWidth - (padding * 2);
    const textHeight = Math.ceil(fontSize * 1.5 * (text.length / (textWidth / fontSize)));
    const boxHeight = textHeight + (padding * 2);

    // Position calculation
    let yPosition = 0;
    if (position === 'bottom') {
      yPosition = imageHeight - boxHeight;
    } else if (position === 'center') {
      yPosition = Math.floor((imageHeight - boxHeight) / 2);
    } else if (position === 'top') {
      yPosition = 0;
    }

    // Create SVG overlay with randomly selected professional advertising typeface
    const svg = `
      <svg width="${imageWidth}" height="${imageHeight}">
        <defs>
          <style>
            .text {
              fill: ${fontColor};
              font-size: ${fontSize}px;
              font-family: ${selectedFont};
              font-weight: 700;
              text-anchor: middle;
              letter-spacing: 0.02em;
            }
          </style>
        </defs>
        <rect x="0" y="${yPosition}" width="${imageWidth}" height="${boxHeight}" fill="${backgroundColor}" />
        <text x="${imageWidth / 2}" y="${yPosition + boxHeight / 2 + fontSize / 3}" class="text">${escapeXml(text)}</text>
      </svg>
    `;

    const result = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    logger.info('Text overlay added successfully');
    return result;
  } catch (error) {
    logger.error('Error adding text overlay:', error);
    throw new Error(`Text overlay failed: ${error}`);
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a filename for an asset
 */
export function generateAssetFilename(
  campaignId: string,
  productId: string,
  aspectRatio: string,
  extension: string = 'png'
): string {
  const timestamp = Date.now();
  const sanitizedRatio = aspectRatio.replace(/:/g, 'x');
  return `${campaignId}/${productId}/${sanitizedRatio}_${timestamp}.${extension}`;
}
