import { logger } from './logger';

/**
 * File type signatures (magic numbers)
 * Used to verify actual file type regardless of extension
 */
const FILE_SIGNATURES = {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],

  // JPEG: FF D8 FF
  jpeg: [0xFF, 0xD8, 0xFF],

  // GIF: 47 49 46 38 (GIF8)
  gif: [0x47, 0x49, 0x46, 0x38],

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  webp: [0x52, 0x49, 0x46, 0x46],

  // BMP: 42 4D (BM)
  bmp: [0x42, 0x4D]
};

/**
 * Check if a buffer starts with a specific byte sequence
 */
function bufferStartsWith(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validate that a file is actually an image by checking its magic number
 * Returns the detected file type or null if not a valid image
 */
export function validateImageFile(buffer: Buffer): { valid: boolean; type?: string; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  // Check against known image signatures
  if (bufferStartsWith(buffer, FILE_SIGNATURES.png)) {
    return { valid: true, type: 'png' };
  }

  if (bufferStartsWith(buffer, FILE_SIGNATURES.jpeg)) {
    return { valid: true, type: 'jpeg' };
  }

  if (bufferStartsWith(buffer, FILE_SIGNATURES.gif)) {
    return { valid: true, type: 'gif' };
  }

  if (bufferStartsWith(buffer, FILE_SIGNATURES.webp)) {
    // WebP needs additional check at offset 8
    if (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { valid: true, type: 'webp' };
    }
  }

  if (bufferStartsWith(buffer, FILE_SIGNATURES.bmp)) {
    return { valid: true, type: 'bmp' };
  }

  return { valid: false, error: 'Not a valid image file' };
}

/**
 * Validate file size is within acceptable limits
 */
export function validateFileSize(buffer: Buffer, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation for uploads
 */
export function validateUploadedFile(buffer: Buffer, options: {
  maxSizeMB?: number;
  allowedTypes?: string[];
} = {}): { valid: boolean; type?: string; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['png', 'jpeg', 'gif', 'webp'] } = options;

  // Check file size
  const sizeCheck = validateFileSize(buffer, maxSizeMB);
  if (!sizeCheck.valid) {
    logger.warn(`File upload rejected: ${sizeCheck.error}`);
    return sizeCheck;
  }

  // Check file type by magic number
  const typeCheck = validateImageFile(buffer);
  if (!typeCheck.valid) {
    logger.warn(`File upload rejected: ${typeCheck.error}`);
    return typeCheck;
  }

  // Check if file type is allowed
  if (!allowedTypes.includes(typeCheck.type!)) {
    logger.warn(`File upload rejected: File type ${typeCheck.type} not allowed`);
    return {
      valid: false,
      error: `File type ${typeCheck.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  logger.info(`File upload validated: ${typeCheck.type}, ${(buffer.length / 1024).toFixed(2)} KB`);
  return { valid: true, type: typeCheck.type };
}
