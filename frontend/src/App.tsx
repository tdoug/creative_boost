import React, { useState, useEffect, useRef } from 'react';
import { BriefForm } from './components/BriefBuilder/BriefForm';
import { GenerationProgress } from './components/Dashboard/GenerationProgress';
import { AssetGrid } from './components/Gallery/AssetGrid';
import { HamburgerMenu } from './components/Menu/HamburgerMenu';
import { CampaignBrief, ProgressEvent, GeneratedAsset } from './types';
import { campaignApi, createWebSocket, assetsApi } from './services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles, ArrowDown } from 'lucide-react';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [currentBrief, setCurrentBrief] = useState<CampaignBrief | null>(null);
  const [loadedBrief, setLoadedBrief] = useState<CampaignBrief | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Load all existing assets on mount
  useEffect(() => {
    const loadExistingAssets = async () => {
      try {
        const existingAssets = await assetsApi.listAllAssets();
        setAssets(existingAssets);
      } catch (error) {
        console.error('Error loading existing assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    // Initial load
    loadExistingAssets();
  }, []); // Only run once on mount

  useEffect(() => {
    if (!currentCampaignId) return;

    const ws = createWebSocket(currentCampaignId);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = async (event) => {
      const progressEvent: ProgressEvent = JSON.parse(event.data);
      console.log('Progress event:', progressEvent);

      setEvents(prev => [...prev, progressEvent]);

      if (progressEvent.asset) {
        setAssets(prev => [...prev, progressEvent.asset!]);
      }

      if (progressEvent.type === 'complete') {
        setIsGenerating(false);
        toast.success('Campaign generation complete!');

        // Refresh gallery once when generation batch completes
        try {
          const latestAssets = await assetsApi.listAllAssets();
          console.log(`Gallery refreshed: ${latestAssets.length} assets`);
          setAssets(latestAssets);
        } catch (error) {
          console.error('Error refreshing gallery after completion:', error);
        }
      } else if (progressEvent.type === 'error' && !progressEvent.productId) {
        setIsGenerating(false);
        toast.error('Campaign generation failed');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [currentCampaignId]);

  const handleGenerateCampaign = async (brief: CampaignBrief) => {
    try {
      setIsGenerating(true);
      setCurrentCampaignId(brief.campaignId);
      setCurrentBrief(brief);
      setEvents([]); // Clear previous events

      // Don't clear assets - we want to keep existing ones visible

      toast.loading('Starting campaign generation...', { id: 'generate' });

      await campaignApi.generateCampaign(brief);

      toast.success('Campaign generation started!', { id: 'generate' });
    } catch (error) {
      console.error('Error generating campaign:', error);
      toast.error('Failed to start campaign generation', { id: 'generate' });
      setIsGenerating(false);
    }
  };

  const handleLoadCampaign = (brief: CampaignBrief) => {
    setLoadedBrief(brief);
    setCurrentBrief(brief);
  };

  const handleFormChange = (brief: CampaignBrief) => {
    setCurrentBrief(brief);
  };

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <HamburgerMenu currentBrief={currentBrief} onLoadCampaign={handleLoadCampaign} />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-blue-600" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Creative Boost</h1>
                <p className="text-sm text-gray-600">AI-Powered Campaign Generation</p>
              </div>
            </div>
            <button
              onClick={scrollToGallery}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowDown size={20} />
              Jump to Gallery
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brief Builder - Full Width */}
        <div className="mb-8">
          <BriefForm
            onSubmit={handleGenerateCampaign}
            isGenerating={isGenerating}
            loadedBrief={loadedBrief}
            onBriefLoaded={() => setLoadedBrief(null)}
            onFormChange={handleFormChange}
          />
        </div>

        {/* Progress - Show when generating or when there are events to display */}
        {(isGenerating || events.length > 0) && (
          <div className="mb-8">
            <GenerationProgress events={events} assets={assets} isGenerating={isGenerating} />
          </div>
        )}

        {/* Asset Gallery - Full Width */}
        <div ref={galleryRef} className="mt-8">
          <AssetGrid assets={assets} />
        </div>
      </main>
    </div>
  );
}

export default App;
