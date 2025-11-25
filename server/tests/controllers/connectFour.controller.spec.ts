import supertest from 'supertest';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { Server as HTTPServer, createServer } from 'http';
import { io as Client, type Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { app } from '../../app';
import GameManager from '../../services/games/gameManager';
import {
  FakeSOSocket,
  GameInstance,
  ConnectFourGameState,
  ConnectFourRoomSettings,
} from '../../types/types';
import gameController from '../../controllers/game.controller';
import ConnectFourGame from '../../services/games/connectFour';
import * as userService from '../../services/user.service';

jest.mock('../../services/user.service', () => ({
  __esModule: true,
  getRelations: jest.fn(),
}));

const mockGameManager = GameManager.getInstance();

describe('Connect Four Controller Tests', () => {
  describe('POST /connectfour/create', () => {
    const addGameSpy = jest.spyOn(mockGameManager, 'addGame');
    const getGameSpy = jest.spyOn(mockGameManager, 'getGame');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('200 OK Requests', () => {
      it('should create a public Connect Four room successfully', async () => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Test Room',
          privacy: 'PUBLIC',
          allowSpectators: true,
        };

        const mockGame = new ConnectFourGame('player1', roomSettings);
        addGameSpy.mockResolvedValueOnce('testGameID');
        getGameSpy.mockReturnValueOnce(mockGame);

        const response = await supertest(app).post('/api/games/connectfour/create').send({
          playerID: 'player1',
          roomSettings,
        });

        expect(response.status).toEqual(200);
        expect(response.body.gameID).toEqual('testGameID');
        expect(response.body.game).toBeDefined();
        expect(addGameSpy).toHaveBeenCalledWith('Connect Four', 'player1', roomSettings);
      });

      it('should create a private Connect Four room with room code', async () => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Private Room',
          privacy: 'PRIVATE',
          allowSpectators: false,
        };

        const mockGame = new ConnectFourGame('player1', roomSettings);
        addGameSpy.mockResolvedValueOnce('testGameID');
        getGameSpy.mockReturnValueOnce(mockGame);

        const response = await supertest(app).post('/api/games/connectfour/create').send({
          playerID: 'player1',
          roomSettings,
        });

        expect(response.status).toEqual(200);
        expect(response.body.gameID).toEqual('testGameID');
        expect(response.body.roomCode).toBeDefined();
        expect(response.body.game).toBeDefined();
      });

      it('should create a friends-only Connect Four room', async () => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Friends Room',
          privacy: 'FRIENDS_ONLY',
          allowSpectators: true,
        };

        const mockGame = new ConnectFourGame('player1', roomSettings);
        addGameSpy.mockResolvedValueOnce('testGameID');
        getGameSpy.mockReturnValueOnce(mockGame);

        const response = await supertest(app).post('/api/games/connectfour/create').send({
          playerID: 'player1',
          roomSettings,
        });

        expect(response.status).toEqual(200);
        expect(response.body.gameID).toEqual('testGameID');
        expect(response.body.roomCode).toBeDefined();
        expect(response.body.game).toBeDefined();
      });
    });

    describe('400 Invalid Request', () => {
      it('should return 500 for undefined request body', async () => {
        const response = await supertest(app).post('/api/games/connectfour/create').send(undefined);

        expect(response.status).toEqual(500);
      });

      it('should return 400 for empty request body', async () => {
        const response = await supertest(app).post('/api/games/connectfour/create').send({});

        expect(response.status).toBe(500);
        expect(response.text).toContain('Creator ID is required');
      });

      it('should return 400 for missing playerID', async () => {
        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
          });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Creator ID is required');
      });

      it('should return 400 for missing roomSettings', async () => {
        const response = await supertest(app).post('/api/games/connectfour/create').send({
          playerID: 'player1',
        });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Room settings are required');
      });
    });

    describe('500 Server Error Request', () => {
      it('should return 500 if addGame fails', async () => {
        addGameSpy.mockResolvedValueOnce({ error: 'test error' });

        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
            playerID: 'player1',
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
          });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when creating Connect Four room: test error');
      });

      it('should return 500 if addGame throws an error', async () => {
        addGameSpy.mockRejectedValueOnce(new Error('test error'));

        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
            playerID: 'player1',
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
          });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when creating Connect Four room: test error');
      });

      it('should return 500 if game cannot be retrieved after creation', async () => {
        addGameSpy.mockResolvedValueOnce('testGameID');
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
            playerID: 'player1',
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
          });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Game was created but could not be retrieved');
      });
    });
  });

  describe('POST /connectfour/join', () => {
    const joinGameSpy = jest.spyOn(mockGameManager, 'joinGame');
    const getGameSpy = jest.spyOn(mockGameManager, 'getGame');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('200 OK Requests', () => {
      it('should join a Connect Four room successfully', async () => {
        const gameState: GameInstance<ConnectFourGameState> = {
          state: {
            status: 'IN_PROGRESS',
            board: Array(6)
              .fill(null)
              .map(() => Array(7).fill(null)),
            currentTurn: 'RED',
            moves: [],
            totalMoves: 0,
            player1: 'player1',
            player2: 'player2',
            player1Color: 'RED',
            player2Color: 'YELLOW',
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
            spectators: [],
          },
          gameID: '65e9b716ff0e892116b2de01',
          players: ['player1', 'player2'],
          gameType: 'Connect Four',
        };

        joinGameSpy.mockResolvedValueOnce(gameState);
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: '65e9b716ff0e892116b2de01',
          playerID: 'player2',
        });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith(
          '65e9b716ff0e892116b2de01',
          'player2',
          undefined,
          undefined,
        );
      });

      it('should join as spectator successfully', async () => {
        const gameState: GameInstance<ConnectFourGameState> = {
          state: {
            status: 'IN_PROGRESS',
            board: Array(6)
              .fill(null)
              .map(() => Array(7).fill(null)),
            currentTurn: 'RED',
            moves: [],
            totalMoves: 0,
            player1: 'player1',
            player2: 'player2',
            player1Color: 'RED',
            player2Color: 'YELLOW',
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
            spectators: ['spectator1'],
          },
          gameID: '65e9b716ff0e892116b2de01',
          players: ['player1', 'player2'],
          gameType: 'Connect Four',
        };

        joinGameSpy.mockResolvedValueOnce(gameState);
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: '65e9b716ff0e892116b2de01',
          playerID: 'spectator1',
          asSpectator: true,
        });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith(
          '65e9b716ff0e892116b2de01',
          'spectator1',
          undefined,
          true,
        );
      });

      it('should join private room with correct room code', async () => {
        const gameState: GameInstance<ConnectFourGameState> = {
          state: {
            status: 'IN_PROGRESS',
            board: Array(6)
              .fill(null)
              .map(() => Array(7).fill(null)),
            currentTurn: 'RED',
            moves: [],
            totalMoves: 0,
            player1: 'player1',
            player2: 'player2',
            player1Color: 'RED',
            player2Color: 'YELLOW',
            roomSettings: {
              roomName: 'Private Room',
              privacy: 'PRIVATE',
              allowSpectators: true,
              roomCode: 'ABC123',
            },
            spectators: [],
          },
          gameID: '65e9b716ff0e892116b2de01',
          players: ['player1', 'player2'],
          gameType: 'Connect Four',
        };

        joinGameSpy.mockResolvedValueOnce(gameState);
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: '65e9b716ff0e892116b2de01',
          playerID: 'player2',
          roomCode: 'ABC123',
        });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith(
          '65e9b716ff0e892116b2de01',
          'player2',
          'ABC123',
          undefined,
        );
      });

      it('should allow creator to rejoin their own game while it is waiting to start', async () => {
        const roomSettings: ConnectFourRoomSettings = {
          roomName: 'Test Room',
          privacy: 'PUBLIC',
          allowSpectators: true,
        };

        const existingGame = new ConnectFourGame('creator', roomSettings);
        existingGame.state.status = 'WAITING_TO_START';

        const gameState: GameInstance<ConnectFourGameState> = {
          state: existingGame.state as ConnectFourGameState,
          gameID: 'game123',
          players: ['creator'],
          gameType: 'Connect Four',
        };

        getGameSpy.mockReturnValueOnce(existingGame as unknown as ConnectFourGame);
        joinGameSpy.mockResolvedValueOnce(gameState);

        const res = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: 'game123',
          playerID: 'creator',
        });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith('game123', 'creator', undefined, undefined);
      });
    });

    describe('400 Invalid Request', () => {
      it('should return 400 for undefined request body', async () => {
        const response = await supertest(app).post('/api/games/connectfour/join').send(undefined);

        expect(response.status).toEqual(500);
      });

      it('should return 400 for missing gameID', async () => {
        const response = await supertest(app).post('/api/games/connectfour/join').send({
          playerID: 'player1',
        });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Game requested does not exist');
      });

      it('should return 400 for missing playerID', async () => {
        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: 'testGameID',
        });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Game requested does not exist');
      });
    });

    describe('500 Server Error Request', () => {
      it('should return 500 if player already in game', async () => {
        const mockGame = {
          state: {
            player1: 'player1',
            player2: 'player2',
            spectators: [],
          },
        } as unknown as ConnectFourGame;

        getGameSpy.mockReturnValueOnce(mockGame);

        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: '65e9b716ff0e892116b2de01',
          playerID: 'player1',
        });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Game requested does not exist');
      });

      it('should return 500 if player is already in the Connect Four game', async () => {
        const existingGame = {
          gameType: 'Connect Four',
          state: {
            status: 'IN_PROGRESS',
            player1: 'player1',
            player2: 'player2',
            spectators: [],
            roomSettings: {
              roomName: 'Test Room',
              privacy: 'PUBLIC',
              allowSpectators: true,
            },
          },
        } as unknown as ConnectFourGame;

        getGameSpy.mockReturnValueOnce(existingGame);

        const res = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: 'game123',
          playerID: 'player2',
        });

        expect(res.status).toBe(500);
        expect(res.text).toContain(
          'Error when joining Connect Four room: You are already in this game',
        );
        expect(joinGameSpy).not.toHaveBeenCalled();
      });

      it('should return 500 if joinGame fails', async () => {
        joinGameSpy.mockResolvedValueOnce({ error: 'test error' });
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: '65e9b716ff0e892116b2de01',
          playerID: 'player1',
        });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when joining Connect Four room: test error');
      });

      it('should return 500 if joinGame throws an error', async () => {
        joinGameSpy.mockRejectedValueOnce(new Error('test error'));
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app).post('/api/games/connectfour/join').send({
          gameID: '65e9b716ff0e892116b2de01',
          playerID: 'player1',
        });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when joining Connect Four room: test error');
      });
    });
  });

  describe('POST /connectfour/join-by-code', () => {
    const joinGameSpy = jest.spyOn(mockGameManager, 'joinGame');
    const getActiveGameInstancesSpy = jest.spyOn(mockGameManager, 'getActiveGameInstances');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('200 OK Requests', () => {
      it('should join room by code successfully', async () => {
        const mockGame = {
          id: 'gameID123',
          state: {
            roomSettings: {
              privacy: 'PRIVATE',
              roomCode: 'ABC123',
            },
            player1: 'creator',
            player2: undefined,
            spectators: [],
          },
          gameType: 'Connect Four',
        } as unknown as ConnectFourGame;

        const gameState: GameInstance<ConnectFourGameState> = {
          state: {
            status: 'IN_PROGRESS',
            board: Array(6)
              .fill(null)
              .map(() => Array(7).fill(null)),
            currentTurn: 'RED',
            moves: [],
            totalMoves: 0,
            player1: 'creator',
            player2: 'player1',
            player1Color: 'RED',
            player2Color: 'YELLOW',
            roomSettings: {
              roomName: 'Private Room',
              privacy: 'PRIVATE',
              allowSpectators: true,
              roomCode: 'ABC123',
            },
            spectators: [],
          },
          gameID: 'gameID123',
          players: ['creator', 'player1'],
          gameType: 'Connect Four',
        };

        getActiveGameInstancesSpy.mockReturnValueOnce([mockGame]);
        joinGameSpy.mockResolvedValueOnce(gameState);

        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'ABC123',
          playerID: 'player1',
        });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith('gameID123', 'player1', 'ABC123', undefined);
      });

      it('should join room by code as spectator', async () => {
        const mockGame = {
          id: 'gameID123',
          state: {
            roomSettings: {
              privacy: 'PRIVATE',
              roomCode: 'ABC123',
            },
            player1: 'creator',
            player2: 'player2',
            spectators: [],
          },
          gameType: 'Connect Four',
        } as unknown as ConnectFourGame;

        const gameState: GameInstance<ConnectFourGameState> = {
          state: {
            status: 'IN_PROGRESS',
            board: Array(6)
              .fill(null)
              .map(() => Array(7).fill(null)),
            currentTurn: 'RED',
            moves: [],
            totalMoves: 0,
            player1: 'creator',
            player2: 'player2',
            player1Color: 'RED',
            player2Color: 'YELLOW',
            roomSettings: {
              roomName: 'Private Room',
              privacy: 'PRIVATE',
              allowSpectators: true,
              roomCode: 'ABC123',
            },
            spectators: ['spectator1'],
          },
          gameID: 'gameID123',
          players: ['creator', 'player2'],
          gameType: 'Connect Four',
        };

        getActiveGameInstancesSpy.mockReturnValueOnce([mockGame]);
        joinGameSpy.mockResolvedValueOnce(gameState);

        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'ABC123',
          playerID: 'spectator1',
          asSpectator: true,
        });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith('gameID123', 'spectator1', 'ABC123', true);
      });
    });

    describe('400 Bad Request', () => {
      it('should return 400 for missing roomCode', async () => {
        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          playerID: 'player1',
        });

        expect(response.status).toEqual(400);
        expect(response.text).toContain('roomCode and playerID are required');
      });

      it('should return 400 for missing playerID', async () => {
        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'ABC123',
        });

        expect(response.status).toEqual(400);
        expect(response.text).toContain('roomCode and playerID are required');
      });
    });

    describe('404 Not Found', () => {
      it('should return 404 for non-existent room code', async () => {
        getActiveGameInstancesSpy.mockReturnValueOnce([]);

        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'NONEXISTENT',
          playerID: 'player1',
        });

        expect(response.status).toEqual(404);
        expect(response.text).toContain('Room not found');
      });

      it('should return 404 for public room code', async () => {
        const mockGame = {
          state: {
            roomSettings: {
              privacy: 'PUBLIC',
              roomCode: undefined,
            },
          },
          gameType: 'Connect Four',
        } as unknown as ConnectFourGame;

        getActiveGameInstancesSpy.mockReturnValueOnce([mockGame]);

        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'ABC123',
          playerID: 'player1',
        });

        expect(response.status).toEqual(404);
        expect(response.text).toContain('Room not found');
      });
    });

    describe('500 Server Error', () => {
      it('should return 500 if player already in game', async () => {
        const mockGame = {
          id: 'gameID123',
          state: {
            roomSettings: {
              privacy: 'PRIVATE',
              roomCode: 'ABC123',
            },
            player1: 'player1',
            player2: undefined,
            spectators: [],
          },
          gameType: 'Connect Four',
        } as unknown as ConnectFourGame;

        getActiveGameInstancesSpy.mockReturnValueOnce([mockGame]);

        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'ABC123',
          playerID: 'player1',
        });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('You are already in this game');
      });

      it('should return 500 if joinGame fails', async () => {
        const mockGame = {
          id: 'gameID123',
          state: {
            roomSettings: {
              privacy: 'PRIVATE',
              roomCode: 'ABC123',
            },
            player1: 'creator',
            player2: undefined,
            spectators: [],
          },
          gameType: 'Connect Four',
        } as unknown as ConnectFourGame;

        getActiveGameInstancesSpy.mockReturnValueOnce([mockGame]);
        joinGameSpy.mockResolvedValueOnce({ error: 'test error' });

        const response = await supertest(app).post('/api/games/connectfour/join-by-code').send({
          roomCode: 'ABC123',
          playerID: 'player1',
        });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when joining by code: test error');
      });
    });
  });

  describe('GET /connectfour/:gameID', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return public room info for an existing Connect Four game', async () => {
      const publicInfo = { id: 'game123', roomName: 'Test Room' };

      const mockGame = {
        gameType: 'Connect Four',
        state: {
          status: 'WAITING_TO_START',
          roomSettings: {
            roomName: 'Test Room',
            privacy: 'PUBLIC',
            allowSpectators: true,
          },
        },
        getPublicRoomInfo: jest.fn().mockReturnValue(publicInfo),
      } as unknown as ConnectFourGame;

      jest.spyOn(mockGameManager, 'getGame').mockReturnValueOnce(mockGame);

      const res = await supertest(app).get('/api/games/connectfour/game123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(publicInfo);
      expect(mockGame.getPublicRoomInfo).toHaveBeenCalled();
    });

    it('should return 500 when Connect Four game is not found', async () => {
      jest.spyOn(mockGameManager, 'getGame').mockReturnValueOnce(undefined);

      const res = await supertest(app).get('/api/games/connectfour/missing');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting room: Connect Four game not found');
    });
  });

  describe('GET /games (Connect Four rooms)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return public and friends-only Connect Four rooms for a user and their friends', async () => {
      const publicRoomInfo = { id: 'public', roomName: 'Public Room' };
      const friendsRoomInfo = { id: 'friends', roomName: 'Friends Room' };

      const publicGame = {
        gameType: 'Connect Four',
        state: {
          roomSettings: {
            privacy: 'PUBLIC',
            roomName: 'Public Room',
            allowSpectators: true,
          },
          player1: 'publicCreator',
          spectators: [],
        },
        getPublicRoomInfo: jest.fn().mockReturnValue(publicRoomInfo),
      } as unknown as ConnectFourGame;

      const friendsOnlyGame = {
        gameType: 'Connect Four',
        state: {
          roomSettings: {
            privacy: 'FRIENDS_ONLY',
            roomName: 'Friends Room',
            allowSpectators: true,
          },
          player1: 'friendCreator',
          spectators: [],
        },
        getPublicRoomInfo: jest.fn().mockReturnValue(friendsRoomInfo),
      } as unknown as ConnectFourGame;

      const privateGame = {
        gameType: 'Connect Four',
        state: {
          roomSettings: {
            privacy: 'PRIVATE',
            roomName: 'Private Room',
            allowSpectators: false,
          },
          player1: 'privateCreator',
          spectators: [],
        },
        getPublicRoomInfo: jest.fn(),
      } as unknown as ConnectFourGame;

      jest
        .spyOn(mockGameManager, 'getActiveGameInstances')
        .mockReturnValueOnce([publicGame, friendsOnlyGame, privateGame]);

      (userService.getRelations as jest.Mock).mockResolvedValueOnce({
        friends: ['friendCreator'],
      });

      const res = await supertest(app)
        .get('/api/games/games')
        .query({ gameType: 'Connect Four', username: 'alice' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([publicRoomInfo, friendsRoomInfo]);
      expect(userService.getRelations).toHaveBeenCalledWith('alice');
    });

    it('should handle errors from getPublicConnectFourRooms and return empty array', async () => {
      jest.spyOn(mockGameManager, 'getActiveGameInstances').mockImplementation(() => {
        throw new Error('boom');
      });

      const res = await supertest(app).get('/api/games/games').query({ gameType: 'Connect Four' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle errors when fetching friends list and still return public rooms', async () => {
      const publicRoomInfo = { id: 'public', roomName: 'Public Room' };

      const publicGame = {
        gameType: 'Connect Four',
        state: {
          roomSettings: {
            privacy: 'PUBLIC',
            roomName: 'Public Room',
            allowSpectators: true,
          },
          player1: 'publicCreator',
          spectators: [],
        },
        getPublicRoomInfo: jest.fn().mockReturnValue(publicRoomInfo),
      } as unknown as ConnectFourGame;

      jest.spyOn(mockGameManager, 'getActiveGameInstances').mockReturnValueOnce([publicGame]);

      (userService.getRelations as jest.Mock).mockRejectedValueOnce(
        new Error('friends fetch failed'),
      );

      const res = await supertest(app)
        .get('/api/games/games')
        .query({ gameType: 'Connect Four', username: 'alice' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([publicRoomInfo]);
    });
  });

  describe('Socket Event Tests', () => {
    let httpServer: HTTPServer;
    let io: FakeSOSocket;
    let clientSocket: ClientSocket;
    let serverSocket: ServerSocket;

    let mockConnectFourGame: ConnectFourGame;
    let getGameSpy: jest.SpyInstance;
    let applyMoveSpy: jest.SpyInstance;
    let toModelSpy: jest.SpyInstance;
    let saveGameStateSpy: jest.SpyInstance;
    let removeGameSpy: jest.SpyInstance;
    let serverPort: number;

    beforeAll(done => {
      httpServer = createServer();
      io = new Server(httpServer);
      gameController(io);

      httpServer.listen(() => {
        const { port } = httpServer.address() as AddressInfo;
        serverPort = port;
        clientSocket = Client(`http://localhost:${port}`);
        io.on('connection', socket => {
          serverSocket = socket;
        });

        clientSocket.on('connect', done);
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();

      mockConnectFourGame = new ConnectFourGame('player1', {
        roomName: 'Test Room',
        privacy: 'PUBLIC',
        allowSpectators: true,
      });
      mockConnectFourGame.join('player2');

      getGameSpy = jest.spyOn(mockGameManager, 'getGame');
      applyMoveSpy = jest.spyOn(mockConnectFourGame, 'applyMove');
      toModelSpy = jest.spyOn(mockConnectFourGame, 'toModel').mockReturnValue({
        state: {
          status: 'IN_PROGRESS',
          board: Array(6)
            .fill(null)
            .map(() => Array(7).fill(null)),
          currentTurn: 'RED',
          moves: [],
          totalMoves: 1,
          player1: 'player1',
          player2: 'player2',
          player1Color: 'RED',
          player2Color: 'YELLOW',
          roomSettings: {
            roomName: 'Test Room',
            privacy: 'PUBLIC',
            allowSpectators: true,
          },
          spectators: [],
        },
        gameID: 'game123',
        players: ['player1', 'player2'],
        gameType: 'Connect Four',
      });

      saveGameStateSpy = jest
        .spyOn(mockConnectFourGame, 'saveGameState')
        .mockResolvedValue(undefined);
      removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');
    });

    afterAll(done => {
      clientSocket.removeAllListeners();
      clientSocket.disconnect();
      if (serverSocket) {
        serverSocket.removeAllListeners();
        serverSocket.disconnect();
      }
      io.close();
      httpServer.close(() => done());
    });

    it('should join a Connect Four game when "joinGame" event is emitted', async () => {
      const joinGameEvent = new Promise(resolve => {
        serverSocket.once('joinGame', arg => {
          expect(io.sockets.adapter.rooms.has('game123')).toBeTruthy();
          resolve(arg);
        });
      });

      clientSocket.emit('joinGame', 'game123');

      const joinGameArg = await joinGameEvent;
      expect(joinGameArg).toBe('game123');
    });

    it('should emit a "gameUpdate" event when a valid Connect Four move is made', async () => {
      getGameSpy.mockReturnValue(mockConnectFourGame);
      const gameMovePayload = {
        playerID: 'player1',
        gameID: 'game123',
        move: { column: 3 },
      };

      const joinGameEvent = new Promise(resolve => {
        serverSocket.once('joinGame', arg => {
          resolve(arg);
        });
      });

      const makeMoveEvent = new Promise(resolve => {
        serverSocket.once('makeMove', arg => {
          resolve(arg);
        });
      });

      const gameUpdateEvent = new Promise(resolve => {
        clientSocket.once('gameUpdate', arg => {
          resolve(arg);
        });
      });

      clientSocket.emit('joinGame', 'game123');
      clientSocket.emit('makeMove', gameMovePayload);

      const [joinMoveArg, makeMoveArg, gameUpdateArg] = await Promise.all([
        joinGameEvent,
        makeMoveEvent,
        gameUpdateEvent,
      ]);

      expect(joinMoveArg).toBe('game123');
      expect(makeMoveArg).toStrictEqual(gameMovePayload);
      expect(gameUpdateArg).toHaveProperty('gameInstance');
      expect(getGameSpy).toHaveBeenCalledWith('game123');
      expect(applyMoveSpy).toHaveBeenCalledWith({ column: 3 });
      expect(toModelSpy).toHaveBeenCalled();
      expect(removeGameSpy).not.toHaveBeenCalled();
    });

    it('should remove the game if Connect Four game ends after a move', async () => {
      getGameSpy.mockReturnValue(mockConnectFourGame);
      applyMoveSpy.mockImplementation(() => {
        mockConnectFourGame.state.status = 'OVER';
        mockConnectFourGame.state.winners = ['player1'];
      });

      const gameMovePayload = {
        playerID: 'player1',
        gameID: 'game123',
        move: { column: 3 },
      };

      const joinGameEvent = new Promise(resolve => {
        serverSocket.once('joinGame', arg => {
          resolve(arg);
        });
      });

      const makeMoveEvent = new Promise(resolve => {
        serverSocket.once('makeMove', arg => {
          resolve(arg);
        });
      });

      const gameUpdateEvent = new Promise(resolve => {
        clientSocket.once('gameUpdate', arg => {
          resolve(arg);
        });
      });

      clientSocket.emit('joinGame', 'game123');
      clientSocket.emit('makeMove', gameMovePayload);

      const [joinMoveArg, makeMoveArg, gameUpdateArg] = await Promise.all([
        joinGameEvent,
        makeMoveEvent,
        gameUpdateEvent,
      ]);

      expect(joinMoveArg).toBe('game123');
      expect(makeMoveArg).toStrictEqual(gameMovePayload);
      expect(gameUpdateArg).toHaveProperty('gameInstance');
      expect(getGameSpy).toHaveBeenCalledWith('game123');
      expect(applyMoveSpy).toHaveBeenCalledWith({ column: 3 });
      expect(toModelSpy).toHaveBeenCalled();
      expect(saveGameStateSpy).toHaveBeenCalled();
      expect(removeGameSpy).toHaveBeenCalledWith('game123');
    });

    it('should emit "gameError" event when Connect Four game does not exist', async () => {
      getGameSpy.mockReturnValue(undefined);
      const gameMovePayload = {
        playerID: 'player1',
        gameID: 'nonexistent',
        move: { column: 3 },
      };

      const makeMoveEvent = new Promise(resolve => {
        serverSocket.once('makeMove', arg => {
          resolve(arg);
        });
      });

      const gameUpdateEvent = new Promise<void>((resolve, reject) => {
        clientSocket.once('gameUpdate', reject);
        resolve();
      });

      const gameErrorEvent = new Promise(resolve => {
        clientSocket.once('gameError', arg => {
          resolve(arg);
        });
      });

      clientSocket.emit('joinGame', 'nonexistent');
      clientSocket.emit('makeMove', gameMovePayload);

      const [makeMoveArg, , gameErrorArg] = await Promise.all([
        makeMoveEvent,
        gameUpdateEvent,
        gameErrorEvent,
      ]);

      expect(makeMoveArg).toStrictEqual(gameMovePayload);
      expect(gameErrorArg).toStrictEqual({
        error: 'Game requested does not exist',
      });
      expect(getGameSpy).toHaveBeenCalledWith('nonexistent');
      expect(applyMoveSpy).not.toHaveBeenCalled();
      expect(toModelSpy).not.toHaveBeenCalled();
      expect(saveGameStateSpy).not.toHaveBeenCalled();
      expect(removeGameSpy).not.toHaveBeenCalled();
    });

    it('should emit "gameError" event for invalid Connect Four move', async () => {
      getGameSpy.mockReturnValue(mockConnectFourGame);
      applyMoveSpy.mockImplementation(() => {
        throw new Error('Invalid move: column is full');
      });

      const gameMovePayload = {
        playerID: 'player1',
        gameID: 'game123',
        move: { column: 0 },
      };

      const makeMoveEvent = new Promise(resolve => {
        serverSocket.once('makeMove', arg => {
          resolve(arg);
        });
      });

      const gameErrorEvent = new Promise(resolve => {
        clientSocket.once('gameError', arg => {
          resolve(arg);
        });
      });

      clientSocket.emit('joinGame', 'game123');
      clientSocket.emit('makeMove', gameMovePayload);

      const [makeMoveArg, gameErrorArg] = await Promise.all([makeMoveEvent, gameErrorEvent]);

      expect(makeMoveArg).toStrictEqual(gameMovePayload);
      expect(gameErrorArg).toStrictEqual({
        error: 'Invalid move: column is full',
      });
      expect(getGameSpy).toHaveBeenCalledWith('game123');
      expect(applyMoveSpy).toHaveBeenCalledWith({ column: 0 });
      expect(saveGameStateSpy).not.toHaveBeenCalled();
      expect(removeGameSpy).not.toHaveBeenCalled();
    });

    describe('Presence tracking and disconnect cleanup', () => {
      it('should call leaveGame when "leaveGame" event is emitted', async () => {
        const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');

        const leaveHandled = new Promise<void>(resolve => {
          leaveGameSpy.mockImplementation(async (gameID, playerID, isSpectator) => {
            resolve();
            return mockConnectFourGame.toModel();
          });
        });

        const leavePayload = { gameID: 'game123', playerID: 'player1', isSpectator: false };
        clientSocket.emit('leaveGame', leavePayload);

        await leaveHandled;

        expect(leaveGameSpy).toHaveBeenCalledWith('game123', 'player1', false);
      });

      it('should emit "gameError" when leaveGame fails', async () => {
        jest.spyOn(mockGameManager, 'leaveGame').mockRejectedValue(new Error('leave failure'));

        const gameErrorEvent = new Promise(resolve => {
          clientSocket.once('gameError', arg => resolve(arg));
        });

        const leavePayload = { gameID: 'game999', playerID: 'player2', isSpectator: true };
        clientSocket.emit('leaveGame', leavePayload);

        const errorPayload = await gameErrorEvent;

        expect(errorPayload).toStrictEqual({
          player: 'player2',
          error: 'leave failure',
        });
      });

      it('should swallow non-throwing errors from leaveGame (result with error field)', async () => {
        const leaveHandled = new Promise<void>(resolve => {
          jest
            .spyOn(mockGameManager, 'leaveGame')
            .mockImplementation(async (gameID, playerID, isSpectator) => {
              resolve();
              return { error: 'cannot leave' };
            });
        });

        const leavePayload = { gameID: 'game123', playerID: 'player1', isSpectator: false };

        clientSocket.emit('leaveGame', leavePayload);
        await leaveHandled;

        expect(mockGameManager.leaveGame).toHaveBeenCalledWith('game123', 'player1', false);
      });

      it('should auto-leave active Connect Four players on disconnect', async () => {
        mockConnectFourGame.state.status = 'IN_PROGRESS';
        getGameSpy.mockReturnValue(mockConnectFourGame);

        const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');
        const leaveHandled = new Promise<{
          gameID: string;
          playerID: string;
          isSpectator?: boolean;
        }>(resolve => {
          leaveGameSpy.mockImplementation(async (gameID, playerID, isSpectator) => {
            resolve({ gameID, playerID, isSpectator });
            return mockConnectFourGame.toModel();
          });
        });

        const originalServerSocket = serverSocket;
        const newConnectionPromise = new Promise<ServerSocket>(resolve => {
          io.once('connection', socket => resolve(socket));
        });
        const tempClient = Client(`http://localhost:${serverPort}`);
        const tempServerSocket = await newConnectionPromise;
        await new Promise<void>(resolve => {
          tempClient.once('connect', () => resolve());
        });

        tempClient.emit('registerPresence', {
          gameID: 'game123',
          playerID: 'player1',
          isSpectator: false,
        });
        await new Promise(resolve => {
          tempServerSocket.once('registerPresence', resolve);
        });

        tempServerSocket.disconnect(true);
        await new Promise<void>(resolve => {
          tempClient.once('disconnect', () => resolve());
        });

        const leaveArgs = await leaveHandled;
        expect(leaveArgs).toStrictEqual({
          gameID: 'game123',
          playerID: 'player1',
          isSpectator: false,
        });
        expect(getGameSpy).toHaveBeenCalledWith('game123');

        tempClient.removeAllListeners();
        tempServerSocket.removeAllListeners();
        if (originalServerSocket) {
          serverSocket = originalServerSocket;
        }
      });

      it('should clean up spectators on disconnect without forcing wins', async () => {
        mockConnectFourGame.state.status = 'IN_PROGRESS';
        getGameSpy.mockReturnValue(mockConnectFourGame);

        const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');
        const leaveHandled = new Promise<boolean | undefined>(resolve => {
          leaveGameSpy.mockImplementation(async (gameID, playerID, isSpectator) => {
            resolve(isSpectator);
            return mockConnectFourGame.toModel();
          });
        });

        const originalServerSocket = serverSocket;
        const newConnectionPromise = new Promise<ServerSocket>(resolve => {
          io.once('connection', socket => resolve(socket));
        });
        const tempClient = Client(`http://localhost:${serverPort}`);
        const tempServerSocket = await newConnectionPromise;
        await new Promise<void>(resolve => {
          tempClient.once('connect', () => resolve());
        });

        tempClient.emit('registerPresence', {
          gameID: 'game123',
          playerID: 'spectator1',
          isSpectator: true,
        });
        await new Promise(resolve => {
          tempServerSocket.once('registerPresence', resolve);
        });

        tempServerSocket.disconnect(true);
        await new Promise<void>(resolve => {
          tempClient.once('disconnect', () => resolve());
        });

        const spectatorFlag = await leaveHandled;
        expect(spectatorFlag).toBe(true);

        tempClient.removeAllListeners();
        tempServerSocket.removeAllListeners();
        if (originalServerSocket) {
          serverSocket = originalServerSocket;
        }
      });

      it('should perform a normal leave on disconnect when Connect Four game is not in progress', async () => {
        mockConnectFourGame.state.status = 'WAITING_TO_START';
        getGameSpy.mockReturnValue(mockConnectFourGame);

        const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');
        const leaveHandled = new Promise<{
          gameID: string;
          playerID: string;
          isSpectator?: boolean;
        }>(resolve => {
          leaveGameSpy.mockImplementation(async (gameID, playerID, isSpectator) => {
            resolve({ gameID, playerID, isSpectator });
            return mockConnectFourGame.toModel();
          });
        });

        const originalServerSocket = serverSocket;
        const newConnectionPromise = new Promise<ServerSocket>(resolve => {
          io.once('connection', socket => resolve(socket));
        });
        const tempClient = Client(`http://localhost:${serverPort}`);
        const tempServerSocket = await newConnectionPromise;

        await new Promise<void>(resolve => {
          tempClient.once('connect', () => resolve());
        });

        tempClient.emit('registerPresence', {
          gameID: 'game123',
          playerID: 'player1',
          isSpectator: false,
        });
        await new Promise(resolve => {
          tempServerSocket.once('registerPresence', resolve);
        });

        tempServerSocket.disconnect(true);
        await new Promise<void>(resolve => {
          tempClient.once('disconnect', () => resolve());
        });

        const leaveArgs = await leaveHandled;
        expect(leaveArgs).toStrictEqual({
          gameID: 'game123',
          playerID: 'player1',
          isSpectator: false,
        });
        expect(getGameSpy).toHaveBeenCalledWith('game123');

        tempClient.removeAllListeners();
        tempServerSocket.removeAllListeners();
        if (originalServerSocket) {
          serverSocket = originalServerSocket;
        }
      });

      it('should ignore errors thrown during disconnect cleanup', async () => {
        mockConnectFourGame.state.status = 'IN_PROGRESS';
        getGameSpy.mockReturnValue(mockConnectFourGame);

        const leaveGameSpy = jest
          .spyOn(mockGameManager, 'leaveGame')
          .mockRejectedValue(new Error('disconnect cleanup failed'));

        const originalServerSocket = serverSocket;
        const newConnectionPromise = new Promise<ServerSocket>(resolve => {
          io.once('connection', socket => resolve(socket));
        });
        const tempClient = Client(`http://localhost:${serverPort}`);
        const tempServerSocket = await newConnectionPromise;

        await new Promise<void>(resolve => {
          tempClient.once('connect', () => resolve());
        });

        tempClient.emit('registerPresence', {
          gameID: 'game123',
          playerID: 'player1',
          isSpectator: false,
        });
        await new Promise(resolve => {
          tempServerSocket.once('registerPresence', resolve);
        });

        tempServerSocket.disconnect(true);
        await new Promise<void>(resolve => {
          tempClient.once('disconnect', () => resolve());
        });

        expect(leaveGameSpy).toHaveBeenCalledWith('game123', 'player1', false);

        tempClient.removeAllListeners();
        tempServerSocket.removeAllListeners();
        if (originalServerSocket) {
          serverSocket = originalServerSocket;
        }
      });
    });

    describe('Connect Four lobby room updates', () => {
      it('should send visible rooms list on socket connect and on requestConnectFourRooms', async () => {
        const publicRoomInfo = { id: 'public', roomName: 'Public Room' };
        const friendsRoomInfo = { id: 'friends', roomName: 'Friends Room' };

        const publicGame = {
          gameType: 'Connect Four',
          state: {
            roomSettings: {
              privacy: 'PUBLIC',
              roomName: 'Public Room',
              allowSpectators: true,
            },
            player1: 'publicCreator',
            spectators: [],
          },
          getPublicRoomInfo: jest.fn().mockReturnValue(publicRoomInfo),
        } as unknown as ConnectFourGame;

        const friendsOnlyGame = {
          gameType: 'Connect Four',
          state: {
            roomSettings: {
              privacy: 'FRIENDS_ONLY',
              roomName: 'Friends Room',
              allowSpectators: true,
            },
            player1: 'friendCreator',
            spectators: [],
          },
          getPublicRoomInfo: jest.fn().mockReturnValue(friendsRoomInfo),
        } as unknown as ConnectFourGame;

        jest
          .spyOn(mockGameManager, 'getActiveGameInstances')
          .mockReturnValue([publicGame, friendsOnlyGame]);

        (userService.getRelations as jest.Mock).mockResolvedValue({
          friends: ['friendCreator'],
        });

        const originalServerSocket = serverSocket;

        const newConnectionPromise = new Promise<ServerSocket>(resolve => {
          io.once('connection', socket => resolve(socket));
        });

        const tempClient = Client(`http://localhost:${serverPort}`, {
          query: { username: 'alice' },
        });

        const roomsOnConnectPromise = new Promise<any[]>(resolve => {
          tempClient.once('connectFourRoomsUpdate', data => resolve(data));
        });

        const tempServerSocket = await newConnectionPromise;
        const roomsOnConnect = await roomsOnConnectPromise;

        expect(roomsOnConnect).toEqual([publicRoomInfo, friendsRoomInfo]);

        const roomsOnRequestPromise = new Promise<any[]>(resolve => {
          tempClient.once('connectFourRoomsUpdate', data => resolve(data));
        });

        tempClient.emit('requestConnectFourRooms');
        const roomsOnRequest = await roomsOnRequestPromise;

        expect(roomsOnRequest).toEqual([publicRoomInfo, friendsRoomInfo]);

        // ✅ Make sure we fully disconnect this temp client so Jest doesn't keep a TCP handle open
        const disconnectPromise = new Promise<void>(resolve => {
          tempClient.once('disconnect', () => resolve());
        });
        tempClient.disconnect();
        await disconnectPromise;

        tempClient.removeAllListeners();
        tempServerSocket.removeAllListeners();
        if (originalServerSocket) {
          serverSocket = originalServerSocket;
        }
      });
    });
  });
});
