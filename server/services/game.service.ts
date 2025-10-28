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
const findGames = async (
  gameType: GameType | undefined,
  status: GameStatus | undefined,
): Promise<GamesResponse> => {
  const query: FindGameQuery = {};

  // Build database query based on provided filters
  if (gameType) {
    query.gameType = gameType;
  }

  if (status) {
    query['state.status'] = status;
  }

  try {
    const games: GameInstance<GameState>[] = await GameModel.find(query).lean();

    if (games === null) {
      throw new Error('No games found');
    }

    // Filter and sanitize results:
    // Exclude private Connect Four rooms from the public list
    // Remove/obfuscate any room codes from Connect Four state before returning
    const sanitized = games
      .filter(game => {
        if (game.gameType === 'Connect Four') {
          const privacy = (game.state as any)?.roomSettings?.privacy;
          return privacy === 'PUBLIC';
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
          const stateAny = (base.state as any) || {};
          const roomSettings = stateAny.roomSettings || {};
          // Do not leak room codes via the games list
          if (roomSettings) {
            stateAny.roomSettings = {
              ...roomSettings,
              roomCode: undefined,
            };
          }
          base.state = stateAny as GameState;
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
