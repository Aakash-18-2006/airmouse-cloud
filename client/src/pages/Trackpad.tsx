import React, { useState, useEffect, useRef } from 'react';
import { mouseClient } from '../services/mouseClient';
import { TouchSurface } from '../components/TouchSurface';
import { KeyboardSurface } from '../components/KeyboardSurface';
import { SensitivityModal } from '../components/SensitivityModal';
import { ConnectionStatus } from '../types/protocol';
import { Sliders, Power, AlertCircle, RefreshCw, MousePointer, Keyboard, XSquare } from 'lucide-react';

interface TrackpadProps {
  onNavigate: (page: string) => void;
}

export const Trackpad: React.FC<TrackpadProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'trackpad' | 'keyboard'>('trackpad');
  const [status, setStatus] = useState<ConnectionStatus>(mouseClient.getStatus());
  const [sessionInfo, setSessionInfo] = useState(mouseClient.getSessionInfo());
  const [sensitivity, setSensitivity] = useState<number>(() => {
    const saved = localStorage.getItem('airmouse_sensitivity');
    return saved ? parseFloat(saved) : 1.4;
  });
  const [isSensitivityOpen, setIsSensitivityOpen] = useState<boolean>(false);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [disconnectReason, setDisconnectReason] = useState<string | null>(null);
  const [altF4Feedback, setAltF4Feedback] = useState<boolean>(false);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Check if paired session exists; if not, redirect to connect
    const currentSession = mouseClient.getSessionInfo();
    if (!currentSession) {
      onNavigate('connect');
      return;
    }

    setSessionInfo(currentSession);

    // Track status
    const unsubStatus = mouseClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'disconnected') {
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      }
    });

    const unsubPeer = mouseClient.onPeerDisconnect((reason) => {
      setDisconnectReason(reason || 'Laptop receiver disconnected.');
    });

    const unsubEmergency = mouseClient.onEmergencyStop(() => {
      setDisconnectReason('Mouse control halted by Windows Receiver Emergency Stop.');
    });

    // Start duration timer
    durationTimerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubStatus();
      unsubPeer();
      unsubEmergency();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [onNavigate]);

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    localStorage.setItem('airmouse_sensitivity', val.toString());
  };

  const handleDisconnect = () => {
    mouseClient.clearSession();
    onNavigate('landing');
  };

  const handleReconnect = async () => {
    if (sessionInfo?.pairingCode) {
      setDisconnectReason(null);
      const res = await mouseClient.connectAndPair(sessionInfo.pairingCode);
      if (!res.success) {
        setDisconnectReason(res.error || 'Failed to reconnect.');
      }
    } else {
      onNavigate('connect');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerHaptic = (ms = 25) => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (_) {}
    }
  };

  const handleAltF4 = () => {
    triggerHaptic(35);
    setAltF4Feedback(true);
    setTimeout(() => setAltF4Feedback(false), 300);
    mouseClient.sendAltF4();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '12px 16px',
        boxSizing: 'border-box',
        gap: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="status-pill" style={{ padding: '4px 10px' }}>
            <span className={`status-dot ${status}`} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {status === 'connected' ? (
                <>🟢 Connected to <span style={{ color: 'var(--accent-cyan)' }}>{sessionInfo?.hostname || 'Laptop'}</span></>
              ) : status === 'connecting' ? (
                <>🟡 Connecting...</>
              ) : (
                <>🔴 Disconnected</>
              )}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatTime(sessionDuration)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleAltF4}
            title="Close Active Window (Alt + F4)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: altF4Feedback ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              borderRadius: 'var(--radius-full)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: altF4Feedback ? '0 0 16px rgba(239, 68, 68, 0.65)' : 'none',
              transform: altF4Feedback ? 'scale(0.94)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            <XSquare size={14} color="#f87171" />
            <span>Alt + F4</span>
          </button>

          <button
            onClick={() => setIsSensitivityOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} color="var(--accent-cyan)" />
            <span>{sensitivity.toFixed(1)}x</span>
          </button>

          <button
            className="btn-danger"
            onClick={handleDisconnect}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Power size={14} />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Trackpad vs Keyboard */}
      <div
        className="glass-panel"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => {
            triggerHaptic(20);
            setActiveTab('trackpad');
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: activeTab === 'trackpad' ? '#ffffff' : 'var(--text-secondary)',
            background: activeTab === 'trackpad'
              ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #7c3aed 100%)'
              : 'transparent',
            boxShadow: activeTab === 'trackpad' ? '0 2px 14px rgba(37, 99, 235, 0.5)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <MousePointer size={15} />
          <span>Trackpad</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(20);
            setActiveTab('keyboard');
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: activeTab === 'keyboard' ? '#ffffff' : 'var(--text-secondary)',
            background: activeTab === 'keyboard'
              ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #7c3aed 100%)'
              : 'transparent',
            boxShadow: activeTab === 'keyboard' ? '0 2px 14px rgba(37, 99, 235, 0.5)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Keyboard size={15} />
          <span>Keyboard</span>
        </button>
      </div>

      {/* Disconnect Alert Banner if connection lost */}
      {disconnectReason && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{disconnectReason}</span>
          </div>
          <button
            onClick={handleReconnect}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
            <span>Reconnect</span>
          </button>
        </div>
      )}

      {/* Dynamic Content Area: Trackpad vs Keyboard */}
      {activeTab === 'trackpad' ? (
        <>
          {/* Main Responsive Trackpad Surface */}
          <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
            <TouchSurface sensitivity={sensitivity} />
          </div>

          {/* Bottom Physical Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              height: '74px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => {
                triggerHaptic(30);
                mouseClient.sendLeftClick();
              }}
              className="glass-panel"
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.1s, border-color 0.1s',
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              LEFT CLICK
            </button>

            <button
              onClick={() => {
                triggerHaptic(30);
                mouseClient.sendRightClick();
              }}
              className="glass-panel"
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.1s, border-color 0.1s',
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              RIGHT CLICK
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
          <KeyboardSurface />
        </div>
      )}

      {/* Sensitivity Settings Modal */}
      <SensitivityModal
        isOpen={isSensitivityOpen}
        sensitivity={sensitivity}
        onSensitivityChange={handleSensitivityChange}
        onClose={() => setIsSensitivityOpen(false)}
      />
    </div>
  );
};
