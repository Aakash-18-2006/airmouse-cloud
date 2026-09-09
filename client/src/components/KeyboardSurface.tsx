import React, { useState } from 'react';
import { mouseClient } from '../services/mouseClient';
import { KeyboardModifier } from '../types/protocol';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Delete as BackspaceIcon,
  Send,
  Trash2,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';

export const KeyboardSurface: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [activeModifiers, setActiveModifiers] = useState<KeyboardModifier[]>([]);
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);

  const triggerHaptic = (ms = 20) => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (_) {}
    }
  };

  const showFeedback = (label: string) => {
    setFeedbackKey(label);
    setTimeout(() => {
      setFeedbackKey((curr) => (curr === label ? null : curr));
    }, 250);
  };

  const toggleModifier = (mod: KeyboardModifier) => {
    triggerHaptic(25);
    setActiveModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const sendKey = (key: string, label?: string) => {
    triggerHaptic(20);
    showFeedback(label || key);

    if (activeModifiers.length > 0) {
      mouseClient.sendHotkey(key, activeModifiers);
      // Auto-release single-shot modifier after key press
      setActiveModifiers([]);
    } else {
      mouseClient.sendKeyPress(key);
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    triggerHaptic(30);
    showFeedback('Text Sent');
    mouseClient.sendTypeText(trimmed);
    setInputText('');
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        gap: '10px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        overflowY: 'auto',
        paddingBottom: '8px',
      }}
    >
      {/* Text Input Card */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <form
          onSubmit={handleSendText}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type text to send to PC..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-cyan)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary"
            style={{
              padding: '10px 16px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              opacity: inputText.trim() ? 1 : 0.45,
              cursor: inputText.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}
          >
            <Send size={15} />
            <span>Type</span>
          </button>
        </form>

        {feedbackKey && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}
          >
            Sent: {feedbackKey}
          </div>
        )}
      </div>

      {/* Modifier Key Toggles: Ctrl, Shift, Alt */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
        }}
      >
        {(['ctrl', 'shift', 'alt'] as KeyboardModifier[]).map((mod) => {
          const isActive = activeModifiers.includes(mod);
          return (
            <button
              key={mod}
              onClick={() => toggleModifier(mod)}
              className="glass-panel"
              style={{
                padding: '10px 4px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isActive ? '#0f172a' : 'var(--text-primary)',
                background: isActive
                  ? 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: isActive ? 'var(--accent-cyan)' : 'var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {mod.toUpperCase()}
              {isActive && ' (ON)'}
            </button>
          );
        })}
      </div>

      {/* Essential Control Keys (Esc, Tab, Backspace, Enter, Space, Del) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        <button
          onClick={() => sendKey('esc', 'Esc')}
          className="glass-panel"
          style={keyButtonStyle}
        >
          ESC
        </button>

        <button
          onClick={() => sendKey('tab', 'Tab')}
          className="glass-panel"
          style={keyButtonStyle}
        >
          TAB ⇥
        </button>

        <button
          onClick={() => sendKey('backspace', 'Backspace')}
          className="glass-panel"
          style={{ ...keyButtonStyle, color: '#fca5a5' }}
        >
          <BackspaceIcon size={16} />
          <span>BKSP</span>
        </button>

        <button
          onClick={() => sendKey('delete', 'Delete')}
          className="glass-panel"
          style={{ ...keyButtonStyle, color: '#fca5a5' }}
        >
          <Trash2 size={15} />
          <span>DEL</span>
        </button>

        <button
          onClick={() => sendKey('space', 'Space')}
          className="glass-panel"
          style={keyButtonStyle}
        >
          SPACE ␣
        </button>

        <button
          onClick={() => sendKey('enter', 'Enter')}
          className="glass-panel"
          style={{
            ...keyButtonStyle,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
            borderColor: 'rgba(34, 197, 94, 0.4)',
            color: '#86efac',
          }}
        >
          <CornerDownLeft size={16} />
          <span>ENTER</span>
        </button>
      </div>

      {/* Navigation & Arrow Keys Section */}
      <div
        className="glass-panel"
        style={{
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Navigation Cluster: Home, End, PgUp, PgDn */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          <button
            onClick={() => sendKey('home', 'Home')}
            className="glass-panel"
            style={navButtonStyle}
          >
            HOME
          </button>
          <button
            onClick={() => sendKey('end', 'End')}
            className="glass-panel"
            style={navButtonStyle}
          >
            END
          </button>
          <button
            onClick={() => sendKey('pageup', 'Page Up')}
            className="glass-panel"
            style={navButtonStyle}
          >
            <ChevronsUp size={14} />
            <span>PG UP</span>
          </button>
          <button
            onClick={() => sendKey('pagedown', 'Page Down')}
            className="glass-panel"
            style={navButtonStyle}
          >
            <ChevronsDown size={14} />
            <span>PG DN</span>
          </button>
        </div>

        {/* Directional D-Pad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 44px)',
            gap: '6px',
            justifyItems: 'center',
            alignItems: 'center',
          }}
        >
          <div />
          <button
            onClick={() => sendKey('up', 'Arrow Up')}
            className="glass-panel"
            style={arrowButtonStyle}
          >
            <ArrowUp size={18} />
          </button>
          <div />

          <button
            onClick={() => sendKey('left', 'Arrow Left')}
            className="glass-panel"
            style={arrowButtonStyle}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => sendKey('down', 'Arrow Down')}
            className="glass-panel"
            style={arrowButtonStyle}
          >
            <ArrowDown size={18} />
          </button>
          <button
            onClick={() => sendKey('right', 'Arrow Right')}
            className="glass-panel"
            style={arrowButtonStyle}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Quick Hotkey Bar (Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+A, Alt+Tab) */}
      <div
        className="glass-panel"
        style={{
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Quick Shortcuts
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '6px',
          }}
        >
          {[
            { label: 'Copy', mod: 'ctrl' as KeyboardModifier, key: 'c' },
            { label: 'Paste', mod: 'ctrl' as KeyboardModifier, key: 'v' },
            { label: 'Undo', mod: 'ctrl' as KeyboardModifier, key: 'z' },
            { label: 'All', mod: 'ctrl' as KeyboardModifier, key: 'a' },
            { label: 'Tab⇥', mod: 'alt' as KeyboardModifier, key: 'tab' },
            { label: 'Alt+F4', isAltF4: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                triggerHaptic(25);
                if (item.isAltF4) {
                  showFeedback('ALT+F4');
                  mouseClient.sendAltF4();
                } else if (item.mod && item.key) {
                  showFeedback(`${item.mod.toUpperCase()}+${item.key.toUpperCase()}`);
                  mouseClient.sendHotkey(item.key, [item.mod]);
                }
              }}
              className="glass-panel"
              style={{
                padding: '8px 2px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: item.isAltF4 ? '#fca5a5' : 'var(--text-primary)',
                background: item.isAltF4 ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                border: item.isAltF4 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const keyButtonStyle: React.CSSProperties = {
  padding: '12px 6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  touchAction: 'manipulation',
};

const navButtonStyle: React.CSSProperties = {
  padding: '10px 4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  touchAction: 'manipulation',
};

const arrowButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--accent-cyan)',
  cursor: 'pointer',
  touchAction: 'manipulation',
};
