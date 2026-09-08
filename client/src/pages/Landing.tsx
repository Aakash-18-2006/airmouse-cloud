import React from 'react';
import { ArrowRight, Download, Laptop, ShieldCheck, Zap, Smartphone, MousePointer } from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingTop: '24px' }}>
        <div
          className="status-pill"
          style={{
            borderColor: 'rgba(56, 189, 248, 0.4)',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            color: 'var(--accent-cyan)',
          }}
        >
          <Zap size={14} />
          <span>Next-Gen Wireless Cloud Mouse</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '800px',
          }}
        >
          Turn your phone into a wireless mouse for your laptop.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            lineHeight: 1.6,
          }}
        >
          Control your real Windows cursor from any mobile browser through the internet. Zero mobile apps to install. Ultra-low latency WebSocket relay.
        </p>

        {/* Primary CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            marginTop: '12px',
          }}
        >
          <button
            className="btn-primary"
            onClick={() => onNavigate('connect')}
            style={{ padding: '16px 36px', fontSize: '1.15rem' }}
          >
            <span>Start Using AirMouse</span>
            <ArrowRight size={20} />
          </button>

          <button
            className="btn-secondary"
            onClick={() => onNavigate('download')}
            style={{ padding: '16px 32px' }}
          >
            <Download size={20} />
            <span>Download Receiver</span>
          </button>
        </div>
      </div>

      {/* Architecture Graphic Card */}
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '24px' }}>
          HOW AIRMOUSE CLOUD WORKS
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Smartphone size={32} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>1. Mobile Touchpad</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Open airmouse on phone browser and input 6-digit PIN.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-indigo)',
              }}
            >
              <Zap size={32} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>2. Cloud WebSocket</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Sub-15ms secure relay verifies tokens & clamps coordinates.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--status-green)',
              }}
            >
              <Laptop size={32} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>3. Windows PC Receiver</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Controls the REAL Windows OS cursor with zero input delay.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        <div className="glass-panel" style={{ padding: '24px' }}>
          <MousePointer size={28} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Real OS Cursor Control</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Moves the actual Windows operating system mouse cursor. No simulated in-browser pointers or fake mockups.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <Zap size={28} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Multi-Touch Gestures</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Native gestures supported: single tap left-click, two-finger right-click, two-finger vertical scrolling, and long-press drag & drop.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <ShieldCheck size={28} color="var(--status-green)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Zero-Account Security</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Single-use cryptographically random 6-digit codes with automatic TTL expiry, rate-limiting, and instant Emergency Stop safety.
          </p>
        </div>
      </div>
    </div>
  );
};
