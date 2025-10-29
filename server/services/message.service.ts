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
export const getDirectMessages = async (user1: string, user2: string): Promise<DatabaseMessage[]> => {
  try {
    const messages: DatabaseMessage[] = await MessageModel.find({
      $or: [
        { msgFrom: user1, msgTo: user2, type: 'direct' },
        { msgFrom: user2, msgTo: user1, type: 'direct' },
        { msgFrom: user1, msgTo: user2, type: 'friendRequest' },
        { msgFrom: user2, msgTo: user1, type: 'friendRequest' },
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
