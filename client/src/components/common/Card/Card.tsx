import './Card.css';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Modern Card component with variants, proper spacing, and accessibility features.
 * Provides a consistent container for content with professional styling.
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    hover && 'card--hover',
    onClick && 'card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const elementType = onClick ? 'button' : 'div';

<<<<<<< HEAD
  return (
    <CardElement
      className={cardClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}>
      {children}
    </CardElement>
=======
  return React.createElement(
    elementType,
    {
      className: cardClasses,
      onClick,
      type: onClick ? 'button' : undefined,
      role: onClick ? 'button' : undefined,
      tabIndex: onClick ? 0 : undefined,
    },
    children,
>>>>>>> d2014c3 (run lint)
  );
};

export default Card;
