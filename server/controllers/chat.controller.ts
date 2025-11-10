import express, { Response } from 'express';
import {
  saveChat,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
  toggleNotify,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  FakeSOSocket,
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
  PopulatedDatabaseChat,
} from '../types/types';
import { saveMessage } from '../services/message.service';
import { getRelations } from '../services/user.service';

/*
 * This controller handles chat-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the chat routes.
 * @throws {Error} Throws an error if the chat creation fails.
 */
const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Creates a new chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    const { participants, messages } = req.body;
    const formattedMessages = messages.map(m => ({ ...m, type: 'direct' as 'direct' | 'global' }));

    try {
      // Validate that for 2-person chats, participants must be friends
      const participantUsernames = Object.keys(participants);
      if (participantUsernames.length === 2) {
        const [user1, user2] = participantUsernames;
        
        // Check if user1 has user2 as a friend
        const user1Relations = await getRelations(user1);
        if ('error' in user1Relations) {
          throw new Error(user1Relations.error);
        }
        
        if (!user1Relations.friends.includes(user2)) {
          res.status(403).send('Users must be friends to create a direct message chat');
          return;
        }
        
        // Check if user2 has user1 as a friend (bidirectional check)
        const user2Relations = await getRelations(user2);
        if ('error' in user2Relations) {
          throw new Error(user2Relations.error);
        }
        
        if (!user2Relations.friends.includes(user1)) {
          res.status(403).send('Users must be friends to create a direct message chat');
          return;
        }
      }

      const savedChat = await saveChat({ participants, messages: formattedMessages });

      if ('error' in savedChat) {
        throw new Error(savedChat.error);
      }

      // Enrich the newly created chat with message details
      const populatedChat = await populateDocument(savedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', { chat: populatedChat as PopulatedDatabaseChat, type: 'created' });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a chat: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToChatRoute = async (
    req: AddMessageRequestToChat,
    res: Response,
  ): Promise<void> => {
    const { chatId } = req.params;
    const { msg, msgFrom, msgDateTime } = req.body;

    try {
      // Create a new message in the DB
      const newMessage = await saveMessage({ msg, msgFrom, msgDateTime, type: 'direct' });

      if ('error' in newMessage) {
        throw new Error(newMessage.error);
      }

      // Associate the message with the chat
      const updatedChat = await addMessageToChat(chatId, newMessage._id.toString());

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      // Enrich the updated chat for the response
      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');

      socket
        .to(chatId)
        .emit('chatUpdate', { chat: populatedChat as PopulatedDatabaseChat, type: 'newMessage' });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding a message to chat: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves a chat by its ID, optionally populating participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;

    try {
      const foundChat = await getChat(chatId);

      if ('error' in foundChat) {
        throw new Error(foundChat.error);
      }

      const populatedChat = await populateDocument(foundChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves chats for a user based on their username.
   * @param req The request object containing the username parameter in `req.params`.
   * @param res The response object to send the result, either the populated chats or an error message.
   * @returns {Promise<void>} A promise that resolves when the chats are successfully retrieved and populated.
   */
  const getChatsByUserRoute = async (
    req: GetChatByParticipantsRequest,
    res: Response,
  ): Promise<void> => {
    const { username } = req.params;

    try {
      const chats = await getChatsByParticipants([username]);

      const populatedChats = await Promise.all(
        chats.map(chat => populateDocument(chat._id.toString(), 'chat')),
      );

      if (populatedChats.some(chat => 'error' in chat)) {
        throw new Error('Failed populating all retrieved chats');
      }

      res.json(populatedChats);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a participant to an existing chat.
   * @param req The request object containing the participant data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToChatRoute = async (
    req: AddParticipantRequest,
    res: Response,
  ): Promise<void> => {
    const { chatId } = req.params;
    const { username: userId } = req.body;

    try {
      const updatedChat = await addParticipantToChat(chatId, userId);

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseChat,
        type: 'newParticipant',
      });
      res.json(updatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding participant to chat: ${(err as Error).message}`);
    }
  };

  socket.on('connection', conn => {
    conn.on('joinChat', (chatID: string) => {
      conn.join(chatID);
    });

    conn.on('leaveChat', (chatID: string | undefined) => {
      if (chatID) {
        conn.leave(chatID);
      }
    });
  });

  /**
   * Toggles the notification status for a user in a chat.
   * @param req The request object containing the chat ID and username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the notification status is toggled.
   * @throws {Error} Throws an error if the toggle operation fails.
   */
  const toggleNotifyRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;
    const { username } = req.body;

    try {
      const updatedChat = await toggleNotify(chatId, username);

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');
      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error toggling notification status: ${(err as Error).message}`);
    }
  };

  // Register the routes
  router.post('/createChat', createChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.get('/:chatId', getChatRoute);
  router.post('/:chatId/addParticipant', addParticipantToChatRoute);
  router.get('/getChatsByUser/:username', getChatsByUserRoute);
  router.post('/:chatId/toggleNotify', toggleNotifyRoute);

  return router;
};

export default chatController;
