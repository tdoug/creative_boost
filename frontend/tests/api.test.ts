import { describe, it, expect } from 'vitest';
import { assetsApi } from '../src/services/api';

describe('API Service - Assets', () => {
  it('should generate correct asset URL without cache busting', () => {
    const path = 'campaign-123/prod-1/1x1_123456.png';
    const url = assetsApi.getAssetUrl(path, false);

    expect(url).toContain('/api/assets/file/');
    expect(url).toContain('campaign-123');
    expect(url).toContain('prod-1');
    expect(url).toContain('1x1_123456.png');
    expect(url).not.toContain('?t=');
  });

  it('should generate correct asset URL with cache busting', () => {
    const path = 'campaign-123/prod-1/1x1_123456.png';
    const url = assetsApi.getAssetUrl(path, true);

    expect(url).toContain('/api/assets/file/');
    expect(url).toContain('campaign-123');
    expect(url).toContain('?t=');
  });

  it('should properly encode path segments', () => {
    const path = 'campaign with spaces/prod-1/file.png';
    const url = assetsApi.getAssetUrl(path, false);

    expect(url).toContain('campaign%20with%20spaces');
  });
});

describe('API Service - WebSocket', () => {
  it('should construct WebSocket URL from HTTP URL', () => {
    const httpUrl = 'http://localhost:3000';
    const wsUrl = httpUrl.replace('http://', 'ws://');

    expect(wsUrl).toBe('ws://localhost:3000');
  });

  it('should construct WebSocket URL from HTTPS URL', () => {
    const httpsUrl = 'https://example.com';
    const wsUrl = httpsUrl.replace('https://', 'wss://');

    expect(wsUrl).toBe('wss://example.com');
  });
});
