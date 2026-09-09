import React, { useState, useRef, useEffect } from 'react';
import { mouseClient } from '../services/mouseClient';
import { ArrowLeft, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConnectProps {
  onNavigate: (page: string) => void;
}

export const Connect: React.FC<ConnectProps> = ({ onNavigate }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [statusState, setStatusState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check if code query param is present
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && /^\d{6}$/.test(codeParam.trim())) {
      const codeDigits = codeParam.trim().split('');
      setDigits(codeDigits);
      const connectWithCode = async (c: string) => {
        setStatusState('connecting');
        setStatusMessage('Connecting...');
        try {
          const result = await mouseClient.connectAndPair(c);
          if (result.success) {
            setStatusState('connected');
            setStatusMessage('Connected to Windows PC');
            setTimeout(() => {
              onNavigate('mouse');
            }, 650);
          } else {
            setStatusState('error');
            setStatusMessage(result.error || 'Invalid Code');
          }
        } catch (err: any) {
          setStatusState('error');
          setStatusMessage('Connection error.');
        }
      };
      connectWithCode(codeParam.trim());
    } else {
      // Focus the first digit input on mount
      inputRefs.current[0]?.focus();
    }
  }, []);

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

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
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
          onNavigate('mouse');
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
      setStatusMessage('Connection Lost. Please check your network and try again.');
    }
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '20px auto',
        padding: '24px 20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <button
        onClick={() => onNavigate('landing')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.95rem',
          padding: '4px 0',
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </button>

      <div
        className="glass-card-glow"
        style={{
          padding: '40px 28px',
          textAlign: 'center',
          backgroundColor: 'rgba(11, 16, 36, 0.85)',
          borderRadius: '24px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            margin: '0 auto 18px auto',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
          }}
        >
          <KeyRound size={28} />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Connect to your laptop
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px', lineHeight: 1.5 }}>
          Enter the 6-digit pairing code shown on your AirMouse Receiver.
        </p>

        {/* 6 Digit Input Group */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '24px',
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

          {/* Feedback states */}
          {statusState === 'connecting' && (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--status-yellow)',
                fontSize: '0.92rem',
                marginBottom: '20px',
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
                marginBottom: '20px',
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
                gap: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '0.9rem',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={statusState === 'connecting' || statusState === 'connected'}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
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

        <div
          style={{
            marginTop: '26px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Need the receiver for your laptop?{' '}
            <button
              onClick={() => onNavigate('download')}
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
