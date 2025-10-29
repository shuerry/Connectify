import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import { DatabaseMessage } from '../../../types/types';
import { getMetaData } from '../../../tool';
import useUserContext from '../../../hooks/useUserContext';
import { respondToFriendRequest } from '../../../services/messageService';

/**
 * MessageCard component displays a single message with its sender and timestamp.
 * For friend requests, it also shows accept/decline buttons.
 *
 * @param message: The message object to display.
 * @param onMessageUpdate: Callback function to refresh messages after friend request response.
 */
const MessageCard = ({ 
  message, 
  onMessageUpdate 
}: { 
  message: DatabaseMessage; 
  onMessageUpdate?: () => void;
}) => {
  const { user: currentUser } = useUserContext();

  const handleFriendRequestResponse = async (status: 'accepted' | 'declined') => {
    try {
      await respondToFriendRequest(message._id.toString(), status, currentUser.username);
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  return (
    <div className='message'>
      <div className='message-header'>
        <div className='message-sender'>{message.msgFrom}</div>
        <div className='message-time'>{getMetaData(new Date(message.msgDateTime))}</div>
      </div>
      <div className='message-body'>
        <Markdown remarkPlugins={[remarkGfm]}>{message.msg}</Markdown>
        {message.type === 'friendRequest' && message.msgTo === currentUser.username && (
          <div className='friend-request-actions'>
            {message.friendRequestStatus === 'pending' && (
              <>
                <button 
                  className='accept-button' 
                  onClick={() => handleFriendRequestResponse('accepted')}
                >
                  Accept
                </button>
                <button 
                  className='decline-button' 
                  onClick={() => handleFriendRequestResponse('declined')}
                >
                  Decline
                </button>
              </>
            )}
            {message.friendRequestStatus === 'accepted' && (
              <span className='friend-request-status accepted'>✓ Accepted</span>
            )}
            {message.friendRequestStatus === 'declined' && (
              <span className='friend-request-status declined'>✗ Declined</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;
