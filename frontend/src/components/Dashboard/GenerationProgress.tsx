import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ProgressEvent, GeneratedAsset } from '../../types';
import { assetsApi } from '../../services/api';

interface GenerationProgressProps {
  events: ProgressEvent[];
  assets: GeneratedAsset[];
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ events, assets }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'complete':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'error':
        return <XCircle className="text-red-600" size={24} />;
      default:
        return <Loader2 className="text-blue-600 animate-spin" size={24} />;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Generation Progress</h2>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {events.map((event, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <div className="flex-shrink-0 mt-1">
              {getIcon(event.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{event.message}</p>
              {event.asset && (
                <div className="mt-2">
                  <img
                    src={assetsApi.getAssetUrl(event.asset.path)}
                    alt={`${event.asset.productName} - ${event.asset.aspectRatio}`}
                    className="w-32 h-32 object-cover rounded border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {assets.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Generated {assets.length} assets so far...
          </p>
        </div>
      )}
    </div>
  );
};
