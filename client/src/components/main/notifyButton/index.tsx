import './index.css';
import { PopulatedDatabaseChat } from '../../../types/types';
import useNotifyStatus from '../../../hooks/useNotifyStatus';
/**
 * Interface represents the props for the FollowComponent.
 *
 * question - The question object containing follow information.
 */
interface NotifComponentProps {
  chat: PopulatedDatabaseChat;
}

/**
 * A Notification component that displays the notification button for a chat.
 *
 * @param chat - The chat object containing notification information.
 */
const NotifComponent = ({ chat }: NotifComponentProps) => {
  const { toggleLocalNotify, notify } = useNotifyStatus({ chat });

  // Kept the classnames so that I can reuse the CSS styles
  return (
    <div className='vote-container'>
      <button
        className='action-button'
        onClick={e => {
          e.stopPropagation();
          toggleLocalNotify();
        }}
        title={
          notify ? 'Disable notifications for this chat' : 'Enable notifications for this chat'
        }>
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
          <path
            d='M12 22c1.1 0 2-.9 2-2H10a2 2 0 0 0 2 2z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M18 16v-5a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          {!notify && (
            <line
              x1='4'
              y1='4'
              x2='20'
              y2='23'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            />
          )}
        </svg>
      </button>
    </div>
  );
};

export default NotifComponent;
