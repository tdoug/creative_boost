import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { ProgressEvent, GeneratedAsset } from '../../types';
import { assetsApi } from '../../services/api';

interface GenerationProgressProps {
  events: ProgressEvent[];
  assets: GeneratedAsset[];
  isGenerating: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ events, assets, isGenerating }) => {
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
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
        <h2 className="text-2xl font-bold mb-6">Generation Progress</h2>

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
                    key={`${event.asset.path}-${Date.now()}`}
                    src={assetsApi.getAssetUrl(event.asset.path)}
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
              src={assetsApi.getAssetUrl(selectedAsset.path)}
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
