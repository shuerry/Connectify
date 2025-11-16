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
    return (
      <div className='connect-four-page'>
        <div className='loading-container'>
          <div className='loading-spinner'></div>
          <p>Loading Connect Four...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='connect-four-page'>
        <div className='error-container'>
          <div className='error-icon'>
            <svg width='64' height='64' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
            </svg>
          </div>
          <h2 className='error-title'>Connection Error</h2>
          <p className='error-message'>{error}</p>
          <div className='error-actions'>
            <button className='btn btn-primary' onClick={() => window.location.reload()}>
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='currentColor'
                style={{ marginRight: '8px' }}>
                <path d='M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z' />
              </svg>
              Reload Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='connect-four-page'>
      <div className='game-container'>
        {!currentGame ? (
          <div className='lobby-section'>
            <div className='page-header'>
              <h1 className='page-title'>
                <span className='game-icon'>🔴</span>
                Connect Four
              </h1>
              <p className='page-subtitle'>
                Challenge friends or join existing games in this classic strategy game
              </p>
            </div>
            <ConnectFourLobby
              games={games}
              onCreateRoom={() => setShowCreateModal(true)}
              onJoinRoom={handleJoinRoom}
              onJoinByCode={handleJoinByCode}
              initialRoomCode={pendingRoomCode || undefined}
              currentUser={user.username}
            />
          </div>
        ) : (
          <div className='game-section'>
            <ConnectFourBoard
              gameInstance={currentGame}
              currentUser={user.username}
              onMakeMove={handleMakeMove}
              onLeaveGame={handleLeaveGame}
            />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateRoom} />
      )}
    </div>
  );
};

export default ConnectFourPage;
