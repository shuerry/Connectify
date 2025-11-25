import GameModel from '../../models/games.model';
import findGames from '../../services/game.service';
import { getUserByUsername } from '../../services/user.service';
import { MAX_NIM_OBJECTS } from '../../types/constants';
import { FindGameQuery, GameInstance, NimGameState, ConnectFourGameState } from '../../types/types';

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

  describe('Connect Four privacy filtering', () => {
    const buildConnectFourGame = (overrides: any = {}): GameInstance<any> => {
      const defaultRoomSettings: ConnectFourGameState['roomSettings'] = {
        roomName: 'Room',
        privacy: 'PUBLIC',
        allowSpectators: true,
        roomCode: 'SECRET',
      };
      const state: ConnectFourGameState = {
        status: 'WAITING_TO_START',
        board: Array(6)
          .fill(null)
          .map(() => Array(7).fill(null)),
        currentTurn: 'RED',
        moves: [],
        totalMoves: 0,
        player1: 'creator',
        player1Color: 'RED',
        player2Color: 'YELLOW',
        spectators: [],
        ...overrides.state,
        roomSettings: {
          ...defaultRoomSettings,
          ...(overrides.state?.roomSettings || {}),
        },
      };
      return {
        state,
        gameID: overrides.gameID || `cf-${Math.random()}`,
        players: overrides.players || ['creator'],
        gameType: 'Connect Four',
      };
    };

    it('filters Connect Four games by privacy for anonymous users', async () => {
      const publicGame = buildConnectFourGame({
        state: {
          roomSettings: {
            roomName: 'Public',
            privacy: 'PUBLIC',
            allowSpectators: true,
            roomCode: 'SECRET',
          },
        },
      });
      const privateGame = buildConnectFourGame({
        state: {
          roomSettings: { roomName: 'Private', privacy: 'PRIVATE', allowSpectators: true },
          status: 'WAITING_TO_START',
        },
      });
      const noSpectators = buildConnectFourGame({
        state: {
          roomSettings: { roomName: 'No Specs', privacy: 'PUBLIC', allowSpectators: false },
          status: 'WAITING_TO_START',
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([publicGame, privateGame, noSpectators]),
      } as any);

      const results = await findGames(undefined, undefined);
      expect(results).toHaveLength(1);
      expect(results[0].gameID).toBe(publicGame.gameID);
      expect((results[0].state as any).roomSettings.roomCode).toBeUndefined(); // sanitized
    });

    it('includes friends-only rooms when requester is a friend', async () => {
      const friendsOnlyGame = buildConnectFourGame({
        state: {
          player1: 'alice',
          roomSettings: {
            roomName: 'Friends',
            privacy: 'FRIENDS_ONLY',
            allowSpectators: true,
            roomCode: 'HUSH',
          },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([friendsOnlyGame]),
      } as any);
      (getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'viewer',
        friends: ['alice'],
      });

      const results = await findGames(undefined, undefined, 'viewer');
      expect(results).toHaveLength(1);
      expect(results[0].gameID).toBe(friendsOnlyGame.gameID);
      expect((results[0].state as any).roomSettings.roomCode).toBeUndefined(); // sanitized
    });

    it('excludes friends-only rooms when requester lacks access', async () => {
      const friendsOnlyGame = buildConnectFourGame({
        state: {
          player1: 'alice',
          roomSettings: { roomName: 'Friends', privacy: 'FRIENDS_ONLY', allowSpectators: true },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([friendsOnlyGame]),
      } as any);
      (getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'viewer',
        friends: ['bob'],
      });

      const results = await findGames(undefined, undefined, 'viewer');
      expect(results).toEqual([]);
    });

    it('excludes OVER games even if they are public', async () => {
      const overGame = buildConnectFourGame({
        state: {
          status: 'OVER',
          roomSettings: { roomName: 'Over', privacy: 'PUBLIC', allowSpectators: true },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([overGame]),
      } as any);

      const results = await findGames(undefined, undefined);
      expect(results).toEqual([]);
    });

    it('excludes games with allowSpectators false', async () => {
      const noSpectatorsGame = buildConnectFourGame({
        state: {
          roomSettings: { roomName: 'No Specs', privacy: 'PUBLIC', allowSpectators: false },
          status: 'WAITING_TO_START',
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([noSpectatorsGame]),
      } as any);

      const results = await findGames(undefined, undefined);
      expect(results).toEqual([]);
    });

    it('handles missing friends array gracefully', async () => {
      const friendsOnlyGame = buildConnectFourGame({
        state: {
          player1: 'alice',
          roomSettings: { roomName: 'Friends', privacy: 'FRIENDS_ONLY', allowSpectators: true },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([friendsOnlyGame]),
      } as any);
      (getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'viewer',
        friends: undefined,
      });

      const results = await findGames(undefined, undefined, 'viewer');
      expect(results).toEqual([]);
    });

    it('handles getUserByUsername returning an error', async () => {
      const friendsOnlyGame = buildConnectFourGame({
        state: {
          player1: 'alice',
          roomSettings: { roomName: 'Friends', privacy: 'FRIENDS_ONLY', allowSpectators: true },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([friendsOnlyGame]),
      } as any);
      (getUserByUsername as jest.Mock).mockResolvedValue({
        error: 'User not found',
      });

      const results = await findGames(undefined, undefined, 'viewer');
      expect(results).toEqual([]);
    });

    it('handles getUserByUsername returning null', async () => {
      const friendsOnlyGame = buildConnectFourGame({
        state: {
          player1: 'alice',
          roomSettings: { roomName: 'Friends', privacy: 'FRIENDS_ONLY', allowSpectators: true },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([friendsOnlyGame]),
      } as any);
      (getUserByUsername as jest.Mock).mockResolvedValue(null);

      const results = await findGames(undefined, undefined, 'viewer');
      expect(results).toEqual([]);
    });

    it('sanitizes room codes from all Connect Four games', async () => {
      const gameWithCode = buildConnectFourGame({
        state: {
          // Use valid ConnectFourGameState values for currentTurn
          board: Array(6)
            .fill(null)
            .map(() => Array(7).fill(null)),
          currentTurn: 'RED',
          player1: 'player1',
          player2: 'player2',
          status: 'WAITING_TO_START',
          player1Color: 'RED',
          player2Color: 'YELLOW',
          winner: undefined,
          roomSettings: {
            roomName: 'Public',
            privacy: 'PUBLIC',
            allowSpectators: true,
            roomCode: 'SECRET123',
          },
        },
      });

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([gameWithCode]),
      } as any);

      const results = await findGames(undefined, undefined);
      expect(results).toHaveLength(1);
      expect((results[0].state as any).roomSettings.roomCode).toBeUndefined();
    });

    it('handles Connect Four games with missing roomSettings', async () => {
      const gameWithoutSettings: GameInstance<any> = {
        state: {
          status: 'WAITING_TO_START',
          // roomSettings is missing
        },
        gameID: 'cf-missing-settings',
        players: ['creator'],
        gameType: 'Connect Four',
      };

      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([gameWithoutSettings]),
      } as any);

      const results = await findGames(undefined, undefined);
      // Should be filtered out due to missing privacy setting
      expect(results).toEqual([]);
    });
  });
});
