import React, { useState, useRef, useEffect } from 'react';
import { mouseClient } from '../services/mouseClient';
import { X, KeyRound, Loader2, CheckCircle2, AlertCircle, Laptop } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToDownload: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateToDownload,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [statusState, setStatusState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setStatusState('idle');
      setStatusMessage('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setStatusState('idle');
    setStatusMessage('');

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setStatusState('error');
      setStatusMessage('Please enter all 6 digits of your pairing code.');
      return;
    }

    setStatusState('connecting');
    setStatusMessage('Connecting...');

    try {
      const result = await mouseClient.connectAndPair(code);
      if (result.success) {
        setStatusState('connected');
        setStatusMessage('Connected to Windows PC');
        setTimeout(() => {
          onSuccess();
        }, 650);
      } else {
        setStatusState('error');
        const err = result.error || 'Invalid Code';
        if (err.toLowerCase().includes('expire')) {
          setStatusMessage('Code Expired');
        } else if (err.toLowerCase().includes('lost') || err.toLowerCase().includes('closed')) {
          setStatusMessage('Connection Lost');
        } else {
          setStatusMessage(err);
        }
      }
    } catch (err: any) {
      setStatusState('error');
      setStatusMessage('Connection Lost. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card-glow"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px 28px',
          borderRadius: '24px',
          backgroundColor: 'rgba(11, 16, 36, 0.88)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
            }}
          >
            <KeyRound size={26} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Connect to your laptop
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Enter the 6-digit pairing code shown on your AirMouse Receiver.
          </p>
        </div>

        {/* 6 Digit Input Group */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: '52px',
                  height: '64px',
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  backgroundColor: 'rgba(7, 11, 26, 0.8)',
                  color: '#ffffff',
                  border: digit
                    ? '2px solid var(--accent-cyan)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  outline: 'none',
                  boxShadow: digit ? '0 0 16px var(--glow-cyan)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {/* Status Feedback Message */}
          {statusState === 'connecting' && (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--status-yellow)',
                fontSize: '0.9rem',
                marginBottom: '18px',
              }}
            >
              <Loader2 size={18} className="status-dot connecting" />
              <span>Connecting...</span>
            </div>
          )}

          {statusState === 'connected' && (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--status-green)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.92rem',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Connected to Windows PC ✓</span>
            </div>
          )}

          {statusState === 'error' && (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#fca5a5',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.9rem',
                marginBottom: '18px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Connect Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={statusState === 'connecting' || statusState === 'connected'}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1.05rem',
              letterSpacing: '0.02em',
              opacity: statusState === 'connecting' ? 0.75 : 1,
            }}
          >
            {statusState === 'connecting' ? (
              <>
                <Loader2 size={18} style={{ animation: 'pulse 1s infinite' }} />
                <span>Connecting...</span>
              </>
            ) : statusState === 'connected' ? (
              <>
                <CheckCircle2 size={18} />
                <span>Connected! Launching Trackpad...</span>
              </>
            ) : (
              <span>Connect</span>
            )}
          </button>
        </form>

        {/* Footer Link to Download Receiver */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Need the receiver for your laptop?{' '}
            <button
              onClick={() => {
                onClose();
                onNavigateToDownload();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              Download Windows Receiver
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
