import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ImageGenerationOptions } from '../../../types';
import { logger } from '../../../utils/logger';

export class BedrockService {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private llmModelId: string;

  constructor(region: string, modelId: string, llmModelId: string) {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
    this.llmModelId = llmModelId;
    logger.info(`Bedrock service initialized with image model: ${modelId}, LLM: ${llmModelId}`);
  }

  /**
   * Generate an image using AWS Bedrock (supports Stable Diffusion XL and Amazon Titan)
   */
  async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
    try {
      logger.info(`Generating image with ${this.modelId}: "${options.prompt.substring(0, 50)}..."`);

      // Determine which model API format to use
      const isTitan = this.modelId.includes('titan');
      const isNova = this.modelId.includes('nova');
      const isStableDiffusion = this.modelId.includes('stability');

      // Generate truly random seed combining timestamp and random values
      // This ensures each generation is unique even if called in rapid succession
      const randomSeed = Math.floor((Date.now() * Math.random()) % 2147483647);
      logger.info(`Using random seed: ${randomSeed} for image generation`);

      let body: string;

      if (isTitan || isNova) {
        // Amazon Titan and Nova Canvas use the same API format
        body = JSON.stringify({
          taskType: "TEXT_IMAGE",
          textToImageParams: {
            text: options.prompt,
            negativeText: options.negativePrompt || ""
          },
          imageGenerationConfig: {
            numberOfImages: 1,
            quality: isNova ? "premium" : "standard",
            height: options.height,
            width: options.width,
            cfgScale: 8.0,
            seed: randomSeed
          }
        });
      } else if (isStableDiffusion) {
        // Stable Diffusion XL format
        body = JSON.stringify({
          text_prompts: [
            {
              text: options.prompt,
              weight: 1
            },
            ...(options.negativePrompt ? [{
              text: options.negativePrompt,
              weight: -1
            }] : [])
          ],
          cfg_scale: 7,
          seed: randomSeed,
          steps: 30,
          width: options.width,
          height: options.height,
          style_preset: 'photographic'
        });
      } else {
        throw new Error(`Unsupported model: ${this.modelId}`);
      }

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: body
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      let base64Image: string;

      if (isTitan || isNova) {
        // Titan and Nova return images in the same structure
        if (!responseBody.images || responseBody.images.length === 0) {
          throw new Error(`No images returned from ${isNova ? 'Nova' : 'Titan'}`);
        }
        base64Image = responseBody.images[0];
      } else {
        // Stable Diffusion returns artifacts
        if (!responseBody.artifacts || responseBody.artifacts.length === 0) {
          throw new Error('No image artifacts returned from Bedrock');
        }
        base64Image = responseBody.artifacts[0].base64;
      }

      const imageBuffer = Buffer.from(base64Image, 'base64');

      logger.info(`Image generated successfully with ${this.modelId} (${imageBuffer.length} bytes)`);
      return imageBuffer;
    } catch (error) {
      logger.error('Error generating image with Bedrock:', error);
      throw new Error(`Bedrock image generation failed: ${error}`);
    }
  }

  /**
   * Generate text using Claude on Bedrock (for brand compliance checks)
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const command = new InvokeModelCommand({
        modelId: this.llmModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: body
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return responseBody.content[0].text;
    } catch (error) {
      logger.error('Error generating text with Bedrock:', error);
      throw new Error(`Bedrock text generation failed: ${error}`);
    }
  }

  /**
   * Analyze an image using Claude Vision on Bedrock
   */
  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    try {
      const base64Image = imageBuffer.toString('base64');

      const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });

      const command = new InvokeModelCommand({
        modelId: this.llmModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: body
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return responseBody.content[0].text;
    } catch (error) {
      logger.error('Error analyzing image with Bedrock:', error);
      throw new Error(`Bedrock image analysis failed: ${error}`);
    }
  }
}
