import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { SessionManager } from './sessionManager';
import { setupWebSocketServer } from './wsServer';
import { createRouter } from './routes';

export function createServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const sessionManager = new SessionManager();

  // Trust reverse proxy headers (Render, Cloudflare, HTTPS/WSS proxy)
  app.set('trust proxy', 1);

  // Middleware
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  // Mount API & Health routes
  app.use(createRouter(sessionManager));

  // WebSocket Server Setup
  const wsService = setupWebSocketServer(wss, sessionManager);

  return { app, server, wss, sessionManager, wsService };
}

// Start server if executed directly
if (require.main === module) {
  const { server } = createServer();
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🚀 AIR MOUSE CLOUD BACKEND ACTIVE`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`🌐 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}/health`);
    console.log(`=========================================`);
  });
}
