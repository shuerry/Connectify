import './index.css';
import ConnectFourLobby from './connectFourLobby';
import ConnectFourBoard from './connectFourBoard';
import CreateRoomModal from './createRoomModal';
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
          currentUser={user.username}
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
    </div>
  );
};

export default ConnectFourPage;
