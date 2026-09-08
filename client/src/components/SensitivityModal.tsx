import React from 'react';
import { X, Sliders } from 'lucide-react';

interface SensitivityModalProps {
  isOpen: boolean;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  onClose: () => void;
}

export const SensitivityModal: React.FC<SensitivityModalProps> = ({
  isOpen,
  sensitivity,
  onSensitivityChange,
  onClose,
}) => {
  if (!isOpen) return null;

  const presets = [
    { label: 'Low', value: 0.8 },
    { label: 'Standard', value: 1.4 },
    { label: 'High', value: 2.2 },
    { label: 'Ultra', value: 3.0 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel fade-in"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '24px',
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Mouse Sensitivity</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tracking Speed</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {sensitivity.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="3.5"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--accent-cyan)',
              height: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Precise (0.4x)</span>
            <span>Fast (3.5x)</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {presets.map((p) => {
            const isSelected = Math.abs(sensitivity - p.value) < 0.15;
            return (
              <button
                key={p.label}
                onClick={() => onSensitivityChange(p.value)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '12px' }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
};
