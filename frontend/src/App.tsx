import React, { useState, useEffect } from 'react';
import { BriefForm } from './components/BriefBuilder/BriefForm';
import { GenerationProgress } from './components/Dashboard/GenerationProgress';
import { AssetGrid } from './components/Gallery/AssetGrid';
import { CampaignBrief, ProgressEvent, GeneratedAsset } from './types';
import { campaignApi, createWebSocket, assetsApi } from './services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

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

    loadExistingAssets();
  }, []);

  useEffect(() => {
    if (!currentCampaignId) return;

    const ws = createWebSocket(currentCampaignId);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const progressEvent: ProgressEvent = JSON.parse(event.data);
      console.log('Progress event:', progressEvent);

      setEvents(prev => [...prev, progressEvent]);

      if (progressEvent.asset) {
        setAssets(prev => [...prev, progressEvent.asset!]);
      }

      if (progressEvent.type === 'complete') {
        setIsGenerating(false);
        toast.success('Campaign generation complete!');
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
      setEvents([]);
      // Don't clear assets - we want to keep existing ones visible
      setCurrentCampaignId(brief.campaignId);

      toast.loading('Starting campaign generation...', { id: 'generate' });

      await campaignApi.generateCampaign(brief);

      toast.success('Campaign generation started!', { id: 'generate' });
    } catch (error) {
      console.error('Error generating campaign:', error);
      toast.error('Failed to start campaign generation', { id: 'generate' });
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creative Boost</h1>
              <p className="text-sm text-gray-600">AI-Powered Campaign Generation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Brief Builder */}
          <div>
            <BriefForm onSubmit={handleGenerateCampaign} isGenerating={isGenerating} />
          </div>

          {/* Right Column - Progress and Gallery */}
          <div className="space-y-8">
            {events.length > 0 && (
              <GenerationProgress events={events} assets={assets} />
            )}
          </div>
        </div>

        {/* Asset Gallery - Full Width */}
        <div className="mt-8">
          <AssetGrid assets={assets} />
        </div>
      </main>
    </div>
  );
}

export default App;
