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
      setSocket(
        io(SERVER_URL, {
          path: '/socket.io',
          withCredentials: true,
          // Production-friendly client configuration
          transports: ['polling', 'websocket'],
          upgrade: true,
          timeout: 20000,
          forceNew: true,
        }),
      );
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
