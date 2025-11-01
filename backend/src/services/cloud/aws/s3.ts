import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { logger } from '../../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class S3StorageService {
  private client!: S3Client;
  private bucket: string;
  private useLocal: boolean;
  private localPath: string;

  constructor(region: string, bucket: string) {
    this.bucket = bucket;
    this.useLocal = !bucket; // Use local storage if bucket is empty/blank
    this.localPath = process.env.STORAGE_PATH || './output';

    if (this.useLocal) {
      logger.info(`Storage service initialized (LOCAL mode: ${this.localPath})`);
    } else {
      this.client = new S3Client({ region });
      logger.info(`S3 storage service initialized (bucket: ${bucket})`);
    }
  }

  /**
   * Upload a file to S3 or local storage
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
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: filePath,
          Body: fileBuffer,
          ContentType: contentType
        });

        await this.client.send(command);
        const url = `s3://${this.bucket}/${filePath}`;
        logger.info(`File uploaded to S3: ${url}`);
        return url;
      }
    } catch (error) {
      logger.error(`Error uploading file to ${this.useLocal ? 'local storage' : 'S3'}:`, error);
      throw new Error(`File upload failed: ${error}`);
    }
  }

  /**
   * Download a file from S3 or local storage
   */
  async download(filePath: string): Promise<Buffer> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localPath, filePath);
        const buffer = await fs.readFile(fullPath);
        return buffer;
      } else {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: filePath
        });

        const response = await this.client.send(command);
        const buffer = Buffer.from(await response.Body!.transformToByteArray());
        logger.info(`File downloaded from S3: ${filePath}`);
        return buffer;
      }
    } catch (error) {
      logger.error(`Error downloading file:`, error);
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
        const command = new HeadObjectCommand({
          Bucket: this.bucket,
          Key: filePath
        });

        await this.client.send(command);
        return true;
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
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix
        });

        const response = await this.client.send(command);
        return response.Contents?.map(obj => obj.Key!) || [];
      }
    } catch (error) {
      logger.error(`Error listing files:`, error);
      return [];
    }
  }
}
