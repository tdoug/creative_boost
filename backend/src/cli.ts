#!/usr/bin/env node

import { Command } from 'commander';
import { loadCampaignBrief } from './core/campaign';
import { CreativePipeline } from './core/pipeline';
import { ProgressEvent } from './types';
import { logger } from './utils/logger';
import * as fs from 'fs/promises';

const program = new Command();

program
  .name('creative-boost')
  .description('Creative Automation Pipeline - Generate scalable social ad campaigns')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate campaign assets from a brief')
  .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
  .option('-o, --output <path>', 'Output directory (default: ./backend/output)')
  .action(async (options) => {
    try {
      console.log('🚀 Creative Boost - Campaign Generation');
      console.log('======================================\n');

      // Load campaign brief
      const brief = await loadCampaignBrief(options.brief);
      console.log(`📋 Campaign: ${brief.campaignId}`);
      console.log(`🎯 Target: ${brief.targetAudience} in ${brief.targetRegion}`);
      console.log(`📦 Products: ${brief.products.length}`);
      console.log(`💬 Message: "${brief.message}"\n`);

      // Set up progress tracking
      const progressCallback = (event: ProgressEvent) => {
        switch (event.type) {
          case 'start':
            console.log(`\n▶️  ${event.message}\n`);
            break;
          case 'progress':
            if (event.asset) {
              console.log(`✅ ${event.message}`);
              console.log(`   → ${event.asset.path}`);
            } else {
              console.log(`⏳ ${event.message}`);
            }
            break;
          case 'complete':
            console.log(`\n✨ ${event.message}`);
            break;
          case 'error':
            console.log(`❌ ${event.message}`);
            break;
        }
      };

      // Execute pipeline (uses cloud provider from environment)
      const pipeline = new CreativePipeline(undefined, progressCallback);
      const result = await pipeline.execute(brief);

      // Display summary
      console.log('\n======================================');
      console.log('📊 Generation Summary');
      console.log('======================================');
      console.log(`Total Assets: ${result.summary.totalAssets}`);
      console.log(`✅ Successful: ${result.summary.successCount}`);
      console.log(`❌ Failed: ${result.summary.errorCount}`);
      console.log(`⏱️  Duration: ${(result.summary.duration / 1000).toFixed(1)}s`);

      if (result.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        result.errors.forEach(err => {
          console.log(`   • ${err.productId} (${err.aspectRatio}): ${err.error}`);
        });
      }

      console.log('\n✨ Campaign generation complete!\n');

      // Save result summary
      const summaryPath = `${options.output || './backend/output'}/${brief.campaignId}/summary.json`;
      await fs.mkdir(`${options.output || './backend/output'}/${brief.campaignId}`, { recursive: true });
      await fs.writeFile(summaryPath, JSON.stringify(result, null, 2));
      console.log(`📄 Summary saved to: ${summaryPath}\n`);

      process.exit(result.errors.length > 0 ? 1 : 0);
    } catch (error) {
      console.error('\n❌ Error:', error);
      logger.error('CLI execution failed:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a campaign brief without generating')
  .requiredOption('-b, --brief <path>', 'Path to campaign brief JSON file')
  .action(async (options) => {
    try {
      const brief = await loadCampaignBrief(options.brief);
      console.log('✅ Campaign brief is valid!');
      console.log(`   Campaign ID: ${brief.campaignId}`);
      console.log(`   Products: ${brief.products.length}`);
      console.log(`   Target: ${brief.targetAudience} in ${brief.targetRegion}`);
      process.exit(0);
    } catch (error) {
      console.error('❌ Campaign brief is invalid:', error);
      process.exit(1);
    }
  });

program.parse();
