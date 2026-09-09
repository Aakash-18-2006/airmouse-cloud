import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Connect } from './pages/Connect';
import { Trackpad } from './pages/Trackpad';
import { DownloadPage } from './pages/Download';
import { ConnectModal } from './components/ConnectModal';
import { mouseClient } from './services/mouseClient';
import { Download, Wifi, Shield, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'connect' || path === 'mouse' || path === 'download') {
      return path;
    }
    return 'landing';
  });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Keep browser history in sync
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'connect' || path === 'mouse' || path === 'download') {
        setCurrentPage(path);
      } else {
        setCurrentPage('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: string) => {
    setCurrentPage(page);
    const newPath = page === 'landing' ? '/' : `/${page}`;
    window.history.pushState(null, '', newPath);
    window.scrollTo(0, 0);
  };

  const handleConnectSuccess = () => {
    setIsConnectModalOpen(false);
    navigate('mouse');
  };

  // If on trackpad page, render immersive full-screen UI
  if (currentPage === 'mouse') {
    return <Trackpad onNavigate={navigate} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Floating Capsule Header matching Reference Image */}
      <header
        style={{
          position: 'sticky',
          top: '16px',
          zIndex: 100,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            backgroundColor: 'rgba(10, 15, 34, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.12)',
            pointerEvents: 'auto',
          }}
        >
          {/* Logo / Brand */}
          <div
            onClick={() => navigate('landing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {/* Pill Logo Icon matching Reference */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              {/* Minimalist mouse / power trackpad icon */}
              <div
                style={{
                  width: '14px',
                  height: '20px',
                  borderRadius: '7px',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '2px',
                }}
              >
                <div style={{ width: '2px', height: '5px', backgroundColor: '#ffffff', borderRadius: '1px' }} />
              </div>
            </div>

            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              AirMouse <span style={{ color: 'var(--accent-cyan)' }}>Cloud</span>
            </span>
          </div>

          {/* Navigation Actions */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('download')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: currentPage === 'download' ? 'var(--accent-cyan)' : '#cbd5e1',
                borderRadius: 'var(--radius-full)',
                padding: '8px 18px',
                fontSize: '0.92rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            >
              <Download size={15} />
              <span>Receiver</span>
            </button>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="btn-primary"
              style={{
                padding: '8px 22px',
                fontSize: '0.92rem',
                fontWeight: 600,
              }}
            >
              <span>Connect</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, paddingTop: '10px' }}>
        {currentPage === 'landing' && (
          <Landing
            onNavigate={navigate}
            onOpenConnect={() => setIsConnectModalOpen(true)}
          />
        )}
        {currentPage === 'connect' && <Connect onNavigate={navigate} />}
        {currentPage === 'download' && <DownloadPage onNavigate={navigate} />}
      </main>

      {/* Modal Pairing Dialog */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={handleConnectSuccess}
        onNavigateToDownload={() => navigate('download')}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '28px 20px',
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
          backgroundColor: '#04060e',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>AirMouse Cloud</span>
            <span>•</span>
            <span>Your phone. Your cursor. Anywhere.</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={14} color="var(--status-green)" /> Sub-15ms WebSocket
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="var(--accent-cyan)" /> Real Windows OS Cursor
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--accent-purple)" /> Cloud Relay
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
