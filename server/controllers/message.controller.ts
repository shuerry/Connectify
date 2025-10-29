import express, { Response, Request } from 'express';
import { FakeSOSocket, AddMessageRequest } from '../types/types';
import { saveMessage, getMessages, getDirectMessages, updateFriendRequestStatus } from '../services/message.service';

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

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addMessageRoute);
  router.get('/getMessages', getMessagesRoute);
  router.post('/addDirectMessage', addDirectMessageRoute);
  router.get('/getDirectMessages', getDirectMessagesRoute);
  router.post('/respondToFriendRequest', respondToFriendRequestRoute);

  return router;
};

export default messageController;
