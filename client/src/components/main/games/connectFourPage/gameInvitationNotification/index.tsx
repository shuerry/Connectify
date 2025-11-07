import { useState } from 'react';
import './index.css';

interface GameInvitation {
  gameID: string;
  roomName: string;
  inviterUsername: string;
  roomCode?: string;
}

interface GameInvitationNotificationProps {
  invitation: GameInvitation;
  onAccept: (gameID: string, roomCode?: string) => void;
  onDecline: () => void;
}

/**
 * Component to display a game invitation notification
 */
const GameInvitationNotification = ({
  invitation,
  onAccept,
  onDecline,
}: GameInvitationNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    onAccept(invitation.gameID, invitation.roomCode);
    setIsVisible(false);
  };

  const handleDecline = () => {
    onDecline();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className='game-invitation-notification'>
      <div className='invitation-content'>
        <div className='invitation-header'>
          <span className='invitation-icon'>🎮</span>
          <div className='invitation-info'>
            <h4>Game Invitation</h4>
            <p>
              <strong>{invitation.inviterUsername}</strong> invited you to join{' '}
              <strong>"{invitation.roomName}"</strong>
            </p>
          </div>
          <button className='btn-close-invitation' onClick={handleDecline} title='Dismiss'>
            ×
          </button>
        </div>
        <div className='invitation-actions'>
          <button className='btn-decline' onClick={handleDecline}>
            Decline
          </button>
          <button className='btn-accept' onClick={handleAccept}>
            Accept & Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameInvitationNotification;
