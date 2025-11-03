import jsPDF from 'jspdf';
import { CampaignBrief, ProgressEvent, GeneratedAsset } from '../types';
import { API_BASE_URL } from '../services/api';

export async function generateCampaignReport(
  brief: CampaignBrief,
  events: ProgressEvent[],
  assets: GeneratedAsset[]
): Promise<void> {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Report', margin, yPosition);
  yPosition += 15;

  // Campaign ID
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(brief.campaignId, margin, yPosition);
  yPosition += 10;
  doc.setTextColor(0, 0, 0);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Campaign Settings Section
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Settings', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Target Region
  doc.setFont('helvetica', 'bold');
  doc.text('Target Region:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(brief.targetRegion, margin + 40, yPosition);
  yPosition += 7;

  // Target Audience
  doc.setFont('helvetica', 'bold');
  doc.text('Target Audience:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(brief.targetAudience, margin + 40, yPosition);
  yPosition += 7;

  // Campaign Message
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Message:', margin, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  const messageLines = doc.splitTextToSize(brief.message, contentWidth - 10);
  doc.text(messageLines, margin + 5, yPosition);
  yPosition += messageLines.length * 5 + 5;

  // Products
  doc.setFont('helvetica', 'bold');
  doc.text(`Products (${brief.products.length}):`, margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  brief.products.forEach((product, index) => {
    checkPageBreak(15);
    doc.text(`${index + 1}. ${product.name}`, margin + 5, yPosition);
    yPosition += 5;
    if (product.description) {
      const descLines = doc.splitTextToSize(product.description, contentWidth - 15);
      doc.setTextColor(100, 100, 100);
      doc.text(descLines, margin + 8, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += descLines.length * 5;
    }
    yPosition += 3;
  });

  yPosition += 5;

  // Optional Features
  const features: string[] = [];
  if (brief.aiPromptAssist) features.push('AI-Powered Message Assist');
  if (brief.generateAnalytics) features.push('Analytics Tracking');
  if (brief.useArtStyle && brief.artStyle) features.push(`Art Style: ${brief.artStyle}`);
  if (brief.brandAssets?.logo) features.push('Brand Logo');
  if (brief.brandAssets?.primaryColor) features.push(`Primary Color: ${brief.brandAssets.primaryColor}`);
  if (brief.brandAssets?.secondaryColor) features.push(`Secondary Color: ${brief.brandAssets.secondaryColor}`);

  if (features.length > 0) {
    checkPageBreak(20 + features.length * 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Features Enabled:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    features.forEach(feature => {
      doc.text(`• ${feature}`, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Models Used Section
  checkPageBreak(30);
  yPosition += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Models Used', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('• Image Generation: Amazon Nova Canvas', margin + 5, yPosition);
  yPosition += 6;
  doc.text('• Text Enhancement: Claude 3.5 Sonnet (AWS Bedrock)', margin + 5, yPosition);
  yPosition += 10;

  // Prompts Section (if art style was used)
  const eventsWithPrompts = events.filter(e => e.prompt);
  if (eventsWithPrompts.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Generation Prompts', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    eventsWithPrompts.forEach((event) => {
      checkPageBreak(25);
      if (event.prompt) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${event.productId || 'Product'} - ${event.aspectRatio || 'Ratio'}:`, margin, yPosition);
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        const promptLines = doc.splitTextToSize(event.prompt, contentWidth - 10);
        doc.setTextColor(80, 80, 80);
        doc.text(promptLines, margin + 5, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += promptLines.length * 4 + 8;
      }
    });
  }

  // Generated Assets Section
  checkPageBreak(40);
  yPosition += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Generated Assets', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${assets.length} images will be displayed on the following pages (one per page)`, margin, yPosition);

  // Group assets by product
  const assetsByProduct = assets.reduce((acc, asset) => {
    if (!acc[asset.productId]) {
      acc[asset.productId] = [];
    }
    acc[asset.productId].push(asset);
    return acc;
  }, {} as Record<string, GeneratedAsset[]>);

  // Add each image on its own page
  for (const [productId, productAssets] of Object.entries(assetsByProduct)) {
    const productName = productAssets[0]?.productName || productId;

    for (const asset of productAssets) {
      // Start a new page for each image
      doc.addPage();

      try {
        // Fetch the image as base64
        const imageUrl = `${API_BASE_URL}/api/assets/file/${asset.path}`;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Parse aspect ratio to get width and height
        const [widthRatio, heightRatio] = asset.aspectRatio.split(':').map(Number);
        const aspectRatio = widthRatio / heightRatio;

        // Calculate available space (with margins)
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin - 40; // Reserve space for title and footer

        // Calculate dimensions to fit the page while maintaining aspect ratio
        let imageWidth: number;
        let imageHeight: number;

        if (aspectRatio > availableWidth / availableHeight) {
          // Width is the limiting factor
          imageWidth = availableWidth;
          imageHeight = imageWidth / aspectRatio;
        } else {
          // Height is the limiting factor
          imageHeight = availableHeight;
          imageWidth = imageHeight * aspectRatio;
        }

        // Center the image on the page
        const xPosition = (pageWidth - imageWidth) / 2;
        const yPosition = margin + 30;

        // Add title at the top
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${productName}`, pageWidth / 2, margin, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Aspect Ratio: ${asset.aspectRatio} • ${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height}`, pageWidth / 2, margin + 8, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // Add image to PDF with proper aspect ratio
        doc.addImage(base64, 'PNG', xPosition, yPosition, imageWidth, imageHeight);

      } catch (error) {
        console.error('Error loading image for PDF:', error);

        // Display error message
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${productName}`, pageWidth / 2, margin, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 0, 0);
        doc.text('Image not available', pageWidth / 2, pageHeight / 2, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`campaign-report-${brief.campaignId}.pdf`);
}
