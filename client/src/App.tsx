import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Connect } from './pages/Connect';
import { Trackpad } from './pages/Trackpad';
import { DownloadPage } from './pages/Download';
import { mouseClient } from './services/mouseClient';
import { Mouse, Download, Wifi, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'connect' || path === 'mouse' || path === 'download') {
      return path;
    }
    return 'landing';
  });

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

  // If on trackpad page, render immersive full-screen UI
  if (currentPage === 'mouse') {
    return <Trackpad onNavigate={navigate} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(9, 13, 22, 0.8)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            onClick={() => navigate('landing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.5)',
              }}
            >
              <Mouse size={20} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              AirMouse <span style={{ color: 'var(--accent-cyan)' }}>Cloud</span>
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('download')}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage === 'download' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={16} />
              <span>Receiver</span>
            </button>

            <button
              onClick={() => navigate('connect')}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.9rem' }}
            >
              <span>Connect</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {currentPage === 'landing' && <Landing onNavigate={navigate} />}
        {currentPage === 'connect' && <Connect onNavigate={navigate} />}
        {currentPage === 'download' && <DownloadPage onNavigate={navigate} />}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          backgroundColor: '#070a12',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            AirMouse Cloud &copy; {new Date().getFullYear()} • Zero-Install Cloud Trackpad
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={14} color="var(--status-green)" /> Sub-15ms WebSocket
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} color="var(--accent-cyan)" /> Real OS Cursor Control
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
