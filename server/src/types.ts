import { WebSocket } from 'ws';

export type ClientRole = 'receiver' | 'phone';

export type CommandType =
  | 'move'
  | 'left_click'
  | 'right_click'
  | 'double_click'
  | 'mouse_down'
  | 'mouse_up'
  | 'drag_start'
  | 'drag_move'
  | 'drag_end'
  | 'scroll'
  | 'stop';

export interface MouseEventPayload {
  type: CommandType;
  dx?: number;
  dy?: number;
  amount?: number;
  button?: 'left' | 'right' | 'middle';
  seq?: number;
  timestamp?: number;
}

export interface PairingSession {
  sessionId: string;
  pairingCode: string;
  codeCreatedAt: number;
  codeExpiresAt: number;
  receiverHostname: string;
  receiverSocket: WebSocket | null;
  phoneSocket: WebSocket | null;
  status: 'waiting' | 'paired' | 'terminated';
  sessionToken?: string;
  lastActive: number;
}

// Inbound WS message types
export type InboundMessageType =
  | 'register_receiver'
  | 'pair_with_code'
  | 'mouse_event'
  | 'emergency_stop'
  | 'ping';

export interface InboundMessage {
  type: InboundMessageType;
  code?: string;
  sessionToken?: string;
  hostname?: string;
  payload?: MouseEventPayload;
  timestamp?: number;
}

// Outbound WS message types
export type OutboundMessageType =
  | 'pairing_code'
  | 'pairing_success'
  | 'pairing_failed'
  | 'mouse_relay'
  | 'peer_disconnected'
  | 'emergency_stopped'
  | 'error'
  | 'pong';

export interface OutboundMessage {
  type: OutboundMessageType;
  success?: boolean;
  code?: string;
  expiresInSeconds?: number;
  sessionToken?: string;
  hostname?: string;
  message?: string;
  payload?: MouseEventPayload;
  timestamp?: number;
}
