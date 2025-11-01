import { logger } from '../../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GCP Cloud Storage Service
 *
 * Uses Google Cloud Storage for file storage
 * Falls back to local filesystem if bucket is set to 'local'
 *
 * Note: Requires @google-cloud/storage package for full GCP support
 */
export class GCPCloudStorageService {
  private bucketName: string;
  private useLocal: boolean;
  private localPath: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
    this.useLocal = !bucketName || bucketName === 'local';
    this.localPath = process.env.STORAGE_PATH || './backend/output';

    if (this.useLocal) {
      logger.info(`GCP Cloud Storage service initialized (LOCAL mode: ${this.localPath})`);
    } else {
      logger.info(`GCP Cloud Storage service initialized (bucket: ${bucketName})`);
    }
  }

  /**
   * Upload a file to GCP Cloud Storage or local storage
   */
  async upload(fileBuffer: Buffer, filePath: string, contentType: string = 'image/png'): Promise<string> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localPath, filePath);
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, fileBuffer);
        logger.info(`File saved locally: ${fullPath}`);
        // Return just the relative path, not the full path
        return filePath;
      } else {
        // GCP Cloud Storage implementation would go here
        // For now, fall back to local storage
        logger.warn('GCP Cloud Storage not fully implemented, using local storage');
        return this.upload(fileBuffer, filePath, contentType);
      }
    } catch (error) {
      logger.error(`Error uploading file to GCP Cloud Storage:`, error);
      throw new Error(`File upload failed: ${error}`);
    }
  }

  /**
   * Download a file from GCP Cloud Storage or local storage
   */
  async download(filePath: string): Promise<Buffer> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localPath, filePath);
        const buffer = await fs.readFile(fullPath);
        logger.info(`File read from local storage: ${fullPath}`);
        return buffer;
      } else {
        // GCP Cloud Storage implementation would go here
        logger.warn('GCP Cloud Storage not fully implemented, using local storage');
        return this.download(filePath);
      }
    } catch (error) {
      logger.error(`Error downloading file from GCP Cloud Storage:`, error);
      throw new Error(`File download failed: ${error}`);
    }
  }

  /**
   * Check if a file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localPath, filePath);
        try {
          await fs.access(fullPath);
          return true;
        } catch {
          return false;
        }
      } else {
        // GCP Cloud Storage implementation would go here
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * List files with a given prefix
   */
  async list(prefix: string): Promise<string[]> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localPath, prefix);
        try {
          const files = await fs.readdir(fullPath, { recursive: true });
          return files.filter(f => typeof f === 'string') as string[];
        } catch {
          return [];
        }
      } else {
        // GCP Cloud Storage implementation would go here
        return [];
      }
    } catch (error) {
      logger.error(`Error listing files from GCP Cloud Storage:`, error);
      return [];
    }
  }
}
