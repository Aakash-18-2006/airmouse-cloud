import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { SessionManager } from './sessionManager';
import {
  InboundMessage,
  OutboundMessage,
  MouseEventPayload,
  KeyboardEventPayload,
  KeyboardAction,
  KeyboardModifier,
  CommandType
} from './types';
import { config } from './config';

const ALLOWED_COMMANDS: Set<string> = new Set([
  'move',
  'left_click',
  'right_click',
  'double_click',
  'mouse_down',
  'mouse_up',
  'drag_start',
  'drag_move',
  'drag_end',
  'scroll',
  'alt_f4',
  'stop'
]);

const ALLOWED_KEYBOARD_KEYS: Set<string> = new Set([
  // Letters A-Z
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  // Numbers 0-9
  ...'0123456789'.split(''),
  // Function keys F1-F12
  ...'123456789'.split('').map((n) => `f${n}`),
  'f10',
  'f11',
  'f12',
  // Navigation and control keys
  'space',
  'enter',
  'backspace',
  'tab',
  'esc',
  'escape',
  'up',
  'down',
  'left',
  'right',
  'shift',
  'ctrl',
  'alt',
  'delete',
  'home',
  'end',
  'pageup',
  'pagedown'
]);

const ALLOWED_MODIFIERS: Set<string> = new Set(['ctrl', 'shift', 'alt']);
const ALLOWED_KEYBOARD_ACTIONS: Set<string> = new Set(['key_press', 'hotkey', 'type_text', 'key_down', 'key_up']);

// Per-session rate limiter for keyboard events to prevent receiver flooding (max 30 events/sec)
class KeyboardRateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private readonly windowMs = 1000;
  private readonly maxEventsPerWindow = 30;

  public allow(sessionId: string): boolean {
    const now = Date.now();
    const history = this.timestamps.get(sessionId) || [];
    const validHistory = history.filter((ts) => now - ts < this.windowMs);
    if (validHistory.length >= this.maxEventsPerWindow) {
      return false;
    }
    validHistory.push(now);
    this.timestamps.set(sessionId, validHistory);
    return true;
  }

  public cleanup(sessionId: string): void {
    this.timestamps.delete(sessionId);
  }
}

const keyboardRateLimiter = new KeyboardRateLimiter();

export function setupWebSocketServer(wss: WebSocketServer, sessionManager: SessionManager) {
  // Heartbeat interval to detect stale/dead sockets
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
      if (ws.isAlive === false) {
        sessionManager.removeSocket(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  const close = () => {
    clearInterval(interval);
    wss.clients.forEach((ws) => {
      try {
        ws.terminate();
      } catch (_) {}
    });
    wss.close();
  };

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocket & { isAlive?: boolean }, req: IncomingMessage) => {
    ws.isAlive = true;

    // Determine client IP for rate limiting
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '127.0.0.1';

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw: string | Buffer) => {
      try {
        const text = raw.toString();
        const msg: InboundMessage = JSON.parse(text);

        switch (msg.type) {
          case 'ping': {
            sendJson(ws, { type: 'pong', timestamp: Date.now() });
            break;
          }

          // 1. Laptop Windows Receiver registers to get a 6-digit pairing code
          case 'register_receiver': {
            const hostname = msg.hostname ? String(msg.hostname).slice(0, 50) : 'Windows PC';
            const session = sessionManager.registerReceiver(ws, hostname, msg.code);

            sendJson(ws, {
              type: 'pairing_code',
              code: session.pairingCode,
              expiresInSeconds: Math.floor(config.pairingCodeTtlMs / 1000),
              hostname: session.receiverHostname,
            });
            break;
          }

          // 2. Mobile Phone enters 6-digit pairing code
          case 'pair_with_code': {
            if (!msg.code || typeof msg.code !== 'string') {
              sendJson(ws, {
                type: 'pairing_failed',
                message: 'A valid 6-digit code is required.'
              });
              return;
            }

            const result = sessionManager.pairPhone(msg.code, ws, clientIp);
            if (!result.success || !result.session) {
              sendJson(ws, {
                type: 'pairing_failed',
                message: result.error || 'Pairing failed'
              });
              return;
            }

            const session = result.session;

            // Notify phone of success with session token & hostname
            sendJson(ws, {
              type: 'pairing_success',
              sessionToken: session.sessionToken,
              hostname: session.receiverHostname,
            });

            // Notify receiver that phone has connected
            if (session.receiverSocket && session.receiverSocket.readyState === WebSocket.OPEN) {
              sendJson(session.receiverSocket, {
                type: 'pairing_success',
                sessionToken: session.sessionToken,
                hostname: session.receiverHostname,
              });
            }
            break;
          }

          // 3. Mouse event sent from paired phone to receiver
          case 'mouse_event': {
            if (!msg.sessionToken) {
              sendJson(ws, { type: 'error', message: 'Session token required for mouse commands.' });
              return;
            }

            const session = sessionManager.getSessionByToken(msg.sessionToken);
            if (!session || session.status !== 'paired') {
              sendJson(ws, { type: 'error', message: 'Invalid or inactive session.' });
              return;
            }

            // Verify the sender is indeed the phone socket for this session
            if (session.phoneSocket !== ws) {
              sendJson(ws, { type: 'error', message: 'Unauthorized client socket.' });
              return;
            }

            const payload = msg.payload;
            if (!payload || !payload.type) {
              return;
            }

            const normalizedType = String(payload.type).toLowerCase() as CommandType;
            if (!ALLOWED_COMMANDS.has(normalizedType)) {
              return;
            }

            if (normalizedType === 'stop') {
              sessionManager.terminateSession(session, 'Emergency stop triggered by client');
              const notify = { type: 'emergency_stopped' as const, message: 'Mouse control terminated by stop command.' };
              if (session.receiverSocket && session.receiverSocket.readyState === WebSocket.OPEN) {
                sendJson(session.receiverSocket, notify);
              }
              if (session.phoneSocket && session.phoneSocket.readyState === WebSocket.OPEN) {
                sendJson(session.phoneSocket, notify);
              }
              return;
            }

            // Sanitize & clamp parameters to safety bounds
            const sanitizedPayload: MouseEventPayload = {
              type: normalizedType,
              seq: typeof payload.seq === 'number' ? payload.seq : undefined,
              timestamp: Date.now()
            };

            if (normalizedType === 'move' || normalizedType === 'drag_move') {
              const dx = Number(payload.dx) || 0;
              const dy = Number(payload.dy) || 0;
              sanitizedPayload.dx = Math.max(-config.mouseLimits.maxDeltaX, Math.min(config.mouseLimits.maxDeltaX, dx));
              sanitizedPayload.dy = Math.max(-config.mouseLimits.maxDeltaY, Math.min(config.mouseLimits.maxDeltaY, dy));
            } else if (normalizedType === 'scroll') {
              const amount = Number(payload.amount) || 0;
              sanitizedPayload.amount = Math.max(-config.mouseLimits.maxScrollAmount, Math.min(config.mouseLimits.maxScrollAmount, amount));
            } else if (normalizedType === 'mouse_down' || normalizedType === 'mouse_up') {
              sanitizedPayload.button = payload.button === 'right' ? 'right' : 'left';
            }

            // Relay directly to the laptop receiver socket
            if (session.receiverSocket && session.receiverSocket.readyState === WebSocket.OPEN) {
              sendJson(session.receiverSocket, {
                type: 'mouse_relay',
                payload: sanitizedPayload
              });
            } else {
              // Laptop receiver disconnected
              sendJson(ws, {
                type: 'peer_disconnected',
                message: 'Laptop receiver is disconnected.'
              });
            }
            break;
          }

          // 4. Keyboard event sent from paired phone to receiver
          case 'keyboard_event': {
            if (!msg.sessionToken) {
              sendJson(ws, { type: 'error', message: 'Session token required for keyboard commands.' });
              return;
            }

            const session = sessionManager.getSessionByToken(msg.sessionToken);
            if (!session || session.status !== 'paired') {
              sendJson(ws, { type: 'error', message: 'Invalid or inactive session.' });
              return;
            }

            // Verify the sender is indeed the phone socket for this session
            if (session.phoneSocket !== ws) {
              sendJson(ws, { type: 'error', message: 'Unauthorized client socket.' });
              return;
            }

            // Rate limit check to prevent receiver flooding
            if (!keyboardRateLimiter.allow(session.sessionId)) {
              sendJson(ws, { type: 'error', message: 'Keyboard rate limit exceeded.' });
              return;
            }

            const keyPayload = msg.keyPayload;
            if (!keyPayload || !keyPayload.action) {
              return;
            }

            const normalizedAction = String(keyPayload.action).toLowerCase() as KeyboardAction;
            if (!ALLOWED_KEYBOARD_ACTIONS.has(normalizedAction)) {
              return;
            }

            const sanitizedKeyPayload: KeyboardEventPayload = {
              action: normalizedAction,
              seq: typeof keyPayload.seq === 'number' ? keyPayload.seq : undefined,
              timestamp: Date.now()
            };

            if (normalizedAction === 'type_text') {
              if (typeof keyPayload.text !== 'string' || keyPayload.text.length === 0) {
                return;
              }
              // Clamp text length to 250 characters max to prevent flood/abuse
              let safeText = keyPayload.text.slice(0, 250);
              // Filter out ASCII control characters except \r, \n, \t
              safeText = safeText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
              if (!safeText) {
                return;
              }
              sanitizedKeyPayload.text = safeText;
            } else {
              // key_press, hotkey, key_down, key_up
              if (typeof keyPayload.key !== 'string') {
                return;
              }
              const keyLower = keyPayload.key.toLowerCase().trim();
              const mappedKey = keyLower === 'escape' ? 'esc' : keyLower;
              if (!ALLOWED_KEYBOARD_KEYS.has(mappedKey)) {
                return;
              }
              sanitizedKeyPayload.key = mappedKey;

              if (normalizedAction === 'hotkey' && Array.isArray(keyPayload.modifiers)) {
                const sanitizedModifiers: KeyboardModifier[] = [];
                for (const mod of keyPayload.modifiers) {
                  const modLower = String(mod).toLowerCase().trim() as KeyboardModifier;
                  if (ALLOWED_MODIFIERS.has(modLower) && !sanitizedModifiers.includes(modLower)) {
                    sanitizedModifiers.push(modLower);
                  }
                }
                sanitizedKeyPayload.modifiers = sanitizedModifiers;
              }
            }

            // Relay directly to the laptop receiver socket
            if (session.receiverSocket && session.receiverSocket.readyState === WebSocket.OPEN) {
              sendJson(session.receiverSocket, {
                type: 'keyboard_relay',
                keyPayload: sanitizedKeyPayload
              });
            } else {
              sendJson(ws, {
                type: 'peer_disconnected',
                message: 'Laptop receiver is disconnected.'
              });
            }
            break;
          }

          // 5. Emergency Stop: can be initiated by receiver or phone
          case 'emergency_stop': {
            const session = sessionManager.getSessionBySocket(ws);
            if (session) {
              sessionManager.terminateSession(session, 'Emergency stop triggered');

              // Notify both sides immediately
              const notify = { type: 'emergency_stopped' as const, message: 'Mouse control terminated by emergency stop.' };
              if (session.receiverSocket && session.receiverSocket.readyState === WebSocket.OPEN) {
                sendJson(session.receiverSocket, notify);
              }
              if (session.phoneSocket && session.phoneSocket.readyState === WebSocket.OPEN) {
                sendJson(session.phoneSocket, notify);
              }
            }
            break;
          }

          default:
            sendJson(ws, { type: 'error', message: 'Unknown message type' });
        }
      } catch (err) {
        sendJson(ws, { type: 'error', message: 'Malformed JSON payload' });
      }
    });

    ws.on('close', () => {
      const { session, role } = sessionManager.removeSocket(ws);
      if (session) {
        keyboardRateLimiter.cleanup(session.sessionId);
        if (role === 'receiver') {
          // Notify phone that laptop disconnected
          if (session.phoneSocket && session.phoneSocket.readyState === WebSocket.OPEN) {
            sendJson(session.phoneSocket, {
              type: 'peer_disconnected',
              message: 'Laptop receiver disconnected.'
            });
          }
        } else if (role === 'phone') {
          // Notify receiver that phone disconnected
          if (session.receiverSocket && session.receiverSocket.readyState === WebSocket.OPEN) {
            sendJson(session.receiverSocket, {
              type: 'peer_disconnected',
              message: 'Phone disconnected.'
            });
          }
        }
      }
    });

    ws.on('error', () => {
      sessionManager.removeSocket(ws);
    });
  });

  return { close };
}

function sendJson(ws: WebSocket, data: OutboundMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}
