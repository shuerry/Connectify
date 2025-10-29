import api from './config';
import { DatabaseMessage, Message } from '../types/types';

const MESSAGE_API_URL = `/api/message`;

/**
 * Interface extending the request body when adding a message, which contains:
 * - messageToAdd - The message being added.
 */
interface AddMessageRequestBody {
  messageToAdd: Message;
}

/**
 * Interface extending the request body when adding a direct message, which contains:
 * - messageToAdd - The message being added.
 */
interface AddDirectMessageRequestBody {
  messageToAdd: Message;
}

/**
 * Adds a new message to a specific chat with the given id.
 *
 * @param messageToAdd - The message object to add to the chat.
 * @throws an error if the request fails or the response status is not 200.
 */
const addMessage = async (messageToAdd: Omit<Message, 'type'>): Promise<DatabaseMessage> => {
  const reqBody: AddMessageRequestBody = {
    messageToAdd: { ...messageToAdd, type: 'global' },
  };
  const res = await api.post(`${MESSAGE_API_URL}/addMessage`, reqBody);
  if (res.status !== 200) {
    throw new Error('Error while adding a new message to a chat');
  }
  return res.data;
};

/**
 * Adds a direct message or friend request.
 *
 * @param messageToAdd - The message object to add.
 * @throws an error if the request fails or the response status is not 200.
 */
const addDirectMessage = async (messageToAdd: Message): Promise<DatabaseMessage> => {
  const reqBody: AddDirectMessageRequestBody = {
    messageToAdd,
  };
  const res = await api.post(`${MESSAGE_API_URL}/addDirectMessage`, reqBody);
  if (res.status !== 200) {
    throw new Error('Error while adding a direct message');
  }
  return res.data;
};

/**
 * Fetches direct messages between two users.
 *
 * @param user1 - First user's username
 * @param user2 - Second user's username
 * @throws an error if the request fails or the response status is not 200.
 */
const getDirectMessages = async (user1: string, user2: string): Promise<DatabaseMessage[]> => {
  const res = await api.get(`${MESSAGE_API_URL}/getDirectMessages?user1=${user1}&user2=${user2}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching direct messages');
  }
  return res.data;
};

/**
 * Responds to a friend request (accept or decline).
 *
 * @param messageId - The message ID of the friend request
 * @param status - The response status ('accepted' or 'declined')
 * @param responderUsername - The username of the user responding
 * @throws an error if the request fails or the response status is not 200.
 */
const respondToFriendRequest = async (
  messageId: string,
  status: 'accepted' | 'declined',
  responderUsername: string,
): Promise<DatabaseMessage> => {
  const res = await api.post(`${MESSAGE_API_URL}/respondToFriendRequest`, {
    messageId,
    status,
    responderUsername,
  });
  if (res.status !== 200) {
    throw new Error('Error when responding to friend request');
  }
  return res.data;
};

/**
 * Function to fetch all messages in ascending order of their date and time.
 * @param user The user to fetch their chat for
 * @throws Error if there is an issue fetching the list of chats.
 */
const getMessages = async (): Promise<DatabaseMessage[]> => {
  const res = await api.get(`${MESSAGE_API_URL}/getMessages`);
  if (res.status !== 200) {
    throw new Error('Error when fetching list of chats for the given user');
  }
  return res.data;
};

export { addMessage, getMessages, addDirectMessage, getDirectMessages, respondToFriendRequest };
