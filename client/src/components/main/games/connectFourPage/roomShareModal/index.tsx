import { useState, useEffect } from 'react';
import './index.css';
import { ConnectFourGameState, GameInstance } from '../../../../../types/types';
import { sendGameInvitation } from '../../../../../services/messageService';
import { getRelations } from '../../../../../services/userService';
import useUserContext from '../../../../../hooks/useUserContext';
import logger from '../../../../../utils/logger';

interface RoomShareModalProps {
  onClose: () => void;
  gameInstance: GameInstance<ConnectFourGameState>;
}

/**
 * Modal component for sharing a Connect Four room via direct messages
 */
const RoomShareModal = ({ onClose, gameInstance }: RoomShareModalProps) => {
  const { user } = useUserContext();
  const [friends, setFriends] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      if (!user?.username) return;

      try {
        setIsLoading(true);
        const relations = await getRelations(user.username);
        setFriends(relations.friends || []);
      } catch (err) {
        setError('Failed to load friends list');
      } finally {
        setIsLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  const handleFriendToggle = (friendUsername: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendUsername)
        ? prev.filter(f => f !== friendUsername)
        : [...prev, friendUsername],
    );
  };

  const handleSendInvitations = async () => {
    if (!user?.username || selectedFriends.length === 0) return;

    try {
      setIsSending(true);
      setError('');

      logger.info('Sending invitations from:', user.username);
      logger.info('Selected friends:', selectedFriends);
      logger.info('Game instance:', gameInstance);

      const roomSettings = gameInstance.state.roomSettings;
      let sentCount = 0;

      for (const friendUsername of selectedFriends) {
        try {
          logger.info(`Sending invitation to: ${friendUsername}`);
          logger.info('Invitation data:', {
            from: user.username,
            to: friendUsername,
            gameID: gameInstance.gameID,
            roomName: roomSettings.roomName,
            gameType: 'Connect Four',
            roomCode: roomSettings.roomCode,
          });

          await sendGameInvitation(
            user.username,
            friendUsername,
            gameInstance.gameID,
            roomSettings.roomName,
            'Connect Four',
            roomSettings.roomCode,
          );
          logger.info(`Successfully sent invitation to ${friendUsername}`);
          sentCount = +1;
        } catch (inviteError) {
          logger.error(`Failed to send invitation to ${friendUsername}:`, inviteError);
          // Show specific error if available
          if (inviteError instanceof Error) {
            setError(`Failed to send invitation to ${friendUsername}: ${inviteError.message}`);
          }
        }
      }

      if (sentCount > 0) {
        alert(`Successfully sent ${sentCount} invitation(s) via direct message!`);
        onClose();
      } else {
        setError('Failed to send any invitations. Please try again.');
      }
    } catch (err) {
      setError('Failed to send invitations. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!gameInstance.state.roomSettings.roomCode) {
    return (
      <div className='modal-overlay' onClick={onClose}>
        <div className='room-share-modal' onClick={e => e.stopPropagation()}>
          <div className='modal-header'>
            <h2>Share Room</h2>
            <button className='btn-close' onClick={onClose}>
              ×
            </button>
          </div>
          <div className='modal-content'>
            <p>This room cannot be shared as it has no room code.</p>
          </div>
          <div className='modal-actions'>
            <button className='btn-cancel' onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='room-share-modal' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>Share Room: {gameInstance.state.roomSettings.roomName}</h2>
          <button className='btn-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='modal-content'>
          <div className='room-info'>
            <p>
              <strong>Room Code:</strong> {gameInstance.state.roomSettings.roomCode}
            </p>
            <p className='help-text'>
              Select friends to send them a direct message with the room invitation and code.
            </p>
          </div>

          {error && <div className='error-message'>{error}</div>}

          {isLoading ? (
            <div className='loading'>Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className='no-friends'>
              <p>No friends found. Add some friends to share your room!</p>
            </div>
          ) : (
            <div className='friends-list'>
              <h3>Select Friends to Invite:</h3>
              <div className='friends-grid'>
                {friends.map(friendUsername => (
                  <label key={friendUsername} className='friend-item'>
                    <input
                      type='checkbox'
                      checked={selectedFriends.includes(friendUsername)}
                      onChange={() => handleFriendToggle(friendUsername)}
                    />
                    <span className='friend-name'>{friendUsername}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='modal-actions'>
          <button className='btn-cancel' onClick={onClose}>
            Cancel
          </button>
          <button
            className='btn-share'
            onClick={handleSendInvitations}
            disabled={selectedFriends.length === 0 || isSending}>
            {isSending ? 'Sending...' : `Send to ${selectedFriends.length} Friend(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomShareModal;
