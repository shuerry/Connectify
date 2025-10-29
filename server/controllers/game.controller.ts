import express, { Response } from 'express';
import {
  FakeSOSocket,
  CreateGameRequest,
  GameMovePayload,
  GameRequest,
  GetGamesRequest,
  CreateConnectFourRoomRequest,
  JoinConnectFourRoomRequest,
  GameInstanceID,
} from '../types/types';
import findGames from '../services/game.service';
import GameManager from '../services/games/gameManager';
import ConnectFourGame from '../services/games/connectFour';

/**
 * Express controller for handling game-related requests,
 * including creating, joining, leaving games, and fetching games.
 * @param socket The socket instance used for emitting game updates and errors.
 * @returns An Express router with endpoints for game actions.
 */
const gameController = (socket: FakeSOSocket) => {
  const router = express.Router();

  //  gather public Connect Four rooms from memory
  const getPublicConnectFourRooms = () => {
    const activeInstances = GameManager.getInstance()
      .getActiveGameInstances()
      .filter(g => g.gameType === 'Connect Four') as unknown as ConnectFourGame[];

    return activeInstances
      .filter(g => g.state.roomSettings.privacy === 'PUBLIC')
      .map(g => g.getPublicRoomInfo());
  };

  // broadcast current public Connect Four rooms to all clients
  const broadcastConnectFourRooms = () => {
    const rooms = getPublicConnectFourRooms();
    socket.emit('connectFourRoomsUpdate', rooms);
  };

  /**
   * Creates a new game based on the provided game type and responds with the created game or an error message.
   * @param req The request object containing the game type.
   * @param res The response object to send the result.
   */
  const createGame = async (req: CreateGameRequest, res: Response) => {
    try {
      const { gameType } = req.body;

      const newGame = await GameManager.getInstance().addGame(gameType);

      if (typeof newGame !== 'string') {
        throw new Error(newGame.error);
      }

      res.status(200).json(newGame);
    } catch (error) {
      res.status(500).send(`Error when creating game: ${(error as Error).message}`);
    }
  };

  /**
   * Creates a new Connect Four room with custom settings.
   * @param req The request object containing the room settings.
   * @param res The response object to send the result.
   */
  const createConnectFourRoom = async (req: CreateConnectFourRoomRequest, res: Response) => {
    try {
      const { playerID, roomSettings } = req.body;

      const newGameID = await GameManager.getInstance().addGame(
        'Connect Four',
        playerID,
        roomSettings,
      );

      if (typeof newGameID !== 'string') {
        throw new Error(newGameID.error);
      }

      const game = GameManager.getInstance().getGame(newGameID);
      if (!game) {
        throw new Error('Game was created but could not be retrieved');
      }

      res.status(200).json({
        gameID: newGameID,
        roomCode: (game as unknown as ConnectFourGame).state.roomSettings.roomCode,
        game: game.toModel(),
      });

      // Notify lobby clients about updated public rooms
      broadcastConnectFourRooms();
    } catch (error) {
      res.status(500).send(`Error when creating Connect Four room: ${(error as Error).message}`);
    }
  };

  /**
   * Joins a game with the specified game ID and player ID, and emits the updated game state.
   * @param req The request object containing the game ID and player ID.
   * @param res The response object to send the result.
   */
  const joinGame = async (req: GameRequest, res: Response) => {
    try {
      const { gameID, playerID } = req.body;

      const game = await GameManager.getInstance().joinGame(gameID, playerID);

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);
    } catch (error) {
      res.status(500).send(`Error when joining game: ${(error as Error).message}`);
    }
  };

  /**
   * Joins a Connect Four room with optional room code and spectator mode.
   * @param req The request object containing the game ID, player ID, and optional parameters.
   * @param res The response object to send the result.
   */
  const joinConnectFourRoom = async (req: JoinConnectFourRoomRequest, res: Response) => {
    try {
      const { gameID, playerID, roomCode, asSpectator } = req.body;

      const game = await GameManager.getInstance().joinGame(
        gameID,
        playerID,
        roomCode,
        asSpectator,
      );

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);

      // Lobby update (public rooms list may change status/player counts)
      broadcastConnectFourRooms();
    } catch (error) {
      res.status(500).send(`Error when joining Connect Four room: ${(error as Error).message}`);
    }
  };

  /**
   * Joins a Connect Four room using a private room code.
   * @param req The request object containing the room code, player ID, and optional spectator flag.
   * @param res The response object to send the result.
   */
  const joinConnectFourRoomByCode = async (
    req: express.Request<
      unknown,
      unknown,
      { roomCode: string; playerID: string; asSpectator?: boolean }
    >,
    res: Response,
  ) => {
    try {
      const { roomCode, playerID, asSpectator } = req.body;

      if (!roomCode || !playerID) {
        res.status(400).send('roomCode and playerID are required');
        return;
      }

      const activeInstances = GameManager.getInstance()
        .getActiveGameInstances()
        .filter(g => g.gameType === 'Connect Four') as unknown as ConnectFourGame[];

      const match = activeInstances.find(
        g =>
          g.state.roomSettings.privacy !== 'PUBLIC' && g.state.roomSettings.roomCode === roomCode,
      );

      if (!match) {
        res.status(404).send('Room not found');
        return;
      }

      const gameID = match.id as GameInstanceID;

      const game = await GameManager.getInstance().joinGame(
        gameID,
        playerID,
        roomCode,
        asSpectator,
      );

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);

      // Update lobby clients in case player counts or statuses changed
      broadcastConnectFourRooms();
    } catch (error) {
      res.status(500).send(`Error when joining by code: ${(error as Error).message}`);
    }
  };

  /**
   * Leaves the game with the specified game ID and player ID, and emits the updated game state.
   * @param req The request object containing the game ID and player ID.
   * @param res The response object to send the result.
   */
  const leaveGame = async (req: GameRequest, res: Response) => {
    try {
      const { gameID, playerID } = req.body;

      const game = await GameManager.getInstance().leaveGame(gameID, playerID);

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);

      // Lobby update (room may have been removed or player count changed)
      broadcastConnectFourRooms();
    } catch (error) {
      res.status(500).send(`Error when leaving game: ${(error as Error).message}`);
    }
  };

  /**
   * Gets room information for a specific Connect Four game.
   * @param req The request object containing the game ID.
   * @param res The response object to send the result.
   */
  const getConnectFourRoom = async (req: express.Request<{ gameID: string }>, res: Response) => {
    try {
      const { gameID } = req.params;

      const game = GameManager.getInstance().getGame(gameID as GameInstanceID);

      if (!game || game.gameType !== 'Connect Four') {
        throw new Error('Connect Four game not found');
      }

      const connectFourGame = game as unknown as ConnectFourGame;
      res.status(200).json(connectFourGame.getPublicRoomInfo());
    } catch (error) {
      res.status(500).send(`Error when getting room: ${(error as Error).message}`);
    }
  };

  /**
   * Fetches games based on optional game type and status query parameters, and responds with the list of games.
   * @param req The request object containing the query parameters for filtering games.
   * @param res The response object to send the result.
   */
  const getGames = async (req: GetGamesRequest, res: Response) => {
    try {
      const { gameType, status } = req.query;

      // For Connect Four rooms, prefer the in-memory registry to reflect live rooms
      // and exclude private rooms from the public listing
      if (gameType === 'Connect Four') {
        const activeInstances = GameManager.getInstance()
          .getActiveGameInstances()
          .filter(g => g.gameType === 'Connect Four') as unknown as ConnectFourGame[];

        const publicRooms = activeInstances
          .filter(g => g.state.roomSettings.privacy === 'PUBLIC')
          .map(g => g.getPublicRoomInfo());

        res.status(200).json(publicRooms);
        return;
      }

      const games = await findGames(gameType, status);

      res.status(200).json(games);
    } catch (error) {
      res.status(500).send(`Error when getting games: ${(error as Error).message}`);
    }
  };

  /**
   * Handles a game move by applying the move to the game state, emitting updates to all players, and saving the state.
   * @param gameMove The payload containing the game ID and move details.
   * @throws Error if applying the move or saving the game state fails.
   */
  const playMove = async (gameMove: GameMovePayload): Promise<void> => {
    const { gameID, move } = gameMove;

    try {
      const game = GameManager.getInstance().getGame(gameID);

      if (game === undefined) {
        throw new Error('Game requested does not exist');
      }

      game.applyMove(move);
      socket.in(gameID).emit('gameUpdate', { gameInstance: game.toModel() });

      await game.saveGameState();

      if (game.state.status === 'OVER') {
        GameManager.getInstance().removeGame(gameID);
      }

      // Update public lobby list as games transition between states
      broadcastConnectFourRooms();
    } catch (error) {
      socket.to(gameID).emit('gameError', {
        player: move.playerID,
        error: (error as Error).message,
      });
    }
  };

  socket.on('connection', conn => {
    // Track per-socket presence so we can auto-leave on disconnect
    const joinedGames = new Set<string>();
    const presence = new Map<string, { playerID: string; isSpectator?: boolean }>();
    conn.on('joinGame', (gameID: string) => {
      conn.join(gameID);

      // Send current game state to the joining player
      const game = GameManager.getInstance().getGame(gameID as GameInstanceID);
      if (game) {
        conn.emit('gameUpdate', { gameInstance: game.toModel() });
      }
    });

    conn.on(
      'leaveGame',
      async (data: { gameID: string; playerID: string; isSpectator?: boolean }) => {
        conn.leave(data.gameID);
        joinedGames.delete(data.gameID);
        presence.delete(data.gameID);

        // Handle disconnection so player leaves game
        try {
          const result = await GameManager.getInstance().leaveGame(
            data.gameID as GameInstanceID,
            data.playerID,
            data.isSpectator,
          );

          if (!('error' in result)) {
            socket.in(data.gameID).emit('gameUpdate', { gameInstance: result });
          }
        } catch (error) {
          conn.emit('gameError', {
            player: data.playerID,
            error: (error as Error).message,
          });
        }
      },
    );

    conn.on('makeMove', playMove);

    // Presence registration for auto cleanup
    conn.on(
      'registerPresence',
      (data: { gameID: string; playerID: string; isSpectator?: boolean }) => {
        joinedGames.add(data.gameID);
        presence.set(data.gameID, { playerID: data.playerID, isSpectator: data.isSpectator });
      },
    );

    conn.on('disconnect', async () => {
      // Auto-leave all registered games for this socket
      for (const gameID of joinedGames) {
        const info = presence.get(gameID);
        if (!info) continue;
        try {
          const result = await GameManager.getInstance().leaveGame(
            gameID as GameInstanceID,
            info.playerID,
            info.isSpectator,
          );
          if (!('error' in result)) {
            socket.in(gameID).emit('gameUpdate', { gameInstance: result });
          }
        } catch (error) {
          // ignore cleanup errors
        }
      }
    });

    // client requests the latest list of public Connect Four rooms
    conn.on('requestConnectFourRooms', () => {
      conn.emit('connectFourRoomsUpdate', getPublicConnectFourRooms());
    });
  });

  // Register routes
  router.post('/create', createGame);
  router.post('/join', joinGame);
  router.post('/leave', leaveGame);
  router.get('/games', getGames);

  // Connect Four specific routes
  router.post('/connectfour/create', createConnectFourRoom);
  router.post('/connectfour/join', joinConnectFourRoom);
  router.post('/connectfour/join-by-code', joinConnectFourRoomByCode);
  router.get('/connectfour/:gameID', getConnectFourRoom);

  return router;
};

export default gameController;
