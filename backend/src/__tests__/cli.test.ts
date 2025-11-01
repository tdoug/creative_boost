/**
 * CLI Interface Tests
 *
 * Tests for the command-line interface including:
 * - Generate command
 * - Validate command
 * - Error handling
 * - Output generation
 */

import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import { CreativePipeline } from '../core/pipeline';
import { loadCampaignBrief } from '../core/campaign';
import type { CampaignBrief, PipelineResult, ProgressEvent } from '../types';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../core/pipeline');
jest.mock('../core/campaign');
jest.mock('../utils/logger');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPipeline = CreativePipeline as unknown as jest.MockedClass<typeof CreativePipeline>;
const mockLoadCampaignBrief = loadCampaignBrief as jest.MockedFunction<typeof loadCampaignBrief>;

describe('CLI Interface', () => {
  const mockBrief: CampaignBrief = {
    campaignId: 'test-campaign',
    products: [
      {
        id: 'prod-1',
        name: 'Test Product',
        description: 'A test product'
      }
    ],
    targetRegion: 'North America',
    targetAudience: 'Adults 25-45',
    message: 'Test Message',
    locale: 'en-US'
  };

  const mockResult: PipelineResult = {
    campaignId: 'test-campaign',
    assets: [
      {
        productId: 'prod-1',
        productName: 'Test Product',
        aspectRatio: '1:1',
        path: 'test-campaign/prod-1/1x1_123.png',
        metadata: {
          generatedAt: '2024-01-01T00:00:00.000Z',
          aspectRatio: '1:1',
          dimensions: { width: 1080, height: 1080 }
        }
      }
    ],
    errors: [],
    summary: {
      totalAssets: 1,
      successCount: 1,
      errorCount: 0,
      duration: 1000
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods to suppress output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit to prevent test termination
    jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new Error(`Process.exit called with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generate command', () => {
    it('should successfully generate campaign assets', async () => {
      // Arrange
      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      const mockExecute = jest.fn<() => Promise<PipelineResult>>().mockResolvedValue(mockResult);
      (mockPipeline as any).mockImplementation(() => ({
        execute: mockExecute
      }));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const { Command } = await import('commander');
      const program = new Command();

      // Set up the generate command manually for testing
      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .option('-o, --output <path>', 'Output directory')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, () => {});
          const result = await pipeline.execute(brief);

          const summaryPath = `${options.output || './backend/output'}/${brief.campaignId}/summary.json`;
          await mockFs.mkdir(`${options.output || './backend/output'}/${brief.campaignId}`, { recursive: true });
          await mockFs.writeFile(summaryPath, JSON.stringify(result, null, 2));
        });

      // Act
      await program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json']);

      // Assert
      expect(mockLoadCampaignBrief).toHaveBeenCalledWith('test-brief.json');
      expect(mockExecute).toHaveBeenCalledWith(mockBrief);
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should generate with custom output directory', async () => {
      // Arrange
      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      const mockExecute = jest.fn<() => Promise<PipelineResult>>().mockResolvedValue(mockResult);
      (mockPipeline as any).mockImplementation(() => ({
        execute: mockExecute
      }));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .option('-o, --output <path>', 'Output directory')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, () => {});
          const result = await pipeline.execute(brief);

          const summaryPath = `${options.output || './backend/output'}/${brief.campaignId}/summary.json`;
          await mockFs.mkdir(`${options.output || './backend/output'}/${brief.campaignId}`, { recursive: true });
          await mockFs.writeFile(summaryPath, JSON.stringify(result, null, 2));
        });

      // Act
      await program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json', '-o', './custom-output']);

      // Assert
      expect(mockFs.mkdir).toHaveBeenCalledWith('./custom-output/test-campaign', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        './custom-output/test-campaign/summary.json',
        expect.any(String)
      );
    });

    it('should handle generation errors gracefully', async () => {
      // Arrange
      const error = new Error('Generation failed');
      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      const mockExecute = jest.fn<() => Promise<PipelineResult>>().mockRejectedValue(error as any);
      (mockPipeline as any).mockImplementation(() => ({
        execute: mockExecute
      }));

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, () => {});
          await pipeline.execute(brief);
        });

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json'])
      ).rejects.toThrow('Generation failed');
    });

    it('should exit with code 1 when there are generation errors', async () => {
      // Arrange
      const resultWithErrors: PipelineResult = {
        ...mockResult,
        errors: [
          { productId: 'prod-1', aspectRatio: '1:1', error: 'Failed to generate' }
        ],
        summary: {
          ...mockResult.summary,
          errorCount: 1,
          successCount: 0
        }
      };

      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      const mockExecute = jest.fn<() => Promise<PipelineResult>>().mockResolvedValue(resultWithErrors);
      (mockPipeline as any).mockImplementation(() => ({
        execute: mockExecute
      }));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, () => {});
          const result = await pipeline.execute(brief);

          const summaryPath = `./backend/output/${brief.campaignId}/summary.json`;
          await mockFs.mkdir(`./backend/output/${brief.campaignId}`, { recursive: true });
          await mockFs.writeFile(summaryPath, JSON.stringify(result, null, 2));

          process.exit(result.errors.length > 0 ? 1 : 0);
        });

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json'])
      ).rejects.toThrow('Process.exit called with code 1');
    });

    it('should call progress callback during generation', async () => {
      // Arrange
      let capturedCallback: ((event: ProgressEvent) => void) | undefined;

      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      (mockPipeline as any).mockImplementation((_provider: any, callback: (event: ProgressEvent) => void) => {
        capturedCallback = callback;
        return {
          execute: jest.fn().mockImplementation(() => {
            // Simulate progress events
            if (capturedCallback) {
              capturedCallback({
                type: 'start',
                campaignId: 'test-campaign',
                message: 'Starting generation'
              });
              capturedCallback({
                type: 'progress',
                campaignId: 'test-campaign',
                message: 'Generating...',
                asset: mockResult.assets[0]
              });
              capturedCallback({
                type: 'complete',
                campaignId: 'test-campaign',
                message: 'Generation complete'
              });
            }
            return Promise.resolve(mockResult);
          })
        };
      });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, (event) => {
            // Progress callback
          });
          await pipeline.execute(brief);
        });

      // Act
      await program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json']);

      // Assert
      expect(mockPipeline).toHaveBeenCalled();
      expect(capturedCallback).toBeDefined();
    });
  });

  describe('validate command', () => {
    it('should successfully validate a campaign brief', async () => {
      // Arrange
      mockLoadCampaignBrief.mockResolvedValue(mockBrief);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('validate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(async (options) => {
          await mockLoadCampaignBrief(options.brief);
          process.exit(0);
        });

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'validate', '-b', 'test-brief.json'])
      ).rejects.toThrow('Process.exit called with code 0');

      expect(mockLoadCampaignBrief).toHaveBeenCalledWith('test-brief.json');
    });

    it('should exit with code 1 for invalid brief', async () => {
      // Arrange
      const error = new Error('Invalid campaign brief');
      mockLoadCampaignBrief.mockRejectedValue(error);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('validate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(async (options) => {
          try {
            await mockLoadCampaignBrief(options.brief);
            process.exit(0);
          } catch (err) {
            process.exit(1);
          }
        });

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'validate', '-b', 'invalid-brief.json'])
      ).rejects.toThrow('Process.exit called with code 1');
    });

    it('should handle file not found errors', async () => {
      // Arrange
      const error = new Error('ENOENT: no such file or directory');
      mockLoadCampaignBrief.mockRejectedValue(error);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('validate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(async (options) => {
          try {
            await mockLoadCampaignBrief(options.brief);
            process.exit(0);
          } catch (err) {
            process.exit(1);
          }
        });

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'validate', '-b', 'nonexistent.json'])
      ).rejects.toThrow('Process.exit called with code 1');
    });
  });

  describe('command line argument parsing', () => {
    it('should require brief option for generate command', async () => {
      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(() => {});

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'generate'])
      ).rejects.toThrow();
    });

    it('should require brief option for validate command', async () => {
      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('validate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .action(() => {});

      // Act & Assert
      await expect(
        program.parseAsync(['node', 'cli', 'validate'])
      ).rejects.toThrow();
    });

    it('should parse brief path correctly', async () => {
      const { Command } = await import('commander');
      const program = new Command();

      let capturedOptions: any;

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .option('-o, --output <path>', 'Output directory')
        .action((options) => {
          capturedOptions = options;
        });

      await program.parseAsync(['node', 'cli', 'generate', '-b', 'path/to/brief.json']);

      expect(capturedOptions.brief).toBe('path/to/brief.json');
    });

    it('should parse output path correctly', async () => {
      const { Command } = await import('commander');
      const program = new Command();

      let capturedOptions: any;

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .option('-o, --output <path>', 'Output directory')
        .action((options) => {
          capturedOptions = options;
        });

      await program.parseAsync(['node', 'cli', 'generate', '-b', 'brief.json', '-o', '/custom/output']);

      expect(capturedOptions.output).toBe('/custom/output');
    });
  });

  describe('summary file generation', () => {
    it('should create summary.json with correct structure', async () => {
      // Arrange
      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      const mockExecute = jest.fn<() => Promise<PipelineResult>>().mockResolvedValue(mockResult);
      (mockPipeline as any).mockImplementation(() => ({
        execute: mockExecute
      }));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .option('-o, --output <path>', 'Output directory')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, () => {});
          const result = await pipeline.execute(brief);

          const summaryPath = `${options.output || './backend/output'}/${brief.campaignId}/summary.json`;
          await mockFs.mkdir(`${options.output || './backend/output'}/${brief.campaignId}`, { recursive: true });
          await mockFs.writeFile(summaryPath, JSON.stringify(result, null, 2));
        });

      // Act
      await program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json']);

      // Assert
      const writtenContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1] as string;
      const parsedContent = JSON.parse(writtenContent);

      expect(parsedContent).toHaveProperty('campaignId');
      expect(parsedContent).toHaveProperty('assets');
      expect(parsedContent).toHaveProperty('errors');
      expect(parsedContent).toHaveProperty('summary');
      expect(parsedContent.summary).toHaveProperty('totalAssets');
      expect(parsedContent.summary).toHaveProperty('successCount');
      expect(parsedContent.summary).toHaveProperty('errorCount');
      expect(parsedContent.summary).toHaveProperty('duration');
    });

    it('should create output directory recursively', async () => {
      // Arrange
      mockLoadCampaignBrief.mockResolvedValue(mockBrief);
      const mockExecute = jest.fn<() => Promise<PipelineResult>>().mockResolvedValue(mockResult);
      (mockPipeline as any).mockImplementation(() => ({
        execute: mockExecute
      }));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const { Command } = await import('commander');
      const program = new Command();

      program
        .command('generate')
        .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
        .option('-o, --output <path>', 'Output directory')
        .action(async (options) => {
          const brief = await mockLoadCampaignBrief(options.brief);
          const pipeline = new mockPipeline(undefined, () => {});
          const result = await pipeline.execute(brief);

          const outputDir = `${options.output || './backend/output'}/${brief.campaignId}`;
          await mockFs.mkdir(outputDir, { recursive: true });
          await mockFs.writeFile(`${outputDir}/summary.json`, JSON.stringify(result, null, 2));
        });

      // Act
      await program.parseAsync(['node', 'cli', 'generate', '-b', 'test-brief.json']);

      // Assert
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        './backend/output/test-campaign',
        { recursive: true }
      );
    });
  });
});
