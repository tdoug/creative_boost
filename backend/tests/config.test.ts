import { config } from '../src/utils/config';

describe('Config', () => {
  test('should have default cloud provider', () => {
    expect(config.cloudProvider).toBeDefined();
    expect(['aws', 'azure', 'gcp']).toContain(config.cloudProvider);
  });

  test('should have AWS configuration', () => {
    expect(config.aws).toBeDefined();
    expect(config.aws.region).toBeDefined();
    expect(config.aws.bedrockModelId).toBeDefined();
    expect(config.aws.bedrockLlmModelId).toBeDefined();
  });

  test('should have storage configuration', () => {
    expect(config.storage).toBeDefined();
    expect(config.storage.path).toBeDefined();
  });

  test('should have API configuration', () => {
    expect(config.api).toBeDefined();
    expect(config.api.port).toBeGreaterThan(0);
    expect(config.api.port).toBeLessThan(65536);
  });

  test('should have feature flags', () => {
    expect(config.features).toBeDefined();
    expect(typeof config.features.enableBrandCheck).toBe('boolean');
    expect(typeof config.features.enableLegalCheck).toBe('boolean');
  });

  test('should use empty string for local S3 bucket by default', () => {
    // If no bucket is configured, it should default to empty string (local storage)
    expect(typeof config.aws.s3Bucket).toBe('string');
  });
});
