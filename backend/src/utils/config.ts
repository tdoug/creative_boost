import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  cloudProvider: process.env.CLOUD_PROVIDER || 'aws',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'local',
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'stability.stable-diffusion-xl-v1',
    bedrockLlmModelId: process.env.BEDROCK_LLM_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  },
  storage: {
    path: process.env.STORAGE_PATH || './backend/output'
  },
  features: {
    enableBrandCheck: process.env.ENABLE_BRAND_CHECK === 'true',
    enableLegalCheck: process.env.ENABLE_LEGAL_CHECK === 'true'
  },
  api: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
