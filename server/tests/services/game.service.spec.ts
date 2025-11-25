import GameModel from '../../models/games.model';
import findGames from '../../services/game.service';
import { getUserByUsername } from '../../services/user.service';
import { MAX_NIM_OBJECTS } from '../../types/constants';
import {
  ConnectFourGameState,
  ConnectFourRoomSettings,
  FindGameQuery,
  GameInstance,
  NimGameState,
} from '../../types/types';

jest.mock('../../services/user.service', () => ({
  getUserByUsername: jest.fn(),
}));

const gameState1: GameInstance<NimGameState> = {
  state: { moves: [], status: 'WAITING_TO_START', remainingObjects: MAX_NIM_OBJECTS },
  gameID: 'testGameID1',
  players: ['user1'],
  gameType: 'Nim',
};

const gameState2: GameInstance<NimGameState> = {
  state: { moves: [], status: 'IN_PROGRESS', remainingObjects: MAX_NIM_OBJECTS },
  gameID: 'testGameID2',
  players: ['user1', 'user2'],
  gameType: 'Nim',
};

const gameState3: GameInstance<NimGameState> = {
  state: { moves: [], status: 'OVER', winners: ['user1'], remainingObjects: MAX_NIM_OBJECTS },
  gameID: 'testGameID3',
  players: ['user1', 'user2'],
  gameType: 'Nim',
};

const createConnectFourState = (
  overrides?: Partial<ConnectFourGameState>,
  roomOverrides?: Partial<ConnectFourRoomSettings>,
): ConnectFourGameState => {
  const baseRoomSettings: ConnectFourRoomSettings = {
    roomName: 'Connect Room',
    privacy: 'PUBLIC',
    allowSpectators: true,
    roomCode: 'SECRET',
  };

  return {
    status: 'WAITING_TO_START',
    board: Array.from({ length: 6 }, () => Array(7).fill(null)),
    currentTurn: 'RED',
    player1: 'creator',
    player2: undefined,
    player1Color: 'RED',
    player2Color: 'YELLOW',
    moves: [],
    totalMoves: 0,
    roomSettings: { ...baseRoomSettings, ...(roomOverrides ?? {}) },
    spectators: [],
    ...overrides,
  };
};

const createConnectFourGame = (
  gameID: string,
  options?: {
    stateOverrides?: Partial<ConnectFourGameState>;
    roomOverrides?: Partial<ConnectFourRoomSettings>;
    players?: string[];
  },
): GameInstance<ConnectFourGameState> => ({
  state: createConnectFourState(options?.stateOverrides, options?.roomOverrides),
  gameID,
  players: options?.players ?? ['creator'],
  gameType: 'Connect Four',
});

describe('findGames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return all games when provided undefined arguments', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState1, gameState2, gameState3]));
      return query;
    });

    const games = await findGames(undefined, undefined);

    expect(games).toEqual([gameState3, gameState2, gameState1]);
  });

  it('should return games with the matching gameType', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation((filter?: FindGameQuery) => {
      expect(filter).toEqual({ 'gameType': 'Nim', 'state.status': undefined });
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState1, gameState2, gameState3]));
      return query;
    });
    const games = await findGames('Nim', undefined);

    expect(games).toEqual([gameState3, gameState2, gameState1]);
  });

  it('should return games with the matching status', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation((filter?: FindGameQuery) => {
      expect(filter).toEqual({ 'gameType': undefined, 'state.status': 'IN_PROGRESS' });
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState2]));
      return query;
    });

    const games = await findGames(undefined, 'IN_PROGRESS');

    expect(games).toEqual([gameState2]);
  });

  it('should return games with the matching gameType and status', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation((filter?: FindGameQuery) => {
      expect(filter).toEqual({ 'gameType': 'Nim', 'state.status': 'OVER' });
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState3]));
      return query;
    });

    const games = await findGames('Nim', 'OVER');

    expect(games).toEqual([gameState3]);
  });

  it('should return an empty list for database error', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockRejectedValue(new Error('Database error'));
      return query;
    });

    const games = await findGames(undefined, undefined);

    expect(games).toEqual([]);
  });

  it('should return an empty list for no games found', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockResolvedValue(null);
      return query;
    });

    const games = await findGames(undefined, undefined);

    expect(games).toEqual([]);
  });

  it('should include only accessible Connect Four rooms and remove room codes', async () => {
    const mockGetUserByUsername = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>;
    mockGetUserByUsername.mockResolvedValueOnce({
      username: 'requester',
      friends: ['friendlyCreator'],
    } as any);

    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(
        Promise.resolve([
          createConnectFourGame('public-room', {
            stateOverrides: { player1: 'publicCreator' },
            roomOverrides: {
              privacy: 'PUBLIC',
              // simulate missing allowSpectators flag
              allowSpectators: undefined as unknown as boolean,
            },
          }),
          createConnectFourGame('private-room', {
            roomOverrides: { privacy: 'PRIVATE' },
          }),
          createConnectFourGame('friend-room', {
            stateOverrides: { player1: 'friendlyCreator', status: 'IN_PROGRESS' },
            roomOverrides: { privacy: 'FRIENDS_ONLY', allowSpectators: true },
          }),
          createConnectFourGame('friend-room-no-access', {
            stateOverrides: { player1: 'strangerCreator' },
            roomOverrides: { privacy: 'FRIENDS_ONLY', allowSpectators: true },
          }),
          createConnectFourGame('no-spectators', {
            roomOverrides: { allowSpectators: false },
          }),
          createConnectFourGame('over-room', {
            stateOverrides: { status: 'OVER' },
          }),
        ]),
      );
      return query;
    });

    const games = await findGames('Connect Four', undefined, 'requester');

    expect(mockGetUserByUsername).toHaveBeenCalledWith('requester');
    expect(games).toHaveLength(2);
    expect(games[0]).toEqual(
      expect.objectContaining({
        gameID: 'friend-room',
        state: expect.objectContaining({
          roomSettings: expect.objectContaining({
            privacy: 'FRIENDS_ONLY',
            roomCode: undefined,
          }),
        }),
      }),
    );
    expect(games[1]).toEqual(
      expect.objectContaining({
        gameID: 'public-room',
        state: expect.objectContaining({
          roomSettings: expect.objectContaining({
            privacy: 'PUBLIC',
            roomCode: undefined,
          }),
        }),
      }),
    );
  });

  it('should exclude friends-only rooms when requester is not a friend or lookup fails', async () => {
    const mockGetUserByUsername = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>;
    mockGetUserByUsername.mockResolvedValueOnce({ error: 'User not found' } as any);

    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(
        Promise.resolve([
          createConnectFourGame('friend-room', {
            stateOverrides: { player1: 'friendlyCreator' },
            roomOverrides: { privacy: 'FRIENDS_ONLY', allowSpectators: true },
          }),
        ]),
      );
      return query;
    });

    const games = await findGames('Connect Four', undefined, 'requester');

    expect(games).toEqual([]);
  });
});
