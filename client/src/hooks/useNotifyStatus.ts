import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { PopulatedDatabaseChat } from '../types/types';
import { toggleNotify } from '../services/chatService';

const useNotifyStatus = ({ chat }: { chat: PopulatedDatabaseChat }) => {
  const { user } = useUserContext();
  const [notify, setNotify] = useState<boolean>(false);

  useEffect(() => {
    const getNotificationStatus = () => {
      //console.log('Checking notification status for user:', user?.username);
      if (!user?.username || !chat?.participants) {
        //console.log('No user or chat participants found');
        return false;
      }
      const status = (chat.participants as Record<string, boolean>)[user.username];
      //console.log('User notification status:', status);
      return status ?? false;
    };

    setNotify(getNotificationStatus());
  }, [chat, user?.username]);

  const toggleLocalNotify = async () => {
    if (!chat._id || !user?.username) return;

    await toggleNotify(chat._id, user.username);
    setNotify(prev => !prev);
  };

  return {
    notify,
    toggleLocalNotify,
  };
};

export default useNotifyStatus;
