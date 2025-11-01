import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Info, Copy, Check, Sparkles } from 'lucide-react';
import { CampaignBrief, Product } from '../../types';
import toast from 'react-hot-toast';
import { campaignApi } from '../../services/api';

interface BriefFormProps {
  onSubmit: (brief: CampaignBrief) => void;
  isGenerating: boolean;
  loadedBrief?: CampaignBrief | null;
  onBriefLoaded?: () => void;
  onFormChange?: (brief: CampaignBrief) => void;
}

export const BriefForm: React.FC<BriefFormProps> = ({ onSubmit, isGenerating, loadedBrief, onBriefLoaded, onFormChange }) => {
  const { t } = useTranslation();
  const [campaignId, setCampaignId] = useState(`campaign-${Date.now()}`);
  const [targetRegion, setTargetRegion] = useState('United States');
  const [targetAudience, setTargetAudience] = useState('Young professionals aged 25-35');
  const [message, setMessage] = useState('Discover the Difference');
  const [aiPromptAssist, setAiPromptAssist] = useState(false);
  const [generateAnalytics, setGenerateAnalytics] = useState(false);
  const [useArtStyle, setUseArtStyle] = useState(false);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [copied, setCopied] = useState(false);
  const [copiedEnhanced, setCopiedEnhanced] = useState(false);
  const [enhancedMessage, setEnhancedMessage] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const artStyles = [
    { value: 'photorealistic', label: 'Photorealistic' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'modern', label: 'Modern' },
    { value: 'luxury', label: 'Luxury / High-End' },
    { value: 'playful', label: 'Playful / Cartoon' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'oil-painting', label: 'Oil Painting' },
    { value: 'sketch', label: 'Sketch / Hand-Drawn' },
    { value: 'neon', label: 'Neon / Cyberpunk' },
    { value: 'pastel', label: 'Pastel / Soft' },
    { value: 'bold-graphic', label: 'Bold Graphic' },
    { value: 'retro', label: 'Retro / 80s' },
    { value: 'art-deco', label: 'Art Deco' },
    { value: 'pop-art', label: 'Pop Art' }
  ];
  const [products, setProducts] = useState<Product[]>([
    { id: 'prod-1', name: 'Premium Coffee Blend', description: 'Artisan roasted coffee beans with rich, smooth flavor' },
    { id: 'prod-2', name: 'Organic Green Tea', description: 'Premium loose-leaf green tea, sustainably sourced' }
  ]);

  // Load campaign from imported brief
  useEffect(() => {
    if (loadedBrief) {
      setCampaignId(loadedBrief.campaignId);
      setTargetRegion(loadedBrief.targetRegion);
      setTargetAudience(loadedBrief.targetAudience);
      setMessage(loadedBrief.message);
      setProducts(loadedBrief.products);
      setAiPromptAssist(loadedBrief.aiPromptAssist || false);
      setGenerateAnalytics(loadedBrief.generateAnalytics || false);
      setUseArtStyle(loadedBrief.useArtStyle || false);
      setArtStyle(loadedBrief.artStyle || 'photorealistic');

      toast.success(t('toast.campaignLoaded'));
      onBriefLoaded?.();
    }
  }, [loadedBrief, onBriefLoaded, t]);

  // Notify parent of form changes (debounced to avoid performance issues)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentBrief: CampaignBrief = {
        campaignId,
        products,
        targetRegion,
        targetAudience,
        message,
        aiPromptAssist,
        generateAnalytics,
        useArtStyle,
        artStyle: useArtStyle ? artStyle : undefined
      };
      onFormChange?.(currentBrief);
    }, 300); // Wait 300ms after last change before notifying parent

    return () => clearTimeout(timeoutId);
  }, [campaignId, products, targetRegion, targetAudience, message, aiPromptAssist, generateAnalytics, useArtStyle, artStyle, onFormChange]);

  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
  const hotjarSiteId = import.meta.env.VITE_HOTJAR_SITE_ID || '1234567';

  const gaTrackingCode = `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaMeasurementId}', {
    'campaign_id': '${campaignId}',
    'campaign_name': '${message}'
  });
</script>`;

  const hotjarTrackingCode = `<!-- Hotjar Tracking Code -->
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${hotjarSiteId},hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`;

  const combinedTrackingCode = `${gaTrackingCode}

${hotjarTrackingCode}`;

  const addProduct = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: '',
      description: ''
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 2) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(combinedTrackingCode);
      setCopied(true);
      toast.success('Tracking codes copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const copyEnhancedMessage = async () => {
    try {
      await navigator.clipboard.writeText(enhancedMessage);
      setCopiedEnhanced(true);
      toast.success('Enhanced message copied to clipboard!');
      setTimeout(() => setCopiedEnhanced(false), 2000);
    } catch (err) {
      toast.error('Failed to copy message');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalMessage = message;

    // If AI Message Assist is enabled, enhance the message first
    if (aiPromptAssist) {
      try {
        setIsEnhancing(true);
        toast.loading('Enhancing message with AI...', { id: 'enhance' });

        const result = await campaignApi.enhancePrompt(message, targetRegion, targetAudience);
        finalMessage = result.enhancedMessage;
        setEnhancedMessage(finalMessage);

        toast.success('Message enhanced!', { id: 'enhance' });
      } catch (error) {
        console.error('Error enhancing message:', error);
        toast.error('Failed to enhance message, using original', { id: 'enhance' });
        finalMessage = message;
      } finally {
        setIsEnhancing(false);
      }
    }

    const brief: CampaignBrief = {
      campaignId,
      products,
      targetRegion,
      targetAudience,
      message: finalMessage,
      aiPromptAssist,
      generateAnalytics,
      useArtStyle,
      artStyle: useArtStyle ? artStyle : undefined
    };
    onSubmit(brief);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Campaign Brief */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">{t('brief.title')}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('brief.campaignId')}
            </label>
            <input
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('brief.targetRegion')}
            </label>
            <input
              type="text"
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('brief.targetRegionPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('brief.targetAudience')}
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('brief.targetAudiencePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('brief.campaignMessage')}
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('brief.campaignMessagePlaceholder')}
              required
            />
          </div>

          {/* Campaign Options */}
          <div className="pt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aiPromptAssist"
                  checked={aiPromptAssist}
                  onChange={(e) => setAiPromptAssist(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="aiPromptAssist" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  {t('brief.aiMessageAssist')}
                  <div className="relative group">
                    <Info size={16} className="text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      {t('brief.aiMessageAssistDesc')}
                    </div>
                  </div>
                </label>
              </div>

              {/* Show Enhanced Message when available */}
              {aiPromptAssist && enhancedMessage && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600" />
                      <h4 className="text-xs font-semibold text-purple-900">{t('brief.aiEnhancedMessage')}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={copyEnhancedMessage}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                    >
                      {copiedEnhanced ? (
                        <>
                          <Check size={12} />
                          {t('brief.copied')}
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          {t('brief.copy')}
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    readOnly
                    value={enhancedMessage}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600 text-sm cursor-text"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <p className="mt-1 text-xs text-purple-700">
                    {t('brief.culturallyOptimized')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generateAnalytics"
                checked={generateAnalytics}
                onChange={(e) => setGenerateAnalytics(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="generateAnalytics" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {t('brief.generateAnalyticsCode')}
                <div className="relative group">
                  <Info size={16} className="text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                    {t('brief.generateAnalyticsDesc')}
                  </div>
                </div>
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useArtStyle"
                  checked={useArtStyle}
                  onChange={(e) => setUseArtStyle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useArtStyle" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  {t('brief.applyArtStyle')}
                  <div className="relative group">
                    <Info size={16} className="text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      {t('brief.applyArtStyleDesc')}
                    </div>
                  </div>
                </label>
              </div>

              {/* Show Art Style Dropdown when checkbox is checked */}
              {useArtStyle && (
                <div className="mt-3">
                  <select
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {artStyles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Show Analytics Tracking Code when checkbox is checked */}
            {generateAnalytics && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t('brief.analyticsTracking')}</h4>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        {t('brief.copied')}
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        {t('brief.copyCode')}
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={combinedTrackingCode}
                  className="w-full h-48 px-3 py-2 bg-white border border-gray-300 rounded font-mono text-xs text-gray-800 resize-none"
                  onClick={(e) => e.currentTarget.select()}
                />
                <p className="mt-2 text-xs text-gray-600">
                  {t('brief.pasteInHead')} <code className="px-1 py-0.5 bg-gray-200 rounded">&lt;head&gt;</code> {t('brief.section')}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Right Column - Products */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{t('brief.products')}</h3>
            <button
              type="button"
              onClick={addProduct}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Plus size={16} /> {t('brief.add')}
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {products.map((product, index) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{t('brief.product')} {index + 1}</h4>
                  {products.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('brief.productNamePlaceholder')}
                    required
                  />
                  <textarea
                    value={product.description}
                    onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('brief.productDescriptionPlaceholder')}
                    rows={2}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button - Full Width Below */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isGenerating || isEnhancing}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
        >
          {isEnhancing ? t('brief.enhancingButton') : isGenerating ? t('brief.generatingButton') : t('brief.generateButton')}
        </button>
      </div>
    </form>
  );
};
