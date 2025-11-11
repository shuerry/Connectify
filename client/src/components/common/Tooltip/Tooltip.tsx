import './Tooltip.css';
import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: string;
}

/**
 * Advanced Tooltip component with multiple positioning options and triggers.
 * Provides accessible, responsive tooltips with smooth animations and positioning.
 */
const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  trigger = 'hover',
  delay = 200,
  disabled = false,
  className = '',
  maxWidth = '200px',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Position calculation to prevent tooltip from going off-screen
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let newPosition = position;

      // Check if tooltip would go off-screen and adjust position
      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
        newPosition = 'top';
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
        newPosition = 'right';
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewport.width - 10) {
        newPosition = 'left';
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideTooltip();
    }
  };

  const tooltipClasses = [
    'tooltip',
    className,
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'tooltip__content',
    `tooltip__content--${actualPosition}`,
    isVisible && 'tooltip__content--visible',
  ].filter(Boolean).join(' ');

  const triggerProps = {
    ...(trigger === 'hover' && {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
    }),
    ...(trigger === 'click' && {
      onClick: toggleTooltip,
    }),
    ...(trigger === 'focus' && {
      onFocus: showTooltip,
      onBlur: hideTooltip,
    }),
  };

  return (
    <div className={tooltipClasses} ref={triggerRef} onKeyDown={handleKeyDown}>
      <div {...triggerProps} className="tooltip__trigger">
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={contentClasses}
          style={{ maxWidth }}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          <div className="tooltip__inner">
            {content}
          </div>
          <div className="tooltip__arrow"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;