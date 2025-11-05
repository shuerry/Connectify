import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { DatabaseMessage } from '../../../types/types';
import { getMetaData } from '../../../tool';
import useUserContext from '../../../hooks/useUserContext';
import { respondToFriendRequest, respondToGameInvitation } from '../../../services/messageService';

/**
 * MessageCard component displays a single message with its sender and timestamp.
 * For friend requests, it also shows accept/decline buttons.
 *
 * @param message: The message object to display.
 * @param onMessageUpdate: Callback function to refresh messages after friend request response.
 */
const MessageCard = ({
  message,
  onMessageUpdate,
}: {
  message: DatabaseMessage;
  onMessageUpdate?: () => void;
}) => {
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();

  const handleFriendRequestResponse = async (status: 'accepted' | 'declined') => {
    try {
      await respondToFriendRequest(message._id.toString(), status, currentUser.username);
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      throw new Error('Failed to respond to friend request');
    }
  };

  const handleGameInvitationResponse = async (status: 'accepted' | 'declined') => {
    try {
      await respondToGameInvitation(message._id.toString(), status, currentUser.username);
      
      // If accepted, copy room code and redirect to Connect Four page
      if (status === 'accepted' && message.gameInvitation) {
        try {
          // If there's a room code, copy it to clipboard
          if (message.gameInvitation.roomCode) {
            await navigator.clipboard.writeText(message.gameInvitation.roomCode);
            alert(`Room code "${message.gameInvitation.roomCode}" copied to clipboard! You can now join the game on the Connect Four page.`);
          } else {
            alert('Redirecting to Connect Four page. Look for the room in the public games list.');
          }
          
          // Save the invitation details for easy access on the Connect Four page
          try {
            localStorage.setItem('connectfour_pending_invitation', JSON.stringify({
              gameID: message.gameInvitation.gameID,
              roomCode: message.gameInvitation.roomCode,
              roomName: message.gameInvitation.roomName,
              inviterUsername: message.msgFrom,
            }));
          } catch (storageError) {
            console.error('Failed to save invitation details:', storageError);
          }
          
          // Navigate to Connect Four page using React Router
          navigate('/games/connectfour');
        } catch (error) {
          console.error('Error handling game invitation:', error);
          // Fallback: just navigate to Connect Four page
          navigate('/games/connectfour');
        }
      }
      
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      console.error('Error responding to game invitation:', error);
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
                  onClick={() => handleFriendRequestResponse('accepted')}>
                  Accept
                </button>
                <button
                  className='decline-button'
                  onClick={() => handleFriendRequestResponse('declined')}>
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
        {message.type === 'gameInvitation' && message.msgTo === currentUser.username && (
          <div className='game-invitation-actions'>
            {message.gameInvitation?.status === 'pending' && (
              <>
                <button 
                  className='accept-button game-accept' 
                  onClick={() => handleGameInvitationResponse('accepted')}
                >
                  {message.gameInvitation?.roomCode ? 'Copy Code & Go' : 'Go to Game'}
                </button>
                <button 
                  className='decline-button game-decline' 
                  onClick={() => handleGameInvitationResponse('declined')}
                >
                  Decline
                </button>
              </>
            )}
            {message.gameInvitation?.status === 'accepted' && (
              <span className='game-invitation-status accepted'> Joined Game</span>
            )}
            {message.gameInvitation?.status === 'declined' && (
              <span className='game-invitation-status declined'> Declined</span>
            )}
            {message.gameInvitation?.status === 'expired' && (
              <span className='game-invitation-status expired'> Expired</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;
