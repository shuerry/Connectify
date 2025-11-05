import { nanoid } from 'nanoid';
import {
  GameMove,
  ConnectFourGameState,
  ConnectFourMove,
  ConnectFourColor,
  BoardPosition,
  ConnectFourRoomSettings,
} from '../../types/types';
import Game from './game';

const ROWS = 6;
const COLS = 7;
const CONNECT_COUNT = 4;

/**
 * Represents a game of Connect Four, extending the generic Game class.
 *
 * This class contains the specific game logic for playing Connect Four.
 */
class ConnectFourGame extends Game<ConnectFourGameState, ConnectFourMove> {
  /**
   * Constructor for the ConnectFourGame class, initializes the game state and type.
   */
  public constructor(
    creatorID: string,
    roomSettings: ConnectFourRoomSettings,
    player1Color: ConnectFourColor = 'RED',
  ) {
    // Generate room code for private rooms if not provided
    const finalRoomSettings = {
      ...roomSettings,
      roomCode:
        roomSettings.privacy === 'PRIVATE' && !roomSettings.roomCode
          ? nanoid(6).toUpperCase()
          : roomSettings.roomCode,
    };

    super(
      {
        status: 'WAITING_TO_START',
        board: Array(ROWS)
          .fill(null)
          .map(() => Array(COLS).fill(null)),
        currentTurn: 'RED',
        player1: creatorID,
        player1Color,
        player2Color: player1Color === 'RED' ? 'YELLOW' : 'RED',
        moves: [],
        totalMoves: 0,
        roomSettings: finalRoomSettings,
        spectators: [],
      },
      'Connect Four',
    );
  }

  /**
   * Creates an empty Connect Four board.
   */
  private _createEmptyBoard(): (ConnectFourColor | null)[][] {
    return Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null));
  }

  /**
   * Checks if a column is full.
   */
  private _isColumnFull(col: number): boolean {
    return this.state.board[0][col] !== null;
  }

  /**
   * Finds the lowest empty row in a column.
   */
  private _getLowestEmptyRow(col: number): number | null {
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (this.state.board[row][col] === null) {
        return row;
      }
    }
    return null;
  }

  /**
   * Checks if a position is valid on the board.
   */
  private _isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  /**
   * Checks for a win from a specific position in all directions.
   */
  private _checkWinFromPosition(
    row: number,
    col: number,
    color: ConnectFourColor,
  ): BoardPosition[] | null {
    const directions = [
      { dr: 0, dc: 1 }, // Horizontal
      { dr: 1, dc: 0 }, // Vertical
      { dr: 1, dc: 1 }, // Diagonal down-right
      { dr: 1, dc: -1 }, // Diagonal down-left
    ];

    for (const { dr, dc } of directions) {
      const positions: BoardPosition[] = [{ row, col }];

      // Check in positive direction
      let r = row + dr;
      let c = col + dc;
      while (
        this._isValidPosition(r, c) &&
        this.state.board[r][c] === color &&
        positions.length < CONNECT_COUNT
      ) {
        positions.push({ row: r, col: c });
        r += dr;
        c += dc;
      }

      // Check in negative direction
      r = row - dr;
      c = col - dc;
      while (
        this._isValidPosition(r, c) &&
        this.state.board[r][c] === color &&
        positions.length < CONNECT_COUNT
      ) {
        positions.push({ row: r, col: c });
        r -= dr;
        c -= dc;
      }

      if (positions.length >= CONNECT_COUNT) {
        return positions;
      }
    }

    return null;
  }

  /**
   * Checks if the board is full (draw condition).
   */
  private _isBoardFull(): boolean {
    return this.state.board[0].every(cell => cell !== null);
  }

  /**
   * Gets the color of the player making the move.
   */
  private _getPlayerColor(playerID: string): ConnectFourColor {
    if (playerID === this.state.player1) {
      return this.state.player1Color;
    }
    return this.state.player2Color;
  }

  /**
   * Gets the player ID for a specific color.
   */
  private _getPlayerByColor(color: ConnectFourColor): string | undefined {
    if (this.state.player1Color === color) {
      return this.state.player1;
    }
    if (this.state.player2Color === color) {
      return this.state.player2;
    }
    return undefined;
  }

  /**
   * Validates the move based on the current game state.
   */
  private _validateMove(gameMove: GameMove<ConnectFourMove>): void {
    const { playerID, move } = gameMove;

    // Check if game is in progress
    if (this.state.status !== 'IN_PROGRESS') {
      throw new Error('Invalid move: game is not in progress');
    }

    // Check if player is in the game
    if (playerID !== this.state.player1 && playerID !== this.state.player2) {
      throw new Error('Invalid move: player is not in this game');
    }

    // Check if it's the player's turn
    const playerColor = this._getPlayerColor(playerID);
    if (playerColor !== this.state.currentTurn) {
      throw new Error('Invalid move: not your turn');
    }

    // Validate column number
    if (move.column < 0 || move.column >= COLS) {
      throw new Error(`Invalid move: column must be between 0 and ${COLS - 1}`);
    }

    // Note: Column full check moved to applyMove to handle as draw condition
  }

  /**
   * Applies a move to the game, validating it and updating the state.
   */
  public applyMove(move: GameMove<ConnectFourMove>): void {
    this._validateMove(move);

    const { playerID, move: gameMove } = move;
    const row = this._getLowestEmptyRow(gameMove.column);

    // If column is full, reject the move (don't end game as draw)
    if (row === null) {
      throw new Error('Invalid move: column is full');
    }

    const playerColor = this._getPlayerColor(playerID);

    // Create new board with the move applied
    const newBoard = this.state.board.map(r => [...r]);
    newBoard[row][gameMove.column] = playerColor;

    // Check for win
    const winningPositions = this._checkWinFromPosition(row, gameMove.column, playerColor);

    if (winningPositions) {
      // Player wins
      this.state = {
        ...this.state,
        board: newBoard,
        status: 'OVER',
        moves: [...this.state.moves, { ...gameMove, playerID }],
        totalMoves: this.state.totalMoves + 1,
        winners: [playerID],
        winningPositions,
        lastMoveColumn: gameMove.column,
      };
    } else if (newBoard[0].every(cell => cell !== null)) {
      // Draw - check if the new board is full after placing the piece
      this.state = {
        ...this.state,
        board: newBoard,
        status: 'OVER',
        moves: [...this.state.moves, { ...gameMove, playerID }],
        totalMoves: this.state.totalMoves + 1,
        winners: [],
        lastMoveColumn: gameMove.column,
      };
    } else {
      // Continue game
      const nextTurn: ConnectFourColor = playerColor === 'RED' ? 'YELLOW' : 'RED';
      this.state = {
        ...this.state,
        board: newBoard,
        currentTurn: nextTurn,
        moves: [...this.state.moves, { ...gameMove, playerID }],
        totalMoves: this.state.totalMoves + 1,
        lastMoveColumn: gameMove.column,
      };
    }
  }

  /**
   * Joins a player to the game.
   */
  protected _join(playerID: string): void {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new Error('Cannot join game: already started');
    }

    if (this._players.includes(playerID)) {
      throw new Error('You are already in this game');
    }

    // Check if joining as player or spectator will be handled by caller
    if (!this.state.player1) {
      this.state = { ...this.state, player1: playerID };
    } else if (!this.state.player2) {
      this.state = { ...this.state, player2: playerID, status: 'IN_PROGRESS' };
    } else {
      throw new Error('Cannot join game: game is full');
    }
  }

  /**
   * Adds a spectator to the game.
   */
  public addSpectator(playerID: string): void {
    if (!this.state.roomSettings.allowSpectators) {
      throw new Error('Spectators are not allowed in this room');
    }

    // Disable spectators for private rooms
    if (this.state.roomSettings.privacy === 'PRIVATE') {
      throw new Error('Spectators are not allowed in private rooms');
    }

    if (this.state.spectators.includes(playerID)) {
      throw new Error('You are already spectating this game');
    }

    if (this._players.includes(playerID)) {
      throw new Error('You are already in this game as a player');
    }

    this.state = {
      ...this.state,
      spectators: [...this.state.spectators, playerID],
    };
  }

  /**
   * Removes a spectator from the game.
   */
  public removeSpectator(playerID: string): void {
    this.state = {
      ...this.state,
      spectators: this.state.spectators.filter(s => s !== playerID),
    };
  }

  /**
   * Removes a player from the game. If a player leaves during an ongoing game, the other player wins.
   */
  protected _leave(playerID: string): void {
    if (!this._players.includes(playerID)) {
      throw new Error(`Cannot leave game: player ${playerID} is not in the game.`);
    }

    if (this.state.status === 'WAITING_TO_START') {
      if (this.state.player1 === playerID) {
        this.state = { ...this.state, player1: this.state.player2, player2: undefined };
      } else if (this.state.player2 === playerID) {
        this.state = { ...this.state, player2: undefined };
      }
    } else if (this.state.status === 'IN_PROGRESS') {
      // Player leaves during game - opponent wins
      if (this.state.player1 === playerID && this.state.player2) {
        this.state = {
          ...this.state,
          status: 'OVER',
          winners: [this.state.player2],
        };
      } else if (this.state.player2 === playerID && this.state.player1) {
        this.state = {
          ...this.state,
          status: 'OVER',
          winners: [this.state.player1],
        };
      }
    }
  }

  /**
   * Verifies room access with optional room code.
   */
  public verifyAccess(roomCode?: string, playerFriends?: string[]): boolean {
    const { privacy, roomCode: actualCode } = this.state.roomSettings;

    if (privacy === 'PUBLIC') {
      return true;
    }

    if (privacy === 'PRIVATE') {
      return roomCode === actualCode;
    }

    if (privacy === 'FRIENDS_ONLY') {
      // For friends-only rooms, allow access if:
      // 1. Player has the correct room code (for sharing with friends)
      // 2. Player is friends with the room creator
      const roomCreator = this.state.player1;
      const hasCorrectCode = roomCode === actualCode;
      const isFriend = Boolean(roomCreator && playerFriends?.includes(roomCreator));
      
      return hasCorrectCode || isFriend;
    }

    return false;
  }

  /**
   * Gets public room info (without sensitive data like room code).
   */
  public getPublicRoomInfo() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roomCode, ...publicSettings } = this.state.roomSettings;
    return {
      ...this.toModel(),
      state: {
        ...this.state,
        roomSettings: {
          ...publicSettings,
          roomCode: this.state.roomSettings.privacy === 'PUBLIC' ? undefined : '******',
        },
      },
    };
  }
}

export default ConnectFourGame;
