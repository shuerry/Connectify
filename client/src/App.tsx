import { useEffect, useState } from 'react';
import { FakeSOSocket } from './types/types';
import { io } from 'socket.io-client';
import FakeStackOverflow from './components/fakestackoverflow';

// ensures that the socket connections work properly in production as well.
// In production, use the group member's server deployment; in development, use localhost
const SERVER_URL: string =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://cs4530-f25-509-backend-0k7a.onrender.com');

// Debug logging to verify connection URL
// eslint-disable-next-line no-console
console.log('Socket.IO Configuration:', {
  VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
  isDev: import.meta.env.DEV,
  windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
  finalServerURL: SERVER_URL,
  environment: import.meta.env.MODE,
});

const App = () => {
  const [socket, setSocket] = useState<FakeSOSocket | null>(null);

  useEffect(() => {
    if (!socket) {
      const newSocket = io(SERVER_URL, {
        path: '/socket.io',
        withCredentials: true,
        // Production-optimized configuration
        transports: ['polling', 'websocket'],
        timeout: 20000,
        forceNew: true,
        // Add reconnection settings for better reliability
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      // Enhanced connection debugging
      newSocket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log(` Socket connected successfully!`, {
          socketId: newSocket.id,
          serverUrl: SERVER_URL,
          transport: newSocket.io.engine.transport.name,
          timestamp: new Date().toISOString(),
        });
      });

      newSocket.on('disconnect', reason => {
        // eslint-disable-next-line no-console
        console.log(` Socket disconnected: ${reason}`, {
          serverUrl: SERVER_URL,
          timestamp: new Date().toISOString(),
        });
      });

      newSocket.on('connect_error', error => {
        // eslint-disable-next-line no-console
        console.error(' Socket connection error:', {
          error: error.message,
          serverUrl: SERVER_URL,
          timestamp: new Date().toISOString(),
        });
      });

      newSocket.on('reconnect', attemptNumber => {
        // eslint-disable-next-line no-console
        console.log(` Socket reconnected after ${attemptNumber} attempts`);
      });

      newSocket.on('reconnect_error', error => {
        // eslint-disable-next-line no-console
        console.error(' Socket reconnection failed:', error.message);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket !== null) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return <FakeStackOverflow socket={socket} />;
};

export default App;
