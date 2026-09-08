import {
  ConnectionStatus,
  MouseEventPayload,
  SessionInfo,
  KeyboardEventPayload,
  KeyboardModifier
} from '../types/protocol';

export class MouseClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private sessionToken: string | null = null;
  private hostname: string = 'Windows PC';
  private pairingCode: string = '';
  private seq = 0;

  // Listeners
  private onStatusChangeCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private onPeerDisconnectCallbacks: ((reason?: string) => void)[] = [];
  private onEmergencyStopCallbacks: (() => void)[] = [];

  // Movement coalescing buffer
  private pendingDx = 0;
  private pendingDy = 0;
  private rafScheduled = false;

  constructor() {
    // Restore session from sessionStorage if present
    const savedToken = sessionStorage.getItem('airmouse_token');
    const savedHost = sessionStorage.getItem('airmouse_host');
    const savedCode = sessionStorage.getItem('airmouse_code');
    if (savedToken) {
      this.sessionToken = savedToken;
      this.hostname = savedHost || 'Windows PC';
      this.pairingCode = savedCode || '';
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getSessionInfo(): SessionInfo | null {
    if (!this.sessionToken) return null;
    return {
      sessionToken: this.sessionToken,
      hostname: this.hostname,
      pairingCode: this.pairingCode
    };
  }

  public onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.onStatusChangeCallbacks.push(cb);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onPeerDisconnect(cb: (reason?: string) => void): () => void {
    this.onPeerDisconnectCallbacks.push(cb);
    return () => {
      this.onPeerDisconnectCallbacks = this.onPeerDisconnectCallbacks.filter((c) => c !== cb);
    };
  }

  public onEmergencyStop(cb: () => void): () => void {
    this.onEmergencyStopCallbacks.push(cb);
    return () => {
      this.onEmergencyStopCallbacks = this.onEmergencyStopCallbacks.filter((c) => c !== cb);
    };
  }

  private setStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach((cb) => cb(newStatus));
  }

  private getWebSocketUrl(): string {
    // Check if configured via Vite environment variable
    let envUrl = (import.meta as any).env?.VITE_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      envUrl = envUrl.trim();
      // Normalize http/https prefix to ws/wss
      if (envUrl.startsWith('https://')) {
        envUrl = 'wss://' + envUrl.slice(8);
      } else if (envUrl.startsWith('http://')) {
        envUrl = 'ws://' + envUrl.slice(7);
      }
      return envUrl;
    }

    // In production build (e.g. deployed to Vercel/Netlify), default to live Render backend
    if ((import.meta as any).env?.PROD) {
      return 'wss://airmouse-cloud-server.onrender.com/ws';
    }

    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In local dev environment, backend runs on port 5000 if frontend is 5173
    if (host.includes(':5173')) {
      return `${proto}//${window.location.hostname}:5000/ws`;
    }
    return `${proto}//${host}/ws`;
  }

  public connectAndPair(code: string): Promise<{ success: boolean; hostname?: string; error?: string }> {
    return new Promise((resolve) => {
      this.disconnect();
      this.setStatus('connecting');
      this.pairingCode = code;

      const wsUrl = this.getWebSocketUrl();

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        this.setStatus('disconnected');
        resolve({ success: false, error: 'Could not establish connection to cloud.' });
        return;
      }

      const timeout = setTimeout(() => {
        if (this.status === 'connecting') {
          this.disconnect();
          resolve({ success: false, error: 'Connection timed out. Please check your network.' });
        }
      }, 10000);

      this.ws.onopen = () => {
        // Send pairing request
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'pair_with_code',
            code: code.trim()
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'pairing_success') {
            clearTimeout(timeout);
            this.sessionToken = msg.sessionToken;
            this.hostname = msg.hostname || 'Windows PC';
            this.setStatus('connected');

            sessionStorage.setItem('airmouse_token', this.sessionToken || '');
            sessionStorage.setItem('airmouse_host', this.hostname);
            sessionStorage.setItem('airmouse_code', this.pairingCode);

            resolve({ success: true, hostname: this.hostname });
          } else if (msg.type === 'pairing_failed') {
            clearTimeout(timeout);
            this.setStatus('disconnected');
            resolve({ success: false, error: msg.message || 'Pairing failed' });
          } else if (msg.type === 'peer_disconnected') {
            this.setStatus('disconnected');
            this.onPeerDisconnectCallbacks.forEach((cb) => cb(msg.message));
          } else if (msg.type === 'emergency_stopped') {
            this.setStatus('disconnected');
            this.onEmergencyStopCallbacks.forEach((cb) => cb());
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.setStatus('disconnected');
        resolve({ success: false, error: 'Failed to reach cloud server.' });
      };

      this.ws.onclose = () => {
        if (this.status === 'connected') {
          this.setStatus('disconnected');
        }
      };
    });
  }

  /**
   * Queue mouse movement delta with requestAnimationFrame coalescing.
   */
  public sendMove(dx: number, dy: number): void {
    if (this.status !== 'connected' || !this.sessionToken) return;

    this.pendingDx += dx;
    this.pendingDy += dy;

    if (!this.rafScheduled) {
      this.rafScheduled = true;
      requestAnimationFrame(() => {
        this.flushPendingMove();
        this.rafScheduled = false;
      });
    }
  }

  private flushPendingMove(): void {
    if (this.pendingDx === 0 && this.pendingDy === 0) return;

    const dx = Math.round(this.pendingDx);
    const dy = Math.round(this.pendingDy);
    this.pendingDx = 0;
    this.pendingDy = 0;

    this.sendCommand({
      type: 'move',
      dx,
      dy
    });
  }

  public sendLeftClick(): void {
    this.sendCommand({ type: 'left_click' });
  }

  public sendRightClick(): void {
    this.sendCommand({ type: 'right_click' });
  }

  public sendDoubleClick(): void {
    this.sendCommand({ type: 'double_click' });
  }

  public sendMouseDown(button: 'left' | 'right' = 'left'): void {
    this.sendCommand({ type: 'mouse_down', button });
  }

  public sendMouseUp(button: 'left' | 'right' = 'left'): void {
    this.sendCommand({ type: 'mouse_up', button });
  }

  public sendDragStart(button: 'left' | 'right' = 'left'): void {
    this.sendCommand({ type: 'drag_start', button });
  }

  public sendDragMove(dx: number, dy: number): void {
    this.sendCommand({ type: 'drag_move', dx, dy });
  }

  public sendDragEnd(button: 'left' | 'right' = 'left'): void {
    this.sendCommand({ type: 'drag_end', button });
  }

  public sendScroll(amount: number): void {
    this.sendCommand({ type: 'scroll', amount: Math.round(amount) });
  }

  public sendKeyPress(key: string): void {
    this.sendKeyboardCommand({
      action: 'key_press',
      key
    });
  }

  public sendHotkey(key: string, modifiers: KeyboardModifier[]): void {
    this.sendKeyboardCommand({
      action: 'hotkey',
      key,
      modifiers
    });
  }

  public sendTypeText(text: string): void {
    if (!text) return;
    this.sendKeyboardCommand({
      action: 'type_text',
      text
    });
  }

  public sendKeyDown(key: string): void {
    this.sendKeyboardCommand({
      action: 'key_down',
      key
    });
  }

  public sendKeyUp(key: string): void {
    this.sendKeyboardCommand({
      action: 'key_up',
      key
    });
  }

  private sendKeyboardCommand(payload: KeyboardEventPayload): void {
    if (this.status !== 'connected' || !this.ws || !this.sessionToken) return;

    this.seq += 1;
    payload.seq = this.seq;

    const message = {
      type: 'keyboard_event',
      sessionToken: this.sessionToken,
      keyPayload: payload
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public sendEmergencyStop(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'emergency_stop' }));
    }
    this.disconnect();
  }

  private sendCommand(payload: MouseEventPayload): void {
    if (this.status !== 'connected' || !this.ws || !this.sessionToken) return;

    this.seq += 1;
    payload.seq = this.seq;

    const message = {
      type: 'mouse_event',
      sessionToken: this.sessionToken,
      payload
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public disconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  public clearSession(): void {
    this.disconnect();
    this.sessionToken = null;
    this.pairingCode = '';
    sessionStorage.removeItem('airmouse_token');
    sessionStorage.removeItem('airmouse_host');
    sessionStorage.removeItem('airmouse_code');
  }
}

// Export singleton instance for app-wide sharing
export const mouseClient = new MouseClient();
