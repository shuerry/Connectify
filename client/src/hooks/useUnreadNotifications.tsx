import { useCallback, useEffect, useState } from 'react';
import { getNotifications } from '../services/notificationService';
import useUserContext from './useUserContext';

const useUnreadNotifications = (username: string) => {
  const { socket } = useUserContext();
  const [unread, setUnread] = useState<number>(0);

  const loadUnread = useCallback(async () => {
    if (!username) return;

    try {
      const { items } = await getNotifications(username, 50);
      const count = items.filter(n => !n.isRead).length;
      setUnread(count);
    } catch (err) {
      //console.error('Failed to load unread notifications', err);
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;

    // initial load
    loadUnread();

    if (!socket) return;

    const handleNotificationUpdate = () => {
      // re-fetch unread count whenever server signals an update
      loadUnread();
    };

    socket.on('notificationUpdate', handleNotificationUpdate);

    return () => {
      socket.off('notificationUpdate', handleNotificationUpdate);
    };
  }, [socket, username, loadUnread]);

  return { unread };
};

export default useUnreadNotifications;
