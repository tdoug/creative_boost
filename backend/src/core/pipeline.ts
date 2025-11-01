import { CampaignBrief, GeneratedAsset, PipelineResult, ASPECT_RATIOS, ProgressEvent } from '../types';
import { CloudProvider, createCloudProviderFromEnv } from '../services/cloud';
import { resizeImage, addTextOverlay, generateAssetFilename } from '../utils/image-utils';
import { generateImagePrompt, generateNegativePrompt } from './campaign';
import { logger } from '../utils/logger';

export class CreativePipeline {
  private cloudProvider: CloudProvider;
  private progressCallback?: (event: ProgressEvent) => void;

  constructor(cloudProvider?: CloudProvider, progressCallback?: (event: ProgressEvent) => void) {
    this.cloudProvider = cloudProvider || createCloudProviderFromEnv();
    this.progressCallback = progressCallback;
    logger.info(`Pipeline initialized with ${this.cloudProvider.name.toUpperCase()} provider`);
  }

  /**
   * Execute the creative automation pipeline for a campaign
   */
  async execute(brief: CampaignBrief): Promise<PipelineResult> {
    const startTime = Date.now();
    const assets: GeneratedAsset[] = [];
    const errors: Array<{ productId: string; aspectRatio: string; error: string }> = [];

    logger.info(`Starting pipeline execution for campaign: ${brief.campaignId}`);
    logger.info(`Brand assets check: ${JSON.stringify({
      hasBrandAssets: !!brief.brandAssets,
      hasLogoBuffer: !!(brief.brandAssets && (brief.brandAssets as any).logoBuffer),
      hasLogoPath: !!(brief.brandAssets?.logo),
      logoBufferSize: (brief.brandAssets as any)?.logoBuffer?.length
    })}`);

    // Upload logo to storage if provided and get reference image buffer
    let logoBuffer: Buffer | undefined;
    if (brief.brandAssets && (brief.brandAssets as any).logoBuffer) {
      try {
        logger.info('Uploading brand logo to storage');
        const logoFilename = `logos/${brief.campaignId}-logo.png`;
        await this.cloudProvider.upload((brief.brandAssets as any).logoBuffer, logoFilename, 'image/png');
        logoBuffer = (brief.brandAssets as any).logoBuffer;
        logger.info(`Brand logo uploaded successfully - buffer size: ${logoBuffer?.length || 0} bytes`);
      } catch (error) {
        logger.error('Failed to upload logo:', error);
        // Continue without logo
      }
    } else if (brief.brandAssets?.logo) {
      // If logo path is provided, download it
      try {
        logger.info(`Downloading brand logo from: ${brief.brandAssets.logo}`);
        logoBuffer = await this.cloudProvider.download(brief.brandAssets.logo);
        logger.info(`Logo downloaded - buffer size: ${logoBuffer.length} bytes`);
      } catch (error) {
        logger.error('Failed to download logo:', error);
        // Continue without logo
      }
    } else {
      logger.info('No logo provided for this campaign');
    }

    try {
      // Process each product
      for (const product of brief.products) {
        logger.info(`Processing product: ${product.name}`);

        // Generate base image for this product
        let baseImage: Buffer;

        try {
          // Check if we have existing assets
          if (product.existingAssets && product.existingAssets.length > 0) {
            logger.info(`Using existing asset for ${product.name}`);
            baseImage = await this.cloudProvider.download(product.existingAssets[0]);
          } else {
            // Generate new image using cloud provider
            logger.info(`Generating new image for ${product.name} using ${this.cloudProvider.name.toUpperCase()}`);

            // Try to include text in AI generation (works best with DALL-E 3, may be unreliable with Titan)
            const useAIText = process.env.USE_AI_TEXT_RENDERING === 'true';
            const prompt = generateImagePrompt(brief, product.name, product.description, useAIText);
            const negativePrompt = generateNegativePrompt();

            logger.info(`Image generation prompt for ${product.name}: "${prompt}"`);

            this.sendProgress({
              type: 'progress',
              campaignId: brief.campaignId,
              productId: product.id,
              message: `Generating image for ${product.name}...`,
              prompt: brief.useArtStyle ? prompt : undefined
            });

            baseImage = await this.cloudProvider.generateImage({
              prompt,
              negativePrompt,
              width: 1024,
              height: 1024,
              text: useAIText ? brief.message : undefined
            });
          }

          // Generate variations for each aspect ratio
          for (const aspectRatio of ASPECT_RATIOS) {
            try {
              logger.info(`Creating ${aspectRatio.label} variant for ${product.name}`);

              this.sendProgress({
                type: 'progress',
                campaignId: brief.campaignId,
                productId: product.id,
                aspectRatio: aspectRatio.label,
                message: `Creating ${aspectRatio.label} variant for ${product.name}...`
              });

              // Resize to aspect ratio
              const resized = await resizeImage(baseImage, aspectRatio.width, aspectRatio.height);

              // Add campaign message overlay with logo and varied styling (skip if using AI text rendering)
              const useAIText = process.env.USE_AI_TEXT_RENDERING === 'true';

              // Alternate logo position: use aspect ratio index to alternate (0=prefix, 1=suffix, 2=prefix)
              const aspectRatioIndex = ASPECT_RATIOS.findIndex(ar => ar.label === aspectRatio.label);
              const logoPosition = aspectRatioIndex % 2 === 0 ? 'prefix' : 'suffix';

              if (!useAIText) {
                logger.info(`Adding text overlay for ${product.name} ${aspectRatio.label} - Logo: ${logoBuffer ? `${logoBuffer.length} bytes, position: ${logoPosition}` : 'none'}`);
              }

              const final = useAIText ? resized : await addTextOverlay(resized, {
                text: brief.message,
                fontSize: Math.floor(aspectRatio.width / 20),
                logo: logoBuffer, // Include logo if available
                logoPosition, // Alternates between prefix and suffix
                brandColors: brief.brandAssets ? {
                  primary: brief.brandAssets.primaryColor,
                  secondary: brief.brandAssets.secondaryColor
                } : undefined
                // position, background, and font will be randomly selected
              });

              // Save to storage
              const filename = generateAssetFilename(brief.campaignId, product.id, aspectRatio.label);
              const filePath = await this.cloudProvider.upload(final, filename, 'image/png');

              const asset: GeneratedAsset = {
                productId: product.id,
                productName: product.name,
                aspectRatio: aspectRatio.label,
                path: filePath,
                metadata: {
                  generatedAt: new Date().toISOString(),
                  aspectRatio: aspectRatio.label,
                  dimensions: {
                    width: aspectRatio.width,
                    height: aspectRatio.height
                  },
                  prompt: product.existingAssets ? undefined : generateImagePrompt(brief, product.name, product.description)
                }
              };

              assets.push(asset);

              this.sendProgress({
                type: 'progress',
                campaignId: brief.campaignId,
                productId: product.id,
                aspectRatio: aspectRatio.label,
                message: `Created ${aspectRatio.label} variant for ${product.name}`,
                asset,
                completed: true
              });

              logger.info(`Successfully created ${aspectRatio.label} variant for ${product.name}`);
            } catch (error) {
              const errorMsg = `Failed to create ${aspectRatio.label} variant: ${error}`;
              logger.error(errorMsg);
              errors.push({
                productId: product.id,
                aspectRatio: aspectRatio.label,
                error: errorMsg
              });

              this.sendProgress({
                type: 'error',
                campaignId: brief.campaignId,
                productId: product.id,
                aspectRatio: aspectRatio.label,
                message: errorMsg,
                error: errorMsg
              });
            }
          }
        } catch (error) {
          const errorMsg = `Failed to process product ${product.name}: ${error}`;
          logger.error(errorMsg);

          // Add error for all aspect ratios
          for (const aspectRatio of ASPECT_RATIOS) {
            errors.push({
              productId: product.id,
              aspectRatio: aspectRatio.label,
              error: errorMsg
            });
          }

          this.sendProgress({
            type: 'error',
            campaignId: brief.campaignId,
            productId: product.id,
            message: errorMsg,
            error: errorMsg
          });
        }
      }

      const duration = Date.now() - startTime;
      const result: PipelineResult = {
        campaignId: brief.campaignId,
        assets,
        errors,
        summary: {
          totalAssets: brief.products.length * ASPECT_RATIOS.length,
          successCount: assets.length,
          errorCount: errors.length,
          duration
        }
      };

      logger.info(`Pipeline execution completed. Success: ${assets.length}, Errors: ${errors.length}, Duration: ${duration}ms`);

      this.sendProgress({
        type: 'complete',
        campaignId: brief.campaignId,
        message: `Campaign generation complete. Generated ${assets.length} assets in ${(duration / 1000).toFixed(1)}s`
      });

      return result;
    } catch (error) {
      logger.error('Pipeline execution failed:', error);
      this.sendProgress({
        type: 'error',
        campaignId: brief.campaignId,
        message: `Pipeline failed: ${error}`,
        error: String(error)
      });
      throw error;
    }
  }

  private sendProgress(event: Omit<ProgressEvent, 'progress'>): void {
    if (this.progressCallback) {
      this.progressCallback(event as ProgressEvent);
    }
  }
}
