import { useEffect, useState } from 'react';
import { FakeSOSocket } from './types/types';
import { BrowserRouter as Router } from 'react-router-dom';
import { io } from 'socket.io-client';
import FakeStackOverflow from './components/fakestackoverflow';

// ensures that the socket connections work properly in production as well.
// In production, use the current origin; in development, use localhost
const SERVER_URL: string =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin);

const App = () => {
  const [socket, setSocket] = useState<FakeSOSocket | null>(null);

  useEffect(() => {
    if (!socket) {
      const newSocket = io(SERVER_URL, {
        path: '/socket.io',
        withCredentials: true,
        // Production-friendly client configuration
        transports: ['polling', 'websocket'],
        upgrade: true,
        timeout: 20000,
        forceNew: true,
        // Additional isolation for multi-browser testing
        multiplex: false,
        rememberUpgrade: false,
        // Add random query to ensure unique connections
        query: {
          t: Date.now().toString(),
          r: Math.random().toString(36).substring(7),
        },
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
