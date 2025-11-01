import { z } from 'zod';

// Campaign Brief Schema
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  existingAssets: z.array(z.string()).optional()
});

export const CampaignBriefSchema = z.object({
  campaignId: z.string(),
  products: z.array(ProductSchema).min(2, 'At least 2 products required'),
  targetRegion: z.string(),
  targetAudience: z.string(),
  message: z.string(),
  locale: z.string().optional(),
  brandGuidelines: z.object({
    logoRequired: z.boolean().optional(),
    brandColors: z.array(z.string()).optional(),
    prohibitedWords: z.array(z.string()).optional()
  }).optional()
});

export type Product = z.infer<typeof ProductSchema>;
export type CampaignBrief = z.infer<typeof CampaignBriefSchema>;

// Aspect Ratio Configuration
export interface AspectRatio {
  width: number;
  height: number;
  label: string;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { width: 1080, height: 1080, label: '1:1' },
  { width: 1080, height: 1920, label: '9:16' },
  { width: 1920, height: 1080, label: '16:9' }
];

// Generated Asset Metadata
export interface AssetMetadata {
  generatedAt: string;
  prompt?: string;
  aspectRatio: string;
  dimensions: {
    width: number;
    height: number;
  };
  complianceChecks?: {
    brandCheck?: boolean;
    legalCheck?: boolean;
  };
}

export interface GeneratedAsset {
  productId: string;
  productName: string;
  aspectRatio: string;
  path: string;
  url?: string;
  metadata: AssetMetadata;
}

// Pipeline Result
export interface PipelineResult {
  campaignId: string;
  assets: GeneratedAsset[];
  errors: Array<{
    productId: string;
    aspectRatio: string;
    error: string;
  }>;
  summary: {
    totalAssets: number;
    successCount: number;
    errorCount: number;
    duration: number;
  };
}

// Cloud Provider Options
export interface ImageGenerationOptions {
  prompt: string;
  width: number;
  height: number;
  negativePrompt?: string;
  text?: string; // Text to render in the image (for models that support it)
}

export interface TextOverlayOptions {
  text: string;
  fontSize?: number;
  fontColor?: string;
  position?: 'top' | 'center' | 'bottom';
  backgroundColor?: string;
  padding?: number;
}

// Progress Event for WebSocket
export interface ProgressEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  campaignId: string;
  productId?: string;
  aspectRatio?: string;
  message: string;
  progress?: number;
  asset?: GeneratedAsset;
  error?: string;
  completed?: boolean; // For progress events, indicates if the task is done
}
