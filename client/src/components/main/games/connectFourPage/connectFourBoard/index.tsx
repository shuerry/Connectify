import { useEffect, useState } from 'react';
import './index.css';
import {
  GameInstance,
  ConnectFourGameState,
  ConnectFourColor,
  BoardPosition,
} from '../../../../../types/types';

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToastMsg(null), 1800);
  };

  // Check if column is full
  const isColumnFull = (col: number): boolean => {
    return board[0][col] !== null;
  };

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
    if (isColumnFull(col)) {
      showToast('Column is full');
      return;
    }

    onMakeMove(col);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (status !== 'IN_PROGRESS') return;
      if (!isPlayer) return;
      if (!isMyTurn) return;

      const key = e.key;
      const col = parseInt(key) - 1;

      if (col >= 0 && col < 7 && !isColumnFull(col)) {
        onMakeMove(col);
      } else if (col >= 0 && col < 7 && isColumnFull(col)) {
        showToast('Column is full');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [status, isPlayer, isMyTurn, board, onMakeMove]);

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
        <button className='btn-leave' onClick={onLeaveGame}>
          Leave Game
        </button>
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

        <div className='turn-indicator'>
          {status === 'WAITING_TO_START' && <span>Waiting for players...</span>}
          {status === 'IN_PROGRESS' && (
            <span className={currentTurn.toLowerCase()}>
              {isMyTurn ? 'Your Turn!' : `${currentTurn}'s Turn`}
            </span>
          )}
          {status === 'OVER' && (
            <span className='game-over'>
              Game Over - {getWinnerName()}
              {state.winners && state.winners.includes(currentUser)}
            </span>
          )}
        </div>

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
                  } ${
                    !isColumnFull(colIndex) && isMyTurn && status === 'IN_PROGRESS'
                      ? 'clickable'
                      : ''
                  }`}
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

      {spectators.length > 0 && (
        <div className='spectators-list'>
          <h4>Spectators ({spectators.length})</h4>
          <div className='spectator-names'>
            {spectators.map((spectator, index) => (
              <span key={index} className='spectator-badge'>
                {spectator}
              </span>
            ))}
          </div>
        </div>
      )}

      {isSpectator && (
        <div className='spectator-notice'>
          <span>👁️ You are spectating this game</span>
        </div>
      )}

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

      <div className='game-instructions'>
        <h4>Controls</h4>
        <p>Click on a column or press keys 1-7 to drop your disc</p>
      </div>
      {toastMsg && <div className='cf-toast'>{toastMsg}</div>}
    </div>
  );
};

export default ConnectFourBoard;
