import {
  GameInstance,
  GameState,
  GameStatus,
  GameType,
  ConnectFourGameState,
  ConnectFourRoomSettings,
} from '../types/types';
import api from './config';

const GAMES_API_URL = `/api/games`;

/**
 * Function to create a new game of the specified type.
 * @param gameType The type of game to create.
 * @returns A promise resolving to the created game instance.
 * @throws Error if there is an issue while creating the game.
 */
const createGame = async (gameType: GameType): Promise<GameInstance<GameState>> => {
  const res = await api.post(`${GAMES_API_URL}/create`, {
    gameType,
  });

  if (res.status !== 200) {
    throw new Error('Error while creating a new game');
  }

  return res.data;
};

/**
 * Function to fetch a list of games based on optional filters for game type and status.
 * @param gameType (Optional) The type of games to filter by.
 * @param status (Optional) The status of games to filter by.
 * @returns A promise resolving to a list of game instances.
 * @throws Error if there is an issue while fetching the games.
 */
const getGames = async (
  gameType: GameType | undefined,
  status: GameStatus | undefined,
): Promise<GameInstance<GameState>[]> => {
  const params = new URLSearchParams();

  if (gameType) {
    params.append('gameType', gameType);
  }

  if (status) {
    params.append('status', status);
  }

  const res = await api.get(`${GAMES_API_URL}/games`, {
    params,
  });

  if (res.status !== 200) {
    throw new Error('Error while getting games');
  }

  return res.data;
};

/**
 * Function to join an existing game.
 * @param gameID The ID of the game to join.
 * @param playerID The ID of the player joining the game.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while joining the game.
 */
const joinGame = async (gameID: string, playerID: string): Promise<GameInstance<GameState>> => {
  const res = await api.post(`${GAMES_API_URL}/join`, {
    gameID,
    playerID,
  });

  if (res.status !== 200) {
    throw new Error('Error while joining a game');
  }

  return res.data;
};

/**
 * Function to leave a game.
 * @param gameID The ID of the game to leave.
 * @param playerID The ID of the player leaving the game.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while leaving the game.
 */
const leaveGame = async (gameID: string, playerID: string): Promise<GameInstance<GameState>> => {
  const res = await api.post(`${GAMES_API_URL}/leave`, {
    gameID,
    playerID,
  });

  if (res.status !== 200) {
    throw new Error('Error while leaving a game');
  }

  return res.data;
};

/**
 * Function to create a new Connect Four room with custom settings.
 * @param playerID The ID of the player creating the room.
 * @param roomSettings The settings for the room.
 * @returns A promise resolving to the created room information.
 * @throws Error if there is an issue while creating the room.
 */
const createConnectFourRoom = async (
  playerID: string,
  roomSettings: ConnectFourRoomSettings,
): Promise<{
  gameID: string;
  roomCode?: string;
  game: GameInstance<ConnectFourGameState>;
}> => {
  const res = await api.post(`${GAMES_API_URL}/connectfour/create`, {
    playerID,
    roomSettings,
  });

  if (res.status !== 200) {
    throw new Error('Error while creating Connect Four room');
  }

  return res.data;
};

/**
 * Function to join a Connect Four room.
 * @param playerID The ID of the player joining.
 * @param gameID The ID of the game to join.
 * @param roomCode Optional room code for private rooms.
 * @param asSpectator Whether to join as a spectator.
 * @returns A promise resolving to the game instance.
 * @throws Error if there is an issue while joining the room.
 */
const joinConnectFourRoom = async (
  playerID: string,
  gameID: string,
  roomCode?: string,
  asSpectator?: boolean,
): Promise<GameInstance<ConnectFourGameState>> => {
  const res = await api.post(`${GAMES_API_URL}/connectfour/join`, {
    playerID,
    gameID,
    roomCode,
    asSpectator,
  });

  if (res.status !== 200) {
    throw new Error('Error while joining Connect Four room');
  }

  return res.data;
};

/**
 * Join a Connect Four room by private room code.
 */
const joinConnectFourRoomByCode = async (
  playerID: string,
  roomCode: string,
  asSpectator?: boolean,
): Promise<GameInstance<ConnectFourGameState>> => {
  const res = await api.post(`${GAMES_API_URL}/connectfour/join-by-code`, {
    playerID,
    roomCode,
    asSpectator,
  });

  if (res.status !== 200) {
    throw new Error('Error while joining Connect Four room by code');
  }

  return res.data;
};

/**
 * Function to get information about a specific Connect Four room.
 * @param gameID The ID of the game.
 * @returns A promise resolving to the game instance.
 * @throws Error if there is an issue while fetching the room.
 */
const getConnectFourRoom = async (gameID: string): Promise<GameInstance<ConnectFourGameState>> => {
  const res = await api.get(`${GAMES_API_URL}/connectfour/${gameID}`);

  if (res.status !== 200) {
    throw new Error('Error while fetching Connect Four room');
  }

  return res.data;
};

export {
  createGame,
  getGames,
  joinGame,
  leaveGame,
  createConnectFourRoom,
  joinConnectFourRoom,
  joinConnectFourRoomByCode,
  getConnectFourRoom,
};
