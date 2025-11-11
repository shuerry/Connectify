import './Badge.css';
import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill' | 'square';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/**
 * Versatile Badge component for displaying status, counts, labels, and notifications.
 * Supports multiple variants, sizes, and special effects like pulse animation.
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  shape = 'rounded',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    `badge--${shape}`,
    dot && 'badge--dot',
    pulse && 'badge--pulse',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (dot) {
    return <span className={badgeClasses} aria-label={typeof children === 'string' ? children : 'notification'} />;
  }

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};

export default Badge;