import { ObjectId } from 'mongodb';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ChatUpdatePayload,
  DatabaseMessage,
  Message,
  MessageUpdatePayload,
  PopulatedDatabaseChat,
  SafeDatabaseUser,
  TypingIndicatorPayload,
} from '../types/types';
import useUserContext from './useUserContext';
import {
  createChat,
  getChatById,
  getChatsByUser,
  sendMessage,
  markMessagesAsRead,
} from '../services/chatService';
import { getDirectMessages } from '../services/messageService';
import { getRelations, getUserByUsername } from '../services/userService';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, and a new message state.
 */

const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [chatToCreate, setChatToCreate] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<PopulatedDatabaseChat | null>(null);
  const [chats, setChats] = useState<PopulatedDatabaseChat[]>([]);
  const [directMessages, setDirectMessages] = useState<DatabaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [participantUsers, setParticipantUsers] = useState<Map<string, SafeDatabaseUser>>(
    new Map(),
  );
  const selectedChatIdRef = useRef<ObjectId | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

  const handleLeaveChat = useCallback(
    (chatID: ObjectId | undefined) => {
      if (!chatID) return;
      socket.emit('leaveChat', String(chatID));
    },
    [socket],
  );

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedChat?._id) {
      // Stop typing indicator when sending message
      if (isTypingRef.current && selectedChat._id) {
        socket.emit('typingStop', { chatID: String(selectedChat._id), username: user.username });
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Check if users are friends before sending message (only for 2-person chats)
      // Group chats (3+ participants) don't require friend checks
      const participants = Object.keys(selectedChat.participants);
      if (participants.length === 2) {
        const otherParticipant = participants.find(p => p !== user.username);
        if (otherParticipant) {
          try {
            const relations = await getRelations(user.username);
            if (!relations.friends.includes(otherParticipant)) {
              setError('You can only send messages to users who are your friends');
              return;
            }
          } catch (err) {
            setError('Error checking friend status');
            return;
          }
        }
      }

      const message: Omit<Message, 'type'> = {
        msg: newMessage,
        msgFrom: user.username,
        msgDateTime: new Date(),
      };

      try {
        const chat = await sendMessage(message, selectedChat._id);
        setSelectedChat(chat);
        setError(null);
        setNewMessage('');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error sending message';
        if (
          errorMessage.includes('must be friends') ||
          errorMessage.includes('only send messages')
        ) {
          setError('You can only send messages to users who are your friends');
        } else {
          setError(errorMessage);
        }
      }
    } else {
      setError('Message cannot be empty');
    }
  };

  const refreshChat = async () => {
    if (selectedChat?._id) {
      try {
        const chat = await getChatById(selectedChat._id);
        setSelectedChat(chat);

        // Also refresh direct messages
        const participants = Object.keys(chat.participants);
        if (participants.length === 2) {
          const otherParticipant = participants.find(p => p !== user.username);
          if (otherParticipant) {
            try {
              const directMsgs = await getDirectMessages(user.username, otherParticipant);
              setDirectMessages(directMsgs);
            } catch (err) {
              throw new Error('Error fetching direct messages');
            }
          }
        }
      } catch (err) {
        throw new Error('Error refreshing chat');
      }
    }
  };

  const handleChatSelect = async (chatID: ObjectId | undefined) => {
    if (!chatID) {
      setError('Invalid chat ID');
      setSelectedChat(null);
      // leave any previously joined chat
      if (selectedChatIdRef.current) {
        handleLeaveChat(selectedChatIdRef.current);
      }
      selectedChatIdRef.current = null;
      setDirectMessages([]);
      return;
    }

    const chat = await getChatById(chatID);
    setSelectedChat(chat);
    // leave previous chat room if different
    if (selectedChatIdRef.current && String(selectedChatIdRef.current) !== String(chatID)) {
      handleLeaveChat(selectedChatIdRef.current);
    }
    selectedChatIdRef.current = chatID;
    handleJoinChat(chatID);

    // Mark messages as read when viewing the chat
    try {
      await markMessagesAsRead(chatID, user.username);
    } catch (err) {
      throw new Error('Error marking messages as read');
    }

    // Fetch direct messages (friend requests, game invitations, etc.) between participants
    const participants = Object.keys(chat.participants);
    if (participants.length === 2) {
      const otherParticipant = participants.find(p => p !== user.username);
      if (otherParticipant) {
        try {
          const directMsgs = await getDirectMessages(user.username, otherParticipant);
          setDirectMessages(directMsgs);
        } catch (err) {
          setDirectMessages([]);
          throw new Error('Error fetching direct messages');
        }
      }
    } else {
      setDirectMessages([]);
    }
  };

  const handleUserSelect = (selectedUser: SafeDatabaseUser) => {
    setChatToCreate(selectedUser.username);
  };

  const handleCreateChat = async () => {
    if (!chatToCreate) {
      setError('Please select a user to chat with');
      return;
    }

    // Check if users are friends before creating chat
    try {
      const relations = await getRelations(user.username);
      if (!relations.friends.includes(chatToCreate)) {
        setError('You can only message users who are your friends');
        return;
      }
    } catch (err) {
      setError('Error checking friend status');
      return;
    }

    // Check if a chat already exists between these two users
    const existingChat = chats.find(chat => {
      const participants = Object.keys(chat.participants);
      return (
        participants.length === 2 &&
        participants.includes(user.username) &&
        participants.includes(chatToCreate)
      );
    });

    if (existingChat) {
      setSelectedChat(existingChat);
      selectedChatIdRef.current = existingChat._id;
      handleJoinChat(existingChat._id);
      setShowCreatePanel(false);
      setError(null);

      try {
        const directMsgs = await getDirectMessages(user.username, chatToCreate);
        setDirectMessages(directMsgs);
      } catch (err) {
        setDirectMessages([]);
        throw new Error('Error fetching direct messages');
      }
      return;
    }

    try {
      const chat = await createChat({ [user.username]: true, [chatToCreate]: true });
      setSelectedChat(chat);
      selectedChatIdRef.current = chat._id;
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setError(null);

      try {
        const directMsgs = await getDirectMessages(user.username, chatToCreate);
        setDirectMessages(directMsgs);
      } catch (err) {
        setDirectMessages([]);
        throw new Error('Error fetching direct messages');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating chat';
      if (errorMessage.includes('must be friends')) {
        setError('You can only message users who are your friends');
      } else {
        setError(errorMessage);
      }
    }
  };

  useEffect(() => {
    // Helper function to check if a chat is a direct message (2-person, not community chat)
    const isDirectMessageChat = (chat: PopulatedDatabaseChat): boolean => {
      const participants = Object.keys(chat.participants);
      return participants.length === 2 && !chat.isCommunityChat;
    };

    const fetchChats = async () => {
      const userChats = await getChatsByUser(user.username);
      // Filter to only show 2-person direct message chats (exclude group chats and community chats)
      const directMessageChats = userChats.filter(isDirectMessageChat);
      setChats(directMessageChats);
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      // Only process direct message chats (2-person, not community chats)
      if (!isDirectMessageChat(chat)) {
        return;
      }

      switch (type) {
        case 'created': {
          if (user.username in chat.participants) {
            setChats(prevChats => [chat, ...prevChats]);
          }
          return;
        }
        case 'newMessage':
        case 'messageDeleted': {
          // Use functional updates to access current state
          setSelectedChat(prevSelectedChat => {
            // Update the selected chat if it matches
            if (prevSelectedChat?._id && String(chat._id) === String(prevSelectedChat._id)) {
              return chat;
            }
            return prevSelectedChat;
          });

          // If user is currently viewing this chat, automatically mark messages as read
          if (
            type === 'newMessage' &&
            selectedChatIdRef.current &&
            String(chat._id) === String(selectedChatIdRef.current)
          ) {
            markMessagesAsRead(chat._id, user.username).catch(err => {
              throw new Error(err);
            });
          }

          // Also update the chats list to reflect the new message
          if (user.username in chat.participants) {
            setChats(prevChats => {
              const existingIndex = prevChats.findIndex(c => String(c._id) === String(chat._id));
              if (existingIndex >= 0) {
                // Update existing chat in the list
                return prevChats.map(c => (String(c._id) === String(chat._id) ? chat : c));
              }
              // If not in list but user is a participant, add it
              return [chat, ...prevChats];
            });
          }
          return;
        }
        case 'readReceipt': {
          // Use functional updates to access current state
          setSelectedChat(prevSelectedChat => {
            // Update the selected chat if it matches
            if (prevSelectedChat?._id && String(chat._id) === String(prevSelectedChat._id)) {
              return chat;
            }
            return prevSelectedChat;
          });

          // Also update the chats list to reflect the read receipt
          if (user.username in chat.participants) {
            setChats(prevChats => {
              const existingIndex = prevChats.findIndex(c => String(c._id) === String(chat._id));
              if (existingIndex >= 0) {
                return prevChats.map(c => (String(c._id) === String(chat._id) ? chat : c));
              }
              return prevChats;
            });
          }
          return;
        }
        case 'newParticipant': {
          // If a participant is added and it's no longer a 2-person chat, remove it from the list
          if (user.username in chat.participants) {
            const participants = Object.keys(chat.participants);
            if (participants.length > 2 || chat.isCommunityChat) {
              // This is now a group chat, remove it from direct messages
              setChats(prevChats => prevChats.filter(c => String(c._id) !== String(chat._id)));
            } else {
              setChats(prevChats => {
                if (prevChats.some(c => String(c._id) === String(chat._id))) {
                  return prevChats.map(c => (String(c._id) === String(chat._id) ? chat : c));
                }
                return [chat, ...prevChats];
              });
            }
          }
          return;
        }
        default: {
          setError('Invalid chat update type');
        }
      }
    };

    const handleMessageUpdate = (messageUpdate: MessageUpdatePayload) => {
      const { msg } = messageUpdate;

      setSelectedChat(prevSelectedChat => {
        if (!prevSelectedChat) {
          return prevSelectedChat;
        }

        const messageIndex = prevSelectedChat.messages.findIndex(
          m => String(m._id) === String(msg._id),
        );

        if (messageIndex === -1) {
          return prevSelectedChat;
        }

        if (msg.isDeleted) {
          return {
            ...prevSelectedChat,
            messages: prevSelectedChat.messages.filter(m => String(m._id) !== String(msg._id)),
          };
        }

        return {
          ...prevSelectedChat,
          messages: prevSelectedChat.messages.map(m =>
            String(m._id) === String(msg._id) ? { ...m, ...msg, user: m.user } : m,
          ),
        };
      });

      setDirectMessages(prev => {
        const existingIndex = prev.findIndex(m => String(m._id) === String(msg._id));

        if (msg.isDeleted) {
          if (existingIndex === -1) {
            return prev;
          }
          return prev.filter(m => String(m._id) !== String(msg._id));
        }

        if (existingIndex >= 0) {
          return prev.map((m, idx) => (idx === existingIndex ? { ...m, ...msg } : m));
        }

        if (msg.type === 'global') {
          return prev;
        }

        const involvesCurrentUser =
          msg.msgFrom === user.username || (msg.msgTo ? msg.msgTo === user.username : false);

        if (!involvesCurrentUser) {
          return prev;
        }

        return [...prev, msg].sort(
          (a, b) => new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime(),
        );
      });
    };

    const handleTypingIndicator = (payload: TypingIndicatorPayload) => {
      // Only process typing indicators for the current chat
      if (!selectedChatIdRef.current || payload.chatID !== String(selectedChatIdRef.current)) {
        return;
      }

      // Only show typing indicators for other users
      if (payload.username === user.username) {
        return;
      }

      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (payload.isTyping) {
          newSet.add(payload.username);
        } else {
          newSet.delete(payload.username);
        }
        return newSet;
      });
    };

    fetchChats();

    // Set up socket listeners
    socket.on('chatUpdate', handleChatUpdate);
    socket.on('messageUpdate', handleMessageUpdate);
    socket.on('typingIndicator', handleTypingIndicator);

    // Also set up listeners when socket connects (in case it's not connected yet)
    const onConnect = () => {
      socket.on('chatUpdate', handleChatUpdate);
      socket.on('messageUpdate', handleMessageUpdate);
      socket.on('typingIndicator', handleTypingIndicator);
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('chatUpdate', handleChatUpdate);
      socket.off('messageUpdate', handleMessageUpdate);
      socket.off('typingIndicator', handleTypingIndicator);
    };
  }, [user.username, socket, selectedChat?._id]);

  // Fetch and manage user data for chat participants
  useEffect(() => {
    const fetchParticipantUsers = async () => {
      const usernames = new Set<string>();
      chats.forEach(chat => {
        Object.keys(chat.participants).forEach(username => {
          if (username !== user.username) {
            usernames.add(username);
          }
        });
      });

      // Determine which usernames we still need to fetch
      const usernamesToFetch = Array.from(usernames).filter(
        username => !participantUsers.has(username),
      );
      if (usernamesToFetch.length === 0) {
        return;
      }

      const fetchedUsers = await Promise.all(
        usernamesToFetch.map(async username => {
          try {
            const userData = await getUserByUsername(username);
            return { username, userData };
          } catch {
            return null;
          }
        }),
      );

      setParticipantUsers(prev => {
        const updated = new Map(prev);
        fetchedUsers.forEach(entry => {
          if (entry) {
            updated.set(entry.username, entry.userData);
          }
        });
        return updated;
      });
    };

    if (chats.length > 0) {
      fetchParticipantUsers();
    }
  }, [chats, participantUsers, user.username]);

  // Listen for user status updates for all participants
  useEffect(() => {
    if (!socket) return;

    const handleUserStatusUpdate = (payload: {
      username: string;
      isOnline: boolean;
      showOnlineStatus: boolean;
    }) => {
      setParticipantUsers(prev => {
        const user = prev.get(payload.username);
        if (user) {
          const newMap = new Map(prev);
          newMap.set(payload.username, {
            ...user,
            isOnline: payload.isOnline,
            showOnlineStatus: payload.showOnlineStatus,
          });
          return newMap;
        }
        return prev;
      });
    };

    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      setParticipantUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(payload.user.username, payload.user);
        return newMap;
      });
    };

    socket.on('userStatusUpdate', handleUserStatusUpdate);
    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userStatusUpdate', handleUserStatusUpdate);
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket]);

  // Merge chat messages with direct messages (friend requests, game invitations, etc.)
  // Convert MessageInChat to DatabaseMessage format for consistency
  const allMessages: DatabaseMessage[] = selectedChat
    ? [
        ...selectedChat.messages
          .filter(msg => !msg.isDeleted)
          .map(msg => ({
            _id: msg._id,
            msg: msg.msg,
            msgFrom: msg.msgFrom,
            msgDateTime: msg.msgDateTime,
            type: msg.type,
            msgTo: msg.msgTo,
            friendRequestStatus: msg.friendRequestStatus,
            gameInvitation: msg.gameInvitation,
            readBy: msg.readBy || [],
            editHistory: msg.editHistory || [],
            lastEditedAt: msg.lastEditedAt,
            lastEditedBy: msg.lastEditedBy,
            isDeleted: msg.isDeleted,
            deletedAt: msg.deletedAt,
            deletedBy: msg.deletedBy,
          })),
        ...directMessages.filter(
          dm =>
            !dm.isDeleted &&
            !selectedChat.messages.some(cm => String(cm._id) === String(dm._id)),
        ),
      ].sort((a, b) => new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime())
    : [];

  /**
   * Handles typing events - emits typingStart/typingStop with debouncing
   */
  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Only handle typing if we have a selected chat
    if (!selectedChat?._id) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user started typing and wasn't typing before, emit typingStart
    if (value.length > 0 && !isTypingRef.current) {
      socket.emit('typingStart', { chatID: String(selectedChat._id), username: user.username });
      isTypingRef.current = true;
    }

    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && selectedChat?._id) {
        socket.emit('typingStop', { chatID: String(selectedChat._id), username: user.username });
        isTypingRef.current = false;
      }
      typingTimeoutRef.current = null;
    }, 3000);
  };

  // Cleanup on unmount or when chat changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && selectedChatIdRef.current) {
        socket.emit('typingStop', {
          chatID: String(selectedChatIdRef.current),
          username: user.username,
        });
      }
      // ensure we leave any joined chat room on unmount
      if (selectedChatIdRef.current) {
        handleLeaveChat(selectedChatIdRef.current);
      }
      setTypingUsers(new Set());
    };
  }, [socket, user.username, handleLeaveChat]);

  // Get the other participant's user data for the selected chat
  const otherParticipant = selectedChat
    ? Object.keys(selectedChat.participants).find(username => username !== user.username)
    : null;
  const otherParticipantUser = otherParticipant ? participantUsers.get(otherParticipant) : null;

  return {
    selectedChat,
    chatToCreate,
    chats,
    messages: allMessages,
    newMessage,
    setNewMessage: handleTyping,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
    refreshChat,
    error,
    typingUsers,
    participantUsers,
    otherParticipantUser,
  };
};

export default useDirectMessage;
