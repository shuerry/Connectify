import { ObjectId } from 'mongodb';
import { useEffect, useState } from 'react';
import {
  ChatUpdatePayload,
  DatabaseMessage,
  Message,
  MessageUpdatePayload,
  PopulatedDatabaseChat,
  SafeDatabaseUser,
} from '../types/types';
import useUserContext from './useUserContext';
import { createChat, getChatById, getChatsByUser, sendMessage } from '../services/chatService';
import { getDirectMessages } from '../services/messageService';
import { getRelations } from '../services/userService';

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

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedChat?._id) {
      // Check if users are friends before sending message
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
        if (errorMessage.includes('must be friends') || errorMessage.includes('only send messages')) {
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
              console.error('Error fetching direct messages:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error refreshing chat:', err);
      }
    }
  };

  const handleChatSelect = async (chatID: ObjectId | undefined) => {
    if (!chatID) {
      setError('Invalid chat ID');
      setSelectedChat(null);
      setDirectMessages([]);
      return;
    }

    const chat = await getChatById(chatID);
    setSelectedChat(chat);
    handleJoinChat(chatID);

    // Fetch direct messages (friend requests, game invitations, etc.) between participants
    const participants = Object.keys(chat.participants);
    if (participants.length === 2) {
      const otherParticipant = participants.find(p => p !== user.username);
      if (otherParticipant) {
        try {
          const directMsgs = await getDirectMessages(user.username, otherParticipant);
          setDirectMessages(directMsgs);
        } catch (err) {
          console.error('Error fetching direct messages:', err);
          setDirectMessages([]);
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
      // Use existing chat instead of creating a new one
      setSelectedChat(existingChat);
      handleJoinChat(existingChat._id);
      setShowCreatePanel(false);
      setError(null);

      // Fetch direct messages (friend requests, game invitations, etc.) between participants
      try {
        const directMsgs = await getDirectMessages(user.username, chatToCreate);
        setDirectMessages(directMsgs);
      } catch (err) {
        console.error('Error fetching direct messages:', err);
        setDirectMessages([]);
      }
      return;
    }

    // No existing chat found, create a new one
    try {
      const chat = await createChat({ [user.username]: true, [chatToCreate]: true });
      setSelectedChat(chat);
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setError(null);

      // Fetch direct messages (friend requests, game invitations, etc.) between participants
      try {
        const directMsgs = await getDirectMessages(user.username, chatToCreate);
        setDirectMessages(directMsgs);
      } catch (err) {
        console.error('Error fetching direct messages:', err);
        setDirectMessages([]);
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
    const fetchChats = async () => {
      const userChats = await getChatsByUser(user.username);
      setChats(userChats);
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created': {
          if (user.username in chat.participants) {
            setChats(prevChats => [chat, ...prevChats]);
          }
          return;
        }
        case 'newMessage': {
          if (selectedChat?._id && chat._id === selectedChat._id) {
            setSelectedChat(chat);
          }
          return;
        }
        case 'newParticipant': {
          if (user.username in chat.participants) {
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
      }
    };

    const handleMessageUpdate = (messageUpdate: MessageUpdatePayload) => {
      const { msg } = messageUpdate;
      
      // If this is a direct message (friend request, game invitation, etc.) for the current chat
      if (selectedChat) {
        const participants = Object.keys(selectedChat.participants);
        const otherParticipant = participants.find(p => p !== user.username);
        
        if (
          otherParticipant &&
          ((msg.msgFrom === user.username && msg.msgTo === otherParticipant) ||
           (msg.msgFrom === otherParticipant && msg.msgTo === user.username) ||
           (msg.type === 'friendRequest' && participants.includes(msg.msgFrom) && participants.includes(msg.msgTo || '')))
        ) {
          // Update direct messages
          setDirectMessages(prev => {
            const existingIndex = prev.findIndex(m => String(m._id) === String(msg._id));
            if (existingIndex >= 0) {
              // Update existing message
              return prev.map((m, idx) => (idx === existingIndex ? msg : m));
            } else {
              // Add new message
              return [...prev, msg].sort((a, b) => 
                new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime()
              );
            }
          });

          // Also update the chat if the message is in the chat's messages
          if (selectedChat.messages.some(m => String(m._id) === String(msg._id))) {
            setSelectedChat(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: prev.messages.map(m => 
                  String(m._id) === String(msg._id) 
                    ? { ...m, ...msg, user: m.user } // Preserve user field
                    : m
                ),
              };
            });
          }
        }
      }
    };

    fetchChats();

    socket.on('chatUpdate', handleChatUpdate);
    socket.on('messageUpdate', handleMessageUpdate);

    return () => {
      socket.off('chatUpdate', handleChatUpdate);
      socket.off('messageUpdate', handleMessageUpdate);
      socket.emit('leaveChat', String(selectedChat?._id));
    };
  }, [user.username, socket, selectedChat]);

  // Merge chat messages with direct messages (friend requests, game invitations, etc.)
  // Convert MessageInChat to DatabaseMessage format for consistency
  const allMessages: DatabaseMessage[] = selectedChat
    ? [
        ...selectedChat.messages.map(msg => ({
          _id: msg._id,
          msg: msg.msg,
          msgFrom: msg.msgFrom,
          msgDateTime: msg.msgDateTime,
          type: msg.type,
          msgTo: msg.msgTo,
          friendRequestStatus: msg.friendRequestStatus,
          gameInvitation: msg.gameInvitation,
        })),
        ...directMessages.filter(
          dm =>
            !selectedChat.messages.some(
              cm => String(cm._id) === String(dm._id)
            )
        ),
      ].sort(
        (a, b) =>
          new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime()
      )
    : [];

  return {
    selectedChat,
    chatToCreate,
    chats,
    messages: allMessages,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
    refreshChat,
    error,
  };
};

export default useDirectMessage;