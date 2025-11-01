import { CloudProvider } from '../cloud-provider';
import { ImageGenerationOptions } from '../../../types';
import { VertexAIService } from './vertex-ai';
import { GCPCloudStorageService } from './cloud-storage';
import { logger } from '../../../utils/logger';

/**
 * GCP Cloud Provider Implementation
 *
 * Uses:
 * - Google Cloud Vertex AI for AI/ML (Imagen 3, Gemini 1.5 Pro)
 * - Google Cloud Storage for file storage (or local filesystem fallback)
 */
export class GCPProvider implements CloudProvider {
  readonly name = 'gcp' as const;
  readonly region: string;

  private vertexAI: VertexAIService;
  private storage: GCPCloudStorageService;

  constructor(region: string, config: {
    projectId: string;
    vertexAIModel: string;
    storageBucket: string;
  }) {
    this.region = region;
    this.vertexAI = new VertexAIService(
      config.projectId,
      region,
      config.vertexAIModel
    );
    this.storage = new GCPCloudStorageService(config.storageBucket);

    logger.info(`GCP Provider initialized (region: ${region})`);
  }

  // AI/ML Capabilities
  async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
    return this.vertexAI.generateImage(options);
  }

  async generateText(prompt: string): Promise<string> {
    return this.vertexAI.generateText(prompt);
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    return this.vertexAI.analyzeImage(imageBuffer, prompt);
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
