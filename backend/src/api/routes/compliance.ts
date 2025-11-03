import { Router, Request, Response } from 'express';
import { createCloudProviderFromEnv } from '../../services/cloud';
import { logger } from '../../utils/logger';
import { aiLimiter } from '../middleware/rate-limiter';

const router = Router();
const cloudProvider = createCloudProviderFromEnv();

interface BrandComplianceRequest {
  imagePath: string;
  brandAssets: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * POST /api/compliance/check
 * Check if an image complies with brand guidelines
 */
router.post('/check', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { imagePath, brandAssets } = req.body as BrandComplianceRequest;

    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    if (!brandAssets || (!brandAssets.logo && !brandAssets.primaryColor && !brandAssets.secondaryColor)) {
      return res.status(400).json({ error: 'Brand assets are required' });
    }

    logger.info(`Checking brand compliance for image: ${imagePath}`);

    // Download the image
    const imageBuffer = await cloudProvider.download(imagePath);

    // Build the compliance check prompt
    let prompt = 'You are a brand compliance checker. Analyze this marketing image and determine if it meets the following brand guidelines:\n\n';

    const checks: string[] = [];

    if (brandAssets.logo) {
      checks.push('- The image should include or feature the brand logo');
      prompt += '1. Logo Presence: Check if the brand logo is visible in the image.\n';
    }

    if (brandAssets.primaryColor || brandAssets.secondaryColor) {
      const colors: string[] = [];
      if (brandAssets.primaryColor) colors.push(brandAssets.primaryColor);
      if (brandAssets.secondaryColor) colors.push(brandAssets.secondaryColor);

      checks.push(`- The image should incorporate the brand colors: ${colors.join(', ')}`);
      prompt += `2. Brand Colors: Check if the brand colors (${colors.join(', ')}) are prominently featured in the image.\n`;
    }

    prompt += '\nRespond with a JSON object in the following format:\n';
    prompt += '{\n';
    prompt += '  "compliant": true/false,\n';
    prompt += '  "logoPresent": true/false/null (null if logo not required),\n';
    prompt += '  "colorsPresent": true/false/null (null if colors not required),\n';
    prompt += '  "details": "Brief explanation of findings"\n';
    prompt += '}\n\nOnly return the JSON object, nothing else.';

    // Use Claude's vision capabilities to analyze the image
    const analysis = await cloudProvider.analyzeImage(imageBuffer, prompt);

    // Parse the JSON response
    let complianceResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        complianceResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      logger.error('Failed to parse compliance result:', parseError);
      return res.status(500).json({
        error: 'Failed to parse compliance analysis'
      });
    }

    logger.info(`Compliance check result: ${JSON.stringify(complianceResult)}`);

    res.json({
      compliant: complianceResult.compliant,
      logoPresent: complianceResult.logoPresent,
      colorsPresent: complianceResult.colorsPresent,
      details: complianceResult.details,
      checks
    });

  } catch (error) {
    logger.error('Error checking brand compliance:', error);
    res.status(500).json({
      error: 'Failed to check brand compliance'
    });
  }
});

export default router;
