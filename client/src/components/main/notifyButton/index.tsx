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
        className={`vote-button ${notify ? 'vote-button-followed' : ''}`}
        onClick={() => handleNotify()}>
        Notify Me
      </button>
    </div>
  );
};

export default NotifComponent;
