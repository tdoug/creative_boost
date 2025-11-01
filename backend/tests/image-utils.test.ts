describe('Image Utils - Aspect Ratios', () => {
  test('should calculate 1:1 aspect ratio dimensions', () => {
    const width = 1080;
    const height = 1080;
    const ratio = width / height;

    expect(ratio).toBe(1);
  });

  test('should calculate 9:16 aspect ratio dimensions', () => {
    const width = 1080;
    const height = 1920;
    const ratio = width / height;

    expect(ratio).toBeCloseTo(9 / 16, 2);
  });

  test('should calculate 16:9 aspect ratio dimensions', () => {
    const width = 1920;
    const height = 1080;
    const ratio = width / height;

    expect(ratio).toBeCloseTo(16 / 9, 2);
  });
});

describe('Image Utils - File Paths', () => {
  test('should format aspect ratio for file path', () => {
    const formatAspectRatio = (ratio: string) => ratio.replace(':', 'x');

    expect(formatAspectRatio('1:1')).toBe('1x1');
    expect(formatAspectRatio('9:16')).toBe('9x16');
    expect(formatAspectRatio('16:9')).toBe('16x9');
  });

  test('should parse aspect ratio from file path', () => {
    const parseAspectRatio = (filename: string) => {
      const match = filename.match(/^(\d+)x(\d+)_/);
      return match ? `${match[1]}:${match[2]}` : null;
    };

    expect(parseAspectRatio('1x1_123456.png')).toBe('1:1');
    expect(parseAspectRatio('9x16_789012.png')).toBe('9:16');
    expect(parseAspectRatio('16x9_345678.png')).toBe('16:9');
    expect(parseAspectRatio('invalid.png')).toBeNull();
  });
});

describe('Image Utils - Text Wrapping', () => {
  test('should calculate characters per line based on width', () => {
    const calculateCharsPerLine = (imageWidth: number, fontSize: number) => {
      return Math.floor(imageWidth / (fontSize * 0.6));
    };

    const charsPerLine1080 = calculateCharsPerLine(1080, 60);
    expect(charsPerLine1080).toBeGreaterThan(0);

    const charsPerLine1920 = calculateCharsPerLine(1920, 60);
    expect(charsPerLine1920).toBeGreaterThan(charsPerLine1080);
  });

  test('should estimate line count for text', () => {
    const estimateLines = (text: string, charsPerLine: number) => {
      return Math.ceil(text.length / charsPerLine);
    };

    const shortText = 'Hello World';
    const longText = 'This is a very long message that will span multiple lines when rendered on the image';

    expect(estimateLines(shortText, 20)).toBe(1);
    expect(estimateLines(longText, 20)).toBeGreaterThan(1);
  });
});
