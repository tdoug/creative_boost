import React, { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { GeneratedAsset } from '../../types';
import { assetsApi } from '../../services/api';

interface AssetGridProps {
  assets: GeneratedAsset[];
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets }) => {
  const [filterRatio, setFilterRatio] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');

  const filteredAssets = assets.filter(asset => {
    if (filterRatio !== 'all' && asset.aspectRatio !== filterRatio) return false;
    if (filterProduct !== 'all' && asset.productId !== filterProduct) return false;
    return true;
  });

  const uniqueRatios = Array.from(new Set(assets.map(a => a.aspectRatio)));
  const uniqueProducts = Array.from(new Set(assets.map(a => ({ id: a.productId, name: a.productName }))));

  const downloadAsset = async (asset: GeneratedAsset) => {
    const url = assetsApi.getAssetUrl(asset.path);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${asset.productName}_${asset.aspectRatio}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Asset Gallery</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter size={16} />
          <span>{filteredAssets.length} of {assets.length} assets</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aspect Ratio
          </label>
          <select
            value={filterRatio}
            onChange={(e) => setFilterRatio(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratios</option>
            {uniqueRatios.map(ratio => (
              <option key={ratio} value={ratio}>{ratio}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product
          </label>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Products</option>
            {uniqueProducts.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No assets generated yet. Create a campaign to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100">
                <img
                  src={assetsApi.getAssetUrl(asset.path)}
                  alt={`${asset.productName} - ${asset.aspectRatio}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{asset.productName}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Aspect Ratio: {asset.aspectRatio}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {asset.metadata.dimensions.width} × {asset.metadata.dimensions.height}
                </p>
                <button
                  onClick={() => downloadAsset(asset)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
