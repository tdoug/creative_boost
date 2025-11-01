/**
 * Abstract Cloud Provider Interface
 *
 * This interface abstracts AI/ML capabilities and storage across cloud providers.
 * Each provider implements both image generation and storage in a unified way.
 */

import { ImageGenerationOptions } from '../../types';

export interface CloudProvider {
  readonly name: 'aws' | 'azure' | 'gcp' | 'local';
  readonly region: string;

  // AI/ML Capabilities
  generateImage(options: ImageGenerationOptions): Promise<Buffer>;
  generateText(prompt: string): Promise<string>;
  analyzeImage?(imageBuffer: Buffer, prompt: string): Promise<string>;

  // Storage Capabilities
  upload(fileBuffer: Buffer, filePath: string, contentType?: string): Promise<string>;
  download(filePath: string): Promise<Buffer>;
  exists(filePath: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}

export interface CloudProviderConfig {
  provider: 'aws' | 'azure' | 'gcp' | 'local';
  region: string;
  credentials?: any;
  options?: any;
}
