import { ObjectId } from 'mongodb';
import { Message, PopulatedDatabaseChat } from '../types/types';
import api from './config';

const CHAT_API_URL = `/api/chat`;

/**
 * Fetches all chats associated with a given user.
 *
 * @param username - The username of the user whose chats are to be fetched.
 * @returns The list of chats for the specified user.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getChatsByUser = async (username: string): Promise<PopulatedDatabaseChat[]> => {
  const res = await api.get(`${CHAT_API_URL}/getChatsByUser/${username}`);

  if (res.status !== 200) {
    throw new Error('Error when fetching chats for user');
  }

  return res.data;
};

/**
 * Fetches a chat by its unique ID.
 *
 * @param chatID - The ID of the chat to fetch.
 * @returns The details of the chat with the specified ID.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getChatById = async (chatID: ObjectId): Promise<PopulatedDatabaseChat> => {
  const res = await api.get(`${CHAT_API_URL}/${chatID}`);

  if (res.status !== 200) {
    throw new Error('Error when fetching chat by ID');
  }

  return res.data;
};

/**
 * Sends a message to a specific chat.
 *
 * @param message - The message to be sent, excluding the 'type' property.
 * @param chatID - The ID of the chat to which the message will be added.
 * @returns The updated chat data after the message has been sent.
 * @throws Throws an error if the message could not be added to the chat.
 */
export const sendMessage = async (
  message: Omit<Message, 'type'>,
  chatID: ObjectId,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/${chatID}/addMessage`, message);

  if (res.status !== 200) {
    throw new Error('Error when adding message to chat');
  }

  return res.data;
};

/**
 * Creates a new chat with the specified participants.
 *
 * @param participants - An array of user IDs representing the participants of the chat.
 * @param name - Optional name for group chats.
 * @param isCommunityChat - Whether this is a community chat.
 * @param communityId - Community ID if this is a community chat.
 * @returns The newly created chat data.
 * @throws Throws an error if the chat creation fails or if the status code is not 200.
 */
export const createChat = async (
  participants: Record<string, boolean>,
  name?: string,
  isCommunityChat?: boolean,
  communityId?: string,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/createChat`, {
    participants,
    messages: [],
    name,
    isCommunityChat,
    communityId,
  });

  if (res.status !== 200) {
    throw new Error('Error when adding message to chat');
  }

  return res.data;
};

export const toggleNotify = async (
  chatID: ObjectId,
  username: string,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/${chatID}/toggleNotify`, { username });
  if (res.status !== 200) {
    throw new Error('Error when toggling notification status for chat');
  }
  return res.data;
};

/**
 * Marks messages in a chat as read by a user.
 *
 * @param chatID - The ID of the chat.
 * @param username - The username of the user marking messages as read.
 * @returns A success response.
 * @throws Throws an error if the operation fails.
 */
export const markMessagesAsRead = async (
  chatID: ObjectId,
  username: string,
): Promise<{ success: boolean }> => {
  const res = await api.post(`${CHAT_API_URL}/${chatID}/markAsRead`, { username });
  if (res.status !== 200) {
    throw new Error('Error when marking messages as read');
  }
  return res.data;
};

/**
 * Adds a participant to an existing chat.
 *
 * @param chatID - The ID of the chat.
 * @param username - The username of the participant to add.
 * @returns The updated chat data.
 * @throws Throws an error if the operation fails.
 */
export const addParticipant = async (
  chatID: ObjectId,
  username: string,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/${chatID}/addParticipant`, { username });
  if (res.status !== 200) {
    throw new Error('Error when adding participant to chat');
  }
  return res.data;
};
