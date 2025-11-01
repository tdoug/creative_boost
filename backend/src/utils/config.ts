import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from project root
// Handle both running from project root and from backend/ subdirectory
let rootDir = process.cwd();

// If running from backend/ directory, go up one level to project root
if (rootDir.endsWith('backend')) {
  rootDir = path.join(rootDir, '..');
}

const envPath = path.join(rootDir, '.env');

// Verify the .env file exists at the expected location
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`[config] Loading .env from: ${envPath}`);
} else {
  console.warn(`[config] Warning: .env file not found at ${envPath}`);
  dotenv.config(); // Try loading from default locations as fallback
}

export const config = {
  cloudProvider: process.env.CLOUD_PROVIDER || 'aws',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '', // Empty string = local storage
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-canvas-v1:0',
    bedrockLlmModelId: process.env.BEDROCK_LLM_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
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
