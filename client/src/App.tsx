import { useEffect, useState } from 'react';
import { FakeSOSocket } from './types/types';
import { BrowserRouter as Router } from 'react-router-dom';
import { io } from 'socket.io-client';
import FakeStackOverflow from './components/fakestackoverflow';

// ensures that the socket connections work properly in production as well.
// In production, use the current origin; in development, use localhost
const SERVER_URL: string =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://cs4530-f25-509-6v2m.onrender.com');

// Debug logging to verify connection URL
// eslint-disable-next-line no-console
console.log('Socket.IO Configuration Debug:', {
  VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
  isDev: import.meta.env.DEV,
  windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'undefined',
  finalServerURL: SERVER_URL,
  environment: import.meta.env.NODE_ENV || 'development',
});

const App = () => {
  const [socket, setSocket] = useState<FakeSOSocket | null>(null);

  useEffect(() => {
    if (!socket) {
      const newSocket = io(SERVER_URL, {
        path: '/socket.io',
        withCredentials: true,
        // Simplified client configuration for better reliability
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true,
      });

      // Add connection debugging for multi-browser testing
      newSocket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log(`Socket connected with ID: ${newSocket.id} to ${SERVER_URL}`);
      });

      newSocket.on('disconnect', reason => {
        // eslint-disable-next-line no-console
        console.log(`Socket disconnected: ${reason}`);
      });

      newSocket.on('connect_error', error => {
        // eslint-disable-next-line no-console
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket !== null) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <Router>
      <FakeStackOverflow socket={socket} />
    </Router>
  );
};

export default App;
