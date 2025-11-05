import MessageModel from '../models/messages.model';
import UserModel from '../models/users.model';
import { DatabaseMessage, DatabaseUser, Message, MessageResponse } from '../types/types';
import { addFriend } from './user.service';

/**
 * Saves a new message to the database.
 * @param {Message} message - The message to save
 * @returns {Promise<MessageResponse>} - The saved message or an error message
 */
export const saveMessage = async (message: Message): Promise<MessageResponse> => {
  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username: message.msgFrom });

    if (!user) {
      throw new Error('Message sender is invalid or does not exist.');
    }

    const result: DatabaseMessage = await MessageModel.create(message);
    return result;
  } catch (error) {
    return { error: `Error when saving a message: ${(error as Error).message}` };
  }
};

/**
 * Retrieves all global messages from the database, sorted by date in ascending order.
 * @returns {Promise<DatabaseMessage[]>} - An array of messages or an empty array if error occurs.
 */
export const getMessages = async (): Promise<DatabaseMessage[]> => {
  try {
    const messages: DatabaseMessage[] = await MessageModel.find({ type: 'global' });
    messages.sort((a, b) => a.msgDateTime.getTime() - b.msgDateTime.getTime());

    return messages;
  } catch (error) {
    return [];
  }
};

/**
 * Retrieves direct messages between two users, sorted by date in ascending order.
 * @param {string} user1 - First user's username
 * @param {string} user2 - Second user's username
 * @returns {Promise<DatabaseMessage[]>} - An array of messages or an empty array if error occurs.
 */
export const getDirectMessages = async (
  user1: string,
  user2: string,
): Promise<DatabaseMessage[]> => {
  try {
    const messages: DatabaseMessage[] = await MessageModel.find({
      $or: [
        { msgFrom: user1, msgTo: user2, type: 'direct' },
        { msgFrom: user2, msgTo: user1, type: 'direct' },
        { msgFrom: user1, msgTo: user2, type: 'friendRequest' },
        { msgFrom: user2, msgTo: user1, type: 'friendRequest' },
        { msgFrom: user1, msgTo: user2, type: 'gameInvitation' },
        { msgFrom: user2, msgTo: user1, type: 'gameInvitation' },
      ],
    });
    messages.sort((a, b) => a.msgDateTime.getTime() - b.msgDateTime.getTime());

    return messages;
  } catch (error) {
    return [];
  }
};

/**
 * Updates a friend request status and adds both users as friends if accepted.
 * @param {string} messageId - The message ID of the friend request
 * @param {string} status - The new status ('accepted' or 'declined')
 * @param {string} responderUsername - The username of the user responding to the request
 * @returns {Promise<MessageResponse>} - The updated message or an error message
 */
export const updateFriendRequestStatus = async (
  messageId: string,
  status: 'accepted' | 'declined',
  responderUsername: string,
): Promise<MessageResponse> => {
  try {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return { error: 'Friend request not found' };
    }

    if (message.type !== 'friendRequest') {
      return { error: 'Not a friend request message' };
    }

    if (message.msgTo !== responderUsername) {
      return { error: 'Unauthorized to respond to this request' };
    }

    // Update the message status
    const updatedMessage = await MessageModel.findByIdAndUpdate(
      messageId,
      { friendRequestStatus: status },
      { new: true },
    );

    if (!updatedMessage) {
      return { error: 'Failed to update friend request' };
    }

    // If accepted, add both users as friends
    if (status === 'accepted') {
      await addFriend(message.msgFrom, message.msgTo!);
      await addFriend(message.msgTo!, message.msgFrom);
    }

    return updatedMessage;
  } catch (error) {
    return { error: `Error updating friend request: ${(error as Error).message}` };
  }
};

/**
 * Sends a game invitation through chat messages.
 * @param {string} fromUsername - The username of the user sending the invitation
 * @param {string} toUsername - The username of the user receiving the invitation
 * @param {string} gameID - The ID of the game
 * @param {string} roomName - The name of the room
 * @param {string} gameType - The type of game
 * @param {string} roomCode - Optional room code for private rooms
 * @returns {Promise<MessageResponse>} - The saved message or an error message
 */
export const sendGameInvitation = async (
  fromUsername: string,
  toUsername: string,
  gameID: string,
  roomName: string,
  gameType: 'Connect Four',
  roomCode?: string,
): Promise<MessageResponse> => {
  try {
    // Validate both sender and recipient exist
    const [fromUser, toUser] = await Promise.all([
      UserModel.findOne({ username: fromUsername }),
      UserModel.findOne({ username: toUsername })
    ]);

    if (!fromUser) {
      return { error: 'Sender does not exist' };
    }

    if (!toUser) {
      return { error: `User ${toUsername} does not exist` };
    }

    const message: Message = {
      msg: `${fromUsername} invited you to join their ${gameType} game: "${roomName}"${roomCode ? ` (Code: ${roomCode})` : ''}`,
      msgFrom: fromUsername,
      msgTo: toUsername,
      msgDateTime: new Date(),
      type: 'gameInvitation',
      gameInvitation: {
        gameID,
        roomName,
        roomCode,
        gameType,
        status: 'pending',
      },
    };

    return await saveMessage(message);
  } catch (error) {
    return { error: `Error sending game invitation: ${(error as Error).message}` };
  }
};

/**
 * Updates a game invitation status.
 * @param {string} messageId - The message ID of the game invitation
 * @param {string} status - The new status ('accepted' or 'declined')
 * @param {string} responderUsername - The username of the user responding to the invitation
 * @returns {Promise<MessageResponse>} - The updated message or an error message
 */
export const updateGameInvitationStatus = async (
  messageId: string,
  status: 'accepted' | 'declined',
  responderUsername: string,
): Promise<MessageResponse> => {
  try {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return { error: 'Game invitation not found' };
    }

    if (message.type !== 'gameInvitation') {
      return { error: 'Not a game invitation message' };
    }

    if (message.msgTo !== responderUsername) {
      return { error: 'Unauthorized to respond to this invitation' };
    }

    if (!message.gameInvitation) {
      return { error: 'Invalid game invitation data' };
    }

    // Update the message status
    const updatedMessage = await MessageModel.findByIdAndUpdate(
      messageId,
      { 'gameInvitation.status': status },
      { new: true },
    );

    if (!updatedMessage) {
      return { error: 'Failed to update game invitation' };
    }

    return updatedMessage;
  } catch (error) {
    return { error: `Error updating game invitation: ${(error as Error).message}` };
  }
};
