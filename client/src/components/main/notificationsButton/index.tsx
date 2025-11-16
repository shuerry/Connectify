// src/components/main/notificationsButton/index.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '../../../hooks/useUnreadNotifications';

const NotificationButton: React.FC<{ username: string }> = ({ username }) => {
  const navigate = useNavigate();
  const { unread } = useUnreadNotifications(username);

  return (
    <button
      type='button'
      className='notifications-button'
      onClick={() => navigate('/notifications')}
      aria-label='Open notifications'
      title='Notifications'>
      {/* Bell icon */}
      <svg
        width='18'
        height='18'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor' /* inherits white from the button */
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'>
        <path d='M12 22c1.1 0 2-.9 2-2H10a2 2 0 0 0 2 2z' />
        <path d='M18 16v-5a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z' />
      </svg>

      {/* Number beside the bell (no badge overlay) */}
      <span className='notifications-count'>{unread}</span>
    </button>
  );
};

export default NotificationButton;
