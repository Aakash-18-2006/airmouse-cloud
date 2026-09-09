import React from 'react';
import { ArrowLeft, Download, Terminal, ShieldAlert, CheckCircle2, Copy, Play, Sparkles } from 'lucide-react';

interface DownloadProps {
  onNavigate: (page: string) => void;
}

export const DownloadPage: React.FC<DownloadProps> = ({ onNavigate }) => {
  const [copiedBatch, setCopiedBatch] = React.useState(false);
  const [copiedPy, setCopiedPy] = React.useState(false);

  const copyBatchCommand = () => {
    navigator.clipboard.writeText('receiver\\run_receiver.bat');
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  const copyPyCommand = () => {
    navigator.clipboard.writeText('cd receiver && py receiver.py');
    setCopiedPy(true);
    setTimeout(() => setCopiedPy(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px 20px 80px 20px',
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
          <span>WINDOWS COMPANION</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
          AirMouse Windows Receiver
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '720px' }}>
          To allow your phone to control the real Windows cursor, run the lightweight AirMouse Receiver
          on your laptop. Zero complex installation, no kernel drivers required.
        </p>
      </div>

      {/* Quick Start Option 1 */}
      <div className="glass-card-glow" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}
          >
            <Play size={22} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
            Option 1: Quick Launch (Recommended)
          </h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.5 }}>
          If you have downloaded or cloned the project repository, double-click the quick launch script in Windows Explorer:
        </p>

        <div
          style={{
            backgroundColor: 'rgba(5, 9, 22, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.92rem',
            color: 'var(--accent-cyan)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <span>receiver\run_receiver.bat</span>
          <button
            onClick={copyBatchCommand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}
          >
            {copiedBatch ? <CheckCircle2 size={16} color="var(--status-green)" /> : <Copy size={16} />}
            <span>{copiedBatch ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '10px' }}>
          Or run directly in PowerShell or Command Prompt:
        </p>

        <div
          style={{
            backgroundColor: 'rgba(5, 9, 22, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.92rem',
            color: '#e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>cd receiver &amp;&amp; py receiver.py</span>
          <button
            onClick={copyPyCommand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}
          >
            {copiedPy ? <CheckCircle2 size={16} color="var(--status-green)" /> : <Copy size={16} />}
            <span>{copiedPy ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Option 2: Build Standalone Executable */}
      <div className="glass-card-glow" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)',
            }}
          >
            <Download size={22} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
            Option 2: Standalone .EXE Executable
          </h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.6 }}>
          You can compile the receiver into a single standalone Windows executable that doesn't require launching python:
        </p>

        <ol
          style={{
            paddingLeft: '22px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
        >
          <li>Open the <code style={{ color: 'var(--accent-cyan)' }}>receiver\</code> folder on your Windows laptop.</li>
          <li>Double click <code style={{ color: 'var(--accent-cyan)' }}>build_exe.bat</code>.</li>
          <li>PyInstaller compiles <code style={{ color: 'var(--status-green)' }}>dist\AirMouseReceiver.exe</code>.</li>
          <li>Run <code style={{ color: 'var(--status-green)' }}>AirMouseReceiver.exe</code> on any Windows 10 or 11 machine without dependencies!</li>
        </ol>
      </div>

      {/* Safety & Emergency Stop */}
      <div className="glass-card-glow" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-red)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
            Emergency Stop &amp; Security Controls
          </h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '14px' }}>
          AirMouse has built-in safety controls so you are always in complete authority over your Windows system:
        </p>

        <ul
          style={{
            paddingLeft: '22px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
        >
          <li>
            <strong style={{ color: '#ffffff' }}>Emergency Stop Button:</strong> Click the prominent red{' '}
            <span style={{ color: '#f87171', fontWeight: 700 }}>[ STOP CONTROL ]</span> button in the receiver floating window at any moment.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Console Shortcut:</strong> Type <code style={{ color: 'var(--accent-cyan)' }}>stop</code> or press <code style={{ color: 'var(--accent-cyan)' }}>Ctrl + C</code> in the receiver terminal.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Auto-Disconnect:</strong> If your browser closes or network drops, remote cursor control terminates immediately.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Velocity Clamping:</strong> Mouse offsets are clamped to protect against jumpy coordinates.
          </li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '10px' }}>
        <button
          className="btn-primary"
          onClick={() => onNavigate('connect')}
          style={{ padding: '16px 44px', fontSize: '1.1rem' }}
        >
          <span>Already Running? Enter Pairing Code</span>
        </button>
      </div>
    </div>
  );
};
