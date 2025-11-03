import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/logger';

/**
 * General API rate limiter
 * Limits: 5000 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiter for expensive operations (AI generation)
 * Limits: 5000 requests per hour per IP
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // Limit each IP to 5000 AI generation requests per hour
  message: {
    error: 'Too many generation requests. AI image generation is rate-limited to prevent abuse.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  handler: (req, res) => {
    logger.warn(`Generation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many generation requests. AI image generation is rate-limited to prevent abuse.',
      retryAfter: '1 hour',
      tip: 'Contact support if you need higher limits for production use.'
    });
  }
});

/**
 * Moderate rate limiter for AI-powered features (prompt enhancement, compliance checks)
 * Limits: 5000 requests per 15 minutes per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 AI requests per 15 minutes
  message: {
    error: 'Too many AI requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many AI requests, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});
