import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Pairing code time-to-live in ms (default 10 minutes)
  pairingCodeTtlMs: parseInt(process.env.PAIRING_CODE_TTL_MS || '600000', 10),

  // Max session lifetime (default 4 hours)
  sessionMaxLifetimeMs: parseInt(process.env.SESSION_MAX_LIFETIME_MS || '14400000', 10),

  // Rate Limiting on pairing attempts per IP
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 min
  rateLimitMaxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '10', 10),

  // Mouse bounds validation safety limits
  mouseLimits: {
    maxDeltaX: 300,
    maxDeltaY: 300,
    maxScrollAmount: 100,
  }
};
