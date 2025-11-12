/* eslint-disable no-console */
import express, { Response, Request } from 'express';
import { FakeSOSocket, AddMessageRequest, PopulatedDatabaseChat} from '../types/types';
import {
  saveMessage,
  getMessages,
  getDirectMessages,
  updateFriendRequestStatus,
  sendGameInvitation,
  updateGameInvitationStatus,
} from '../services/message.service';
import { getChatsByParticipants, saveChat, addMessageToChat } from '../services/chat.service';
import { populateDocument } from '../utils/database.util';

const messageController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Handles adding a new message. The message is first validated and then saved.
   * If the message is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddMessageRequest object containing the message and chat data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addMessageRoute = async (req: AddMessageRequest, res: Response): Promise<void> => {
    const { messageToAdd: msg } = req.body;

    try {
      const msgFromDb = await saveMessage({ ...msg, type: 'global' });

      if ('error' in msgFromDb) {
        throw new Error(msgFromDb.error);
      }

      socket.emit('messageUpdate', { msg: msgFromDb });

      res.json(msgFromDb);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding a message: ${(err as Error).message}`);
    }
  };

  /**
   * Fetch all global messages in ascending order of their date and time.
   * @param req The request object.
   * @param res The HTTP response object used to send back the messages.
   * @returns A Promise that resolves to void.
   */
  const getMessagesRoute = async (_: Request, res: Response): Promise<void> => {
    const messages = await getMessages();
    res.json(messages);
  };

  /**
   * Handles adding a direct message or friend request.
   */
  const addDirectMessageRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageToAdd: msg } = req.body;
      const msgFromDb = await saveMessage(msg);

      if ('error' in msgFromDb) {
        throw new Error(msgFromDb.error);
      }

      // If this is a friend request, create or find a chat between the two users
      if (msg.type === 'friendRequest' && msg.msgTo) {
        const participants = { [msg.msgFrom]: true, [msg.msgTo]: true };

        // Check if a chat already exists between these users
        let existingChats = await getChatsByParticipants([msg.msgFrom, msg.msgTo]);

        // Filter to only 2-person chats with exactly these participants
        existingChats = existingChats.filter(chat => {
          const chatParticipants = Object.keys(chat.participants);
          return (
            chatParticipants.length === 2 &&
            chatParticipants.includes(msg.msgFrom) &&
            chatParticipants.includes(msg.msgTo)
          );
        });

        let chat;
        if (existingChats.length > 0) {
          // Use existing chat
          chat = existingChats[0];
          // Add the friend request message to the existing chat
          const updatedChat = await addMessageToChat(chat._id.toString(), msgFromDb._id.toString());
          if ('error' in updatedChat) {
            console.error('Error adding friend request to chat:', updatedChat.error);
          } else {
            chat = updatedChat;
            // Emit chatUpdate for existing chat
            const populatedChat = await populateDocument(chat._id.toString(), 'chat');
            if (!('error' in populatedChat)) {
              socket.emit('chatUpdate', {
                chat: populatedChat as PopulatedDatabaseChat,
                type: 'newMessage',
              });
            }
          }
        } else {
          // Create new chat with the friend request message
          // Use saveChat but with an empty messages array, then add the message
          // This avoids saving the message twice
          const newChat = await saveChat({
            participants,
            messages: [],
          });

          if ('error' in newChat) {
            console.error('Error creating chat for friend request:', newChat.error);
          } else {
            // Add the friend request message to the chat
            const updatedChat = await addMessageToChat(
              newChat._id.toString(),
              msgFromDb._id.toString(),
            );
            if ('error' in updatedChat) {
              console.error('Error adding friend request to new chat:', updatedChat.error);
              chat = newChat;
            } else {
              chat = updatedChat;
            }
          }
        }

        // Emit chatUpdate so both users see it in their sidebar
        if (chat && !('error' in chat)) {
          const populatedChat = await populateDocument(chat._id.toString(), 'chat');
          if (!('error' in populatedChat)) {
            socket.emit('chatUpdate', {
              chat: populatedChat as PopulatedDatabaseChat,
              type: 'created',
            });
          }
        }
      }

      socket.emit('messageUpdate', { msg: msgFromDb });
      res.json(msgFromDb);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding a direct message: ${(err as Error).message}`);
    }
  };

  /**
   * Fetch direct messages between two users.
   */
  const getDirectMessagesRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user1, user2 } = req.query as { user1: string; user2: string };
      const messages = await getDirectMessages(user1, user2);
      res.json(messages);
    } catch (err: unknown) {
      res.status(500).send(`Error when fetching direct messages: ${(err as Error).message}`);
    }
  };

  /**
   * Handle friend request response (accept/decline).
   */
  const respondToFriendRequestRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, status, responderUsername } = req.body;
      const result = await updateFriendRequestStatus(messageId, status, responderUsername);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('messageUpdate', { msg: result });
      res.json(result);
    } catch (err: unknown) {
      res.status(500).send(`Error when responding to friend request: ${(err as Error).message}`);
    }
  };

  /**
   * Send a game invitation through chat.
   */
  const sendGameInvitationRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Received game invitation request:', req.body);
      const { fromUsername, toUsername, gameID, roomName, gameType, roomCode } = req.body;
      console.log('Calling sendGameInvitation service...');
      const result = await sendGameInvitation(
        fromUsername,
        toUsername,
        gameID,
        roomName,
        gameType,
        roomCode,
      );
      console.log('Service result:', result);

      if ('error' in result) {
        console.log('Service returned error:', result.error);
        throw new Error(result.error);
      }

      console.log('Emitting messageUpdate and sending response');
      socket.emit('messageUpdate', { msg: result });
      res.json(result);
    } catch (err: unknown) {
      console.error('Controller error:', err);
      res.status(500).send(`Error when sending game invitation: ${(err as Error).message}`);
    }
  };

  /**
   * Handle game invitation response (accept/decline).
   */
  const respondToGameInvitationRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, status, responderUsername } = req.body;
      const result = await updateGameInvitationStatus(messageId, status, responderUsername);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('messageUpdate', { msg: result });
      res.json(result);
    } catch (err: unknown) {
      res.status(500).send(`Error when responding to game invitation: ${(err as Error).message}`);
    }
  };

  // Handle typing indicators for global chat
  socket.on('connection', conn => {
    conn.on('typingStart', (data: { chatID?: string; username: string }) => {
      const { chatID, username } = data;
      if (!chatID) {
        // Global chat - broadcast to all clients except the sender
        conn.broadcast.emit('typingIndicator', {
          username,
          isTyping: true,
        });
      }
    });

    conn.on('typingStop', (data: { chatID?: string; username: string }) => {
      const { chatID, username } = data;
      if (!chatID) {
        // Global chat - broadcast to all clients except the sender
        conn.broadcast.emit('typingIndicator', {
          username,
          isTyping: false,
        });
      }
    });
  });

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addMessageRoute);
  router.get('/getMessages', getMessagesRoute);
  router.post('/addDirectMessage', addDirectMessageRoute);
  router.get('/getDirectMessages', getDirectMessagesRoute);
  router.post('/respondToFriendRequest', respondToFriendRequestRoute);
  router.post('/sendGameInvitation', sendGameInvitationRoute);
  router.post('/respondToGameInvitation', respondToGameInvitationRoute);

  return router;
};

export default messageController;
