import React from 'react';
import { ArrowUpRight, Sparkles, Wifi, Cpu, Shield, Zap } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '20px 10px',
        minHeight: '380px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Background Circuit Traces & Cosmic Glow (Pure CSS & SVG) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Ambient Nebula Glow Behind Center */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -30%)',
            width: '650px',
            height: '350px',
            background: 'radial-gradient(ellipse, rgba(147, 51, 234, 0.25) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Circuit Board Lines (Left & Right) */}
        <svg
          style={{ width: '100%', height: '100%', opacity: 0.35 }}
          viewBox="0 0 1160 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Circuit Traces */}
          <path
            d="M 40 220 H 120 L 160 180 H 220"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle cx="220" cy="180" r="3" fill="#38bdf8" />
          <path
            d="M 10 140 H 90 L 130 110 H 200"
            stroke="#6366f1"
            strokeWidth="1.5"
          />
          <circle cx="200" cy="110" r="3" fill="#6366f1" />
          <path
            d="M 60 300 H 140 L 180 270 H 250"
            stroke="#38bdf8"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <circle cx="250" cy="270" r="3" fill="#38bdf8" />

          {/* Right Circuit Traces */}
          <path
            d="M 1120 220 H 1040 L 1000 180 H 940"
            stroke="#a855f7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle cx="940" cy="180" r="3" fill="#a855f7" />
          <path
            d="M 1150 130 H 1070 L 1030 100 H 960"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <circle cx="960" cy="100" r="3" fill="#38bdf8" />
          <path
            d="M 1100 290 H 1020 L 980 260 H 910"
            stroke="#6366f1"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <circle cx="910" cy="260" r="3" fill="#6366f1" />

          {/* Flowing Arcs connecting Phone to Laptop */}
          <path
            d="M 230 170 C 380 40, 780 40, 930 170"
            stroke="url(#streamGradient1)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glowFilter)"
          />
          <path
            d="M 240 185 C 400 65, 760 65, 920 185"
            stroke="url(#streamGradient2)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="12 8"
          />
          <path
            d="M 220 160 C 390 20, 770 20, 940 160"
            stroke="url(#streamGradient3)"
            strokeWidth="2"
            opacity="0.7"
          />

          <defs>
            <linearGradient id="streamGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
              <stop offset="70%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="streamGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            <linearGradient id="streamGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#e879f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {/* Ambient Sparkles */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '8%',
            color: '#c084fc',
            opacity: 0.65,
            animation: 'particleShimmer 3s infinite ease-in-out',
          }}
        >
          <Sparkles size={24} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '48%',
            color: '#38bdf8',
            opacity: 0.5,
            animation: 'particleShimmer 4s infinite ease-in-out',
          }}
        >
          <Sparkles size={18} />
        </div>
      </div>

      {/* LEFT: PHONE MOCKUP */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          flex: '0 0 auto',
        }}
      >
        {/* Label Above Phone */}
        <span
          style={{
            fontSize: '0.78rem',
            letterSpacing: '0.12em',
            fontWeight: 700,
            color: 'rgba(148, 163, 184, 0.85)',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            transform: 'rotate(-4deg)',
            textShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
          }}
        >
          YOUR PHONE INTERFACE
        </span>

        {/* 3D Angled Phone Body */}
        <div
          style={{
            width: '185px',
            height: '350px',
            background: 'linear-gradient(145deg, #1e293b 0%, #090e1c 100%)',
            borderRadius: '34px',
            padding: '9px',
            boxShadow: `
              -12px 18px 35px rgba(0, 0, 0, 0.7),
              0 0 25px rgba(56, 189, 248, 0.25),
              inset 0 0 0 1.5px rgba(255, 255, 255, 0.25),
              inset 0 0 10px rgba(56, 189, 248, 0.2)
            `,
            transform: 'perspective(800px) rotateY(15deg) rotateZ(-3deg)',
            transition: 'transform 0.4s ease',
            position: 'relative',
          }}
        >
          {/* Side Buttons Accent */}
          <div
            style={{
              position: 'absolute',
              left: '-4px',
              top: '65px',
              width: '3px',
              height: '32px',
              backgroundColor: '#475569',
              borderRadius: '2px 0 0 2px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-4px',
              top: '110px',
              width: '3px',
              height: '32px',
              backgroundColor: '#475569',
              borderRadius: '2px 0 0 2px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-4px',
              top: '80px',
              width: '3px',
              height: '45px',
              backgroundColor: '#475569',
              borderRadius: '0 2px 2px 0',
            }}
          />

          {/* Screen Glass */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#070a14',
              borderRadius: '26px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '12px 10px',
              background: 'radial-gradient(circle at 50% 45%, #151d3b 0%, #060914 90%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Top Speaker / Dynamic Island */}
            <div
              style={{
                width: '54px',
                height: '11px',
                backgroundColor: '#000000',
                borderRadius: '9999px',
                margin: '0 auto',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            />

            {/* Trackpad Surface with Concentric Rings */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                margin: '10px 0',
              }}
            >
              {/* Outer Glow Ring */}
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                  position: 'absolute',
                }}
              />
              {/* Mid Ring */}
              <div
                style={{
                  width: '95px',
                  height: '95px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  position: 'absolute',
                }}
              />
              {/* Inner Center Target */}
              <div
                style={{
                  width: '55px',
                  height: '55px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.1) 80%)',
                  border: '1px solid rgba(56, 189, 248, 0.6)',
                  position: 'absolute',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
                }}
              />

              {/* Cursor Arrow inside Phone Screen */}
              <div
                style={{
                  position: 'absolute',
                  zIndex: 3,
                  transform: 'translate(-5px, -5px)',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Touch Bar / Gesture Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                paddingBottom: '4px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }}
              />
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent-cyan)',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  boxShadow: '0 0 10px var(--accent-cyan)',
                }}
              />
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }}
              />
            </div>

            {/* Home Indicator line */}
            <div
              style={{
                width: '44px',
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '9999px',
                margin: '2px auto 0 auto',
              }}
            />
          </div>
        </div>
      </div>

      {/* FLOATING TECH LABELS ALONG THE DATA STREAM (Left Side) */}
      <div
        className="hide-on-mobile"
        style={{
          position: 'absolute',
          left: '215px',
          top: '70px',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          className="tech-tag float-item"
          style={{
            transform: 'rotate(-10deg)',
            borderColor: 'rgba(56, 189, 248, 0.6)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
          }}
        >
          <Wifi size={12} color="#38bdf8" />
          <span>WebSocket Relay</span>
        </div>

        <div
          className="tech-tag float-item"
          style={{
            transform: 'rotate(8deg) translateY(12px)',
            borderColor: 'rgba(99, 102, 241, 0.6)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
            animationDelay: '1.2s',
          }}
        >
          <Zap size={12} color="#818cf8" />
          <span>Zero Latency</span>
        </div>
      </div>

      {/* FLOATING TECH LABELS ALONG THE DATA STREAM (Right Side) */}
      <div
        className="hide-on-mobile"
        style={{
          position: 'absolute',
          right: '235px',
          top: '70px',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          className="tech-tag float-item"
          style={{
            transform: 'rotate(8deg)',
            borderColor: 'rgba(168, 85, 247, 0.6)',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
            animationDelay: '0.6s',
          }}
        >
          <Shield size={12} color="#c084fc" />
          <span>No App Installation</span>
        </div>

        <div
          className="tech-tag float-item"
          style={{
            transform: 'rotate(-10deg) translateY(12px)',
            borderColor: 'rgba(56, 189, 248, 0.6)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
            animationDelay: '1.8s',
          }}
        >
          <Cpu size={12} color="#38bdf8" />
          <span>Cloud Connected</span>
        </div>
      </div>

      {/* RIGHT: WINDOWS LAPTOP MOCKUP */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          flex: '0 0 auto',
        }}
      >
        {/* Label Above Laptop */}
        <span
          style={{
            fontSize: '0.78rem',
            letterSpacing: '0.12em',
            fontWeight: 700,
            color: 'rgba(148, 163, 184, 0.85)',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            transform: 'rotate(4deg)',
            textShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
          }}
        >
          LAPTOP DISPLAY
        </span>

        {/* 3D Angled Windows Laptop */}
        <div
          style={{
            width: '270px',
            transform: 'perspective(850px) rotateY(-16deg) rotateZ(2deg)',
            transition: 'transform 0.4s ease',
            filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.75))',
          }}
        >
          {/* Laptop Screen Lid */}
          <div
            style={{
              width: '100%',
              height: '175px',
              backgroundColor: '#0f172a',
              borderRadius: '12px 12px 2px 2px',
              padding: '7px 7px 10px 7px',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.25)',
              position: 'relative',
            }}
          >
            {/* Laptop WebCam dot */}
            <div
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#334155',
                borderRadius: '50%',
                margin: '0 auto 4px auto',
              }}
            />

            {/* Laptop Screen Display (Windows Desktop) */}
            <div
              style={{
                width: '100%',
                height: '148px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 40%, #0f172a 100%)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Windows Logo Background */}
              <div
                style={{
                  position: 'absolute',
                  right: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.6,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                    width: '56px',
                    height: '56px',
                    transform: 'perspective(200px) rotateY(-20deg)',
                  }}
                >
                  <div style={{ backgroundColor: '#38bdf8', opacity: 0.85 }} />
                  <div style={{ backgroundColor: '#38bdf8', opacity: 0.85 }} />
                  <div style={{ backgroundColor: '#38bdf8', opacity: 0.85 }} />
                  <div style={{ backgroundColor: '#38bdf8', opacity: 0.85 }} />
                </div>
              </div>

              {/* Windows Start Menu / Live Tiles Mockup on Left */}
              <div
                style={{
                  width: '90px',
                  height: '100%',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>
                  Pinned
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '3px',
                  }}
                >
                  <div style={{ height: '18px', backgroundColor: '#0284c7', borderRadius: '2px' }} />
                  <div style={{ height: '18px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                  <div style={{ height: '18px', backgroundColor: '#059669', borderRadius: '2px' }} />
                  <div style={{ height: '18px', backgroundColor: '#7c3aed', borderRadius: '2px' }} />
                  <div style={{ height: '18px', backgroundColor: '#d97706', borderRadius: '2px' }} />
                  <div style={{ height: '18px', backgroundColor: '#dc2626', borderRadius: '2px' }} />
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span style={{ fontSize: '0.45rem', color: '#e2e8f0', fontWeight: 600 }}>Receiver Active</span>
                </div>
              </div>

              {/* Real Cursor on Windows Display */}
              <div
                style={{
                  position: 'absolute',
                  right: '48px',
                  bottom: '36px',
                  zIndex: 4,
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))',
                  animation: 'floatSlow 3s ease-in-out infinite',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
                    fill="#ffffff"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Windows Taskbar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '14px',
                  backgroundColor: 'rgba(10, 15, 30, 0.95)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 6px',
                  gap: '5px',
                  zIndex: 3,
                }}
              >
                {/* Win Icon */}
                <div style={{ width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
                <div style={{ width: '8px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
                <span style={{ marginLeft: 'auto', fontSize: '0.42rem', color: '#94a3b8' }}>10:42 AM</span>
              </div>
            </div>
          </div>

          {/* Laptop Base / Keyboard Deck */}
          <div
            style={{
              width: '100%',
              height: '38px',
              backgroundColor: '#1e293b',
              borderRadius: '2px 2px 14px 14px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.8)',
              padding: '3px 8px',
              position: 'relative',
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            }}
          >
            {/* Keyboard Keys Representation */}
            <div
              style={{
                width: '80%',
                height: '14px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '2px',
                margin: '0 auto',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1px',
                padding: '1px',
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '1px' }} />
              ))}
            </div>

            {/* Laptop Trackpad */}
            <div
              style={{
                width: '42px',
                height: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '2px',
                margin: '4px auto 0 auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Responsive Style Overrides */}
      <style>{`
        @media (max-width: 860px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .hero-visual-container {
            flex-direction: column !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};
