import { logger } from '../../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Azure Blob Storage Service
 *
 * Uses Azure Blob Storage for file storage
 * Falls back to local filesystem if container is empty/blank
 *
 * Note: Requires @azure/storage-blob package for full Azure support
 */
export class AzureBlobStorageService {
  private accountName: string;
  private containerName: string;
  private useLocal: boolean;
  private localPath: string;

  constructor(accountName: string, containerName: string) {
    this.accountName = accountName;
    this.containerName = containerName;
    this.useLocal = !containerName; // Use local storage if container is empty/blank
    this.localPath = process.env.STORAGE_PATH || './backend/output';

    if (this.useLocal) {
      logger.info(`Azure Blob Storage service initialized (LOCAL mode: ${this.localPath})`);
    } else {
      logger.info(`Azure Blob Storage service initialized (container: ${containerName})`);
    }
  }

  /**
   * Upload a file to Azure Blob Storage or local storage
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
        // Azure Blob Storage implementation would go here
        // For now, fall back to local storage
        logger.warn('Azure Blob Storage not fully implemented, using local storage');
        return this.upload(fileBuffer, filePath, contentType);
      }
    } catch (error) {
      logger.error(`Error uploading file to Azure Blob Storage:`, error);
      throw new Error(`File upload failed: ${error}`);
    }
  }

  /**
   * Download a file from Azure Blob Storage or local storage
   */
  async download(filePath: string): Promise<Buffer> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localPath, filePath);
        const buffer = await fs.readFile(fullPath);
        return buffer;
      } else {
        // Azure Blob Storage implementation would go here
        logger.warn('Azure Blob Storage not fully implemented, using local storage');
        return this.download(filePath);
      }
    } catch (error) {
      logger.error(`Error downloading file from Azure Blob Storage:`, error);
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
        // Azure Blob Storage implementation would go here
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
        // Azure Blob Storage implementation would go here
        return [];
      }
    } catch (error) {
      logger.error(`Error listing files from Azure Blob Storage:`, error);
      return [];
    }
  }
}
