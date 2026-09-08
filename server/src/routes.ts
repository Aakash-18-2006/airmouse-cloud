import { Router, Request, Response } from 'express';
import { SessionManager } from './sessionManager';

export function createRouter(sessionManager: SessionManager): Router {
  const router = Router();

  /**
   * Health check endpoint for cloud monitoring (Render, Railway, Fly.io, Cloud Run)
   */
  router.get('/health', (_req: Request, res: Response) => {
    const stats = sessionManager.getStats();
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AirMouse Cloud Server',
      stats
    });
  });

  /**
   * System Information & Public endpoints
   */
  router.get('/api/info', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'AirMouse Cloud',
      version: '1.0.0',
      description: 'Zero-install cloud trackpad & wireless mouse system for Windows PC',
      features: [
        'Real Windows cursor control',
        'Sub-15ms WebSocket relay',
        'Cryptographic single-use pairing codes',
        'Multi-touch trackpad gestures',
        'Hardware emergency stop'
      ]
    });
  });

  /**
   * Pre-validation of 6-digit pairing code
   */
  router.post('/api/pair/check', (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({
        valid: false,
        message: 'Pairing code must be exactly 6 digits.'
      });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '127.0.0.1';

    const rateCheck = sessionManager.checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        valid: false,
        message: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`
      });
    }

    // Check code existence without consuming it (consumption happens on WS pair_with_code)
    const stats = sessionManager.getStats();
    return res.status(200).json({
      valid: true,
      code: code.trim(),
      activeWaiters: stats.waitingCodes
    });
  });

  return router;
}
