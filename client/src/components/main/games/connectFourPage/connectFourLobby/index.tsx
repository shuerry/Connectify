import { useState, useEffect } from 'react';
import './index.css';
import { GameInstance, ConnectFourGameState } from '../../../../../types/types';
import { getRelations } from '../../../../../services/userService';
import logger from '../../../../../utils/logger';

interface ConnectFourLobbyProps {
  games: GameInstance<ConnectFourGameState>[];
  onCreateRoom: () => void;
  onJoinRoom: (gameID: string, roomCode?: string, asSpectator?: boolean) => void;
  onJoinByCode: (roomCode: string) => void;
  initialRoomCode?: string;
  currentUser: string;
}

/**
 * Lobby component for Connect Four that displays available rooms and allows joining/creating rooms
 */
const ConnectFourLobby = ({
  games,
  onCreateRoom,
  onJoinRoom,
  onJoinByCode,
  initialRoomCode,
  currentUser,
}: ConnectFourLobbyProps) => {
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'PLAYING'>('ALL');
  const [privacyFilter, setPrivacyFilter] = useState<'ALL' | 'PUBLIC' | 'FRIENDS_ONLY'>('ALL');
  const [friends, setFriends] = useState<string[]>([]);

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const relations = await getRelations(currentUser);
        setFriends(relations.friends || []);
      } catch (error) {
        logger.error('Failed to load friends:', error);
        setFriends([]);
      }
    };

    if (currentUser) {
      loadFriends();
    }
  }, [currentUser]);

  const filteredGames = games.filter(game => {
    const { privacy } = game.state.roomSettings;

    // First apply privacy filter
    let showRoom = false;

    if (privacy === 'PUBLIC') {
      // Show public rooms if filter allows
      showRoom = privacyFilter === 'ALL' || privacyFilter === 'PUBLIC';
    } else if (privacy === 'FRIENDS_ONLY') {
      // Show friends-only rooms only to friends of the creator and if filter allows
      const roomCreator = game.state.player1;
      const isFriendOfCreator =
        roomCreator === currentUser || (roomCreator && friends.includes(roomCreator));

      showRoom =
        !!isFriendOfCreator && (privacyFilter === 'ALL' || privacyFilter === 'FRIENDS_ONLY');
    }
    // Don't show private rooms in the lobby (they need room codes)

    if (!showRoom) return false;

    // Then apply status filter
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'WAITING') return game.state.status === 'WAITING_TO_START';
    if (statusFilter === 'PLAYING') return game.state.status === 'IN_PROGRESS';
    return true;
  });

  const handleJoinByCode = () => {
    if (roomCodeInput.trim()) {
      onJoinByCode(roomCodeInput.trim().toUpperCase());
      setRoomCodeInput('');
    }
  };

  return (
    <div className='connect-four-lobby'>
      <div className='lobby-actions-header'>
        <div className='main-actions-row'>
          <button className='btn btn-primary btn-lg create-room-btn' onClick={onCreateRoom}>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
            </svg>
            Create New Room
          </button>

          <div className='or-separator'>
            <span>OR</span>
          </div>

          <div className='join-by-code-section'>
            <div className='code-input-group'>
              <input
                type='text'
                className='form-input code-input'
                placeholder='Room Code (6 chars)'
                value={roomCodeInput}
                onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button
                className='btn btn-secondary join-code-btn'
                onClick={handleJoinByCode}
                disabled={!roomCodeInput.trim()}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M13 3l3.293 3.293-7 7 1.414 1.414 7-7L21 10V3z' />
                  <path d='M19 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6' />
                </svg>
                Join
              </button>
            </div>

            <div className='code-hint'>Have a private room code? Enter it here to join directly</div>
          </div>
        </div>
      </div>

      <div className='lobby-filters'>
        <div className='filter-section'>
          <h4>Status</h4>
          <div className='filter-buttons'>
            <button
              className={statusFilter === 'ALL' ? 'active' : ''}
              onClick={() => setStatusFilter('ALL')}>
              All
            </button>
            <button
              className={statusFilter === 'WAITING' ? 'active' : ''}
              onClick={() => setStatusFilter('WAITING')}>
              Waiting
            </button>
            <button
              className={statusFilter === 'PLAYING' ? 'active' : ''}
              onClick={() => setStatusFilter('PLAYING')}>
              Playing
            </button>
          </div>
        </div>

        <div className='filter-section'>
          <h4>Room Type</h4>
          <div className='filter-buttons'>
            <button
              className={privacyFilter === 'ALL' ? 'active' : ''}
              onClick={() => setPrivacyFilter('ALL')}>
              All Rooms
            </button>
            <button
              className={privacyFilter === 'PUBLIC' ? 'active' : ''}
              onClick={() => setPrivacyFilter('PUBLIC')}>
              Public
            </button>
            <button
              className={privacyFilter === 'FRIENDS_ONLY' ? 'active' : ''}
              onClick={() => setPrivacyFilter('FRIENDS_ONLY')}>
              👥 Friends
            </button>
          </div>
        </div>
      </div>

      <div className='rooms-header'>
        <h3>Available Rooms ({filteredGames.length})</h3>
      </div>

      <div className='rooms-list'>
        {filteredGames.length === 0 ? (
          <div className='no-rooms'>
            <p>
              No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''}{' '}
              {privacyFilter !== 'ALL'
                ? privacyFilter === 'PUBLIC'
                  ? 'public'
                  : 'friends-only'
                : ''}{' '}
              rooms available
            </p>
            <p>Create a new room to get started!</p>
          </div>
        ) : (
          filteredGames.map(game => (
            <div key={game.gameID} className='room-card'>
              <div className='room-info'>
                <h3>{game.state.roomSettings.roomName}</h3>
                <div className='room-details'>
                  <span className={`status ${game.state.status.toLowerCase()}`}>
                    {game.state.status === 'WAITING_TO_START' ? 'Waiting' : 'Playing'}
                  </span>
                  {game.state.roomSettings.allowSpectators &&
                    game.state.roomSettings.privacy !== 'PRIVATE' && (
                      <span className='spectators-allowed'>👁️ Spectators Allowed</span>
                    )}
                  {game.state.roomSettings.privacy === 'PRIVATE' && (
                    <span className='privacy-indicator'>🔒 Private Room</span>
                  )}
                  {game.state.roomSettings.privacy === 'FRIENDS_ONLY' && (
                    <span className='privacy-indicator friends-only'>👥 Friends Only</span>
                  )}
                </div>
                <div className='room-players'>
                  <p>Player 1: {game.state.player1 || 'Waiting...'}</p>
                  <p>Player 2: {game.state.player2 || 'Waiting...'}</p>
                  {game.state.spectators.length > 0 && (
                    <p className='spectator-count'>{game.state.spectators.length} spectator(s)</p>
                  )}
                </div>
              </div>
              <div className='room-actions'>
                {game.state.status === 'WAITING_TO_START' && game.players.length < 2 && (
                  <button className='btn-join' onClick={() => onJoinRoom(game.gameID)}>
                    Join Game
                  </button>
                )}
                {game.state.roomSettings.allowSpectators &&
                  game.state.roomSettings.privacy !== 'PRIVATE' && (
                    <button
                      className='btn-spectate'
                      onClick={() => onJoinRoom(game.gameID, undefined, true)}>
                      Spectate
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className='game-rules-summary'>
        <h3>How to Play</h3>
        <ul>
          <li>Players take turns dropping colored discs into a 7-column, 6-row grid</li>
          <li>The disc falls to the lowest available position in the chosen column</li>
          <li>Win by connecting 4 discs horizontally, vertically, or diagonally</li>
          <li>Use number keys 1-7 or click columns to make your move</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectFourLobby;
