import './Avatar.css';
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'circle' | 'rounded' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  fallbackColor?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Advanced Avatar component with multiple variants, status indicators, and fallback handling.
 * Supports images, initials, and various visual states for professional user representation.
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  variant = 'circle',
  status,
  showStatus = false,
  isOnline,
  showOnlineStatus = true,
  fallbackColor,
  className = '',
  onClick,
}) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getFallbackColor = (name: string) => {
    if (fallbackColor) return fallbackColor;

    const colors = [
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
    ];

    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarClasses = [
    'avatar',
    `avatar--${size}`,
    `avatar--${variant}`,
    onClick && 'avatar--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const initials = getInitials(name);
  const colorClass = getFallbackColor(name);

  return (
    <div className={avatarClasses} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={`avatar__container ${!src ? colorClass : ''}`}>
        {src ? (
          <img
            src={src}
            alt={alt || `${name}'s avatar`}
            className='avatar__image'
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className='avatar__initials'>{initials}</span>
        )}
      </div>

      {showStatus && status && (
        <div className={`avatar__status avatar__status--${status}`} title={status}>
          <div className='avatar__status-dot'></div>
        </div>
      )}
      
      {/* Online Status Indicator - positioned at lower left */}
      {showOnlineStatus !== false && isOnline !== undefined && (
        <div 
          className={`avatar__online-status ${isOnline ? 'avatar__online-status--online' : 'avatar__online-status--offline'}`}
          title={isOnline ? 'Online' : 'Offline'}>
        </div>
      )}
    </div>
  );
};

export default Avatar;
