import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { SafeDatabaseUser } from '../types/types';
import { getUserByUsername } from '../services/userService';

/**
 * Custom hook for fetching and managing user data with real-time status updates.
 * @param username - The username to fetch data for
 * @returns The user data or null if not found/loading
 */
const useUserData = (username: string | null | undefined) => {
  const { socket } = useUserContext();
  const [userData, setUserData] = useState<SafeDatabaseUser | null>(null);

  useEffect(() => {
    if (!username) {
      setUserData(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getUserByUsername(username);
        setUserData(data);
      } catch {
        setUserData(null);
      }
    };

    fetchUser();
  }, [username]);

  // Listen for user status updates
  useEffect(() => {
    if (!socket || !username) return;

    const handleUserStatusUpdate = (payload: {
      username: string;
      isOnline: boolean;
      showOnlineStatus: boolean;
    }) => {
      if (payload.username === username && userData) {
        setUserData({
          ...userData,
          isOnline: payload.isOnline,
          showOnlineStatus: payload.showOnlineStatus,
        });
      }
    };

    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      if (payload.user.username === username) {
        setUserData(payload.user);
      }
    };

    socket.on('userStatusUpdate', handleUserStatusUpdate);
    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userStatusUpdate', handleUserStatusUpdate);
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket, username, userData]);

  return userData;
};

export default useUserData;
