import { useEffect, useState, useCallback } from 'react';
import './index.css';
import {
  GameInstance,
  ConnectFourGameState,
  ConnectFourColor,
  BoardPosition,
} from '../../../../../types/types';
import RoomShareModal from '../roomShareModal';

interface ConnectFourBoardProps {
  gameInstance: GameInstance<ConnectFourGameState>;
  currentUser: string;
  onMakeMove: (column: number) => void;
  onLeaveGame: () => void;
}

/**
 * Component for rendering the Connect Four game board and handling gameplay
 */
const ConnectFourBoard = ({
  gameInstance,
  currentUser,
  onMakeMove,
  onLeaveGame,
}: ConnectFourBoardProps) => {
  const { state } = gameInstance;
  const { board, currentTurn, player1, player2, status, winningPositions, spectators } = state;

  // Determine if current user is a player or spectator
  const isPlayer = currentUser === player1 || currentUser === player2;
  const isSpectator = spectators.includes(currentUser);
  const playerColor: ConnectFourColor | null =
    currentUser === player1
      ? state.player1Color
      : currentUser === player2
        ? state.player2Color
        : null;
  const isMyTurn = isPlayer && playerColor === currentTurn;
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToastMsg(null), 1800);
  }, []);

  // Handle column click
  const handleColumnClick = (col: number) => {
    if (status !== 'IN_PROGRESS') {
      showToast('Game is not in progress');
      return;
    }
    if (!isPlayer) {
      showToast('You are not a player in this game');
      return;
    }
    if (!isMyTurn) {
      showToast('Not your turn');
      return;
    }

    // Allow moves on full columns - server will handle as draw condition
    onMakeMove(col);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      const col = parseInt(key) - 1;

      // Only respond to number keys 1-7
      if (!(col >= 0 && col < 7)) return;

      // Check game state conditions and provide specific error messages
      if (status !== 'IN_PROGRESS') {
        showToast('Game is not in progress');
        return;
      }

      if (!isPlayer) {
        showToast('You are not a player in this game');
        return;
      }

      if (!isMyTurn) {
        showToast(`Not your turn - wait for ${currentTurn}'s move`);
        return;
      }

      // Allow moves on full columns - server will handle as draw condition
      onMakeMove(col);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [status, isPlayer, isMyTurn, currentTurn, onMakeMove, showToast]);

  // Check if a position is a winning position
  const isWinningPosition = (row: number, col: number): boolean => {
    if (!winningPositions) return false;
    return winningPositions.some((pos: BoardPosition) => pos.row === row && pos.col === col);
  };

  // Get cell class name
  const getCellClassName = (row: number, col: number): string => {
    const classes = ['cell'];
    const cell = board[row][col];

    if (cell) {
      classes.push(cell.toLowerCase());
    }

    if (isWinningPosition(row, col)) {
      classes.push('winning');
    }

    if (state.lastMoveColumn === col && board[row][col]) {
      // Highlight last move
      let isLastMove = true;
      for (let r = 0; r < row; r = r + 1) {
        if (board[r][col] !== null) {
          isLastMove = false;
          break;
        }
      }
      if (isLastMove) {
        classes.push('last-move');
      }
    }

    return classes.join(' ');
  };

  // Get winner name
  const getWinnerName = (): string => {
    if (!state.winners || state.winners.length === 0) return 'Draw!';
    return state.winners[0];
  };

  return (
    // Connect Four Board Container
    <div className='connect-four-board-container'>
      <div className='game-header'>
        <div className='room-info'>
          <h2>{state.roomSettings.roomName}</h2>
          {state.roomSettings.privacy !== 'PUBLIC' && (
            <span className='room-code'>
              Room Code: <strong>{state.roomSettings.roomCode}</strong>
            </span>
          )}
        </div>
        <div className='header-actions'>
          {state.roomSettings.roomCode && isPlayer && (
            <button className='btn-share' onClick={() => setShowShareModal(true)}>
              📤 Invite Friends
            </button>
          )}
          <button className='btn-leave' onClick={onLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>
      <div className='players-info'>
        <div className={`player-card ${currentTurn === state.player1Color ? 'active' : ''}`}>
          <div className={`player-color ${state.player1Color.toLowerCase()}`}></div>
          <div className='player-details'>
            <span className='player-name'>{player1}</span>
            <span className='player-label'>Player 1 ({state.player1Color})</span>
            {currentUser === player1 && <span className='you-label'>You</span>}
          </div>
        </div>
        {/* Turn Indicator */}
        <div className='turn-indicator'>
          {status === 'WAITING_TO_START' && <span>Waiting for players...</span>}
          {status === 'IN_PROGRESS' && (
            <span className={currentTurn.toLowerCase()}>
              {isMyTurn ? 'Your Turn!' : `${currentTurn}'s Turn`}
            </span>
          )}
          {/* Game Over Indicator */}
          {status === 'OVER' && (
            <span className='game-over'>
              Game Over - {getWinnerName()}
              {state.winners && state.winners.includes(currentUser)}
            </span>
          )}
        </div>
        {/* Player 2 Card */}
        <div className={`player-card ${currentTurn === state.player2Color ? 'active' : ''}`}>
          <div className='player-details'>
            <span className='player-name'>{player2 || 'Waiting...'}</span>
            <span className='player-label'>Player 2 ({state.player2Color})</span>
            {currentUser === player2 && <span className='you-label'>You</span>}
          </div>
          <div className={`player-color ${state.player2Color.toLowerCase()}`}></div>
        </div>
      </div>
      <div className='board-wrapper'>
        <div className='connect-four-board'>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className='board-row'>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${getCellClassName(rowIndex, colIndex)} ${
                    cell ? 'occupied' : 'empty'
                  } ${isMyTurn && status === 'IN_PROGRESS' ? 'clickable' : ''}`}
                  onClick={() => handleColumnClick(colIndex)}>
                  <div className='disc'></div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {status === 'IN_PROGRESS' && isPlayer && (
          <div className='column-indicators'>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <div key={num} className='column-indicator'>
                {num}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Spectators List - Always show section to make it more visible */}
      <div className='spectators-section'>
        <div className='spectators-header'>
          <h4>👀 Spectators ({spectators.length})</h4>
          {spectators.length === 0 && <p className='no-spectators'>No spectators watching</p>}
        </div>
        {spectators.length > 0 && (
          <div className='spectator-names'>
            {spectators.map((spectator, index) => (
              <span key={index} className='spectator-badge'>
                👤 {spectator}
                {spectator === currentUser && <span className='you-indicator'> (You)</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {isSpectator && (
        <div className='spectator-notice'>
          <div className='spectator-status'>
            <span className='spectator-icon'>👁️</span>
            <div>
              <strong>You are spectating this game</strong>
              <p>You can watch the game but cannot make moves</p>
            </div>
          </div>
        </div>
      )}
      {/* Game Info Section */}
      <div className='game-info'>
        <div className='info-item'>
          <strong>Total Moves:</strong> {state.totalMoves}
        </div>
        {status === 'OVER' && state.winners && (
          <div className='info-item result'>
            <strong>Result:</strong>{' '}
            {state.winners.length === 0 ? 'Draw' : `${state.winners[0]} wins!`}
          </div>
        )}
      </div>
      {/* Game Instructions */}
      <div className='game-instructions'>
        <h4>Controls</h4>
        <p>Click on a column or press keys 1-7 to drop your disc</p>
      </div>
      {toastMsg && <div className='cf-toast'>{toastMsg}</div>}

      {/* Room Share Modal */}
      {showShareModal && (
        <RoomShareModal onClose={() => setShowShareModal(false)} gameInstance={gameInstance} />
      )}
    </div>
  );
};

export default ConnectFourBoard;
