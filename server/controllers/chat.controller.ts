import express, { Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  saveChat,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
  toggleNotify,
  getCommunityChat,
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
  Message,
} from '../types/types';
import { saveMessage, markMessagesAsRead } from '../services/message.service';
import { getRelations } from '../services/user.service';
import { getCommunity } from '../services/community.service';

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
    const { participants, messages, name, isCommunityChat, communityId } = req.body;
    // Format messages - add 'direct' type if not present (friend requests already have type)
    const formattedMessages = messages.map(m => {
      // If message already has a type (like friendRequest), use it; otherwise default to 'direct'
      if ('type' in m && m.type) {
        return m as Message;
      }
      return { ...m, type: 'direct' as const };
    });

    try {
      const participantUsernames = Object.keys(participants);

      // For community chats, validate that the creator is the community admin
      if (isCommunityChat && communityId) {
        const community = await getCommunity(communityId);
        if ('error' in community) {
          res.status(404).send('Community not found');
          return;
        }

        // Get the creator (first participant in the list)
        const creator = participantUsernames[0];
        if (community.admin !== creator) {
          res.status(403).send('Only the community admin can create a community chat');
          return;
        }

        // Check if a community chat already exists for this community
        const existingCommunityChat = await getCommunityChat(communityId);
        if (!('error' in existingCommunityChat)) {
          // Community chat already exists, return it instead of creating a new one
          const populatedChat = await populateDocument(
            existingCommunityChat._id.toString(),
            'chat',
          );

          if ('error' in populatedChat) {
            throw new Error(populatedChat.error);
          }

          res.json(populatedChat);
          return;
        }

        // For community chats, skip friend validation - all community members can participate
        // Continue to chat creation below
      } else {
        // For 2-person chats, check if a chat already exists between these participants
        if (participantUsernames.length === 2) {
          const existingChats = await getChatsByParticipants(participantUsernames);

          // Filter to only 2-person chats with exactly these participants
          const matchingChats = existingChats.filter(chat => {
            const chatParticipants = Object.keys(chat.participants);
            return (
              chatParticipants.length === 2 &&
              chatParticipants.includes(participantUsernames[0]) &&
              chatParticipants.includes(participantUsernames[1])
            );
          });

          // If a chat already exists, return it instead of creating a new one
          if (matchingChats.length > 0) {
            const existingChat = matchingChats[0];
            const populatedChat = await populateDocument(existingChat._id.toString(), 'chat');

            if ('error' in populatedChat) {
              throw new Error(populatedChat.error);
            }

            res.json(populatedChat);
            return;
          }
        }

        // Validate that for 2-person chats, participants must be friends
        // UNLESS the chat contains only friend request messages (which are created automatically)
        const hasOnlyFriendRequests = formattedMessages.every(m => m.type === 'friendRequest');

        if (participantUsernames.length === 2 && !hasOnlyFriendRequests) {
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

        // For regular group chats (not community chats), validate that all participants are friends with the creator
        // (the first participant in the list is considered the creator)
        if (participantUsernames.length > 2) {
          // Check if a group chat with the exact same participants already exists
          const existingChats = await getChatsByParticipants(participantUsernames);

          // Filter to group chats (3+ participants, not community chats) with exactly these participants
          const matchingGroupChats = existingChats.filter(chat => {
            const chatParticipants = Object.keys(chat.participants);
            return (
              chatParticipants.length === participantUsernames.length &&
              chatParticipants.length > 2 &&
              !chat.isCommunityChat &&
              participantUsernames.every(p => chatParticipants.includes(p)) &&
              chatParticipants.every(p => participantUsernames.includes(p))
            );
          });

          // If a group chat with the same participants already exists, return it
          if (matchingGroupChats.length > 0) {
            const existingChat = matchingGroupChats[0];
            const populatedChat = await populateDocument(existingChat._id.toString(), 'chat');

            if ('error' in populatedChat) {
              throw new Error(populatedChat.error);
            }

            res.json(populatedChat);
            return;
          }

          const creator = participantUsernames[0];
          const creatorRelations = await getRelations(creator);
          if ('error' in creatorRelations) {
            throw new Error(creatorRelations.error);
          }

          // Check that creator is friends with all other participants
          for (const participant of participantUsernames.slice(1)) {
            if (!creatorRelations.friends.includes(participant)) {
              res
                .status(403)
                .send(`You must be friends with ${participant} to add them to a group chat`);
              return;
            }
          }
        }
      }

      const savedChat = await saveChat({
        participants,
        messages: formattedMessages,
        name,
        isCommunityChat: isCommunityChat || false,
        communityId: communityId ? new ObjectId(communityId) : undefined,
      });

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
      // Get the chat to check participants
      const chat = await getChat(chatId);
      if ('error' in chat) {
        throw new Error(chat.error);
      }

      // For community chats, skip friend validation - all community members can message
      // For 2-person chats, check if participants are friends before allowing regular messages
      if (!chat.isCommunityChat) {
        const participantUsernames = Object.keys(chat.participants);
        if (participantUsernames.length === 2) {
          const [user1, user2] = participantUsernames;

          // Check if user1 has user2 as a friend
          const user1Relations = await getRelations(user1);
          if ('error' in user1Relations) {
            throw new Error(user1Relations.error);
          }

          // Check if user2 has user1 as a friend (bidirectional check)
          const user2Relations = await getRelations(user2);
          if ('error' in user2Relations) {
            throw new Error(user2Relations.error);
          }

          // If they're not friends, prevent sending regular messages
          if (!user1Relations.friends.includes(user2) || !user2Relations.friends.includes(user1)) {
            res.status(403).send('You can only send messages to users who are your friends');
            return;
          }
        }
      }

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
      // Get the chat to check if it's a group chat
      const chat = await getChat(chatId);
      if ('error' in chat) {
        throw new Error(chat.error);
      }

      const participantUsernames = Object.keys(chat.participants);

      // Only allow adding participants to group chats (3+ participants)
      if (participantUsernames.length < 2) {
        res.status(400).send('Cannot add participants to this chat');
        return;
      }

      // For group chats, validate that the user adding the participant is friends with them
      // We'll use the first participant as the requester (in practice, you'd get this from auth)
      // For now, we'll check that the new participant is friends with at least one existing participant
      const requesterRelations = await getRelations(participantUsernames[0]);
      if ('error' in requesterRelations) {
        throw new Error(requesterRelations.error);
      }

      if (!requesterRelations.friends.includes(userId)) {
        res.status(403).send(`You must be friends with ${userId} to add them to the group chat`);
        return;
      }

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
      res.json(populatedChat);
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

    conn.on('joinUserRoom', (username: string) => {
      if (!username) return;
      conn.join(`user:${username}`);
    });

    conn.on('leaveUserRoom', (username: string) => {
      if (!username) return;
      conn.leave(`user:${username}`);
    });

    // Handle typing indicators for direct messages
    conn.on('typingStart', (data: { chatID?: string; username: string }) => {
      const { chatID, username } = data;
      if (chatID) {
        // Direct message chat - emit to others in the chat room
        conn.to(chatID).emit('typingIndicator', {
          username,
          chatID,
          isTyping: true,
        });
      }
    });

    conn.on('typingStop', (data: { chatID?: string; username: string }) => {
      const { chatID, username } = data;
      if (chatID) {
        // Direct message chat - emit to others in the chat room
        conn.to(chatID).emit('typingIndicator', {
          username,
          chatID,
          isTyping: false,
        });
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

  /**
   * Marks messages in a chat as read by a user.
   * @param req The request object containing the chat ID and username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when messages are marked as read.
   * @throws {Error} Throws an error if the operation fails.
   */
  const markMessagesAsReadRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;
    const { username } = req.body;

    try {
      const result = await markMessagesAsRead(chatId, username);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Emit chat update to notify other participants
      const chat = await getChat(chatId);
      if (!('error' in chat)) {
        const populatedChat = await populateDocument(chat._id.toString(), 'chat');
        if (!('error' in populatedChat)) {
          socket.to(chatId).emit('chatUpdate', {
            chat: populatedChat as PopulatedDatabaseChat,
            type: 'readReceipt',
          });
        }
      }

      res.json(result);
    } catch (err: unknown) {
      res.status(500).send(`Error marking messages as read: ${(err as Error).message}`);
    }
  };

  // Register the routes
  router.post('/createChat', createChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.get('/:chatId', getChatRoute);
  router.post('/:chatId/addParticipant', addParticipantToChatRoute);
  router.get('/getChatsByUser/:username', getChatsByUserRoute);
  router.post('/:chatId/toggleNotify', toggleNotifyRoute);
  router.post('/:chatId/markAsRead', markMessagesAsReadRoute);

  return router;
};

export default chatController;
