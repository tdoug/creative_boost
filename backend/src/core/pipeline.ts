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
    this.sendProgress({
      type: 'start',
      campaignId: brief.campaignId,
      message: `Starting campaign generation for ${brief.products.length} products`
    });

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
            const prompt = generateImagePrompt(brief, product.name, product.description);
            const negativePrompt = generateNegativePrompt();

            this.sendProgress({
              type: 'progress',
              campaignId: brief.campaignId,
              productId: product.id,
              message: `Generating image for ${product.name}...`
            });

            baseImage = await this.cloudProvider.generateImage({
              prompt,
              negativePrompt,
              width: 1024,
              height: 1024
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

              // Add campaign message overlay
              const final = await addTextOverlay(resized, {
                text: brief.message,
                fontSize: Math.floor(aspectRatio.width / 20),
                position: 'bottom'
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
                asset
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
