import { generateImagePrompt, generateNegativePrompt } from '../src/core/campaign';
import { CampaignBrief } from '../src/types';

describe('Campaign - Image Prompt Generation', () => {
  test('should generate basic image prompt without art style', () => {
    const brief: CampaignBrief = {
      campaignId: 'test-campaign',
      products: [],
      targetRegion: 'United States',
      targetAudience: 'Everyone',
      message: 'Test Message',
      useArtStyle: false
    };

    const prompt = generateImagePrompt(
      brief,
      'Premium Coffee Blend',
      'Artisan roasted coffee beans with rich flavor'
    );

    expect(prompt).toContain('Premium Coffee Blend');
    expect(prompt).toContain('Artisan roasted coffee beans with rich flavor');
    expect(prompt).toContain('No text, no words, no letters in image');
  });

  test('should generate image prompt with photorealistic style', () => {
    const brief: CampaignBrief = {
      campaignId: 'test-campaign',
      products: [],
      targetRegion: 'United States',
      targetAudience: 'Everyone',
      message: 'Test Message',
      useArtStyle: true,
      artStyle: 'photorealistic'
    };

    const prompt = generateImagePrompt(
      brief,
      'Premium Coffee Blend',
      'Artisan roasted coffee beans'
    );

    expect(prompt).toContain('Premium Coffee Blend');
    expect(prompt).toContain('photorealistic');
    expect(prompt).toContain('ultra-sharp');
  });

  test('should generate image prompt with minimalist style', () => {
    const brief: CampaignBrief = {
      campaignId: 'test-campaign',
      products: [],
      targetRegion: 'United States',
      targetAudience: 'Everyone',
      message: 'Test Message',
      useArtStyle: true,
      artStyle: 'minimalist'
    };

    const prompt = generateImagePrompt(
      brief,
      'Green Tea',
      'Organic tea leaves'
    );

    expect(prompt).toContain('Green Tea');
    expect(prompt).toContain('minimalist');
    expect(prompt).toContain('clean');
  });

  test('should generate image prompt with vintage style', () => {
    const brief: CampaignBrief = {
      campaignId: 'test-campaign',
      products: [],
      targetRegion: 'United States',
      targetAudience: 'Everyone',
      message: 'Test Message',
      useArtStyle: true,
      artStyle: 'vintage'
    };

    const prompt = generateImagePrompt(
      brief,
      'Coffee Mug',
      'Classic ceramic mug'
    );

    expect(prompt).toContain('Coffee Mug');
    expect(prompt).toContain('vintage');
    expect(prompt).toContain('retro');
  });
});

describe('Campaign - Negative Prompt Generation', () => {
  test('should generate negative prompt with text-prevention terms', () => {
    const negPrompt = generateNegativePrompt();

    expect(negPrompt).toContain('text');
    expect(negPrompt).toContain('words');
    expect(negPrompt).toContain('letters');
    expect(negPrompt).toContain('blurry');
    expect(negPrompt).toContain('low quality');
  });
});

describe('Campaign - Art Styles in Prompts', () => {
  test('should include photorealistic style in prompt', () => {
    const brief: CampaignBrief = {
      campaignId: 'test',
      products: [],
      targetRegion: 'US',
      targetAudience: 'Everyone',
      message: 'Test',
      useArtStyle: true,
      artStyle: 'photorealistic'
    };

    const prompt = generateImagePrompt(brief, 'Product', 'Description');
    expect(prompt).toContain('photorealistic');
    expect(prompt).toContain('ultra-sharp');
  });

  test('should include minimalist style in prompt', () => {
    const brief: CampaignBrief = {
      campaignId: 'test',
      products: [],
      targetRegion: 'US',
      targetAudience: 'Everyone',
      message: 'Test',
      useArtStyle: true,
      artStyle: 'minimalist'
    };

    const prompt = generateImagePrompt(brief, 'Product', 'Description');
    expect(prompt).toContain('minimalist');
    expect(prompt).toContain('clean');
  });

  test('should include vintage style in prompt', () => {
    const brief: CampaignBrief = {
      campaignId: 'test',
      products: [],
      targetRegion: 'US',
      targetAudience: 'Everyone',
      message: 'Test',
      useArtStyle: true,
      artStyle: 'vintage'
    };

    const prompt = generateImagePrompt(brief, 'Product', 'Description');
    expect(prompt).toContain('vintage');
    expect(prompt).toContain('retro');
  });

  test('should include luxury style in prompt', () => {
    const brief: CampaignBrief = {
      campaignId: 'test',
      products: [],
      targetRegion: 'US',
      targetAudience: 'Everyone',
      message: 'Test',
      useArtStyle: true,
      artStyle: 'luxury'
    };

    const prompt = generateImagePrompt(brief, 'Product', 'Description');
    expect(prompt).toContain('luxury');
    expect(prompt).toContain('elegant');
  });
});
