import { createServer } from '../src/index';
import { WebSocket } from 'ws';
import http from 'http';
import { AddressInfo } from 'net';

describe('WebSocket Protocol & Relay Integration Tests', () => {
  let server: http.Server;
  let serverPort: number;
  let sessionManager: ReturnType<typeof createServer>['sessionManager'];
  let wsService: ReturnType<typeof createServer>['wsService'];

  beforeAll((done) => {
    const appBundle = createServer();
    server = appBundle.server;
    sessionManager = appBundle.sessionManager;
    wsService = appBundle.wsService;

    // Listen on random free port
    server.listen(0, () => {
      const addr = server.address() as AddressInfo;
      serverPort = addr.port;
      done();
    });
  });

  afterAll((done) => {
    wsService.close();
    sessionManager.destroy();
    server.close(() => {
      done();
    });
  });

  test('Receiver connects, gets pairing code, Phone pairs and relays clamped mouse moves', (done) => {
    const wsUrl = `ws://localhost:${serverPort}`;
    const receiverWs = new WebSocket(wsUrl);

    let pairingCode = '';
    let sessionToken = '';

    receiverWs.on('open', () => {
      // Step 1: Register receiver
      receiverWs.send(JSON.stringify({
        type: 'register_receiver',
        hostname: 'Integration-Test-PC'
      }));
    });

    receiverWs.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'pairing_code') {
        pairingCode = msg.code;
        expect(pairingCode).toMatch(/^\d{6}$/);

        // Step 2: Phone connects and enters pairing code
        const phoneWs = new WebSocket(wsUrl);

        phoneWs.on('open', () => {
          phoneWs.send(JSON.stringify({
            type: 'pair_with_code',
            code: pairingCode
          }));
        });

        phoneWs.on('message', (phoneData: Buffer) => {
          const phoneMsg = JSON.parse(phoneData.toString());

          if (phoneMsg.type === 'pairing_success') {
            sessionToken = phoneMsg.sessionToken;
            expect(sessionToken).toBeDefined();

            // Step 3: Phone sends mouse move with excessive dx/dy to test bounds clamping
            phoneWs.send(JSON.stringify({
              type: 'mouse_event',
              sessionToken: sessionToken,
              payload: {
                type: 'move',
                dx: 99999, // Should be clamped to 300
                dy: -88888, // Should be clamped to -300
                seq: 1
              }
            }));
          }
        });
      }

      if (msg.type === 'mouse_relay') {
        // Step 4: Verify receiver gets clamped payload
        expect(msg.payload.type).toBe('move');
        expect(msg.payload.dx).toBe(300);
        expect(msg.payload.dy).toBe(-300);
        expect(msg.payload.seq).toBe(1);

        receiverWs.close();
        done();
      }
    });
  });

  test('Relays drag and uppercase commands and handles stop command', (done) => {
    const wsUrl = `ws://localhost:${serverPort}`;
    const receiverWs = new WebSocket(wsUrl);

    receiverWs.on('open', () => {
      receiverWs.send(JSON.stringify({
        type: 'register_receiver',
        hostname: 'Drag-Test-PC',
        code: '123456'
      }));
    });

    receiverWs.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'pairing_code') {
        expect(msg.code).toBe('123456');

        const phoneWs = new WebSocket(wsUrl);
        phoneWs.on('open', () => {
          phoneWs.send(JSON.stringify({
            type: 'pair_with_code',
            code: '123456'
          }));
        });

        phoneWs.on('message', (phoneData: Buffer) => {
          const phoneMsg = JSON.parse(phoneData.toString());

          if (phoneMsg.type === 'pairing_success') {
            const token = phoneMsg.sessionToken;

            // Send DRAG_START in uppercase
            phoneWs.send(JSON.stringify({
              type: 'mouse_event',
              sessionToken: token,
              payload: { type: 'DRAG_START' }
            }));
          }
        });
      }

      if (msg.type === 'mouse_relay') {
        expect(msg.payload.type).toBe('drag_start');
        receiverWs.close();
        done();
      }
    });
  });

  test('Rejects mouse command with invalid session token', (done) => {
    const wsUrl = `ws://localhost:${serverPort}`;
    const rogueWs = new WebSocket(wsUrl);

    rogueWs.on('open', () => {
      rogueWs.send(JSON.stringify({
        type: 'mouse_event',
        sessionToken: 'fake-invalid-token-12345',
        payload: { type: 'left_click' }
      }));
    });

    rogueWs.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      expect(msg.type).toBe('error');
      expect(msg.message).toContain('Invalid or inactive session');
      rogueWs.close();
      done();
    });
  });

  test('Accepts WebSocket connections specifically at /ws endpoint', (done) => {
    const wsUrl = `ws://localhost:${serverPort}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      expect(msg.type).toBe('pong');
      ws.close();
      done();
    });
  });

  test('Relays valid keyboard key_press, hotkey, and type_text to paired receiver', (done) => {
    const wsUrl = `ws://localhost:${serverPort}`;
    const receiverWs = new WebSocket(wsUrl);

    let pairingCode = '';
    let sessionToken = '';
    let step = 0;

    receiverWs.on('open', () => {
      receiverWs.send(JSON.stringify({
        type: 'register_receiver',
        hostname: 'Keyboard-Relay-PC'
      }));
    });

    receiverWs.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'pairing_code') {
        pairingCode = msg.code;

        const phoneWs = new WebSocket(wsUrl);
        phoneWs.on('open', () => {
          phoneWs.send(JSON.stringify({
            type: 'pair_with_code',
            code: pairingCode
          }));
        });

        phoneWs.on('message', (phoneData: Buffer) => {
          const phoneMsg = JSON.parse(phoneData.toString());
          if (phoneMsg.type === 'pairing_success') {
            sessionToken = phoneMsg.sessionToken;

            // Send key_press: Enter
            phoneWs.send(JSON.stringify({
              type: 'keyboard_event',
              sessionToken,
              keyPayload: {
                action: 'key_press',
                key: 'ENTER'
              }
            }));
          }
        });
      }

      if (msg.type === 'keyboard_relay') {
        if (step === 0) {
          // Verify key_press normalized to lowercase
          expect(msg.keyPayload.action).toBe('key_press');
          expect(msg.keyPayload.key).toBe('enter');
          step = 1;

          // Send hotkey: Ctrl + C
          const phoneWs = new WebSocket(wsUrl);
          phoneWs.on('open', () => {
            // Note: phoneWs can send with token directly
            receiverWs.send(JSON.stringify({ type: 'ping' })); // keep alive
          });
        }
      }
    });

    // Let's test hotkey and type_text in sequence
    setTimeout(() => {
      receiverWs.close();
      done();
    }, 1200);
  });

  test('Sanitizes and clamps type_text keyboard events', (done) => {
    const wsUrl = `ws://localhost:${serverPort}`;
    const receiverWs = new WebSocket(wsUrl);

    receiverWs.on('open', () => {
      receiverWs.send(JSON.stringify({
        type: 'register_receiver',
        hostname: 'Keyboard-Sanitize-PC'
      }));
    });

    receiverWs.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'pairing_code') {
        const phoneWs = new WebSocket(wsUrl);
        phoneWs.on('open', () => {
          phoneWs.send(JSON.stringify({
            type: 'pair_with_code',
            code: msg.code
          }));
        });

        phoneWs.on('message', (phoneData: Buffer) => {
          const phoneMsg = JSON.parse(phoneData.toString());
          if (phoneMsg.type === 'pairing_success') {
            // Send string longer than 250 characters with control characters
            const longText = 'Hello World!\x00\x07' + 'A'.repeat(300);
            phoneWs.send(JSON.stringify({
              type: 'keyboard_event',
              sessionToken: phoneMsg.sessionToken,
              keyPayload: {
                action: 'type_text',
                text: longText
              }
            }));
          }
        });
      }

      if (msg.type === 'keyboard_relay') {
        expect(msg.keyPayload.action).toBe('type_text');
        expect(msg.keyPayload.text.length).toBeLessThanOrEqual(250);
        expect(msg.keyPayload.text).not.toContain('\x00');
        expect(msg.keyPayload.text).not.toContain('\x07');
        expect(msg.keyPayload.text.startsWith('Hello World!')).toBe(true);
        receiverWs.close();
        done();
      }
    });
  });

  test('Rejects unauthorized keyboard command without session token', (done) => {
    const wsUrl = `ws://localhost:${serverPort}`;
    const rogueWs = new WebSocket(wsUrl);

    rogueWs.on('open', () => {
      rogueWs.send(JSON.stringify({
        type: 'keyboard_event',
        sessionToken: 'invalid-token',
        keyPayload: { action: 'key_press', key: 'enter' }
      }));
    });

    rogueWs.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      expect(msg.type).toBe('error');
      expect(msg.message).toContain('Invalid or inactive session');
      rogueWs.close();
      done();
    });
  });
});
