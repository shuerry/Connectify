import './index.css';
import ConnectFourLobby from './connectFourLobby';
import ConnectFourBoard from './connectFourBoard';
import CreateRoomModal from './createRoomModal';
import GameInvitationNotification from './gameInvitationNotification';
import useConnectFourPage from '../../../../hooks/useConnectFourPage';

/**
 * Main Connect Four page component that manages the game flow
 */
const ConnectFourPage = () => {
  const {
    games,
    currentGame,
    user,
    showCreateModal,
    setShowCreateModal,
    handleCreateRoom,
    handleJoinRoom,
    handleJoinByCode,
    handleMakeMove,
    handleLeaveGame,
    gameInvitations,
    handleAcceptInvitation,
    handleDeclineInvitation,
    error,
    pendingRoomCode,
  } = useConnectFourPage();

  // Wait for user context to be ready
  if (!user) {
    return <div className='connect-four-page'>Loading...</div>;
  }

  if (error) {
    return (
      <div className='connect-four-error'>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <div className='connect-four-page'>
      {!currentGame ? (
        <ConnectFourLobby
          games={games}
          onCreateRoom={() => setShowCreateModal(true)}
          onJoinRoom={handleJoinRoom}
          onJoinByCode={handleJoinByCode}
          initialRoomCode={pendingRoomCode || undefined}
        />
      ) : (
        <ConnectFourBoard
          gameInstance={currentGame}
          currentUser={user.username}
          onMakeMove={handleMakeMove}
          onLeaveGame={handleLeaveGame}
        />
      )}

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateRoom} />
      )}

      {/* Game Invitations */}
      {gameInvitations.map((invitation, index) => (
        <GameInvitationNotification
          key={`${invitation.gameID}-${index}`}
          invitation={invitation}
          onAccept={(gameID, roomCode) => handleAcceptInvitation(gameID, roomCode)}
          onDecline={() => handleDeclineInvitation(invitation.gameID)}
        />
      ))}
    </div>
  );
};

export default ConnectFourPage;
