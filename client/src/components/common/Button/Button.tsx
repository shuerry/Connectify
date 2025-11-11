import './Button.css';
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}

/**
 * Modern Button component with comprehensive variants, sizes, and states.
 * Follows accessibility best practices and design system tokens.
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
}) => {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
    >
      {loading && (
        <div className='btn-spinner' role='status' aria-label='Loading'>
          <div className='spinner'></div>
        </div>
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className='btn-icon btn-icon-left'>{icon}</span>
      )}
      <span className={loading ? 'btn-text-loading' : 'btn-text'}>{children}</span>
      {icon && iconPosition === 'right' && !loading && (
        <span className='btn-icon btn-icon-right'>{icon}</span>
      )}
    </button>
  );
};

export default Button;