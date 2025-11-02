import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Filter, X, ShieldCheck } from 'lucide-react';
import { GeneratedAsset, BrandAssets } from '../../types';
import { assetsApi, complianceApi } from '../../services/api';
import toast from 'react-hot-toast';

interface AssetGridProps {
  assets: GeneratedAsset[];
  brandAssets?: BrandAssets;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets, brandAssets }) => {
  const { t } = useTranslation();
  const [filterRatio, setFilterRatio] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [downloadingAsset, setDownloadingAsset] = useState<string | null>(null);
  const [checkingCompliance, setCheckingCompliance] = useState<string | null>(null);

  // Extract timestamp from asset path for sorting
  const getAssetTimestamp = (asset: GeneratedAsset): number => {
    // Path format: campaignId/productId/aspectRatio_timestamp.png
    const match = asset.path.match(/_(\d+)\.\w+$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Filter by aspect ratio and sort by timestamp (newest first)
  const filteredAssets = assets
    .filter(asset => {
      if (filterRatio !== 'all' && asset.aspectRatio !== filterRatio) return false;
      return true;
    })
    .sort((a, b) => getAssetTimestamp(b) - getAssetTimestamp(a));

  const uniqueRatios = Array.from(new Set(assets.map(a => a.aspectRatio)));

  const downloadAsset = async (asset: GeneratedAsset) => {
    try {
      setDownloadingAsset(asset.path);

      // Fetch the image as a blob
      const url = assetsApi.getAssetUrl(asset.path, false);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch asset');
      }

      const blob = await response.blob();

      // Create a download link from the blob
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${asset.productName.replace(/\s+/g, '_')}_${asset.aspectRatio.replace(':', 'x')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      toast.success('Asset downloaded successfully!');
    } catch (error) {
      console.error('Error downloading asset:', error);
      toast.error('Failed to download asset. Please try again.');
    } finally {
      setDownloadingAsset(null);
    }
  };

  const handleCheckCompliance = async (asset: GeneratedAsset) => {
    if (!brandAssets) return;

    try {
      setCheckingCompliance(asset.path);
      toast.loading(t('toast.checkingCompliance'), { id: 'compliance' });

      const result = await complianceApi.checkBrandCompliance(asset.path, {
        logo: brandAssets.logo,
        primaryColor: brandAssets.primaryColor,
        secondaryColor: brandAssets.secondaryColor
      });

      if (result.compliant) {
        toast.success(`✓ Brand compliant: ${result.details}`, { id: 'compliance', duration: 5000 });
      } else {
        toast.error(`✗ Brand compliance issue: ${result.details}`, { id: 'compliance', duration: 5000 });
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
      toast.error(t('toast.complianceCheckFailed'), { id: 'compliance' });
    } finally {
      setCheckingCompliance(null);
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('gallery.title')}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>{filteredAssets.length} of {assets.length} assets</span>
          </div>
        </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">
          {t('progress.ratio')}:
        </label>
        <select
          value={filterRatio}
          onChange={(e) => setFilterRatio(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('gallery.filterAll')}</option>
          {uniqueRatios.map(ratio => (
            <option key={ratio} value={ratio}>{ratio}</option>
          ))}
        </select>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('gallery.noAssetsDesc')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                <img
                  key={asset.path}
                  src={assetsApi.getAssetUrl(asset.path, false)}
                  alt={`${asset.productName} - ${asset.aspectRatio}`}
                  className="w-full h-full object-contain hover:opacity-90 transition-opacity"
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
                  disabled={downloadingAsset === asset.path}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  <Download size={16} className={downloadingAsset === asset.path ? 'animate-bounce' : ''} />
                  {downloadingAsset === asset.path ? t('gallery.loading') : t('gallery.download')}
                </button>
                {brandAssets && (brandAssets.logo || brandAssets.primaryColor || brandAssets.secondaryColor) && (
                  <button
                    onClick={() => handleCheckCompliance(asset)}
                    disabled={checkingCompliance === asset.path}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                  >
                    <ShieldCheck size={16} className={checkingCompliance === asset.path ? 'animate-pulse' : ''} />
                    {checkingCompliance === asset.path ? t('gallery.checking') : t('gallery.checkCompliance')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
