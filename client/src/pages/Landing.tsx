import React from 'react';
import { HeroVisual } from '../components/HeroVisual';
import {
  ArrowRight,
  Download,
  Zap,
  MousePointer,
  Keyboard,
  Globe,
  Lock,
  OctagonAlert,
  Radio,
  Laptop,
  Smartphone,
  CheckCircle2,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string) => void;
  onOpenConnect: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate, onOpenConnect }) => {
  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '24px 20px 80px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '64px',
        position: 'relative',
      }}
    >
      {/* ==================================================
          HERO SECTION
          ================================================== */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
          paddingTop: '16px',
        }}
      >
        {/* Small Glowing Badge */}
        <div className="glow-badge">
          <Zap size={15} color="#38bdf8" />
          <span>Next-Gen Wireless Cloud Mouse</span>
        </div>

        {/* Main Heading */}
        <h1
          style={{
            fontSize: 'clamp(2.6rem, 5.8vw, 4.4rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: '#ffffff',
            maxWidth: '920px',
            textShadow: '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.25)',
          }}
        >
          Turn your phone into
          <br />
          a wireless mouse
          <br />
          for your laptop.
        </h1>

        {/* Subtitle & Supporting Pill */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '680px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-full)',
              padding: '10px 24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
                color: '#e2e8f0',
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              Control your real Windows cursor from any mobile browser.
            </p>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                marginTop: '4px',
                letterSpacing: '0.01em',
              }}
            >
              No apps. Ultra-low latency cloud-link.
            </p>
          </div>
        </div>

        {/* Primary & Secondary CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '8px',
          }}
        >
          <button
            className="btn-primary"
            onClick={onOpenConnect}
            style={{ padding: '16px 36px', fontSize: '1.1rem' }}
          >
            <span>Start Using AirMouse</span>
            <ArrowRight size={20} />
          </button>

          <button
            className="btn-secondary"
            onClick={() => onNavigate('download')}
            style={{ padding: '16px 32px', fontSize: '1.05rem' }}
          >
            <Download size={19} color="#94a3b8" />
            <span>Download Receiver</span>
          </button>
        </div>

        {/* Central Hero Visual (Phone -> Cloud -> Laptop) */}
        <div style={{ width: '100%', marginTop: '12px' }}>
          <HeroVisual />
        </div>
      </section>

      {/* ==================================================
          HOW IT WORKS SECTION
          ================================================== */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="status-pill"
            style={{
              borderColor: 'rgba(168, 85, 247, 0.35)',
              backgroundColor: 'rgba(168, 85, 247, 0.08)',
              color: '#d8b4fe',
              marginBottom: '12px',
            }}
          >
            <Cpu size={14} />
            <span>SEAMLESS WORKFLOW</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            HOW IT WORKS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px', maxWidth: '520px' }}>
            Four effortless steps to transform your phone into a high-precision laptop trackpad.
          </p>
        </div>

        {/* 4 Glass Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            width: '100%',
          }}
        >
          {/* Card 1: GET RECEIVER */}
          <div className="glass-card-glow" style={{ padding: '30px 24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                marginBottom: '20px',
              }}
            >
              <Download size={26} />
            </div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>
              STEP 01
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              GET RECEIVER
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Run the lightweight Windows receiver on your laptop. No administrative installation required.
            </p>
          </div>

          {/* Card 2: PAIR DEVICE */}
          <div className="glass-card-glow" style={{ padding: '30px 24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-purple)',
                marginBottom: '20px',
              }}
            >
              <Radio size={26} />
            </div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '6px' }}>
              STEP 02
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              PAIR DEVICE
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Enter the secure 6-digit pairing code shown on your receiver into your mobile browser.
            </p>
          </div>

          {/* Card 3: CONTROL */}
          <div className="glass-card-glow" style={{ padding: '30px 24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
                marginBottom: '20px',
              }}
            >
              <Smartphone size={26} />
            </div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '6px' }}>
              STEP 03
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              CONTROL
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Use your phone as a wireless mouse and keyboard with ultra-smooth native multi-touch gestures.
            </p>
          </div>

          {/* Card 4: CONNECTED */}
          <div className="glass-card-glow" style={{ padding: '30px 24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--status-green)',
                marginBottom: '20px',
              }}
            >
              <CheckCircle2 size={26} />
            </div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--status-green)', fontWeight: 700, marginBottom: '6px' }}>
              STEP 04
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              CONNECTED
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Control your Windows PC securely through the cloud, even across different Wi-Fi or cellular networks.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          FEATURES SECTION
          ================================================== */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="status-pill"
            style={{
              borderColor: 'rgba(56, 189, 248, 0.35)',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              color: 'var(--accent-cyan)',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={14} />
            <span>CLOUD CAPABILITIES</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Engineered for Precision &amp; Speed
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px', maxWidth: '580px' }}>
            Everything you need to replace your physical mouse on the go.
          </p>
        </div>

        {/* 6 Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            width: '100%',
          }}
        >
          {/* Feature 1 */}
          <div className="glass-card-glow" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <MousePointer size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Real Windows Cursor
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Control the actual Windows cursor remotely. No simulated in-browser pointers or artificial limits.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card-glow" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                }}
              >
                <Keyboard size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Remote Keyboard
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Type text and control keyboard shortcuts from your phone with full modifier and function key support.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card-glow" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                }}
              >
                <Globe size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Cloud Connected
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Works over the internet without requiring the same Wi-Fi. Control your home PC from anywhere.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card-glow" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-green)',
                }}
              >
                <Lock size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Secure Pairing
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Temporary pairing codes and authenticated sessions with automatic rate-limiting protection.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card-glow" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-yellow)',
                }}
              >
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Low Latency
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Optimized WebSocket communication with micro-frame coalescing for sub-15ms responsive control.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card-glow" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-red)',
                }}
              >
                <OctagonAlert size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Emergency Stop
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
              Immediately stop remote input whenever needed with physical hotkeys or receiver UI overrides.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          BOTTOM CALL TO ACTION BANNER
          ================================================== */}
      <section
        className="glass-card-glow"
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          borderRadius: '32px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.25) 0%, rgba(13, 19, 38, 0.8) 75%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.15)',
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.7rem)', fontWeight: 800, color: '#ffffff' }}>
          Ready to experience frictionless control?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', lineHeight: 1.6 }}>
          No software to install on your mobile device. Launch AirMouse in seconds and control your Windows PC from anywhere.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
          <button
            className="btn-primary"
            onClick={onOpenConnect}
            style={{ padding: '16px 40px', fontSize: '1.1rem' }}
          >
            <span>Launch AirMouse Now</span>
            <ArrowRight size={20} />
          </button>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('download')}
            style={{ padding: '16px 32px' }}
          >
            <Download size={19} />
            <span>Receiver Setup Guide</span>
          </button>
        </div>
      </section>
    </div>
  );
};
