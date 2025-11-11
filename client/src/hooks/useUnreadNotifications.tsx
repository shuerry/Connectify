import { useEffect, useState } from 'react';
import { getNotifications } from '../services/notificationService';

export const useUnreadNotifications = (username: string) => {
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    if (!username) return;

    const load = async () => {
      try {
        const { items } = await getNotifications(username, 50);
        const count = items.filter(n => !n.isRead).length;
        setUnread(count);
      } catch (err) {
        console.error('Failed to load unread notifications', err);
      }
    };

    load();

    // Optional: poll every 30 seconds (can remove if using sockets)
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [username]);

  return { unread };
};