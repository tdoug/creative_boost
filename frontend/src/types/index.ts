export interface Product {
  id: string;
  name: string;
  description: string;
  existingAssets?: string[];
}

export interface CampaignBrief {
  campaignId: string;
  products: Product[];
  targetRegion: string;
  targetAudience: string;
  message: string;
  locale?: string;
}

export interface GeneratedAsset {
  productId: string;
  productName: string;
  aspectRatio: string;
  path: string;
  url?: string;
  metadata: {
    generatedAt: string;
    aspectRatio: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
}

export interface ProgressEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  campaignId: string;
  productId?: string;
  aspectRatio?: string;
  message: string;
  progress?: number;
  asset?: GeneratedAsset;
  error?: string;
}
