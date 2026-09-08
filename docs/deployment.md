# AirMouse Cloud - Deployment Guide

This guide details how to deploy **AirMouse Cloud** so that it is publicly accessible to any user without requiring users to host their own infrastructure.

## 1. Cloud Architecture & Host Selection

### Frontend (Static Web Application)
- **Hosts**: Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
- **Build Command**: `npm run build` (within `client/`).
- **Publish Directory**: `client/dist`.
- **Environment Variables**:
  - `VITE_SERVER_URL`: URL of the cloud backend (e.g., `https://airmouse-relay.onrender.com`).
  - `VITE_WS_URL`: WebSocket URL of the cloud backend (e.g., `wss://airmouse-relay.onrender.com`).

### Backend (Persistent WebSocket Relay)
> [!IMPORTANT]
> A persistent WebSocket server is required. Serverless functions (such as AWS Lambda or basic Vercel API routes) timeout after short durations and cannot maintain bidirectional stateful WebSocket channels.

Recommended persistent hosts:
- **Render** (Web Service): Automatic SSL/TLS, persistent connections, free/standard tier.
- **Railway**: Low-latency containers, zero-config deploys.
- **Fly.io**: Edge container deployment with sub-10ms latency worldwide.
- **Google Cloud Run**: Managed containers supporting WebSocket streaming with session affinity.

---

## 2. Deploying Backend to Render (Step-by-Step)

1. Connect your repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. Set the following settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   ```env
   PORT=10000
   NODE_ENV=production
   CORS_ORIGIN=*
   PAIRING_CODE_TTL_MS=600000
   RATE_LIMIT_WINDOW_MS=300000
   RATE_LIMIT_MAX_ATTEMPTS=5
   ```
5. Deploy. Render will assign an HTTPS/WSS URL such as `https://airmouse-relay.onrender.com`.

---

## 3. Deploying Frontend to Vercel (Step-by-Step)

1. Connect your repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variables:
   ```env
   VITE_SERVER_URL=https://airmouse-relay.onrender.com
   ```
5. Click **Deploy**. Vercel will provide an instant global CDN URL (e.g. `https://airmouse.vercel.app`).

---

## 4. Single-Container Unified Deployment (Docker Alternative)

If you prefer to deploy both frontend and backend on a single container:
1. The server can serve static assets from `client/dist` via `express.static`:
   ```typescript
   app.use(express.static(path.join(__dirname, '../../client/dist')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
   });
   ```
2. Both REST, WebSockets (`ws://`), and Web UI will operate seamlessly on a single port (e.g., port `8080`).
