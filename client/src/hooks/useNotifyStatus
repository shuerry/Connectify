import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { PopulatedDatabaseChat } from '../types/types';

/**
 * Custom hook to handle notification logic for a chat.
 * It manages the user notification status (notify, don't notify),
 * and handles real-time notification updates via socket events.
 *
 * @param chat - The chat object for which the notification is tracked.
 *
 * @returns notify - The user's notification status
 * @returns setNotify - The function to manually update user's notification status
 */

const useNotifyStatus = ({ chat }: { chat: PopulatedDatabaseChat }) => {
    const { user } = useUserContext();
    const [notify, setNotify] = useState<boolean>(false);

    useEffect(() => {
        /**
         * Function to get the current notification status for the user.
         *
         * @returns The current notification status for the user in the chat.
         */
        const getNotificationStatus = () => {
            if (!user?.username || !chat?.participants) {
                return false;
            }
            const status = (chat.participants as Record<string, boolean>)[user.username];

            return status ?? false;
        };

        setNotify(getNotificationStatus());
    }, [chat, user?.username]);

    return {
        notify,
    };
};

export default useNotifyStatus;