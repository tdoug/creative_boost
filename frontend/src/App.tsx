import React, { useState, useEffect } from 'react';
import { BriefForm } from './components/BriefBuilder/BriefForm';
import { GenerationProgress } from './components/Dashboard/GenerationProgress';
import { AssetGrid } from './components/Gallery/AssetGrid';
import { CampaignBrief, ProgressEvent, GeneratedAsset } from './types';
import { campaignApi, createWebSocket } from './services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);

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
      setAssets([]);
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
        {assets.length > 0 && (
          <div className="mt-8">
            <AssetGrid assets={assets} />
          </div>
        )}

        {/* Info Section */}
        {!isGenerating && assets.length === 0 && (
          <div className="mt-12 text-center">
            <div className="inline-block p-8 bg-white shadow rounded-lg">
              <Sparkles className="mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Creative Boost
              </h2>
              <p className="text-gray-600 max-w-md">
                Generate scalable social ad campaigns with AI. Fill out the campaign brief
                above and click "Generate Campaign" to create assets for multiple products
                and aspect ratios automatically.
              </p>
              <div className="mt-6 text-sm text-gray-500">
                <p>✨ Powered by AWS Bedrock</p>
                <p>📐 Generates 3 aspect ratios (1:1, 9:16, 16:9)</p>
                <p>🎨 Automatic text overlay with campaign message</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>Creative Boost - Proof of Concept for FDE Take-Home Exercise</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
