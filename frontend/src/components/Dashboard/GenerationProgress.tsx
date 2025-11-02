import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, X, FileDown } from 'lucide-react';
import { ProgressEvent, GeneratedAsset, CampaignBrief } from '../../types';
import { assetsApi } from '../../services/api';
import { generateCampaignReport } from '../../utils/pdfReport';
import toast from 'react-hot-toast';

interface GenerationProgressProps {
  events: ProgressEvent[];
  assets: GeneratedAsset[];
  isGenerating: boolean;
  currentBrief: CampaignBrief | null;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ events, assets, isGenerating, currentBrief }) => {
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadReport = async () => {
    if (!currentBrief) {
      toast.error('No campaign data available');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      toast.loading('Generating PDF report...', { id: 'pdf' });

      // Filter assets for this campaign
      const campaignAssets = assets.filter(asset =>
        events.some(e => e.asset?.path === asset.path)
      );

      await generateCampaignReport(currentBrief, events, campaignAssets);

      toast.success('Report downloaded successfully!', { id: 'pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report', { id: 'pdf' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Check if generation is complete (has a complete event and not currently generating)
  const isComplete = !isGenerating && events.some(e => e.type === 'complete');
  const getIcon = (event: ProgressEvent) => {
    if (event.type === 'complete' || event.completed) {
      return <CheckCircle className="text-green-600" size={24} />;
    } else if (event.type === 'error') {
      return <XCircle className="text-red-600" size={24} />;
    } else {
      return <Loader2 className="text-blue-600 animate-spin" size={24} />;
    }
  };

  // Deduplicate events - keep only the latest event for each product/aspectRatio combination
  const getUniqueEvents = () => {
    const eventMap = new Map<string, ProgressEvent>();
    const productsWithCompletedVariants = new Set<string>();

    // First pass: identify products that have completed variants
    events.forEach(event => {
      if (event.completed && event.productId && event.aspectRatio) {
        productsWithCompletedVariants.add(event.productId);
      }
    });

    events.forEach(event => {
      // Skip "Generating image" events if we have completed variants for that product
      if (event.productId && !event.aspectRatio && !event.completed &&
          productsWithCompletedVariants.has(event.productId)) {
        return;
      }

      // Create a unique key for each product/aspect ratio combination
      const key = event.productId && event.aspectRatio
        ? `${event.productId}-${event.aspectRatio}`
        : event.type === 'start' ? 'start' :
          event.productId ? `${event.productId}-base` : `global-${event.type}`;

      // Always keep the latest event for this key
      // If there's a completed event, it will overwrite the in-progress event
      eventMap.set(key, event);
    });

    return Array.from(eventMap.values());
  };

  const uniqueEvents = getUniqueEvents();

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Generation Progress</h2>
          {isComplete && currentBrief && (
            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FileDown size={20} />
              {isGeneratingPdf ? 'Generating Report...' : 'Download Campaign Report'}
            </button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {uniqueEvents.length === 0 && isGenerating ? (
            <div className="flex items-center justify-center p-8 w-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-blue-600 animate-spin" size={48} />
                <p className="text-gray-600">Initializing campaign generation...</p>
              </div>
            </div>
          ) : (
            uniqueEvents.map((event, index) => (
            <div key={index} className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {getIcon(event)}
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{event.message}</p>
              </div>
              {event.prompt && (
                <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Custom Art Style Prompt:</p>
                  <p className="text-xs text-purple-800 font-mono line-clamp-2">{event.prompt}</p>
                </div>
              )}
              {event.asset && (
                <div className="cursor-pointer" onClick={() => setSelectedAsset(event.asset!)}>
                  <img
                    key={event.asset.path}
                    src={assetsApi.getAssetUrl(event.asset.path, false)}
                    alt={`${event.asset.productName} - ${event.asset.aspectRatio}`}
                    className="w-full aspect-square object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>

      {/* Full Resolution Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img
              src={assetsApi.getAssetUrl(selectedAsset.path, false)}
              alt={`${selectedAsset.productName} - ${selectedAsset.aspectRatio}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
              <h3 className="text-lg font-semibold">{selectedAsset.productName}</h3>
              <p className="text-sm text-gray-300">
                {selectedAsset.aspectRatio} • {selectedAsset.metadata.dimensions.width} × {selectedAsset.metadata.dimensions.height}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
