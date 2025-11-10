import { useEffect, useState } from 'react';
import { DatabaseMessage, Message, SafeDatabaseUser } from '../types/types';
import useUserContext from './useUserContext';
import { addDirectMessage, getDirectMessages } from '../services/messageService';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, and a new message state.
 */

const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedUser) {
      const message: Message = {
        msg: newMessage,
        msgFrom: user.username,
        msgDateTime: new Date(),
        type: 'direct',
        msgTo: selectedUser,
      };

      try {
        await addDirectMessage(message);
        setError(null);
        setNewMessage('');
        // Refresh messages
        const updatedMessages = await getDirectMessages(user.username, selectedUser);
        setMessages(updatedMessages);
      } catch (err) {
        setError('Failed to send message');
      }
    } else {
      setError('Message cannot be empty');
    }
  };

  const handleUserSelect = (selectedUserData: SafeDatabaseUser) => {
    setSelectedUser(selectedUserData.username);
    setShowCreatePanel(false);
  };

  const handleCreateChat = async () => {
    if (!selectedUser) {
      setError('Please select a user to chat with');
      return;
    }
    // Chat is created by selecting a user
  };

    // Change 'false' later to use a default notif setting in user preferences
    const participants = {
      [user.username]: false,
      [chatToCreate]: false,
    };

    const chat = await createChat(participants);
    setSelectedChat(chat);
    handleJoinChat(chat._id);
    setShowCreatePanel(false);
  const refreshMessages = async () => {
    if (selectedUser) {
      try {
        const userMessages = await getDirectMessages(user.username, selectedUser);
        setMessages(userMessages);
      } catch (err) {
        setError('Failed to fetch messages');
      }
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser) {
        try {
          const userMessages = await getDirectMessages(user.username, selectedUser);
          setMessages(userMessages);
        } catch (err) {
          setError('Failed to fetch messages');
        }
      }
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created': {
          if (chat.participants && chat.participants[user.username]) {
            setChats(prevChats => [chat, ...prevChats]);
          }
          return;
        }
        case 'newMessage': {
          setSelectedChat(chat);
          return;
        }
        case 'newParticipant': {
          if (chat.participants && chat.participants[user.username]) {
            setChats(prevChats => {
              if (prevChats.some(c => chat._id === c._id)) {
                return prevChats.map(c => (c._id === chat._id ? chat : c));
              }
              return [chat, ...prevChats];
            });
          }
          return;
        }
        default: {
          setError('Invalid chat update type');
        }
    const handleMessageUpdate = (messageUpdate: { msg: DatabaseMessage }) => {
      const { msg } = messageUpdate;

      // Only update if this message is relevant to the current conversation
      if (
        (msg.msgFrom === user.username && msg.msgTo === selectedUser) ||
        (msg.msgFrom === selectedUser && msg.msgTo === user.username)
      ) {
        setMessages(prevMessages => {
          const existingIndex = prevMessages.findIndex(m => m._id === msg._id);
          if (existingIndex >= 0) {
            // Update existing message
            return prevMessages.map((m, index) => (index === existingIndex ? msg : m));
          } else {
            // Add new message
            return [...prevMessages, msg];
          }
        });
      }
    };

    fetchMessages();

    socket.on('messageUpdate', handleMessageUpdate);

    return () => {
      socket.off('messageUpdate', handleMessageUpdate);
    };
  }, [user.username, selectedUser, socket]);

  return {
    selectedUser,
    messages,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleUserSelect,
    handleCreateChat,
    error,
    refreshMessages,
  };
};

export default useDirectMessage;
