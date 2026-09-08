import React, { useState, useRef, useEffect } from 'react';
import { mouseClient } from '../services/mouseClient';
import { ArrowLeft, Laptop, AlertCircle, Loader2, KeyRound } from 'lucide-react';

interface ConnectProps {
  onNavigate: (page: string) => void;
}

export const Connect: React.FC<ConnectProps> = ({ onNavigate }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus the first digit input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    // Allow only single numeric digit
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance to next input if digit entered
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
      setErrorMessage('Please enter all 6 digits of your pairing code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await mouseClient.connectAndPair(code);
      if (result.success) {
        onNavigate('mouse');
      } else {
        setErrorMessage(result.error || 'Pairing failed. Please check the code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        padding: '32px 20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
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

      <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            margin: '0 auto 16px auto',
          }}
        >
          <KeyRound size={28} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
          Connect to Laptop
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px' }}>
          Enter the 6-digit pairing code displayed on your Windows AirMouse Receiver
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
                  width: '46px',
                  height: '58px',
                  textAlign: 'center',
                  fontSize: '1.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: 'var(--text-primary)',
                  border: digit ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  boxShadow: digit ? '0 0 12px var(--accent-cyan-glow)' : 'none',
                  transition: 'border 0.2s, box-shadow 0.2s',
                }}
              />
            ))}
          </div>

          {errorMessage && (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '0.9rem',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.1rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="status-dot connecting" />
                <span>Pairing with PC...</span>
              </>
            ) : (
              <span>CONNECT</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
