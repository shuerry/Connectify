import GameModel from '../models/games.model';
import {
  FindGameQuery,
  GameInstance,
  GameInstanceID,
  GamesResponse,
  GameState,
  GameStatus,
  GameType,
} from '../types/types';

/**
 * Retrieves games from the database based on the specified game type and status.
 * @param {GameType | undefined} gameType - The type of the game to filter by (e.g., 'Nim').
 * @param {GameStatus | undefined} status - The status of the game to filter by (e.g., 'IN_PROGRESS').
 * @returns {Promise<GamesResponse>} - A promise resolving to a list of games matching the query.
 */

import { getUserByUsername } from './user.service';

/**
 * Retrieves games from the database based on the specified game type and status.
 * Includes 'FRIENDS_ONLY' rooms for friends of the creator.
 * @param {GameType | undefined} gameType - The type of the game to filter by (e.g., 'Nim').
 * @param {GameStatus | undefined} status - The status of the game to filter by (e.g., 'IN_PROGRESS').
 * @param {string | undefined} username - The username of the requesting user (for friends-only rooms).
 * @returns {Promise<GamesResponse>} - A promise resolving to a list of games matching the query.
 */
const findGames = async (
  gameType: GameType | undefined,
  status: GameStatus | undefined,
  username?: string,
): Promise<GamesResponse> => {
  const query: FindGameQuery = {};

  if (gameType) {
    query.gameType = gameType;
  }
  if (status) {
    query['state.status'] = status;
  }

  let friends: string[] = [];
  if (username) {
    const user = await getUserByUsername(username);
    if (user && !('error' in user) && Array.isArray(user.friends)) {
      friends = user.friends;
    }
  }

  try {
    const games: GameInstance<GameState>[] = await GameModel.find(query).lean();
    if (games === null) {
      throw new Error('No games found');
    }

    const sanitized = games
      .filter(game => {
        if (game.gameType === 'Connect Four') {
          const state = game.state as unknown as {
            roomSettings?: { privacy?: string; allowSpectators?: boolean };
            status?: string;
            player1?: string;
            [key: string]: unknown;
          };
          const privacy = state?.roomSettings?.privacy;
          const creator = state?.player1;
          const allowSpectators = state?.roomSettings?.allowSpectators !== false; // default true
          const status = state?.status;
          if (privacy === 'PUBLIC') return status !== 'OVER' && allowSpectators;
          if (
            privacy === 'FRIENDS_ONLY' &&
            username &&
            typeof creator === 'string' &&
            friends.includes(creator)
          ) {
            return status !== 'OVER' && allowSpectators;
          }
          return false;
        }
        return true;
      })
      .map(game => {
        const base = {
          state: game.state as GameState,
          gameID: game.gameID as GameInstanceID,
          players: game.players as string[],
          gameType: game.gameType as GameType,
        };
        if (game.gameType === 'Connect Four') {
          const connectFourState =
            (base.state as { roomSettings?: { roomCode?: string; [key: string]: unknown } }) || {};
          const roomSettings = connectFourState.roomSettings || {};
          // Do not leak room codes via the games list
          if (roomSettings) {
            connectFourState.roomSettings = {
              ...roomSettings,
              roomCode: undefined,
            };
          }
          base.state = connectFourState as GameState;
        }
        return base;
      })
      .reverse();
    return sanitized;
  } catch (error) {
    return [];
  }
};

export default findGames;
