/**
 * Sanitize user input to prevent XSS attacks
 * This escapes HTML special characters that could be used for injection
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize all string fields in an object recursively
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate that a string doesn't contain potential script injection
 * Returns true if the string appears safe, false if it contains suspicious content
 */
export function validateNoScriptInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return true;
  }

  // Check for common XSS patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=, onload=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize campaign brief to prevent XSS
 * Specifically targets user-controlled text fields
 */
export function sanitizeCampaignBrief(brief: any): any {
  return {
    ...brief,
    message: sanitizeString(brief.message),
    targetRegion: sanitizeString(brief.targetRegion),
    targetAudience: sanitizeString(brief.targetAudience),
    locale: brief.locale ? sanitizeString(brief.locale) : brief.locale,
    artStyle: brief.artStyle ? sanitizeString(brief.artStyle) : brief.artStyle,
    products: brief.products?.map((product: any) => ({
      ...product,
      name: sanitizeString(product.name),
      description: sanitizeString(product.description)
    }))
  };
}
