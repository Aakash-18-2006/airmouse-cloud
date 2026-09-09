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
  | 'alt_f4'
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

export type KeyboardAction = 'key_press' | 'hotkey' | 'type_text' | 'key_down' | 'key_up';
export type KeyboardModifier = 'ctrl' | 'shift' | 'alt';

export interface KeyboardEventPayload {
  action: KeyboardAction;
  key?: string;
  modifiers?: KeyboardModifier[];
  text?: string;
  seq?: number;
  timestamp?: number;
}

