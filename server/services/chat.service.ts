import { ObjectId } from 'mongodb';
import ChatModel from '../models/chat.model';
import UserModel from '../models/users.model';
import { Chat, ChatResponse, DatabaseChat, MessageResponse, DatabaseUser } from '../types/types';
import { saveMessage } from './message.service';
import { NotificationService } from './notification.service';
import MessageModel from '../models/messages.model';
import NotificationModel from '../models/notification.model';

/**
 * Saves a new chat, storing any messages provided as part of the argument.
 * @param chatPayload - The chat object containing full message data.
 * @returns {Promise<ChatResponse>} - The saved chat or an error message.
 */
export const saveChat = async (chatPayload: Chat): Promise<ChatResponse> => {
  try {
    // Save the messages provided in the arugment to the database
    const messageIds: ObjectId[] = await Promise.all(
      chatPayload.messages.map(async msg => {
        const savedMessage: MessageResponse = await saveMessage(msg);

        if ('error' in savedMessage) {
          throw new Error(savedMessage.error);
        }

        return savedMessage._id;
      }),
    );

    // Create the chat using participant IDs and saved message IDs
    return await ChatModel.create({
      participants: chatPayload.participants,
      messages: messageIds,
    });
  } catch (error) {
    return { error: `Error saving chat: ${error}` };
  }
};

/**
 * Adds a message ID to a chat.
 * @param chatId - The ID of the chat to update.
 * @param messageId - The ID of the message to add.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const addMessageToChat = async (
  chatId: string,
  messageId: string,
): Promise<ChatResponse> => {
  try {
    const updatedChat: DatabaseChat | null = await ChatModel.findByIdAndUpdate(
      chatId,
      { $push: { messages: messageId } },
      { new: true },
    ).lean<DatabaseChat>();

    if (!updatedChat) {
      throw new Error('Chat not found');
    }

    const messageDoc = await MessageModel.findById(messageId).lean();
    if (!messageDoc) {
      throw new Error('Message not found after save');
    }

    const senderUsername: string = messageDoc.msgFrom;
    const messagePreview: string = (messageDoc.msg || '')
      .toString()
      .replace(/\s+/g, ' ')
      .slice(0, 140);

    // for future group chats
    const groupName = undefined;

    // ---- PARTICIPANTS ----
    const participants = updatedChat.participants as Record<string, boolean>;

    const toEmail: string[] = [];

    for (const [username, isEnabled] of Object.entries(participants)) {
      if (!isEnabled) continue;
      if (username === senderUsername) continue;

      const recipientUser = await UserModel.findOne({ username }).lean();

      // --- CREATE DB NOTIFICATION ---
      await NotificationModel.create({
        recipient: username,
        kind: 'chat',
        title: `New message from ${senderUsername}`,
        preview: messagePreview,
        link: `/messaging/direct-message`,
        actorUsername: senderUsername,
        meta: { chatId, isMention: false },
      });

      // ---- EMAIL NOTIFICATIONS ----
      if (!recipientUser || !recipientUser.email || !recipientUser.emailVerified) {
        // console.warn(
        //   `Skipping email notify for "${username}" (no user or no email) in chat: ${chatId}`,
        // );
        continue;
      }

      toEmail.push(recipientUser.email);
    }

    if (toEmail.length > 0) {
      try {
        await new NotificationService().sendChatNotification({
          toEmail,
          fromName: senderUsername,
          chatId,
          messagePreview,
          groupName,
          isMention: false,
        });
      } catch (notifyErr) {
        //console.error(`Failed to send chat notification to chat: ${chatId}:`, notifyErr);
      }
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error adding message to chat: ${error}` };
  }
};

/**
 * Retrieves a chat document by its ID.
 * @param chatId - The ID of the chat to retrieve.
 * @returns {Promise<ChatResponse>} - The chat or an error message.
 */
export const getChat = async (chatId: string): Promise<ChatResponse> => {
  try {
    const chat: DatabaseChat | null = await ChatModel.findById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    return chat;
  } catch (error) {
    return { error: `Error retrieving chat: ${error}` };
  }
};

/**
 * Retrieves chats that include all the provided participants.
 * @param p - An array of participant usernames or IDs.
 * @returns {Promise<DatabaseChat[]>} - An array of matching chats or an empty array.
 */
export const getChatsByParticipants = async (p: string[]): Promise<DatabaseChat[]> => {
  try {
    const andConditions = p.map(username => ({
      [`participants.${username}`]: { $exists: true },
    }));

    const chats = await ChatModel.find({ $and: andConditions }).lean<DatabaseChat[]>();

    if (!chats) {
      throw new Error('Chat not found with the provided participants');
    }

    return chats ?? [];
  } catch {
    return [];
  }
};

/**
 * Adds a participant to an existing chat.
 * @param chatId - The ID of the chat to update.
 * @param userId - The user ID to add to the chat.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const addParticipantToChat = async (
  chatId: string,
  username: string,
): Promise<ChatResponse> => {
  try {
    // Validate if user exists
    const userExists: DatabaseUser | null = await UserModel.findOne({ username });

    if (!userExists) {
      throw new Error('User does not exist.');
    }

    const updatePath = `participants.${username}`;

    // Add participant if not already in the chat
    const updatedChat: DatabaseChat | null = await ChatModel.findOneAndUpdate(
      { _id: chatId, [updatePath]: { $ne: true } },
      { $set: { [updatePath]: true } },
      { new: true }, // Return the updated document
    );

    if (!updatedChat) {
      throw new Error('Chat not found or user already a participant.');
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error adding participant to chat: ${(error as Error).message}` };
  }
};

/**
 * Toggles the notification preference for a participant in a chat.
 * @param chatId - The ID of the chat to update.
 * @param username - The username of the participant whose preference is to be toggled.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const toggleNotify = async (chatId: string, username: string): Promise<ChatResponse> => {
  try {
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const participantsMap = chat.participants as unknown as Map<string, boolean>;

    const current = participantsMap.get(username) ?? false;
    participantsMap.set(username, !current);

    const updatedChat = await chat.save();
    return updatedChat as DatabaseChat;
  } catch (error) {
    return { error: `Error toggling notification status: ${(error as Error).message}` };
  }
};
