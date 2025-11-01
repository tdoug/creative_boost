import { CloudProvider } from '../cloud-provider';
import { ImageGenerationOptions } from '../../../types';
import { BedrockService } from './bedrock';
import { S3StorageService } from './s3';
import { logger } from '../../../utils/logger';

/**
 * AWS Cloud Provider Implementation
 *
 * Uses:
 * - AWS Bedrock for AI/ML (Stable Diffusion XL, Claude)
 * - AWS S3 for storage (or local filesystem fallback)
 */
export class AWSProvider implements CloudProvider {
  readonly name = 'aws' as const;
  readonly region: string;

  private bedrock: BedrockService;
  private storage: S3StorageService;

  constructor(region: string, config: {
    bedrockModelId: string;
    bedrockLlmModelId: string;
    s3Bucket: string;
  }) {
    this.region = region;
    this.bedrock = new BedrockService(region, config.bedrockModelId, config.bedrockLlmModelId);
    this.storage = new S3StorageService(region, config.s3Bucket);

    logger.info(`AWS Provider initialized (region: ${region})`);
  }

  // AI/ML Capabilities
  async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
    return this.bedrock.generateImage(options);
  }

  async generateText(prompt: string): Promise<string> {
    return this.bedrock.generateText(prompt);
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    return this.bedrock.analyzeImage(imageBuffer, prompt);
  }

  // Storage Capabilities
  async upload(fileBuffer: Buffer, filePath: string, contentType: string = 'image/png'): Promise<string> {
    return this.storage.upload(fileBuffer, filePath, contentType);
  }

  async download(filePath: string): Promise<Buffer> {
    return this.storage.download(filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    return this.storage.exists(filePath);
  }

  async list(prefix: string): Promise<string[]> {
    return this.storage.list(prefix);
  }
}
