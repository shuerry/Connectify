import React from 'react';
import './OnlineStatusIndicator.css';

interface OnlineStatusIndicatorProps {
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Component that displays an online/offline status indicator.
 * Only shows the indicator if showOnlineStatus is true.
 */
const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline = false,
  showOnlineStatus = true,
  size = 'medium',
  className = '',
}) => {
  if (!showOnlineStatus) {
    return null;
  }

  return (
    <span
      className={`online-status-indicator online-status-indicator-${size} ${
        isOnline ? 'online-status-online' : 'online-status-offline'
      } ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
      aria-label={isOnline ? 'Online' : 'Offline'}>
      <span className='online-status-dot' />
    </span>
  );
};

export default OnlineStatusIndicator;
