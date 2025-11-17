import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { PopulatedDatabaseChat } from '../../../types/types';
import { toggleNotify } from '../../../services/chatService';
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
  const { user } = useUserContext();
  const { notify } = useNotifyStatus({ chat });
  /**
   * Function to handle following a chat.
   */
  const handleNotify = async () => {
    try {
      if (chat._id) {
        await toggleNotify(chat._id, user.username);
      }
    } catch (error) {
      // Handle error
    }
  };

  // Kept the classnames so that I can reuse the CSS styles
  return (
    <div className='vote-container'>
      <button
        aria-pressed={notify}
        title={
          notify ? 'You will be notified for new messages' : 'Enable notifications for this chat'
        }
        className={`vote-button ${notify ? 'vote-button-followed' : ''}`}
        onClick={e => {
          e.stopPropagation();
          handleNotify();
        }}>
        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true' focusable='false'>
          <path
            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M13.73 21a2 2 0 01-3.46 0'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
        <span className='vote-label'>{notify ? 'Notified' : 'Notify'}</span>
      </button>
    </div>
  );
};

export default NotifComponent;
