import NimModel from '../../models/nim.model';
import {
  BaseMove,
  GameInstance,
  GameInstanceID,
  GameMove,
  GameState,
  GameType,
  ConnectFourRoomSettings,
  ConnectFourGameState,
} from '../../types/types';
import Game from './game';
import NimGame from './nim';
import ConnectFourGame from './connectFour';
import { getRelations } from '../user.service';

/**
 * Manages the lifecycle of games, including creation, joining, and leaving games.
 *
 * This class is responsible for handling game instances and ensuring that the right game logic is
 * applied based on the game type. It provides methods for adding, removing, joining, and leaving
 * games, and it maintains a map of active game instances.
 */
class GameManager {
  private static _instance: GameManager | undefined;
  private _games: Map<string, Game<GameState, GameMove<unknown>>>;

  /**
   * Private constructor to initialize the games map.
   */
  private constructor() {
    this._games = new Map();
  }

  /**
   * Factory method to create a new game based on the provided game type.
   * @param gameType The type of the game to create.
   * @param creatorID The ID of the player creating the game.
   * @param roomSettings Optional room settings for Connect Four games.
   * @returns A promise resolving to the created game instance.
   * @throws an error for an unsupported game type
   */
  private async _gameFactory(
    gameType: GameType,
    creatorID?: string,
    roomSettings?: ConnectFourRoomSettings,
  ): Promise<Game<GameState, BaseMove>> {
    switch (gameType) {
      case 'Nim': {
        const newGame = new NimGame();
        await NimModel.create(newGame.toModel());

        return newGame;
      }
      case 'Connect Four': {
        if (!creatorID) {
          throw new Error('Creator ID is required for Connect Four');
        }
        if (!roomSettings) {
          throw new Error('Room settings are required for Connect Four');
        }
        const newGame = new ConnectFourGame(creatorID, roomSettings);
        await newGame.saveGameState();

        return newGame;
      }
      default: {
        throw new Error('Invalid game type');
      }
    }
  }

  /**
   * Singleton pattern to get the unique instance of the GameManager.
   * @returns The instance of GameManager.
   */
  public static getInstance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }

    return GameManager._instance;
  }

  /**
   * Creates and adds a new game to the manager games map.
   * @param gameType The type of the game to add.
   * @param creatorID Optional creator ID for games that require it.
   * @param roomSettings Optional room settings for Connect Four games.
   * @returns The game ID or an error message.
   */
  public async addGame(
    gameType: GameType,
    creatorID?: string,
    roomSettings?: ConnectFourRoomSettings,
  ): Promise<GameInstanceID | { error: string }> {
    try {
      const newGame = await this._gameFactory(gameType, creatorID, roomSettings);
      this._games.set(newGame.id, newGame);

      return newGame.id;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Removes a game from the manager by its ID.
   * @param gameID The ID of the game to remove.
   * @returns Whether the game was successfully removed.
   */
  public removeGame(gameID: string): boolean {
    return this._games.delete(gameID);
  }

  /**
   * Joins an existing game.
   * @param gameID The ID of the game to join.
   * @param playerID The ID of the player joining the game.
   * @param roomCode Optional room code for private rooms.
   * @param asSpectator Whether to join as a spectator.
   * @returns The game instance or an error message.
   */
  public async joinGame(
    gameID: GameInstanceID,
    playerID: string,
    roomCode?: string,
    asSpectator?: boolean,
  ): Promise<GameInstance<GameState> | { error: string }> {
    try {
      const gameToJoin = this.getGame(gameID);

      if (gameToJoin === undefined) {
        throw new Error('Game requested does not exist.');
      }

      // Verify access for Connect Four games
      if (gameToJoin.gameType === 'Connect Four') {
        const connectFourGame = gameToJoin as unknown as ConnectFourGame;

        // Get player's friends list for friends-only room access
        let playerFriends: string[] = [];
        if (connectFourGame.state.roomSettings.privacy === 'FRIENDS_ONLY') {
          const relations = await getRelations(playerID);
          if ('error' in relations) {
            throw new Error('Could not verify friends for room access');
          }
          playerFriends = relations.friends;
        }

        if (!connectFourGame.verifyAccess(roomCode, playerFriends)) {
          if (connectFourGame.state.roomSettings.privacy === 'FRIENDS_ONLY') {
            throw new Error('Access denied: This is a friends-only room');
          } else {
            throw new Error('Access denied: invalid room code or room is private');
          }
        }

        if (asSpectator) {
          connectFourGame.addSpectator(playerID);
        } else {
          gameToJoin.join(playerID);
        }
      } else {
        gameToJoin.join(playerID);
      }

      await gameToJoin.saveGameState();

      return gameToJoin.toModel();
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Allows a player to leave a game.
   * @param gameID The ID of the game to leave.
   * @param playerID The ID of the player leaving the game.
   * @param isSpectator Whether the player is leaving as a spectator.
   * @returns The updated game state or an error message.
   */
  public async leaveGame(
    gameID: GameInstanceID,
    playerID: string,
    isSpectator?: boolean,
  ): Promise<GameInstance<GameState> | { error: string }> {
    try {
      const gameToLeave = this.getGame(gameID);

      if (gameToLeave === undefined) {
        throw new Error('Game requested does not exist.');
      }

      // Handle spectator leaving for Connect Four
      if (isSpectator && gameToLeave.gameType === 'Connect Four') {
        const connectFourGame = gameToLeave as unknown as ConnectFourGame;
        connectFourGame.removeSpectator(playerID);
      } else {
        gameToLeave.leave(playerID);
      }

      await gameToLeave.saveGameState();

      const leftGameState = gameToLeave.toModel();

      // Remove game if it's over or has no players
      if (gameToLeave.state.status === 'OVER') {
        this.removeGame(gameID);
      } else if (gameToLeave.gameType === 'Connect Four') {
        // Check if Connect Four game has no players
        const connectFourState = leftGameState.state as ConnectFourGameState;
        if (!connectFourState.player1 && !connectFourState.player2) {
          this.removeGame(gameID);
        }
      }

      return leftGameState;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Gets a game instance by its ID.
   * @param gameID The ID of the game.
   * @returns The game instance or undefined if not found.
   */
  public getGame(gameID: GameInstanceID): Game<GameState, BaseMove> | undefined {
    return this._games.get(gameID);
  }

  /**
   * Retrieves all active game instances.
   * @returns An array of all active game instances.
   */
  public getActiveGameInstances(): Game<GameState, BaseMove>[] {
    return Array.from(this._games.values());
  }

  /**
   * Resets the GameManager instance, clearing all active games.
   */
  public static resetInstance(): void {
    GameManager._instance = undefined;
  }
}

export default GameManager;
