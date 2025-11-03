import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Info, Copy, Check, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { CampaignBrief, Product, BrandAssets } from '../../types';
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
  const [showAnalyticsCode, setShowAnalyticsCode] = useState(false);
  const [showBrandAssets, setShowBrandAssets] = useState(false);
  const [useArtStyle, setUseArtStyle] = useState(false);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [copied, setCopied] = useState(false);
  const [copiedEnhanced, setCopiedEnhanced] = useState(false);
  const [enhancedMessage, setEnhancedMessage] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [brandAssets, setBrandAssets] = useState<BrandAssets>({});
  // const [logoPreview, setLogoPreview] = useState<string>('');
  // const logoInputRef = useRef<HTMLInputElement>(null);

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
      setBrandAssets(loadedBrief.brandAssets || {});

      // Auto-expand Brand Assets section if brand assets exist
      if (loadedBrief.brandAssets?.logo || loadedBrief.brandAssets?.primaryColor || loadedBrief.brandAssets?.secondaryColor) {
        setShowBrandAssets(true);
      }

      // Handle logo preview if it's a string path
      // if (loadedBrief.brandAssets?.logo && typeof loadedBrief.brandAssets.logo === 'string') {
      //   // If it's a relative path, construct the full URL
      //   const logoPath = loadedBrief.brandAssets.logo;
      //   if (logoPath.startsWith('logos/')) {
      //     setLogoPreview(`${API_BASE_URL}/api/assets/file/${logoPath}`);
      //   } else {
      //     setLogoPreview(logoPath);
      //   }
      // }

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
        artStyle: useArtStyle ? artStyle : undefined,
        brandAssets: Object.keys(brandAssets).length > 0 ? brandAssets : undefined
      };
      onFormChange?.(currentBrief);
    }, 300); // Wait 300ms after last change before notifying parent

    return () => clearTimeout(timeoutId);
  }, [campaignId, products, targetRegion, targetAudience, message, aiPromptAssist, generateAnalytics, useArtStyle, artStyle, brandAssets, onFormChange]);

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

  // Commented out unused logo upload functionality
  // const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   // Validate file type
  //   if (!file.type.startsWith('image/')) {
  //     toast.error('Please upload an image file');
  //     return;
  //   }

  //   // Validate file size (max 5MB)
  //   if (file.size > 5 * 1024 * 1024) {
  //     toast.error('Logo file size must be less than 5MB');
  //     return;
  //   }

  //   // Create preview URL
  //   const previewUrl = URL.createObjectURL(file);
  //   setLogoPreview(previewUrl);

  //   // Update brand assets
  //   setBrandAssets(prev => ({ ...prev, logo: file }));
  //   toast.success('Logo uploaded successfully!');
  // };

  // const removeLogo = () => {
  //   setLogoPreview('');
  //   setBrandAssets(prev => {
  //     const { logo, ...rest } = prev;
  //     return rest;
  //   });
  //   if (logoInputRef.current) {
  //     logoInputRef.current.value = '';
  //   }
  // };

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    setBrandAssets(prev => ({ ...prev, [field]: value }));
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
      artStyle: useArtStyle ? artStyle : undefined,
      brandAssets: Object.keys(brandAssets).length > 0 ? brandAssets : undefined
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

          {/* Brand Assets - Collapsible */}
          <div className="pt-4 border-t border-gray-200">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBrandAssets(!showBrandAssets)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t('brief.brandAssets')}</span>
                {showBrandAssets ? (
                  <ChevronDown size={20} className="text-gray-500" />
                ) : (
                  <ChevronRight size={20} className="text-gray-500" />
                )}
              </button>

              {showBrandAssets && (
                <div className="p-4 bg-white border-t border-gray-200">
                  {/* Brand Assets Description */}
                  <div className="mb-4 flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <Info size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">
                      {t('brief.brandAssetsDesc')}
                    </p>
                  </div>

                  {/* Logo Upload */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Brand Logo {t('brief.optional')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBrandAssets(prev => ({ ...prev, logo: file }));
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {brandAssets.logo && (
                      <p className="mt-1 text-xs text-gray-500">
                        {brandAssets.logo instanceof File
                          ? brandAssets.logo.name
                          : typeof brandAssets.logo === 'string'
                            ? brandAssets.logo.split('/').pop() || 'Logo uploaded'
                            : 'Logo uploaded'}
                      </p>
                    )}
                  </div>

                  {/* Brand Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {t('brief.primaryColor')} {t('brief.optional')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={brandAssets.primaryColor || '#FFD700'}
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={brandAssets.primaryColor || ''}
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          placeholder="#FFD700"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {t('brief.secondaryColor')} {t('brief.optional')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={brandAssets.secondaryColor || '#0066CC'}
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={brandAssets.secondaryColor || ''}
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          placeholder="#0066CC"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Color Note */}
                  <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Brand colors are more likely to appear prominently in non-photorealistic art styles (e.g., minimalist, watercolor, playful). For photorealistic styles, colors may be subtly incorporated into the scene.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Tracking Code - Collapsible */}
          <div className="pt-4 border-t border-gray-200">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAnalyticsCode(!showAnalyticsCode)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t('brief.analyticsTrackingCodeHeader')}</span>
                {showAnalyticsCode ? (
                  <ChevronDown size={20} className="text-gray-500" />
                ) : (
                  <ChevronRight size={20} className="text-gray-500" />
                )}
              </button>

              {showAnalyticsCode && (
                <div className="p-4 bg-white border-t border-gray-200">
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
                    className="w-full h-48 px-3 py-2 bg-gray-50 border border-gray-300 rounded font-mono text-xs text-gray-800 resize-none"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    {t('brief.pasteInHead')} <code className="px-1 py-0.5 bg-gray-200 rounded">&lt;head&gt;</code> {t('brief.section')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Options */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
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
