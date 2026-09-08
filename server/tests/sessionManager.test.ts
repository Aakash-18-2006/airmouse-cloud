import { SessionManager } from '../src/sessionManager';
import { WebSocket } from 'ws';

// Mock minimal WebSocket for testing session logic
function createMockSocket(): WebSocket {
  return {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
    terminate: jest.fn(),
    close: jest.fn(),
  } as unknown as WebSocket;
}

describe('SessionManager Unit Tests', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    sessionManager.destroy();
  });

  test('registers receiver and generates valid 6-digit code', () => {
    const mockSocket = createMockSocket();
    const session = sessionManager.registerReceiver(mockSocket, 'Test-Laptop');

    expect(session.pairingCode).toMatch(/^\d{6}$/);
    expect(session.receiverHostname).toBe('Test-Laptop');
    expect(session.status).toBe('waiting');
    expect(session.codeExpiresAt).toBeGreaterThan(Date.now());
  });

  test('registers receiver with custom secure 6-digit PIN when valid and available', () => {
    const mockSocket = createMockSocket();
    const session = sessionManager.registerReceiver(mockSocket, 'Test-Laptop', '654321');

    expect(session.pairingCode).toBe('654321');
    expect(session.status).toBe('waiting');
  });

  test('rejects expired pairing code', () => {
    const receiverSocket = createMockSocket();
    const phoneSocket = createMockSocket();

    const session = sessionManager.registerReceiver(receiverSocket, 'Old-Laptop');
    // Artificially expire the code
    session.codeExpiresAt = Date.now() - 1000;

    const result = sessionManager.pairPhone(session.pairingCode, phoneSocket, '192.168.1.50');
    expect(result.success).toBe(false);
    expect(result.error).toContain('expired');
  });

  test('pairs phone successfully with correct 6-digit code', () => {
    const receiverSocket = createMockSocket();
    const phoneSocket = createMockSocket();

    const session = sessionManager.registerReceiver(receiverSocket, 'Akash-Laptop');
    const code = session.pairingCode;

    const pairResult = sessionManager.pairPhone(code, phoneSocket, '192.168.1.100');

    expect(pairResult.success).toBe(true);
    expect(pairResult.session).toBeDefined();
    expect(pairResult.session?.status).toBe('paired');
    expect(pairResult.session?.sessionToken).toBeDefined();
    expect(pairResult.session?.sessionToken?.length).toBe(64); // hex 32 bytes

    // Code must be single-use and consumed
    const reuseAttempt = sessionManager.pairPhone(code, phoneSocket, '192.168.1.100');
    expect(reuseAttempt.success).toBe(false);
  });

  test('rejects pairing with invalid code', () => {
    const phoneSocket = createMockSocket();
    const result = sessionManager.pairPhone('000000', phoneSocket, '192.168.1.101');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid pairing code');
  });

  test('rate limits repeated failed pairing attempts from same IP', () => {
    const phoneSocket = createMockSocket();
    const testIp = '10.0.0.99';

    // Trigger max allowed failed attempts
    for (let i = 0; i < 10; i++) {
      sessionManager.pairPhone('999999', phoneSocket, testIp);
    }

    // 11th attempt should be blocked by rate limit
    const blockedResult = sessionManager.pairPhone('999999', phoneSocket, testIp);
    expect(blockedResult.success).toBe(false);
    expect(blockedResult.error).toContain('Too many attempts');
  });

  test('terminates session immediately upon emergency stop', () => {
    const receiverSocket = createMockSocket();
    const phoneSocket = createMockSocket();

    const session = sessionManager.registerReceiver(receiverSocket, 'Work-PC');
    const pairResult = sessionManager.pairPhone(session.pairingCode, phoneSocket, '127.0.0.1');
    const token = pairResult.session!.sessionToken!;

    expect(sessionManager.getSessionByToken(token)).toBeDefined();

    sessionManager.terminateSession(pairResult.session!, 'Emergency stop');

    expect(sessionManager.getSessionByToken(token)).toBeUndefined();
    expect(pairResult.session!.status).toBe('terminated');
  });
});
