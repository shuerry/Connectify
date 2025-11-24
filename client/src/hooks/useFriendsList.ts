import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { SafeDatabaseUser } from '../types/types';
import { getRelations, getUserByUsername, removeFriend } from '../services/userService';

/**
 * Custom hook for managing friends list state and real-time updates.
 */
const useFriendsList = () => {
  const { user: currentUser, socket } = useUserContext();
  const [friends, setFriends] = useState<SafeDatabaseUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { friends: friendUsernames } = await getRelations(currentUser.username);
        const results = await Promise.all(friendUsernames.map(u => getUserByUsername(u)));
        setFriends(results);
      } catch {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.username]);

  // Listen for user status updates
  useEffect(() => {
    if (!socket) return;

    const handleUserStatusUpdate = (payload: {
      username: string;
      isOnline: boolean;
      showOnlineStatus: boolean;
    }) => {
      setFriends(prevFriends =>
        prevFriends.map(friend =>
          friend.username === payload.username
            ? { ...friend, isOnline: payload.isOnline, showOnlineStatus: payload.showOnlineStatus }
            : friend,
        ),
      );
    };

    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      setFriends(prevFriends =>
        prevFriends.map(friend =>
          friend.username === payload.user.username ? payload.user : friend,
        ),
      );
    };

    socket.on('userStatusUpdate', handleUserStatusUpdate);
    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userStatusUpdate', handleUserStatusUpdate);
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket]);

  const onRemove = async (target: string) => {
    try {
      await removeFriend(currentUser.username, target);
      setFriends(prev => prev.filter(u => u.username !== target));
    } catch {
      throw new Error('Failed to remove friend');
    }
  };

  return {
    friends,
    loading,
    onRemove,
  };
};

export default useFriendsList;
