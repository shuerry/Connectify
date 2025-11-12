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

        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
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
        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send(undefined);

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
        const response = await supertest(app)
          .post('/api/games/connectfour/create')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
            gameID: '65e9b716ff0e892116b2de01',
            playerID: 'player2',
          });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith('65e9b716ff0e892116b2de01', 'player2', undefined, undefined);
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
            gameID: '65e9b716ff0e892116b2de01',
            playerID: 'spectator1',
            asSpectator: true,
          });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith('65e9b716ff0e892116b2de01', 'spectator1', undefined, true);
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
            gameID: '65e9b716ff0e892116b2de01',
            playerID: 'player2',
            roomCode: 'ABC123',
          });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(gameState);
        expect(joinGameSpy).toHaveBeenCalledWith('65e9b716ff0e892116b2de01', 'player2', 'ABC123', undefined);
      });
    });

    describe('400 Invalid Request', () => {
      it('should return 400 for undefined request body', async () => {
        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send(undefined);

        expect(response.status).toEqual(500);
      });

      it('should return 400 for missing gameID', async () => {
        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
            playerID: 'player1',
          });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Game requested does not exist');
      });

      it('should return 400 for missing playerID', async () => {
        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
            gameID: '65e9b716ff0e892116b2de01',
            playerID: 'player1',
          });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Game requested does not exist');
      });

      it('should return 500 if joinGame fails', async () => {
        joinGameSpy.mockResolvedValueOnce({ error: 'test error' });
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
            gameID: '65e9b716ff0e892116b2de01',
            playerID: 'player1',
          });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when joining Connect Four room: test error');
      });

      it('should return 500 if joinGame throws an error', async () => {
        joinGameSpy.mockRejectedValueOnce(new Error('test error'));
        getGameSpy.mockReturnValueOnce(undefined);

        const response = await supertest(app)
          .post('/api/games/connectfour/join')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
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
        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
            playerID: 'player1',
          });

        expect(response.status).toEqual(400);
        expect(response.text).toContain('roomCode and playerID are required');
      });

      it('should return 400 for missing playerID', async () => {
        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
            roomCode: 'ABC123',
          });

        expect(response.status).toEqual(400);
        expect(response.text).toContain('roomCode and playerID are required');
      });
    });

    describe('404 Not Found', () => {
      it('should return 404 for non-existent room code', async () => {
        getActiveGameInstancesSpy.mockReturnValueOnce([]);

        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
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

        const response = await supertest(app)
          .post('/api/games/connectfour/join-by-code')
          .send({
            roomCode: 'ABC123',
            playerID: 'player1',
          });

        expect(response.status).toEqual(500);
        expect(response.text).toContain('Error when joining by code: test error');
      });
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

    beforeAll(done => {
      httpServer = createServer();
      io = new Server(httpServer);
      gameController(io);

      httpServer.listen(() => {
        const { port } = httpServer.address() as AddressInfo;
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

      saveGameStateSpy = jest.spyOn(mockConnectFourGame, 'saveGameState').mockResolvedValue(undefined);
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
        move: { column: 0 }, // Assume column 0 is full
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
  });
});