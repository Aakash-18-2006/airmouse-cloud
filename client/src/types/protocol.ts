export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

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

export interface SessionInfo {
  sessionToken: string;
  hostname: string;
  pairingCode: string;
}
