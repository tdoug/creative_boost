import { ImageGenerationOptions } from '../../../types';
import { logger } from '../../../utils/logger';

/**
 * Azure OpenAI Service
 *
 * Uses Azure OpenAI Service for:
 * - DALL-E 3 for image generation
 * - GPT-4 for text generation
 * - GPT-4 Vision for image analysis
 *
 * Note: Requires @azure/openai package
 */
export class AzureOpenAIService {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor(endpoint: string, apiKey: string, deploymentName: string, apiVersion: string = '2024-02-01') {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.deploymentName = deploymentName;
    this.apiVersion = apiVersion;
    logger.info(`Azure OpenAI service initialized (deployment: ${deploymentName})`);
  }

  /**
   * Generate an image using Azure OpenAI DALL-E 3
   */
  async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
    try {
      logger.info(`Generating image with Azure OpenAI: "${options.prompt.substring(0, 50)}..."`);

      // Build the API URL
      const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/images/generations?api-version=${this.apiVersion}`;

      // Azure OpenAI uses a simpler prompt format for DALL-E 3
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          prompt: options.prompt,
          n: 1,
          size: this.mapDimensionsToSize(options.width, options.height),
          quality: 'hd',
          style: 'natural'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error('No image data returned from Azure OpenAI');
      }

      // DALL-E 3 returns a URL, we need to download it
      const imageUrl = data.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      logger.info(`Image generated successfully with Azure OpenAI (${imageBuffer.length} bytes)`);
      return imageBuffer;
    } catch (error) {
      logger.error('Error generating image with Azure OpenAI:', error);
      throw new Error(`Azure OpenAI image generation failed: ${error}`);
    }
  }

  /**
   * Generate text using Azure OpenAI GPT-4
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const url = `${this.endpoint}/openai/deployments/gpt-4/chat/completions?api-version=${this.apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      logger.error('Error generating text with Azure OpenAI:', error);
      throw new Error(`Azure OpenAI text generation failed: ${error}`);
    }
  }

  /**
   * Analyze an image using Azure OpenAI GPT-4 Vision
   */
  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    try {
      const base64Image = imageBuffer.toString('base64');
      const url = `${this.endpoint}/openai/deployments/gpt-4-vision/chat/completions?api-version=${this.apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      logger.error('Error analyzing image with Azure OpenAI:', error);
      throw new Error(`Azure OpenAI image analysis failed: ${error}`);
    }
  }

  /**
   * Map dimensions to Azure OpenAI supported sizes
   * DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
   */
  private mapDimensionsToSize(width: number, height: number): string {
    if (width === height) {
      return '1024x1024';
    } else if (width > height) {
      return '1792x1024';
    } else {
      return '1024x1792';
    }
  }
}
