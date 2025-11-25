import { useCallback, useState } from 'react';
import { PopulatedDatabaseChat, SafeDatabaseUser } from '../types/types';
import { toggleNotify } from '../services/chatService';

type UseMuteChatOptions = {
  chat: PopulatedDatabaseChat | null;
  user: SafeDatabaseUser | null;
  /**
   * Function that refetches the current chat from the backend
   * and updates local state.
   */
  refreshChat: () => Promise<void>;
};

const useMuteChat = ({ chat, user, refreshChat }: UseMuteChatOptions) => {
  const [isMuting, setIsMuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMute = !!chat?._id && !!user?.username;

  const muteFor = useCallback(
    async (durationMs: number) => {
      if (!canMute) return;

      setIsMuting(true);
      setError(null);

      try {
        // Toggle to muted now
        await toggleNotify(chat!._id, user!.username);
        await refreshChat();

        // Auto-unmute after the given duration
        window.setTimeout(async () => {
          try {
            await toggleNotify(chat!._id, user!.username);
            await refreshChat();
          } catch (err) {
            // Silent catch
          }
        }, durationMs);
      } catch (err) {
        setError('Failed to mute chat');
      } finally {
        setIsMuting(false);
      }
    },
    [canMute, chat, user, refreshChat],
  );

  const muteIndefinitely = useCallback(async () => {
    if (!canMute) return;

    setIsMuting(true);
    setError(null);

    try {
      await toggleNotify(chat!._id, user!.username);
      await refreshChat();
    } catch (err) {
      setError('Failed to mute chat');
    } finally {
      setIsMuting(false);
    }
  }, [canMute, chat, user, refreshChat]);

  return {
    muteFor,
    muteIndefinitely,
    isMuting,
    error,
    canMute,
  };
};

export default useMuteChat;
