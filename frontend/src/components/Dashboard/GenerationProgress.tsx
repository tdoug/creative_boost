import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { ProgressEvent, GeneratedAsset } from '../../types';
import { assetsApi } from '../../services/api';

interface GenerationProgressProps {
  events: ProgressEvent[];
  assets: GeneratedAsset[];
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ events, assets }) => {
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

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {uniqueEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <div className="flex-shrink-0 mt-1">
                {getIcon(event)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{event.message}</p>
                {event.asset && (
                  <div className="mt-2 cursor-pointer" onClick={() => setSelectedAsset(event.asset!)}>
                    <img
                      src={assetsApi.getAssetUrl(event.asset.path)}
                      alt={`${event.asset.productName} - ${event.asset.aspectRatio}`}
                      className="w-32 h-32 object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
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
