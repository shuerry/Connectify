import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GameInstance,
  ConnectFourGameState,
  ConnectFourRoomSettings,
  GameUpdatePayload,
} from '../types/types';
import {
  getGames,
  createConnectFourRoom,
  joinConnectFourRoom,
  joinConnectFourRoomByCode,
} from '../services/gamesService';
import useUserContext from './useUserContext';

/**
 * Hook for managing Connect Four game page state and logic
 */
const useConnectFourPage = () => {
  const { user, socket } = useUserContext();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameInstance<ConnectFourGameState>[]>([]);
  const [currentGame, setCurrentGame] = useState<GameInstance<ConnectFourGameState> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);

  // Load available games (fallback to HTTP)
  const loadGames = useCallback(async () => {
    try {
      const allGames = (await getGames('Connect Four', undefined)) as unknown as Array<
        GameInstance<ConnectFourGameState>
      >;
      setGames(allGames);
    } catch (err) {
      setError(null);
    }
  }, []);

  // Initial load and real-time lobby updates
  useEffect(() => {
    if (!user || !user.username) {
      navigate('/');
      return;
    }

    // Fallback initial fetch
    loadGames();

    if (socket) {
      const handleRoomsUpdate = (rooms: Array<GameInstance<ConnectFourGameState>>) => {
        setGames(rooms);
      };

      socket.on(
        'connectFourRoomsUpdate',
        handleRoomsUpdate as unknown as (rooms: unknown[]) => void,
      );
      // Request latest rooms immediately
      socket.emit('requestConnectFourRooms');

      return () => {
        socket.off(
          'connectFourRoomsUpdate',
          handleRoomsUpdate as unknown as (rooms: unknown[]) => void,
        );
      };
    }
  }, [user, navigate, loadGames, socket]);

  // Leave game (moved above socket handlers to satisfy hooks lint rules)
  const handleLeaveGame = useCallback(() => {
    if (!currentGame || !user || !socket) return;

    const shouldLeave = window.confirm(
      'Are you sure you want to leave? You cannot rejoin this game after leaving.',
    );

    if (!shouldLeave) return;

    socket.emit('leaveGame', {
      gameID: currentGame.gameID,
      playerID: user.username,
      isSpectator,
    });

    setCurrentGame(null);
    setIsSpectator(false);
    loadGames();
  }, [currentGame, user, socket, isSpectator, loadGames]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = (update: GameUpdatePayload) => {
      const updatedGame = update.gameInstance as GameInstance<ConnectFourGameState>;

      // Update games list
      setGames(prevGames => {
        const index = prevGames.findIndex(g => g.gameID === updatedGame.gameID);
        if (index >= 0) {
          const newGames = [...prevGames];
          newGames[index] = updatedGame;
          return newGames;
        }
        return [...prevGames, updatedGame];
      });

      // Update current game if it's the one we're in
      if (currentGame && currentGame.gameID === updatedGame.gameID) {
        setCurrentGame(updatedGame);

        // Check if game is over
        if (updatedGame.state.status === 'OVER') {
          setTimeout(() => {
            const shouldReturn = window.confirm(
              `Game Over! ${
                updatedGame.state.winners && updatedGame.state.winners.length > 0
                  ? `${updatedGame.state.winners[0]} wins!`
                  : "It's a draw!"
              }\n\nReturn to lobby?`,
            );
            if (shouldReturn) {
              handleLeaveGame();
            }
          }, 1000);
        }
      }
    };

    const handleGameError = (data: { player: string; error: string }) => {
      if (user && data.player === user.username) {
        alert(`Error: ${data.error}`);
      }
    };

    socket.on('gameUpdate', handleGameUpdate);
    socket.on('gameError', handleGameError);

    return () => {
      socket.off('gameUpdate', handleGameUpdate);
      socket.off('gameError', handleGameError);
    };
  }, [currentGame, user, socket, handleLeaveGame]);

  // Create new room
  const handleCreateRoom = async (roomSettings: ConnectFourRoomSettings) => {
    if (!user || !socket) return;

    try {
      const response = await createConnectFourRoom(user.username, roomSettings);
      setShowCreateModal(false);

      // Show room code for private rooms
      if (roomSettings.privacy !== 'PUBLIC' && response.roomCode) {
        alert(
          `Room created! Room code: ${response.roomCode}\n\nShare this code with others to let them join.`,
        );
      }

      // Join the created room
      setCurrentGame(response.game);
      setIsSpectator(false);
      socket.emit('joinGame', response.gameID);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating room:', err);
      alert('Failed to create room. Please try again.');
    }
  };

  // Join existing room
  const handleJoinRoom = async (
    gameID: string,
    roomCode?: string,
    asSpectator: boolean = false,
  ) => {
    if (!user || !socket) return;

    try {
      const game = await joinConnectFourRoom(user.username, gameID, roomCode, asSpectator);
      setCurrentGame(game);
      setIsSpectator(asSpectator);
      socket.emit('joinGame', gameID);
      // Register presence for auto-cleanup on disconnect
      socket.emit('registerPresence', {
        gameID,
        playerID: user.username,
        isSpectator: asSpectator,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error joining room:', err);
      alert('Failed to join room. It may be full, private, or no longer available.');
    }
  };

  // Join by room code
  const handleJoinByCode = async (roomCode: string) => {
    if (!user || !socket) return;

    try {
      const game = await joinConnectFourRoomByCode(user.username, roomCode, false);
      setCurrentGame(game);
      setIsSpectator(false);
      socket.emit('joinGame', game.gameID);
      socket.emit('registerPresence', {
        gameID: game.gameID,
        playerID: user.username,
        isSpectator: false,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error joining by code:', err);
      alert('Failed to join room. Please check the code and try again.');
    }
  };

  // Make a move
  const handleMakeMove = (column: number) => {
    if (!currentGame || !user || !socket) return;
    if (isSpectator) return;

    socket.emit('makeMove', {
      gameID: currentGame.gameID,
      move: {
        playerID: user.username,
        gameID: currentGame.gameID,
        move: { column },
      },
    });
  };

  // (handleLeaveGame moved above)

  return {
    games,
    currentGame,
    user,
    showCreateModal,
    setShowCreateModal,
    handleCreateRoom,
    handleJoinRoom,
    handleJoinByCode,
    handleMakeMove,
    handleLeaveGame,
    error,
  };
};

export default useConnectFourPage;
