import { CloudProvider } from '../cloud-provider';
import { ImageGenerationOptions } from '../../../types';
import { AzureOpenAIService } from './openai';
import { AzureBlobStorageService } from './blob-storage';
import { logger } from '../../../utils/logger';

/**
 * Azure Cloud Provider Implementation
 *
 * Uses:
 * - Azure OpenAI Service for AI/ML (DALL-E 3, GPT-4, GPT-4 Vision)
 * - Azure Blob Storage for file storage (or local filesystem fallback)
 */
export class AzureProvider implements CloudProvider {
  readonly name = 'azure' as const;
  readonly region: string;

  private openai: AzureOpenAIService;
  private storage: AzureBlobStorageService;

  constructor(region: string, config: {
    openaiEndpoint: string;
    openaiApiKey: string;
    openaiDeploymentName: string;
    openaiApiVersion: string;
    storageAccountName: string;
    storageContainer: string;
  }) {
    this.region = region;
    this.openai = new AzureOpenAIService(
      config.openaiEndpoint,
      config.openaiApiKey,
      config.openaiDeploymentName,
      config.openaiApiVersion
    );
    this.storage = new AzureBlobStorageService(
      config.storageAccountName,
      config.storageContainer
    );

    logger.info(`Azure Provider initialized (region: ${region})`);
  }

  // AI/ML Capabilities
  async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
    return this.openai.generateImage(options);
  }

  async generateText(prompt: string): Promise<string> {
    return this.openai.generateText(prompt);
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    return this.openai.analyzeImage(imageBuffer, prompt);
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
