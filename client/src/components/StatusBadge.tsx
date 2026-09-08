import React from 'react';
import { ConnectionStatus } from '../types/protocol';

interface StatusBadgeProps {
  status: ConnectionStatus;
  hostname?: string;
  onClick?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, hostname, onClick }) => {
  const getLabel = () => {
    switch (status) {
      case 'connected':
        return hostname ? `Connected to ${hostname}` : 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div
      className={`status-pill ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <span className={`status-dot ${status}`} />
      <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{getLabel()}</span>
    </div>
  );
};
