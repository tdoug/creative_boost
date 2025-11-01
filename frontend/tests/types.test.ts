import { describe, it, expect } from 'vitest';
import type { CampaignBrief, Product, GeneratedAsset } from '../src/types';

describe('Type Validation - CampaignBrief', () => {
  it('should validate basic campaign brief structure', () => {
    const brief: CampaignBrief = {
      campaignId: 'test-campaign',
      products: [
        {
          id: 'prod-1',
          name: 'Test Product',
          description: 'Test Description'
        }
      ],
      targetRegion: 'United States',
      targetAudience: 'Young professionals',
      message: 'Test Message'
    };

    expect(brief.campaignId).toBe('test-campaign');
    expect(brief.products).toHaveLength(1);
    expect(brief.targetRegion).toBe('United States');
  });

  it('should allow optional fields in campaign brief', () => {
    const brief: CampaignBrief = {
      campaignId: 'test-campaign',
      products: [],
      targetRegion: 'US',
      targetAudience: 'Everyone',
      message: 'Test',
      aiPromptAssist: true,
      generateAnalytics: true,
      useArtStyle: true,
      artStyle: 'photorealistic'
    };

    expect(brief.aiPromptAssist).toBe(true);
    expect(brief.generateAnalytics).toBe(true);
    expect(brief.useArtStyle).toBe(true);
    expect(brief.artStyle).toBe('photorealistic');
  });
});

describe('Type Validation - Product', () => {
  it('should validate product structure', () => {
    const product: Product = {
      id: 'prod-1',
      name: 'Test Product',
      description: 'Test Description'
    };

    expect(product.id).toBe('prod-1');
    expect(product.name).toBe('Test Product');
    expect(product.description).toBe('Test Description');
  });

  it('should allow optional existingAssets field', () => {
    const product: Product = {
      id: 'prod-1',
      name: 'Test Product',
      description: 'Test Description',
      existingAssets: ['path/to/asset.png']
    };

    expect(product.existingAssets).toHaveLength(1);
  });
});

describe('Type Validation - GeneratedAsset', () => {
  it('should validate generated asset structure', () => {
    const asset: GeneratedAsset = {
      productId: 'prod-1',
      productName: 'Test Product',
      aspectRatio: '1:1',
      path: 'campaign/prod-1/1x1_123.png',
      metadata: {
        generatedAt: new Date().toISOString(),
        aspectRatio: '1:1',
        dimensions: {
          width: 1080,
          height: 1080
        }
      }
    };

    expect(asset.productId).toBe('prod-1');
    expect(asset.aspectRatio).toBe('1:1');
    expect(asset.metadata.dimensions.width).toBe(1080);
    expect(asset.metadata.dimensions.height).toBe(1080);
  });

  it('should allow optional url field', () => {
    const asset: GeneratedAsset = {
      productId: 'prod-1',
      productName: 'Test Product',
      aspectRatio: '1:1',
      path: 'campaign/prod-1/1x1_123.png',
      url: 'http://localhost:3000/api/assets/file/path',
      metadata: {
        generatedAt: new Date().toISOString(),
        aspectRatio: '1:1',
        dimensions: { width: 1080, height: 1080 }
      }
    };

    expect(asset.url).toBeDefined();
    expect(asset.url).toContain('http://');
  });
});
