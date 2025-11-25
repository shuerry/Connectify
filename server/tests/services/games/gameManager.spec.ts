import NimModel from '../../../models/nim.model';
import GameModel from '../../../models/games.model';
import GameManager from '../../../services/games/gameManager';
import NimGame from '../../../services/games/nim';
import ConnectFourGame from '../../../services/games/connectFour';
import { MAX_NIM_OBJECTS } from '../../../types/constants';
import {
  GameInstance,
  GameInstanceID,
  NimGameState,
  GameType,
  ConnectFourRoomSettings,
  ConnectFourGameState,
} from '../../../types/types';
import { getRelations } from '../../../services/user.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'testGameID'), // Mock the return value
}));

jest.mock('../../../services/user.service', () => ({
  getRelations: jest.fn(),
}));

const mockedGetRelations = getRelations as jest.MockedFunction<typeof getRelations>;

describe('GameManager', () => {
  afterEach(() => {
    GameManager.resetInstance(); // Call the reset method
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  describe('constructor', () => {
    it('should create a singleton instance of GameManager', () => {
      const gameManager = GameManager.getInstance();

      // Object references should be the same
      expect(GameManager.getInstance()).toBe(gameManager);
    });
  });

  describe('resetInstance', () => {
    it('should reset the singleton instance of GameManager', () => {
      const gameManager1 = GameManager.getInstance();

      GameManager.resetInstance();

      const gameManager2 = GameManager.getInstance();

      expect(gameManager1).not.toBe(gameManager2);
    });
  });

  describe('addGame', () => {
    const mapSetSpy = jest.spyOn(Map.prototype, 'set');

    it('should return the gameID for a successfully created game', async () => {
      jest
        .spyOn(NimModel, 'create')
        .mockResolvedValue(
          new NimGame().toModel() as unknown as ReturnType<typeof NimModel.create>,
        );

      const gameManager = GameManager.getInstance();
      const gameID = await gameManager.addGame('Nim');

      expect(gameID).toEqual('testGameID');
      expect(mapSetSpy).toHaveBeenCalledWith(gameID, expect.any(NimGame));
    });

    it('should return an error for an invalid game type', async () => {
      const gameManager = GameManager.getInstance();
      // casting string for error testing purposes
      const error = await gameManager.addGame('fakeGame' as GameType);

      expect(mapSetSpy).not.toHaveBeenCalled();
      expect(error).toHaveProperty('error');
      expect(error).toEqual({ error: 'Invalid game type' });
    });

    it('should return an error for a database error', async () => {
      jest.spyOn(NimModel, 'create').mockRejectedValueOnce(() => new Error('database error'));

      const gameManager = GameManager.getInstance();
      // casting string for error testing purposes
      const error = await gameManager.addGame('Nim');

      expect(mapSetSpy).not.toHaveBeenCalled();
      expect(error).toHaveProperty('error');
    });
  });

  describe('removeGame', () => {
    const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

    it('should remove the game with the provided gameID', async () => {
      jest
        .spyOn(NimModel, 'create')
        .mockResolvedValue(
          new NimGame().toModel() as unknown as ReturnType<typeof NimModel.create>,
        );

      // assemble
      const gameManager = GameManager.getInstance();
      const gameID = await gameManager.addGame('Nim');
      expect(gameManager.getActiveGameInstances().length).toEqual(1);

      if (typeof gameID === 'string') {
        // act
        const removed = gameManager.removeGame(gameID);

        // assess
        expect(removed).toBeTruthy();
        expect(gameManager.getActiveGameInstances().length).toEqual(0);
        expect(mapDeleteSpy).toHaveBeenCalledWith(gameID);
      }
    });

    it('should return false if there is no game with the provided gameID', async () => {
      // assemble
      const gameManager = GameManager.getInstance();
      const gameID = 'fakeGameID';

      // act
      const removed = gameManager.removeGame(gameID);

      // assess
      expect(removed).toBeFalsy();
      expect(mapDeleteSpy).toHaveBeenCalledWith(gameID);
    });
  });

  describe('joinGame', () => {
    let gameManager: GameManager;
    let gameID: GameInstanceID;

    beforeEach(async () => {
      jest
        .spyOn(NimModel, 'create')
        .mockResolvedValue(
          new NimGame().toModel() as unknown as ReturnType<typeof NimModel.create>,
        );

      gameManager = GameManager.getInstance();
      const addGameResult = await gameManager.addGame('Nim');

      if (typeof addGameResult === 'string') {
        gameID = addGameResult;
      }
    });

    it('should join the requested game', async () => {
      const gameState: GameInstance<NimGameState> = {
        state: {
          moves: [],
          player1: 'player1',
          status: 'WAITING_TO_START',
          remainingObjects: MAX_NIM_OBJECTS,
        },
        gameID,
        players: ['player1'],
        gameType: 'Nim',
      };

      const saveGameStateSpy = jest
        .spyOn(NimGame.prototype, 'saveGameState')
        .mockResolvedValueOnce();
      const nimGameJoinSpy = jest.spyOn(NimGame.prototype, 'join');

      const gameJoined = await gameManager.joinGame(gameID, 'player1');

      expect(saveGameStateSpy).toHaveBeenCalled();
      expect(nimGameJoinSpy).toHaveBeenCalledWith('player1');
      expect(gameJoined).toEqual(gameState);
    });

    it('should throw an error if the game does not exist', async () => {
      const response = await gameManager.joinGame('fakeGameID', 'player1');

      expect(response).toEqual({ error: 'Game requested does not exist.' });
    });
  });

  describe('leaveGame', () => {
    let gameManager: GameManager;
    let gameID: GameInstanceID;

    beforeEach(async () => {
      jest
        .spyOn(NimModel, 'create')
        .mockResolvedValue(
          new NimGame().toModel() as unknown as ReturnType<typeof NimModel.create>,
        );
      jest.spyOn(NimGame.prototype, 'saveGameState').mockResolvedValue();

      gameManager = GameManager.getInstance();
      const addGameResult = await gameManager.addGame('Nim');

      if (typeof addGameResult === 'string') {
        gameID = addGameResult;
        await gameManager.joinGame(gameID, 'player1');
      }
    });

    it('should leave the requested game', async () => {
      const gameState: GameInstance<NimGameState> = {
        state: {
          moves: [],
          status: 'WAITING_TO_START',
          remainingObjects: MAX_NIM_OBJECTS,
        },
        gameID,
        players: [],
        gameType: 'Nim',
      };

      const saveGameStateSpy = jest
        .spyOn(NimGame.prototype, 'saveGameState')
        .mockResolvedValueOnce();
      const nimGameLeaveSpy = jest.spyOn(NimGame.prototype, 'leave');

      const gameLeft = await gameManager.leaveGame(gameID, 'player1');

      expect(saveGameStateSpy).toHaveBeenCalled();
      expect(nimGameLeaveSpy).toHaveBeenCalledWith('player1');
      expect(gameLeft).toEqual(gameState);
    });

    it('should leave and remove the requested game if it ends', async () => {
      // assemble
      await gameManager.joinGame(gameID, 'player2');

      const gameState: GameInstance<NimGameState> = {
        state: {
          moves: [],
          status: 'OVER',
          player1: undefined,
          player2: 'player2',
          winners: ['player2'],
          remainingObjects: MAX_NIM_OBJECTS,
        },
        gameID: 'testGameID',
        players: ['player2'],
        gameType: 'Nim',
      };
      const saveGameStateSpy = jest
        .spyOn(NimGame.prototype, 'saveGameState')
        .mockResolvedValueOnce();
      const nimGameLeaveSpy = jest.spyOn(NimGame.prototype, 'leave');
      const removeGameSpy = jest.spyOn(gameManager, 'removeGame');

      const gameLeft = await gameManager.leaveGame(gameID, 'player1');

      expect(saveGameStateSpy).toHaveBeenCalled();
      expect(nimGameLeaveSpy).toHaveBeenCalledWith('player1');
      expect(removeGameSpy).toHaveBeenLastCalledWith(gameID);
      expect(gameLeft).toEqual(gameState);
    });

    it('should throw an error if the game does not exist', async () => {
      const response = await gameManager.leaveGame('fakeGameID', 'player1');

      expect(response).toEqual({ error: 'Game requested does not exist.' });
    });
  });

  describe('getGame', () => {
    let gameManager: GameManager;
    const mapGetSpy = jest.spyOn(Map.prototype, 'get');

    beforeEach(() => {
      gameManager = GameManager.getInstance();
    });

    it('should return the game if it exists', async () => {
      // assemble
      jest
        .spyOn(NimModel, 'create')
        .mockResolvedValue(
          new NimGame().toModel() as unknown as ReturnType<typeof NimModel.create>,
        );

      const gameID = await gameManager.addGame('Nim');

      if (typeof gameID === 'string') {
        // act
        const game = gameManager.getGame(gameID);

        expect(game).toBeInstanceOf(NimGame);
        expect(mapGetSpy).toHaveBeenCalledWith(gameID);
      }
    });

    it('should return undefined if the game request does not exist', () => {
      const gameID = 'fakeGameID';
      const game = gameManager.getGame(gameID);

      expect(game).toBeUndefined();
      expect(mapGetSpy).toHaveBeenCalledWith(gameID);
    });
  });

  describe('getActiveGameInstances', () => {
    it('should be empty on initialization', () => {
      const games = GameManager.getInstance().getActiveGameInstances();
      expect(games.length).toEqual(0);
    });

    it('should return active games', async () => {
      jest
        .spyOn(NimModel, 'create')
        .mockResolvedValue(
          new NimGame().toModel() as unknown as ReturnType<typeof NimModel.create>,
        );
      // assemble
      const gameManager = GameManager.getInstance();
      await gameManager.addGame('Nim');

      // act
      const games = gameManager.getActiveGameInstances();
      expect(games.length).toEqual(1);
      expect(games[0]).toBeInstanceOf(NimGame);
    });
  });

  describe('Connect Four specific logic', () => {
    const getGamesMap = (manager: GameManager): Map<string, any> =>
      (manager as unknown as { _games: Map<string, any> })._games;

    beforeEach(() => {
      jest.clearAllMocks();
      mockedGetRelations.mockReset();
    });

    describe('addGame for Connect Four', () => {
      it('should create and save a Connect Four game when valid params are provided', async () => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Test Room',
          privacy: 'PUBLIC',
          allowSpectators: true,
        };

        const MockGameModel = {
          state: {
            status: 'WAITING_TO_START',
            player1: 'creator',
            roomSettings,
          },
          gameID: 'testGameID',
          players: ['creator'],
          gameType: 'Connect Four',
        };

        jest.spyOn(GameModel, 'create').mockResolvedValue(MockGameModel as any);
        jest.spyOn(ConnectFourGame.prototype, 'saveGameState').mockResolvedValue(undefined);

        const gameManager = GameManager.getInstance();
        const result = await gameManager.addGame('Connect Four', 'creator', roomSettings);

        expect(result).toEqual('testGameID');
        const game = gameManager.getGame('testGameID');
        expect(game).toBeInstanceOf(ConnectFourGame);
        expect(game?.gameType).toBe('Connect Four');
      });

      it('should return an error when creatorID is missing for Connect Four', async () => {
        const gameManager = GameManager.getInstance();
        const result = await gameManager.addGame(
          'Connect Four',
          undefined as unknown as string,
          { privacy: 'PUBLIC' } as any,
        );

        expect(result).toEqual({ error: 'Creator ID is required for Connect Four' });
      });

      it('should return an error when roomSettings is missing for Connect Four', async () => {
        const gameManager = GameManager.getInstance();
        const result = await gameManager.addGame('Connect Four', 'creator');

        expect(result).toEqual({ error: 'Room settings are required for Connect Four' });
      });
    });

    describe('joinGame for Connect Four', () => {
      let gameManager: GameManager;
      let connectFourGame: ConnectFourGame;
      let gameID: string;

      beforeEach(() => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Test Room',
          privacy: 'PUBLIC',
          allowSpectators: true,
        };

        connectFourGame = new ConnectFourGame('creator', roomSettings);
        jest.spyOn(connectFourGame, 'saveGameState').mockResolvedValue(undefined);
        jest.spyOn(connectFourGame, 'verifyAccess').mockReturnValue(true);
        jest.spyOn(connectFourGame, 'join').mockImplementation(() => {});
        jest.spyOn(connectFourGame, 'addSpectator').mockImplementation(() => {});

        gameManager = GameManager.getInstance();
        getGamesMap(gameManager).set('testGameID', connectFourGame);
        gameID = 'testGameID';
      });

      it('should join a Connect Four game when access is granted', async () => {
        const toModelSpy = jest.spyOn(connectFourGame, 'toModel').mockReturnValue({
          state: {
            status: 'WAITING_TO_START',
            player1: 'creator',
            player2: 'player1',
          } as ConnectFourGameState,
          gameID: 'testGameID',
          players: ['creator', 'player1'],
          gameType: 'Connect Four',
        } as any);

        const result = await gameManager.joinGame(gameID, 'player1');

        expect(connectFourGame.verifyAccess).toHaveBeenCalledWith(undefined, []);
        expect(connectFourGame.join).toHaveBeenCalledWith('player1');
        expect(connectFourGame.saveGameState).toHaveBeenCalled();
        expect(result).toEqual(toModelSpy.mock.results[0].value);
      });

      it('should fetch relations for friends-only rooms and join when access is granted', async () => {
        connectFourGame.state.roomSettings.privacy = 'FRIENDS_ONLY';
        mockedGetRelations.mockResolvedValue({ friends: ['creator'], blockedUsers: [] });

        jest.spyOn(connectFourGame, 'verifyAccess').mockReturnValue(true);
        jest.spyOn(connectFourGame, 'toModel').mockReturnValue({
          state: { player1: 'creator', player2: 'friend' } as ConnectFourGameState,
          gameID: 'testGameID',
          players: ['creator', 'friend'],
          gameType: 'Connect Four',
        } as any);

        const result = await gameManager.joinGame(gameID, 'friend');

        expect(mockedGetRelations).toHaveBeenCalledWith('friend');
        expect(connectFourGame.verifyAccess).toHaveBeenCalledWith(undefined, ['creator']);
        expect(connectFourGame.join).toHaveBeenCalledWith('friend');
        expect(result).not.toHaveProperty('error');
      });

      it('should return an error when getRelations fails for friends-only room', async () => {
        connectFourGame.state.roomSettings.privacy = 'FRIENDS_ONLY';
        mockedGetRelations.mockResolvedValue({ error: 'User not found' } as any);

        const result = await gameManager.joinGame(gameID, 'player1');

        expect(result).toEqual({ error: 'Could not verify friends for room access' });
        expect(connectFourGame.join).not.toHaveBeenCalled();
      });

      it('should return an error when access is denied for friends-only room', async () => {
        connectFourGame.state.roomSettings.privacy = 'FRIENDS_ONLY';
        mockedGetRelations.mockResolvedValue({ friends: [], blockedUsers: [] });
        jest.spyOn(connectFourGame, 'verifyAccess').mockReturnValue(false);

        const result = await gameManager.joinGame(gameID, 'stranger');

        expect(result).toEqual({ error: 'Access denied: This is a friends-only room' });
        expect(connectFourGame.join).not.toHaveBeenCalled();
      });

      it('should return an error when access is denied for private room', async () => {
        connectFourGame.state.roomSettings.privacy = 'PRIVATE';
        jest.spyOn(connectFourGame, 'verifyAccess').mockReturnValue(false);

        const result = await gameManager.joinGame(gameID, 'player1', 'wrongCode');

        expect(result).toEqual({ error: 'Access denied: invalid room code or room is private' });
        expect(connectFourGame.join).not.toHaveBeenCalled();
      });

      it('should join as a spectator when requested', async () => {
        jest.spyOn(connectFourGame, 'toModel').mockReturnValue({
          state: { spectators: ['viewer'] } as ConnectFourGameState,
          gameID: 'testGameID',
          players: ['creator'],
          gameType: 'Connect Four',
        } as any);

        const result = await gameManager.joinGame(gameID, 'viewer', undefined, true);

        expect(connectFourGame.addSpectator).toHaveBeenCalledWith('viewer');
        expect(connectFourGame.join).not.toHaveBeenCalled();
        expect(result).not.toHaveProperty('error');
      });
    });

    describe('leaveGame for Connect Four', () => {
      let gameManager: GameManager;
      let connectFourGame: ConnectFourGame;
      let gameID: string;

      beforeEach(() => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Test Room',
          privacy: 'PUBLIC',
          allowSpectators: true,
        };

        connectFourGame = new ConnectFourGame('creator', roomSettings);
        jest.spyOn(connectFourGame, 'saveGameState').mockResolvedValue(undefined);
        jest.spyOn(connectFourGame, 'leave').mockImplementation(() => {});
        jest.spyOn(connectFourGame, 'removeSpectator').mockImplementation(() => {});

        gameManager = GameManager.getInstance();
        getGamesMap(gameManager).set('testGameID', connectFourGame);
        gameID = 'testGameID';
      });

      it('should remove spectator when leaving as a spectator', async () => {
        jest.spyOn(connectFourGame, 'toModel').mockReturnValue({
          state: {
            ...connectFourGame.state,
            status: 'WAITING_TO_START',
            player1: 'creator',
            spectators: [],
          },
          gameID: 'testGameID',
          players: ['creator'],
          gameType: 'Connect Four',
        } as any);

        const result = await gameManager.leaveGame(gameID, 'viewer', true);

        expect(connectFourGame.removeSpectator).toHaveBeenCalledWith('viewer');
        expect(connectFourGame.leave).not.toHaveBeenCalled();
        expect(result).not.toHaveProperty('error');
      });

      it('should remove Connect Four game when no players remain after leave', async () => {
        connectFourGame.state.player1 = 'solo';
        connectFourGame.state.player2 = undefined;
        connectFourGame.state.status = 'WAITING_TO_START';

        jest.spyOn(connectFourGame, 'toModel').mockReturnValue({
          state: {
            status: 'WAITING_TO_START',
            player1: undefined,
            player2: undefined,
          } as ConnectFourGameState,
          gameID: 'testGameID',
          players: [],
          gameType: 'Connect Four',
        } as any);

        const removeGameSpy = jest.spyOn(gameManager, 'removeGame');

        await gameManager.leaveGame(gameID, 'solo');

        expect(connectFourGame.leave).toHaveBeenCalledWith('solo');
        expect(removeGameSpy).toHaveBeenCalledWith(gameID);
        expect(getGamesMap(gameManager).has(gameID)).toBe(false);
      });

      it('should not remove Connect Four game when players remain', async () => {
        connectFourGame.state.player1 = 'player1';
        connectFourGame.state.player2 = 'player2';

        jest.spyOn(connectFourGame, 'toModel').mockReturnValue({
          state: {
            status: 'IN_PROGRESS',
            player1: 'player1',
            player2: 'player2',
          } as ConnectFourGameState,
          gameID: 'testGameID',
          players: ['player1', 'player2'],
          gameType: 'Connect Four',
        } as any);

        const removeGameSpy = jest.spyOn(gameManager, 'removeGame');

        await gameManager.leaveGame(gameID, 'player1');

        expect(connectFourGame.leave).toHaveBeenCalledWith('player1');
        expect(removeGameSpy).not.toHaveBeenCalled();
        expect(getGamesMap(gameManager).has(gameID)).toBe(true);
      });
    });
  });
});
