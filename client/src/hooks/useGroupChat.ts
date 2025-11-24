import { ObjectId } from 'mongodb';
import { useEffect, useState, useRef } from 'react';
import {
  ChatUpdatePayload,
  DatabaseMessage,
  Message,
  MessageUpdatePayload,
  PopulatedDatabaseChat,
  SafeDatabaseUser,
  TypingIndicatorPayload,
  DatabaseCommunity,
} from '../types/types';
import useUserContext from './useUserContext';
import {
  createChat,
  getChatById,
  getChatsByUser,
  sendMessage,
  markMessagesAsRead,
  getCommunityChat,
} from '../services/chatService';
import { getRelations, getUserByUsername } from '../services/userService';
import { getCommunities } from '../services/communityService';

/**
 * useGroupChat is a custom hook that provides state and functions for group chat messaging.
 * It includes support for regular group chats and community chats.
 */
const useGroupChat = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<Set<string>>(new Set());
  const [groupChatName, setGroupChatName] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<PopulatedDatabaseChat | null>(null);
  const [chats, setChats] = useState<PopulatedDatabaseChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isCreatingCommunityChat, setIsCreatingCommunityChat] = useState<boolean>(false);
  const [selectedCommunity, setSelectedCommunity] = useState<DatabaseCommunity | null>(null);
  const [communities, setCommunities] = useState<DatabaseCommunity[]>([]);
  const [participantUsers, setParticipantUsers] = useState<Map<string, SafeDatabaseUser>>(
    new Map(),
  );
  const selectedChatIdRef = useRef<ObjectId | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

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
        setError(errorMessage);
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
      } catch (err) {
        throw new Error('Error refreshing chat');
      }
    }
  };

  const handleChatSelect = async (chatID: ObjectId | undefined) => {
    if (!chatID) {
      setError('Invalid chat ID');
      setSelectedChat(null);
      selectedChatIdRef.current = null;
      return;
    }

    const chat = await getChatById(chatID);
    setSelectedChat(chat);
    selectedChatIdRef.current = chatID;
    handleJoinChat(chatID);

    // Mark messages as read when viewing the chat
    try {
      await markMessagesAsRead(chatID, user.username);
    } catch (err) {
      throw new Error('Error marking messages as read');
    }
  };

  const handleUserSelect = (selectedUser: SafeDatabaseUser) => {
    // Toggle user selection for group chat
    setSelectedUsersForGroup(prev => {
      const newSet = new Set(prev);
      if (newSet.has(selectedUser.username)) {
        newSet.delete(selectedUser.username);
      } else {
        newSet.add(selectedUser.username);
      }
      return newSet;
    });
  };

  const handleCreateGroupChat = async () => {
    if (selectedUsersForGroup.size === 0) {
      setError('Please select at least one friend to create a group chat');
      return;
    }

    // Check if all selected users are friends
    try {
      const relations = await getRelations(user.username);
      for (const username of selectedUsersForGroup) {
        if (!relations.friends.includes(username)) {
          setError(`You must be friends with ${username} to add them to a group chat`);
          return;
        }
      }
    } catch (err) {
      setError('Error checking friend status');
      return;
    }

    // Create group chat with all selected users
    try {
      const participants: Record<string, boolean> = { [user.username]: true };
      selectedUsersForGroup.forEach(username => {
        participants[username] = true;
      });

      const chat = await createChat(participants, groupChatName || undefined);
      setSelectedChat(chat);
      selectedChatIdRef.current = chat._id;
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setError(null);
      setSelectedUsersForGroup(new Set());
      setGroupChatName('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating group chat';
      setError(errorMessage);
    }
  };

  const handleCreateCommunityChat = async () => {
    if (!selectedCommunity) {
      setError('Please select a community');
      return;
    }

    // Check if user is the admin of the community (only admins can create community chats)
    if (selectedCommunity.admin !== user.username) {
      setError('Only the community admin can create a community chat');
      return;
    }

    // Check if community chat already exists
    try {
      const existingChat = await getCommunityChat(selectedCommunity._id.toString());
      // Chat exists, select it
      setSelectedChat(existingChat);
      selectedChatIdRef.current = existingChat._id;
      handleJoinChat(existingChat._id);
      setShowCreatePanel(false);
      setError(null);
      setSelectedCommunity(null);
      setIsCreatingCommunityChat(false);
      return;
    } catch (err) {
      // Chat doesn't exist, create it
    }

    // Create community chat with all community members
    try {
      const participants: Record<string, boolean> = {};
      selectedCommunity.participants.forEach(username => {
        participants[username] = true;
      });

      const chat = await createChat(
        participants,
        `Community chat for ${selectedCommunity.name}`,
        true,
        selectedCommunity._id.toString(),
      );
      setSelectedChat(chat);
      selectedChatIdRef.current = chat._id;
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setError(null);
      setSelectedCommunity(null);
      setIsCreatingCommunityChat(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating community chat';
      setError(errorMessage);
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getChatsByUser(user.username);
      // Filter to only group chats (3+ participants or community chats)
      const groupChats = userChats.filter(chat => {
        const participants = Object.keys(chat.participants);
        return participants.length > 2 || chat.isCommunityChat;
      });
      setChats(groupChats);
    };

    const fetchCommunities = async () => {
      try {
        const allCommunities = await getCommunities();
        // Filter to communities where the user is the admin (only admins can create community chats)
        const adminCommunities = allCommunities.filter(
          community => community.admin === user.username,
        );
        setCommunities(adminCommunities);
      } catch (err) {
        throw new Error('Error fetching communities');
      }
    };

    fetchChats();
    fetchCommunities();

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created': {
          if (user.username in chat.participants) {
            const participants = Object.keys(chat.participants);
            if (participants.length > 2 || chat.isCommunityChat) {
              setChats(prevChats => [chat, ...prevChats]);
            }
          }
          return;
        }
        case 'newMessage': {
          setSelectedChat(prevSelectedChat => {
            if (prevSelectedChat?._id && String(chat._id) === String(prevSelectedChat._id)) {
              return chat;
            }
            return prevSelectedChat;
          });

          if (selectedChatIdRef.current && String(chat._id) === String(selectedChatIdRef.current)) {
            markMessagesAsRead(chat._id, user.username).catch(err => {
              throw new Error(err);
            });
          }

          if (user.username in chat.participants) {
            const participants = Object.keys(chat.participants);
            if (participants.length > 2 || chat.isCommunityChat) {
              setChats(prevChats => {
                const existingIndex = prevChats.findIndex(c => String(c._id) === String(chat._id));
                if (existingIndex >= 0) {
                  return prevChats.map(c => (String(c._id) === String(chat._id) ? chat : c));
                }
                return [chat, ...prevChats];
              });
            }
          }
          return;
        }
        case 'readReceipt': {
          setSelectedChat(prevSelectedChat => {
            if (prevSelectedChat?._id && String(chat._id) === String(prevSelectedChat._id)) {
              return chat;
            }
            return prevSelectedChat;
          });

          if (user.username in chat.participants) {
            const participants = Object.keys(chat.participants);
            if (participants.length > 2 || chat.isCommunityChat) {
              setChats(prevChats => {
                const existingIndex = prevChats.findIndex(c => String(c._id) === String(chat._id));
                if (existingIndex >= 0) {
                  return prevChats.map(c => (String(c._id) === String(chat._id) ? chat : c));
                }
                return prevChats;
              });
            }
          }
          return;
        }
        case 'newParticipant': {
          if (user.username in chat.participants) {
            const participants = Object.keys(chat.participants);
            if (participants.length > 2 || chat.isCommunityChat) {
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
        if (prevSelectedChat) {
          if (prevSelectedChat.messages.some(m => String(m._id) === String(msg._id))) {
            return {
              ...prevSelectedChat,
              messages: prevSelectedChat.messages.map(m =>
                String(m._id) === String(msg._id) ? { ...m, ...msg, user: m.user } : m,
              ),
            };
          }
        }
        return prevSelectedChat;
      });
    };

    const handleTypingIndicator = (payload: TypingIndicatorPayload) => {
      if (!selectedChatIdRef.current || payload.chatID !== String(selectedChatIdRef.current)) {
        return;
      }

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

    // Set up socket listeners
    socket.on('chatUpdate', handleChatUpdate);
    socket.on('messageUpdate', handleMessageUpdate);
    socket.on('typingIndicator', handleTypingIndicator);

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

      if (selectedChat) {
        Object.keys(selectedChat.participants).forEach(username => {
          if (username !== user.username) {
            usernames.add(username);
          }
        });
      }

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

    if (chats.length > 0 || selectedChat) {
      fetchParticipantUsers();
    }
  }, [chats, participantUsers, selectedChat, user.username]);

  useEffect(() => {
    if (!socket) return;

    const handleUserStatusUpdate = (payload: {
      username: string;
      isOnline: boolean;
      showOnlineStatus: boolean;
    }) => {
      setParticipantUsers(prev => {
        const existing = prev.get(payload.username);
        if (!existing) {
          return prev;
        }
        const updated = new Map(prev);
        updated.set(payload.username, {
          ...existing,
          isOnline: payload.isOnline,
          showOnlineStatus: payload.showOnlineStatus,
        });
        return updated;
      });
    };

    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      setParticipantUsers(prev => {
        const updated = new Map(prev);
        updated.set(payload.user.username, payload.user);
        return updated;
      });
    };

    socket.on('userStatusUpdate', handleUserStatusUpdate);
    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userStatusUpdate', handleUserStatusUpdate);
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket]);

  const allMessages: DatabaseMessage[] = selectedChat
    ? selectedChat.messages
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
        }))
        .sort((a, b) => new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime())
    : [];

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!selectedChat?._id) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0 && !isTypingRef.current) {
      socket.emit('typingStart', { chatID: String(selectedChat._id), username: user.username });
      isTypingRef.current = true;
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && selectedChat?._id) {
        socket.emit('typingStop', { chatID: String(selectedChat._id), username: user.username });
        isTypingRef.current = false;
      }
      typingTimeoutRef.current = null;
    }, 3000);
  };

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
      setTypingUsers(new Set());
    };
  }, [socket, user.username]);

  return {
    selectedChat,
    chats,
    messages: allMessages,
    newMessage,
    setNewMessage: handleTyping,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateGroupChat,
    handleCreateCommunityChat,
    refreshChat,
    error,
    typingUsers,
    selectedUsersForGroup,
    setSelectedUsersForGroup,
    groupChatName,
    setGroupChatName,
    isCreatingCommunityChat,
    setIsCreatingCommunityChat,
    selectedCommunity,
    setSelectedCommunity,
    communities,
    participantUsers,
  };
};

export default useGroupChat;
