import React, { useState, useRef } from 'react';
import { Menu, X, Upload, Download, Trash2, FileText, Copy, Save } from 'lucide-react';
import { CampaignBrief } from '../../types';
import toast from 'react-hot-toast';

interface HamburgerMenuProps {
  currentBrief: CampaignBrief | null;
  onLoadCampaign: (brief: CampaignBrief) => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ currentBrief, onLoadCampaign }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSavedCampaigns, setShowSavedCampaigns] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get saved campaigns from localStorage
  const getSavedCampaigns = (): CampaignBrief[] => {
    try {
      const saved = localStorage.getItem('savedCampaigns');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved campaigns:', error);
      return [];
    }
  };

  // Save campaign to localStorage
  const saveCampaign = (brief: CampaignBrief) => {
    try {
      const campaigns = getSavedCampaigns();
      const existing = campaigns.findIndex(c => c.campaignId === brief.campaignId);

      if (existing >= 0) {
        campaigns[existing] = brief;
        toast.success('Campaign updated!');
      } else {
        campaigns.push(brief);
        toast.success('Campaign saved!');
      }

      localStorage.setItem('savedCampaigns', JSON.stringify(campaigns));
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  // Save current campaign
  const handleSaveCurrent = () => {
    if (!currentBrief) {
      toast.error('No campaign to save');
      return;
    }

    saveCampaign(currentBrief);
    setIsOpen(false);
  };

  // Delete campaign from localStorage
  const deleteCampaign = (campaignId: string) => {
    try {
      const campaigns = getSavedCampaigns();
      const filtered = campaigns.filter(c => c.campaignId !== campaignId);
      localStorage.setItem('savedCampaigns', JSON.stringify(filtered));
      toast.success('Campaign deleted');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  // Export current campaign as JSON
  const handleExport = () => {
    if (!currentBrief) {
      toast.error('No campaign to export');
      return;
    }

    const json = JSON.stringify(currentBrief, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-${currentBrief.campaignId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Campaign exported!');
    setIsOpen(false);
  };

  // Import campaign from JSON text
  const handleImportFromText = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Validate required fields
      if (!parsed.campaignId || !parsed.products || !Array.isArray(parsed.products)) {
        throw new Error('Invalid campaign format. Must include campaignId and products array.');
      }

      if (parsed.products.length < 2) {
        throw new Error('Campaign must have at least 2 products.');
      }

      onLoadCampaign(parsed);
      saveCampaign(parsed);
      setShowImportModal(false);
      setJsonInput('');
      setIsOpen(false);
      toast.success('Campaign loaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid JSON format');
    }
  };

  // Import campaign from file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.campaignId || !parsed.products || !Array.isArray(parsed.products)) {
          throw new Error('Invalid campaign format');
        }

        if (parsed.products.length < 2) {
          throw new Error('Campaign must have at least 2 products');
        }

        onLoadCampaign(parsed);
        saveCampaign(parsed);
        setShowImportModal(false);
        setIsOpen(false);
        toast.success('Campaign loaded from file!');
      } catch (error: any) {
        toast.error(error.message || 'Invalid JSON file');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load a saved campaign
  const handleLoadSaved = (brief: CampaignBrief) => {
    onLoadCampaign(brief);
    setShowSavedCampaigns(false);
    setIsOpen(false);
    toast.success('Campaign loaded!');
  };

  const savedCampaigns = getSavedCampaigns();

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Campaign Menu</h2>

          <div className="space-y-4">
            {/* Save Campaign */}
            <button
              onClick={handleSaveCurrent}
              disabled={!currentBrief}
              className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={20} />
              <span>Save Campaign</span>
            </button>

            {/* Import Campaign */}
            <button
              onClick={() => {
                setShowImportModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload size={20} />
              <span>Import Campaign</span>
            </button>

            {/* Export Campaign */}
            <button
              onClick={handleExport}
              disabled={!currentBrief}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={20} />
              <span>Export Campaign</span>
            </button>

            {/* Saved Campaigns */}
            <button
              onClick={() => {
                setShowSavedCampaigns(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileText size={20} />
              <span>Saved Campaigns ({savedCampaigns.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Import Campaign</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setJsonInput('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload JSON File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-center text-gray-500 mb-6">OR</div>

              {/* Paste JSON */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"campaignId": "campaign-123", "products": [...], ...}'
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImportFromText}
                  disabled={!jsonInput.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Copy size={16} />
                    Import from Paste
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setJsonInput('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Campaigns Modal */}
      {showSavedCampaigns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Saved Campaigns</h3>
                <button
                  onClick={() => setShowSavedCampaigns(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {savedCampaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No saved campaigns yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedCampaigns.map((campaign) => (
                    <div
                      key={campaign.campaignId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{campaign.campaignId}</h4>
                          <p className="text-sm text-gray-600 mt-1">{campaign.message}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>{campaign.products.length} products</span>
                            <span>{campaign.targetRegion}</span>
                            <span>{campaign.targetAudience}</span>
                          </div>
                          {/* Show optional features if enabled */}
                          {(campaign.aiPromptAssist || campaign.generateAnalytics || campaign.useArtStyle) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {campaign.aiPromptAssist && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  AI Assist
                                </span>
                              )}
                              {campaign.generateAnalytics && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Analytics
                                </span>
                              )}
                              {campaign.useArtStyle && campaign.artStyle && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                  {campaign.artStyle}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadSaved(campaign)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete campaign "${campaign.campaignId}"?`)) {
                                deleteCampaign(campaign.campaignId);
                                // Force re-render by closing and reopening
                                setShowSavedCampaigns(false);
                                setTimeout(() => setShowSavedCampaigns(true), 100);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
