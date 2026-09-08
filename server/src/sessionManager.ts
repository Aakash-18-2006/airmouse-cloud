import crypto from 'crypto';
import { WebSocket } from 'ws';
import { PairingSession } from './types';
import { config } from './config';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
}

export class SessionManager {
  private sessionsByCode: Map<string, PairingSession> = new Map();
  private sessionsByToken: Map<string, PairingSession> = new Map();
  private socketToSession: Map<WebSocket, PairingSession> = new Map();
  private rateLimits: Map<string, RateLimitRecord> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 60 seconds
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), 60000);
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Generates a cryptographically secure 6-digit pairing code.
   */
  private generateUniqueCode(): string {
    let attempts = 0;
    while (attempts < 100) {
      const code = crypto.randomInt(100000, 1000000).toString();
      if (!this.sessionsByCode.has(code)) {
        return code;
      }
      attempts++;
    }
    // Fallback if space is saturated
    return (Date.now() % 900000 + 100000).toString();
  }

  /**
   * Creates a new pairing session for a registered Windows Receiver.
   */
  public registerReceiver(socket: WebSocket, hostname: string = 'Windows PC', preferredCode?: string): PairingSession {
    // Remove any previous session associated with this socket
    this.removeSocket(socket);

    let code = '';
    if (preferredCode && /^\d{6}$/.test(preferredCode.trim()) && !this.sessionsByCode.has(preferredCode.trim())) {
      code = preferredCode.trim();
    } else {
      code = this.generateUniqueCode();
    }
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    const session: PairingSession = {
      sessionId,
      pairingCode: code,
      codeCreatedAt: now,
      codeExpiresAt: now + config.pairingCodeTtlMs,
      receiverHostname: hostname || 'Windows PC',
      receiverSocket: socket,
      phoneSocket: null,
      status: 'waiting',
      lastActive: now,
    };

    this.sessionsByCode.set(code, session);
    this.socketToSession.set(socket, session);

    return session;
  }

  /**
   * Rate limiting verification for an IP address.
   */
  public checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const record = this.rateLimits.get(ip);

    if (!record) {
      return { allowed: true };
    }

    if (now - record.firstAttempt > config.rateLimitWindowMs) {
      this.rateLimits.delete(ip);
      return { allowed: true };
    }

    if (record.attempts >= config.rateLimitMaxAttempts) {
      const retryAfter = Math.ceil((config.rateLimitWindowMs - (now - record.firstAttempt)) / 1000);
      return { allowed: false, retryAfterSeconds: retryAfter };
    }

    return { allowed: true };
  }

  public recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const record = this.rateLimits.get(ip);
    if (!record) {
      this.rateLimits.set(ip, { attempts: 1, firstAttempt: now });
    } else {
      record.attempts += 1;
    }
  }

  public resetRateLimit(ip: string): void {
    this.rateLimits.delete(ip);
  }

  /**
   * Pair a phone with the Windows receiver using the 6-digit code.
   */
  public pairPhone(
    code: string,
    phoneSocket: WebSocket,
    clientIp: string
  ): { success: boolean; session?: PairingSession; error?: string } {
    const rateCheck = this.checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`
      };
    }

    const session = this.sessionsByCode.get(code.trim());

    if (!session) {
      this.recordFailedAttempt(clientIp);
      return { success: false, error: 'Invalid pairing code. Please verify the 6-digit code on your laptop.' };
    }

    const now = Date.now();
    if (now > session.codeExpiresAt) {
      this.sessionsByCode.delete(code);
      return { success: false, error: 'This pairing code has expired. Please refresh your laptop receiver.' };
    }

    if (session.status !== 'waiting' || !session.receiverSocket || session.receiverSocket.readyState !== WebSocket.OPEN) {
      return { success: false, error: 'Laptop receiver is no longer connected.' };
    }

    // Generate secure session token for authorized communication
    const sessionToken = crypto.randomBytes(32).toString('hex');
    session.sessionToken = sessionToken;
    session.phoneSocket = phoneSocket;
    session.status = 'paired';
    session.lastActive = now;

    // Single-use code: delete pairing code lookup once paired so code cannot be reused
    this.sessionsByCode.delete(code);

    // Map token and phone socket to session
    this.sessionsByToken.set(sessionToken, session);
    this.socketToSession.set(phoneSocket, session);

    this.resetRateLimit(clientIp);
    return { success: true, session };
  }

  /**
   * Look up an active session by session token.
   */
  public getSessionByToken(token: string): PairingSession | undefined {
    const session = this.sessionsByToken.get(token);
    if (!session) return undefined;

    // Check lifetime
    if (Date.now() - session.lastActive > config.sessionMaxLifetimeMs) {
      this.terminateSession(session, 'Session expired due to inactivity');
      return undefined;
    }

    session.lastActive = Date.now();
    return session;
  }

  /**
   * Get session associated with a WebSocket.
   */
  public getSessionBySocket(socket: WebSocket): PairingSession | undefined {
    return this.socketToSession.get(socket);
  }

  /**
   * Terminate an active session immediately (e.g. emergency stop or disconnect).
   */
  public terminateSession(session: PairingSession, reason: string): void {
    session.status = 'terminated';

    if (session.pairingCode) {
      this.sessionsByCode.delete(session.pairingCode);
    }
    if (session.sessionToken) {
      this.sessionsByToken.delete(session.sessionToken);
    }
    if (session.receiverSocket) {
      this.socketToSession.delete(session.receiverSocket);
    }
    if (session.phoneSocket) {
      this.socketToSession.delete(session.phoneSocket);
    }
  }

  /**
   * Handle socket closure or disconnection.
   */
  public removeSocket(socket: WebSocket): { session?: PairingSession; role?: 'receiver' | 'phone' } {
    const session = this.socketToSession.get(socket);
    if (!session) return {};

    let role: 'receiver' | 'phone' = 'receiver';
    if (socket === session.phoneSocket) {
      role = 'phone';
      session.phoneSocket = null;
      if (session.status === 'paired') {
        session.status = 'waiting'; // Can allow reconnection if receiver still active
      }
    } else if (socket === session.receiverSocket) {
      role = 'receiver';
      session.receiverSocket = null;
      this.terminateSession(session, 'Receiver disconnected');
    }

    this.socketToSession.delete(socket);
    return { session, role };
  }

  /**
   * Routine garbage collection of stale/expired sessions and rate-limits.
   */
  public cleanupExpired(): void {
    const now = Date.now();

    // Expire waiting codes
    for (const [code, session] of this.sessionsByCode.entries()) {
      if (now > session.codeExpiresAt || (session.receiverSocket && session.receiverSocket.readyState !== WebSocket.OPEN)) {
        this.terminateSession(session, 'Pairing code expired');
      }
    }

    // Expire old sessions
    for (const [token, session] of this.sessionsByToken.entries()) {
      if (now - session.lastActive > config.sessionMaxLifetimeMs) {
        this.terminateSession(session, 'Session lifetime exceeded');
      }
    }

    // Clean rate limits
    for (const [ip, record] of this.rateLimits.entries()) {
      if (now - record.firstAttempt > config.rateLimitWindowMs) {
        this.rateLimits.delete(ip);
      }
    }
  }

  public getStats(): { activeSessions: number; waitingCodes: number } {
    return {
      activeSessions: this.sessionsByToken.size,
      waitingCodes: this.sessionsByCode.size,
    };
  }
}
