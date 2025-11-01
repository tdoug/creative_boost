import axios from 'axios';
import { CampaignBrief, GeneratedAsset } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const campaignApi = {
  async generateCampaign(brief: CampaignBrief): Promise<{ campaignId: string }> {
    const response = await api.post('/api/campaigns/generate', brief);
    return response.data;
  },

  async validateBrief(brief: CampaignBrief): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await api.post('/api/campaigns/validate', brief);
      return response.data;
    } catch (error: any) {
      return { valid: false, error: error.response?.data?.error || 'Validation failed' };
    }
  }
};

export const assetsApi = {
  async listAssets(campaignId: string): Promise<GeneratedAsset[]> {
    const response = await api.get(`/api/assets/${campaignId}`);
    return response.data.assets;
  },

  async listAllAssets(): Promise<GeneratedAsset[]> {
    const response = await api.get('/api/assets');
    return response.data.assets;
  },

  getAssetUrl(assetPath: string, bustCache: boolean = true): string {
    // Encode each path segment separately to preserve slashes
    const segments = assetPath.split('/').map(segment => encodeURIComponent(segment));
    const baseUrl = `${API_BASE_URL}/api/assets/file/${segments.join('/')}`;

    // Add cache-busting parameter to force browser to reload images
    if (bustCache) {
      return `${baseUrl}?t=${Date.now()}`;
    }

    return baseUrl;
  }
};

export function createWebSocket(campaignId: string): WebSocket {
  const wsUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
  return new WebSocket(`${wsUrl}/ws?campaignId=${campaignId}`);
}
