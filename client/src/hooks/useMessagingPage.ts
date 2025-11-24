import { useState, useEffect, useRef } from 'react';
import useUserContext from './useUserContext';
import {
  DatabaseMessage,
  Message,
  MessageUpdatePayload,
  TypingIndicatorPayload,
} from '../types/types';
import { addMessage, getMessages } from '../services/messageService';
import filter from 'leo-profanity';

/**
 * Custom hook that handles the logic for the messaging page.
 *
 * @returns messages - The list of messages.
 * @returns newMessage - The new message to be sent.
 * @returns setNewMessage - The function to set the new message.
 * @returns handleSendMessage - The function to handle sending a new message.
 * @returns typingUsers - The list of users currently typing.
 */
const useMessagingPage = () => {
  const { user, socket } = useUserContext();
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterReason, setFilterReason] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs = await getMessages();
      setMessages(msgs.filter(msg => !msg.isDeleted));
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    // Ensure the profanity dictionary is available before checking text
    filter.loadDictionary('en');
  }, []);

  useEffect(() => {
    const handleMessageUpdate = (data: MessageUpdatePayload) => {
      const { msg } = data;

      if (msg.type !== 'global') {
        return;
      }

      setMessages(prev => {
        const existingIndex = prev.findIndex(existing => String(existing._id) === String(msg._id));

        if (msg.isDeleted) {
          if (existingIndex === -1) {
            return prev;
          }
          const next = [...prev];
          next.splice(existingIndex, 1);
          return next;
        }

        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], ...msg };
          return next;
        }

        return [...prev, msg].sort(
          (a, b) => new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime(),
        );
      });
    };

    const handleTypingIndicator = (payload: TypingIndicatorPayload) => {
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

    socket.on('messageUpdate', handleMessageUpdate);
    socket.on('typingIndicator', handleTypingIndicator);

    return () => {
      socket.off('messageUpdate', handleMessageUpdate);
      socket.off('typingIndicator', handleTypingIndicator);
    };
  }, [socket, user.username]);

  /**
   * Handles sending a new message.
   *
   * @returns void
   */
  const handleSendMessage = async () => {
    if (newMessage === '') {
      setError('Message cannot be empty');
      return;
    }

    setError('');

    // Check for profanity before sending
    const hits = filter.badWordsUsed(newMessage);
    if (hits.length > 0) {
      setFilterReason(
        `Your message contains inappropriate language. Please remove: ${hits.join(', ')}`,
      );
      setIsFilterModalOpen(true);
      return;
    }

    // Stop typing indicator when sending message
    if (isTypingRef.current) {
      socket.emit('typingStop', { username: user.username });
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const newMsg: Omit<Message, 'type'> = {
      msg: newMessage,
      msgFrom: user.username,
      msgDateTime: new Date(),
    };

    await addMessage(newMsg);

    setNewMessage('');
  };

  /**
   * Handles typing events - emits typingStart/typingStop with debouncing
   */
  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user started typing and wasn't typing before, emit typingStart
    if (value.length > 0 && !isTypingRef.current) {
      socket.emit('typingStart', { username: user.username });
      isTypingRef.current = true;
    }

    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit('typingStop', { username: user.username });
        isTypingRef.current = false;
      }
      typingTimeoutRef.current = null;
    }, 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        socket.emit('typingStop', { username: user.username });
      }
    };
  }, [socket, user.username]);

  return {
    messages,
    newMessage,
    setNewMessage: handleTyping,
    handleSendMessage,
    error,
    typingUsers,
    isFilterModalOpen,
    setIsFilterModalOpen,
    filterReason,
  };
};

export default useMessagingPage;
