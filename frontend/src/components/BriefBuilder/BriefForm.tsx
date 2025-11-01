import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CampaignBrief, Product } from '../../types';

interface BriefFormProps {
  onSubmit: (brief: CampaignBrief) => void;
  isGenerating: boolean;
}

export const BriefForm: React.FC<BriefFormProps> = ({ onSubmit, isGenerating }) => {
  const [campaignId, setCampaignId] = useState(`campaign-${Date.now()}`);
  const [targetRegion, setTargetRegion] = useState('United States');
  const [targetAudience, setTargetAudience] = useState('Young professionals aged 25-35');
  const [message, setMessage] = useState('Discover the Difference');
  const [products, setProducts] = useState<Product[]>([
    { id: 'prod-1', name: 'Premium Coffee Blend', description: 'Artisan roasted coffee beans with rich, smooth flavor' },
    { id: 'prod-2', name: 'Organic Green Tea', description: 'Premium loose-leaf green tea, sustainably sourced' }
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const brief: CampaignBrief = {
      campaignId,
      products,
      targetRegion,
      targetAudience,
      message
    };
    onSubmit(brief);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Campaign Brief</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign ID
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
              Target Region
            </label>
            <input
              type="text"
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Message
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your campaign message..."
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Products (minimum 2)</h3>
          <button
            type="button"
            onClick={addProduct}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus size={20} /> Add Product
          </button>
        </div>

        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-700">Product {index + 1}</h4>
                {products.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name..."
                  required
                />
                <textarea
                  value={product.description}
                  onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product description..."
                  rows={2}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
      >
        {isGenerating ? 'Generating...' : 'Generate Campaign'}
      </button>
    </form>
  );
};
