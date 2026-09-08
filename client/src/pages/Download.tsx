import React from 'react';
import { ArrowLeft, Download, Terminal, ShieldAlert, CheckCircle2, Copy, Play } from 'lucide-react';

interface DownloadProps {
  onNavigate: (page: string) => void;
}

export const DownloadPage: React.FC<DownloadProps> = ({ onNavigate }) => {
  const [copied, setCopied] = React.useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('cd receiver && python receiver.py');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: '840px',
        margin: '0 auto',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
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
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </button>

      <div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>
          AirMouse Windows Receiver
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          To allow your phone to control the real Windows cursor, you only need to run the lightweight
          AirMouse Receiver on your laptop. No accounts, no admin drivers required.
        </p>
      </div>

      {/* Quick Start Option 1: Run Batch or Python */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Play size={22} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Option 1: Quick Launch (Recommended)</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
          If you have cloned or downloaded the AirMouse project, double-click:
        </p>

        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--accent-cyan)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <span>receiver\run_receiver.bat</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>
          Or run directly in PowerShell or Command Prompt:
        </p>

        <div
          style={{
            backgroundColor: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: '#e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>cd receiver &amp;&amp; py receiver.py</span>
          <button
            onClick={copyCommand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
            }}
          >
            {copied ? <CheckCircle2 size={16} color="var(--status-green)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Option 2: Build Standalone Executable */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Download size={22} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Option 2: Build Standalone .EXE</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.5 }}>
          You can compile a single standalone Windows executable that doesn't require launching from the command line:
        </p>

        <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
          <li>Open the <code style={{ color: 'var(--accent-cyan)' }}>receiver\</code> directory on your Windows laptop.</li>
          <li>Double click <code style={{ color: 'var(--accent-cyan)' }}>build_exe.bat</code>.</li>
          <li>PyInstaller will compile <code style={{ color: 'var(--status-green)' }}>dist\AirMouseReceiver.exe</code>.</li>
          <li>Distribute or run <code style={{ color: 'var(--status-green)' }}>AirMouseReceiver.exe</code> on any Windows 10/11 machine!</li>
        </ol>
      </div>

      {/* Safety & Emergency Stop Guide */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ShieldAlert size={22} color="var(--status-red)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Emergency Stop &amp; Safety Features</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '12px' }}>
          AirMouse includes multi-layered safety mechanisms so you always retain full control of your PC:
        </p>

        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
          <li><strong>Emergency Stop Button:</strong> Click the prominent red <span style={{ color: '#ef4444' }}>[ STOP CONTROL ]</span> button in the receiver floating window at any time.</li>
          <li><strong>Terminal Keybind:</strong> Press <code style={{ color: 'var(--accent-cyan)' }}>Ctrl + C</code> or type <code style={{ color: 'var(--accent-cyan)' }}>stop</code> in the receiver console.</li>
          <li><strong>Auto-Disconnect:</strong> If the phone browser tab closes or your internet drops, mouse control immediately disengages.</li>
          <li><strong>Bounds Clamping:</strong> Relative cursor jumps are strictly clamped by the cloud relay to prevent erratic cursor movement.</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '12px' }}>
        <button
          className="btn-primary"
          onClick={() => onNavigate('connect')}
          style={{ padding: '16px 40px', fontSize: '1.1rem' }}
        >
          <span>Already Running? Enter Pairing Code</span>
        </button>
      </div>
    </div>
  );
};
