import { useState } from 'react';
import './index.css';
import { GameInstance, ConnectFourGameState } from '../../../../../types/types';

interface ConnectFourLobbyProps {
  games: GameInstance<ConnectFourGameState>[];
  onCreateRoom: () => void;
  onJoinRoom: (gameID: string, roomCode?: string, asSpectator?: boolean) => void;
  onJoinByCode: (roomCode: string) => void;
  initialRoomCode?: string;
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
}: ConnectFourLobbyProps) => {
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'PLAYING'>('ALL');

  const filteredGames = games.filter(game => {
    // Only show public rooms in the lobby
    if (game.state.roomSettings.privacy !== 'PUBLIC') {
      return false;
    }

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
      <div className='lobby-header'>
        <h1>Connect Four Lobby</h1>
        <p>Join a game or create your own room!</p>
      </div>

      <div className='lobby-actions'>
        <button className='btn-create-room' onClick={onCreateRoom}>
          Create New Room
        </button>

        <div className='join-by-code'>
          <input
            type='text'
            placeholder='Enter Room Code'
            value={roomCodeInput}
            onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button onClick={handleJoinByCode} disabled={!roomCodeInput.trim()}>
            Join by Code
          </button>
        </div>
      </div>

      <div className='lobby-filters'>
        <button
          className={statusFilter === 'ALL' ? 'active' : ''}
          onClick={() => setStatusFilter('ALL')}>
          All Rooms
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

      <div className='rooms-list'>
        {filteredGames.length === 0 ? (
          <div className='no-rooms'>
            <p>No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} rooms available</p>
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
                  <span className='players'>{game.players.length}/2 Players</span>
                  {game.state.roomSettings.allowSpectators && 
                   game.state.roomSettings.privacy !== 'PRIVATE' && (
                    <span className='spectators-allowed'>👁️ Spectators Allowed</span>
                  )}
                  {game.state.roomSettings.privacy === 'PRIVATE' && (
                    <span className='privacy-indicator'>🔒 Private Room</span>
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
