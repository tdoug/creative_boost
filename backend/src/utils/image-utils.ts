import sharp from 'sharp';
import { TextOverlayOptions } from '../types';
import { logger } from './logger';

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
    const {
      text,
      fontSize = 48,
      fontColor = '#FFFFFF',
      backgroundColor = 'rgba(0, 0, 0, 0.5)',
      padding = 20,
      position = 'bottom'
    } = options;

    logger.info(`Adding text overlay: "${text}"`);

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

    // Create SVG overlay
    const svg = `
      <svg width="${imageWidth}" height="${imageHeight}">
        <defs>
          <style>
            .text {
              fill: ${fontColor};
              font-size: ${fontSize}px;
              font-family: Arial, sans-serif;
              font-weight: bold;
              text-anchor: middle;
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
