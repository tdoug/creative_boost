/**
 * Cloud Provider Factory
 *
 * Creates the appropriate cloud provider based on configuration.
 * Supports AWS, Azure, and GCP with a unified interface.
 */

import { CloudProvider } from './cloud-provider';
import { AWSProvider } from './aws';
import { AzureProvider } from './azure';
import { GCPProvider } from './gcp';
import { logger } from '../../utils/logger';

export * from './cloud-provider';

export interface CloudProviderFactoryConfig {
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  aws?: {
    bedrockModelId: string;
    bedrockLlmModelId: string;
    s3Bucket: string;
  };
  azure?: {
    openaiEndpoint: string;
    openaiApiKey: string;
    openaiDeploymentName: string;
    openaiApiVersion: string;
    storageAccountName: string;
    storageContainer: string;
  };
  gcp?: {
    projectId: string;
    vertexAIModel: string;
    storageBucket: string;
  };
}

/**
 * Create a cloud provider instance based on configuration
 */
export function createCloudProvider(config: CloudProviderFactoryConfig): CloudProvider {
  logger.info(`Creating cloud provider: ${config.provider} (region: ${config.region})`);

  switch (config.provider) {
    case 'aws':
      if (!config.aws) {
        throw new Error('AWS configuration is required when provider is AWS');
      }
      return new AWSProvider(config.region, config.aws);

    case 'azure':
      if (!config.azure) {
        throw new Error('Azure configuration is required when provider is Azure');
      }
      return new AzureProvider(config.region, config.azure);

    case 'gcp':
      if (!config.gcp) {
        throw new Error('GCP configuration is required when provider is GCP');
      }
      return new GCPProvider(config.region, config.gcp);

    default:
      throw new Error(`Unsupported cloud provider: ${config.provider}`);
  }
}

/**
 * Create a cloud provider from environment variables
 */
export function createCloudProviderFromEnv(): CloudProvider {
  const provider = (process.env.CLOUD_PROVIDER || 'aws') as 'aws' | 'azure' | 'gcp';
  const region = process.env.CLOUD_REGION || process.env.AWS_REGION || 'us-east-1';

  const config: CloudProviderFactoryConfig = {
    provider,
    region,
    aws: provider === 'aws' ? {
      bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-canvas-v1:0',
      bedrockLlmModelId: process.env.BEDROCK_LLM_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      s3Bucket: process.env.AWS_S3_BUCKET || 'local'
    } : undefined,
    azure: provider === 'azure' ? {
      openaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      openaiApiKey: process.env.AZURE_OPENAI_API_KEY || '',
      openaiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'dall-e-3',
      openaiApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
      storageAccountName: process.env.AZURE_STORAGE_ACCOUNT || '',
      storageContainer: process.env.AZURE_STORAGE_CONTAINER || 'local'
    } : undefined,
    gcp: provider === 'gcp' ? {
      projectId: process.env.GCP_PROJECT_ID || '',
      vertexAIModel: process.env.VERTEX_AI_MODEL || 'imagegeneration@006',
      storageBucket: process.env.GCP_BUCKET || 'local'
    } : undefined
  };

  return createCloudProvider(config);
}
