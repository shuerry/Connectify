import mongoose from 'mongoose';
import ChatModel from '../../models/chat.model';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import {
  saveChat,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../../services/chat.service';
import { Chat, DatabaseChat } from '../../types/types';
import { user } from '../mockData.models';
import { NotificationService } from '../../services/notification.service';
import NotificationModel from '../../models/notification.model';

describe('Chat service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveChat', () => {
    const mockChatPayload: Chat = {
      participants: { ['user1']: false },
      messages: [
        {
          msg: 'Hello!',
          msgFrom: 'user1',
          msgDateTime: new Date('2025-01-01T00:00:00.000Z'),
          type: 'direct',
        },
      ],
    };

    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(user);

      jest.spyOn(MessageModel, 'create').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01T00:00:00Z'),
        type: 'direct',
      } as unknown as ReturnType<typeof MessageModel.create>);

      jest.spyOn(ChatModel, 'create').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ReturnType<typeof ChatModel.create>);

      const result = await saveChat(mockChatPayload);

      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(typeof result.participants).toBe('object');
      expect(Array.isArray(result.messages)).toBe(true);
      expect(Object.keys(result.participants)[0].toString()).toEqual(expect.any(String));
      expect(result.messages[0].toString()).toEqual(expect.any(String));
    });

    it('should return an error if an exception occurs', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(MessageModel, 'create').mockResolvedValueOnce({
        error: 'Error when saving a message',
      } as unknown as ReturnType<typeof MessageModel.create>);

      const result = await saveChat(mockChatPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error when saving a message');
      }
    });
  });

  const asLeanQuery = <T>(value: T) => ({
    lean: jest.fn().mockResolvedValue(value),
  });

  describe('addMessageToChat', () => {
    const chatId = new mongoose.Types.ObjectId(); // DB shape: ObjectId
    const messageId = new mongoose.Types.ObjectId(); // DB shape: ObjectId

    const chatIdString = chatId.toString(); // function inputs: strings
    const messageIdString = messageId.toString();

    beforeEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    it('happy path: pushes message, creates DB notifications for enabled non-sender participants, and emails verified recipients', async () => {
      // Updated chat returned by findByIdAndUpdate (DB doc shape)
      const updatedChat: DatabaseChat = {
        _id: chatId,
        participants: {
          alice: true, // sender (skipped)
          bob: true, // enabled → DB notif + email
          charlie: false, // disabled → skipped
        },
        messages: [messageId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Sender message (lean result)
      const messageDoc = {
        _id: messageId,
        msgFrom: 'alice',
        msg: 'hello world',
      };

      // Recipient lookup (lean results)
      const bobUser = { username: 'bob', email: 'bob@example.com', emailVerified: true };

      // Spies/mocks
      jest.spyOn(ChatModel, 'findByIdAndUpdate').mockResolvedValue(updatedChat as any);
      jest.spyOn(MessageModel, 'findById').mockReturnValue(asLeanQuery(messageDoc) as any);

      const findOneSpy = jest.spyOn(UserModel, 'findOne').mockImplementation((cond: any) => {
        if (cond?.username === 'bob') return asLeanQuery(bobUser) as any;
        return asLeanQuery(null) as any;
      });

      const notifCreateSpy = jest.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
      const sendEmailSpy = jest
        .spyOn(NotificationService.prototype, 'sendChatNotification')
        .mockResolvedValue(undefined as any);

      const result = await addMessageToChat(chatIdString, messageIdString);

      // Returned updated chat (ObjectIds inside)
      expect('error' in (result as any)).toBe(false);
      expect(result).toEqual(updatedChat);

      // Calls use STRING ids (function inputs)
      expect(ChatModel.findByIdAndUpdate).toHaveBeenCalledWith(
        chatIdString,
        { $push: { messages: messageIdString } },
        { new: true },
      );
      expect(MessageModel.findById).toHaveBeenCalledWith(messageIdString);
      expect(findOneSpy).toHaveBeenCalledTimes(1); // only bob
      expect(findOneSpy).toHaveBeenCalledWith({ username: 'bob' });

      // DB notification created only for bob
      expect(notifCreateSpy).toHaveBeenCalledTimes(1);
      expect(notifCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: 'bob',
          kind: 'chat',
          title: expect.stringContaining('alice'),
          link: `/chat/${chatIdString}`, // link uses string id
          actorUsername: 'alice',
          meta: { chatId: chatIdString, isMention: false }, // meta uses string id
        }),
      );

      // Email notification sent to bob
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          toEmail: ['bob@example.com'],
          fromName: 'alice',
          chatId: chatIdString, // string id
          isMention: false,
          messagePreview: 'hello world',
        }),
      );
    });

    it('returns {error} when chat is not found', async () => {
      jest.spyOn(ChatModel, 'findByIdAndUpdate').mockResolvedValue(null as any);

      // create spies so "not called" assertions are valid
      const findByIdSpy = jest.spyOn(MessageModel, 'findById');
      const findOneSpy = jest.spyOn(UserModel, 'findOne');
      const notifSpy = jest.spyOn(NotificationModel, 'create');
      const emailSpy = jest.spyOn(NotificationService.prototype, 'sendChatNotification');

      const result = await addMessageToChat(chatIdString, messageIdString);

      expect(result).toHaveProperty('error');
      expect(findByIdSpy).not.toHaveBeenCalled();
      expect(findOneSpy).not.toHaveBeenCalled();
      expect(notifSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
    });

    it('returns {error} when message cannot be found after save', async () => {
      const updatedChat: DatabaseChat = {
        _id: chatId,
        participants: { alice: true, bob: true },
        messages: [messageId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findByIdAndUpdate').mockResolvedValue(updatedChat as any);
      jest.spyOn(MessageModel, 'findById').mockReturnValue(asLeanQuery(null) as any);

      // spies for "not called"
      const findOneSpy = jest.spyOn(UserModel, 'findOne');
      const notifSpy = jest.spyOn(NotificationModel, 'create');
      const emailSpy = jest.spyOn(NotificationService.prototype, 'sendChatNotification');

      const result = await addMessageToChat(chatIdString, messageIdString);

      expect(result).toHaveProperty('error');
      expect(findOneSpy).not.toHaveBeenCalled();
      expect(notifSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
    });

    it('creates DB notifications but skips email when user has no verified email', async () => {
      const updatedChat: DatabaseChat = {
        _id: chatId,
        participants: { alice: true, bob: true },
        messages: [messageId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findByIdAndUpdate').mockResolvedValue(updatedChat as any);
      jest
        .spyOn(MessageModel, 'findById')
        .mockReturnValue(asLeanQuery({ _id: messageId, msgFrom: 'alice', msg: 'ping' }) as any);

      // bob exists but lacks a verified email
      jest
        .spyOn(UserModel, 'findOne')
        .mockReturnValue(
          asLeanQuery({ username: 'bob', email: null, emailVerified: false }) as any,
        );

      const notifCreateSpy = jest.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
      const sendEmailSpy = jest
        .spyOn(NotificationService.prototype, 'sendChatNotification')
        .mockResolvedValue(undefined as any);

      const result = await addMessageToChat(chatIdString, messageIdString);

      expect('error' in (result as any)).toBe(false);
      expect(result).toEqual(updatedChat);

      // DB notif created for bob, but email skipped
      expect(notifCreateSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('swallows email service errors and still returns the updated chat', async () => {
      const updatedChat: DatabaseChat = {
        _id: chatId,
        participants: { alice: true, bob: true },
        messages: [messageId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findByIdAndUpdate').mockResolvedValue(updatedChat as any);
      jest
        .spyOn(MessageModel, 'findById')
        .mockReturnValue(
          asLeanQuery({ _id: messageId, msgFrom: 'alice', msg: 'hello again' }) as any,
        );
      jest
        .spyOn(UserModel, 'findOne')
        .mockReturnValue(
          asLeanQuery({ username: 'bob', email: 'bob@example.com', emailVerified: true }) as any,
        );

      jest.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
      jest
        .spyOn(NotificationService.prototype, 'sendChatNotification')
        .mockRejectedValue(new Error('SMTP down'));

      const result = await addMessageToChat(chatIdString, messageIdString);

      // Still returns the updated chat object
      expect('error' in (result as any)).toBe(false);
      expect(result).toEqual(updatedChat);
    });
  });

  describe('getChat', () => {
    it('should retrieve a chat by ID', async () => {
      const mockFoundChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['testUser']: false },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findOne').mockResolvedValueOnce(mockFoundChat);
      const result = await getChat(mockFoundChat._id.toString());

      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockFoundChat._id);
    });

    it('should return an error if the chat is not found', async () => {
      jest.spyOn(ChatModel, 'findOne').mockResolvedValueOnce(null);

      const result = await getChat('anyChatId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(ChatModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await getChat('dbFailChatId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error retrieving chat:');
      }
    });
  });

  describe('addParticipantToChat', () => {
    it('should add a participant if user exists', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        username: 'testUser',
      });

      const mockChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['testUser']: false },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findOneAndUpdate').mockResolvedValueOnce(mockChat);

      const result = await addParticipantToChat(mockChat._id.toString(), 'newUserId');
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockChat._id);
    });

    it('should return an error if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

      const result = await addParticipantToChat('anyChatId', 'nonExistentUser');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('User does not exist.');
      }
    });

    it('should return an error if chat is not found', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
        _id: 'validUserId',
      });
      jest.spyOn(ChatModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await addParticipantToChat('anyChatId', 'validUserId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found or user already a participant.');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
        _id: 'validUserId',
      });
      jest.spyOn(ChatModel, 'findOneAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await addParticipantToChat('chatId', 'validUserId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error adding participant to chat:');
      }
    });
  });

  describe('getChatsByParticipants (exists semantics)', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    it('returns chats that include all provided participants (key presence regardless of boolean)', async () => {
      const input = ['alice', 'bob'];

      const mockChats = [
        {
          _id: 'chat-1',
          messages: ['m1'],
          participants: { alice: true, bob: false, carol: true }, // bob present but false is still a match
        },
        {
          _id: 'chat-2',
          messages: [],
          participants: { alice: false, bob: true },
        },
      ];

      // Make ChatModel.find() return an object that has .lean(), which resolves to mockChats
      const findSpy = jest.spyOn(ChatModel, 'find').mockReturnValue({} as any);
      (findSpy as any).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockChats),
      });

      const result = await getChatsByParticipants(input);

      // Verify query shape: dotted keys with $exists: true
      expect(ChatModel.find).toHaveBeenCalledWith({
        $and: [
          { 'participants.alice': { $exists: true } },
          { 'participants.bob': { $exists: true } },
        ],
      });

      // Should return what .lean() resolved to
      expect(result).toEqual(mockChats);
    });

    it('returns [] when the underlying read rejects or throws', async () => {
      const input = ['alice', 'bob'];

      const findSpy = jest.spyOn(ChatModel, 'find').mockReturnValue({} as any);
      (findSpy as any).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB down')),
      });

      const result = await getChatsByParticipants(input);
      expect(result).toEqual([]);
    });
  });
});
