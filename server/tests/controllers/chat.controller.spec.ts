import mongoose from 'mongoose';
import supertest from 'supertest';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { createServer } from 'http';
import { io as Client, type Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { app } from '../../app';
import * as messageService from '../../services/message.service';
import * as chatService from '../../services/chat.service';
import * as databaseUtil from '../../utils/database.util';
import { DatabaseChat, PopulatedDatabaseChat, Message, DatabaseCommunity } from '../../types/types';
import chatController from '../../controllers/chat.controller';
import * as communityService from '../../services/community.service';
import * as userService from '../../services/user.service';

/**
 * Spies on the service functions
 */
let saveChatSpy: jest.SpyInstance;
let saveMessageSpy: jest.SpyInstance;
let addMessageSpy: jest.SpyInstance;
let getChatSpy: jest.SpyInstance;
let addParticipantSpy: jest.SpyInstance;
let populateDocumentSpy: jest.SpyInstance;
let getChatsByParticipantsSpy: jest.SpyInstance;
let getCommunitySpy: jest.SpyInstance;
let getCommunityChatSpy: jest.SpyInstance;
let getRelationsSpy: jest.SpyInstance;
let markMessagesAsReadSpy: jest.SpyInstance;
let toggleNotifySpy: jest.SpyInstance;

beforeEach(() => {
  saveChatSpy = jest.spyOn(chatService, 'saveChat');
  saveMessageSpy = jest.spyOn(messageService, 'saveMessage');
  addMessageSpy = jest.spyOn(chatService, 'addMessageToChat');
  getChatSpy = jest.spyOn(chatService, 'getChat');
  addParticipantSpy = jest.spyOn(chatService, 'addParticipantToChat');
  populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');
  getChatsByParticipantsSpy = jest.spyOn(chatService, 'getChatsByParticipants');
  getCommunitySpy = jest.spyOn(communityService, 'getCommunity');
  getCommunityChatSpy = jest.spyOn(chatService, 'getCommunityChat');
  getRelationsSpy = jest.spyOn(userService, 'getRelations');
  markMessagesAsReadSpy = jest.spyOn(messageService, 'markMessagesAsRead');
  toggleNotifySpy = jest.spyOn(chatService, 'toggleNotify');
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Sample test suite for the /chat endpoints
 */
describe('Chat Controller', () => {
  describe('POST /chat/createChat', () => {
    it.skip('should create a new chat successfully', async () => {
      const validChatPayload = {
        participants: { ['user1']: false, ['user2']: false },
        messages: [{ msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') }],
      };

      const serializedPayload = {
        ...validChatPayload,
        messages: validChatPayload.messages.map(message => ({
          ...message,
          type: 'direct',
          msgDateTime: message.msgDateTime.toISOString(),
        })),
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false, ['user2']: false },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChatResponse: PopulatedDatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false, ['user2']: false },
        messages: [
          {
            _id: chatResponse.messages[0],
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
            },
            type: 'direct',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChatResponse);

      const response = await supertest(app).post('/api/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: populatedChatResponse._id.toString(),
        participants: populatedChatResponse.participants,
        messages: populatedChatResponse.messages.map(message => ({
          ...message,
          _id: message._id.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: populatedChatResponse.createdAt.toISOString(),
        updatedAt: populatedChatResponse.updatedAt.toISOString(),
      });

      expect(saveChatSpy).toHaveBeenCalledWith(serializedPayload);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatResponse._id.toString(), 'chat');
    });

    it('should return 400 if participants array is invalid', async () => {
      const invalidPayload = {
        participants: {},
        messages: [],
      };

      const response = await supertest(app).post('/api/chat/createChat').send(invalidPayload);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].message).toBe('must NOT have fewer than 1 properties');
    });

    it('should return 500 on service error', async () => {
      saveChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app)
        .post('/api/chat/createChat')
        .send({
          participants: { ['user1']: false },
          messages: [],
        });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating a chat: Service error');
    });

    it.skip('should return 500 on populateChat error', async () => {
      const validChatPayload = {
        participants: { ['user1']: false, ['user2']: false },
        messages: [{ msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') }],
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false, ['user2']: false },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue({ error: 'Provided ID is undefined.' });

      const response = await supertest(app).post('/api/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating a chat: Provided ID is undefined.');
    });

    it('should return existing community chat if one already exists', async () => {
      const communityId = new mongoose.Types.ObjectId().toString();
      const createPayload = {
        participants: { admin_user: true, user1: true },
        messages: [],
        isCommunityChat: true,
        communityId,
      };

      const community: DatabaseCommunity = {
        _id: new mongoose.Types.ObjectId(communityId),
        name: 'React Fans',
        description: 'test',
        admin: 'admin_user',
        participants: ['admin_user', 'user1'],
        visibility: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { admin_user: true, user1: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isCommunityChat: true,
        communityId: community._id,
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...existingChat,
        messages: [],
      };

      getCommunitySpy.mockResolvedValueOnce(community);
      getCommunityChatSpy.mockResolvedValueOnce(existingChat);
      populateDocumentSpy.mockResolvedValueOnce(populatedChat);

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(200);
      expect(saveChatSpy).not.toHaveBeenCalled();
      expect(getCommunityChatSpy).toHaveBeenCalledWith(communityId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(existingChat._id.toString(), 'chat');
      expect(response.body._id).toBe(populatedChat._id.toString());
    });

    it('should return existing group chat when participants match', async () => {
      const createPayload = {
        participants: { alice: true, bob: true, carol: true },
        messages: [],
      };

      const existingChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { alice: true, bob: true, carol: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...existingChat,
        messages: [],
      };

      getChatsByParticipantsSpy.mockResolvedValueOnce([existingChat]);
      populateDocumentSpy.mockResolvedValueOnce(populatedChat);

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(200);
      expect(saveChatSpy).not.toHaveBeenCalled();
      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith(['alice', 'bob', 'carol']);
      expect(populateDocumentSpy).toHaveBeenCalledWith(existingChat._id.toString(), 'chat');
      expect(response.body._id).toBe(populatedChat._id.toString());
    });

    it('should return 500 if populateDocument fails for an existing group chat', async () => {
      const createPayload = {
        participants: { alice: true, bob: true, carol: true },
        messages: [],
      };

      const existingChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { alice: true, bob: true, carol: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatsByParticipantsSpy.mockResolvedValueOnce([existingChat]);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Populate error' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating a chat: Populate error');
    });
  });

  describe('POST /chat/:chatId/addMessage', () => {
    it.skip('should add a message to chat successfully', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload: Message = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
        type: 'direct',
      };

      const serializedPayload = {
        ...messagePayload,
        msgDateTime: messagePayload.msgDateTime.toISOString(),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        ...messagePayload,
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: 'user1',
        },
      };

      const chatResponse: DatabaseChat = {
        _id: chatId,
        participants: { ['user1']: false, ['user2']: false },
        messages: [messageResponse._id],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      const populatedChatResponse: PopulatedDatabaseChat = {
        _id: chatId,
        participants: { ['user1']: false, ['user2']: false },
        messages: [messageResponse],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      saveMessageSpy.mockResolvedValue(messageResponse);
      addMessageSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChatResponse);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: populatedChatResponse._id.toString(),
        participants: populatedChatResponse.participants,
        messages: populatedChatResponse.messages.map(message => ({
          ...message,
          _id: message._id.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: populatedChatResponse.createdAt.toISOString(),
        updatedAt: populatedChatResponse.updatedAt.toISOString(),
      });

      expect(saveMessageSpy).toHaveBeenCalledWith(serializedPayload);
      expect(addMessageSpy).toHaveBeenCalledWith(chatId.toString(), messageResponse._id.toString());
      expect(populateDocumentSpy).toHaveBeenCalledWith(
        populatedChatResponse._id.toString(),
        'chat',
      );
    });

    it('should return 400 for missing chatId, msg, or msgFrom', async () => {
      const chatId = new mongoose.Types.ObjectId();

      const missingMsg = {
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };
      const response1 = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(missingMsg);
      expect(response1.status).toBe(400);

      const missingFrom = {
        msg: 'Hello!',
        msgDateTime: new Date('2025-01-01'),
      };
      const response2 = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(missingFrom);
      expect(response2.status).toBe(400);
    });

    it('should return 500 if addMessageToChat returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedMessage = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
        type: 'direct' as const,
      };

      getChatSpy.mockResolvedValue(chat);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: ['user2'], blockedUsers: [] })
        .mockResolvedValueOnce({ friends: ['user1'], blockedUsers: [] });
      saveMessageSpy.mockResolvedValue(savedMessage);
      addMessageSpy.mockResolvedValue({ error: 'Error updating chat' });

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding a message to chat: Error updating chat');
    });

    it.skip('should throw an error if message creation fails and does not return an _id', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload: Message = {
        msg: 'Hello',
        msgFrom: 'User1',
        msgDateTime: new Date(),
        type: 'direct',
      };

      saveMessageSpy.mockResolvedValue({ error: 'Error saving message' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chat: Error saving message');
    });

    it.skip('should throw an error if updatedChat returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload = { msg: 'Hello', msgFrom: 'User1', msgDateTime: new Date() };
      const mockMessage = {
        _id: new mongoose.Types.ObjectId(),
        type: 'direct' as 'direct' | 'global',
        ...messagePayload,
      };

      saveMessageSpy.mockResolvedValueOnce(mockMessage);
      addMessageSpy.mockResolvedValueOnce({ error: 'Error updating chat' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chat: Error updating chat');
    });

    it('should return 500 if populateDocument returns an error (GET /chat/:chatId)', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const foundChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['testUser']: false },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(foundChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Error populating chat' });

      const response = await supertest(app).get(`/api/chat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error populating chat');
      expect(getChatSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(foundChat._id.toString(), 'chat');
    });

    it('should return 500 if createMessage returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isCommunityChat: true, // skip friendship check
      };

      getChatSpy.mockResolvedValue(chat);
      saveMessageSpy.mockResolvedValue({ error: 'Service error' } as any);

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding a message to chat: Service error');
    });
  });

  describe('GET /chat/:chatId', () => {
    it('should retrieve a chat by ID', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const mockFoundChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPopulatedChat: PopulatedDatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false },
        messages: [
          {
            _id: new mongoose.Types.ObjectId(),
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01T00:00:00Z'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
            },
            type: 'direct',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(mockFoundChat);
      populateDocumentSpy.mockResolvedValue(mockPopulatedChat);

      const response = await supertest(app).get(`/api/chat/${chatId}`);

      expect(response.status).toBe(200);
      expect(getChatSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(mockFoundChat._id.toString(), 'chat');

      expect(response.body).toMatchObject({
        _id: mockPopulatedChat._id.toString(),
        participants: mockPopulatedChat.participants,
        messages: mockPopulatedChat.messages.map(m => ({
          _id: m._id.toString(),
          msg: m.msg,
          msgFrom: m.msgFrom,
          msgDateTime: m.msgDateTime.toISOString(),
          user: {
            _id: m.user?._id.toString(),
            username: m.user?.username,
          },
        })),
        createdAt: mockPopulatedChat.createdAt.toISOString(),
        updatedAt: mockPopulatedChat.updatedAt.toISOString(),
      });
    });

    it('should return 500 if getChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      getChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).get(`/api/chat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error retrieving chat: Service error');
    });
  });

  describe('POST /chat/:chatId/addParticipant', () => {
    let baseChat: DatabaseChat;

    beforeEach(() => {
      baseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue({ ...baseChat });
      getRelationsSpy.mockResolvedValue({
        friends: ['user1', 'user2', 'newUser'],
        blockedUsers: [],
      });
    });

    it('should add a participant to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = 'newUser';

      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false, ['user2']: false },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedUpdatedChat: PopulatedDatabaseChat = {
        _id: updatedChat._id,
        participants: { ['user1']: false, ['user2']: false },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addParticipantSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue(populatedUpdatedChat);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: userId });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: populatedUpdatedChat._id.toString(),
        participants: { ['user1']: false, ['user2']: false },
        messages: [],
        createdAt: populatedUpdatedChat.createdAt.toISOString(),
        updatedAt: populatedUpdatedChat.updatedAt.toISOString(),
      });

      expect(addParticipantSpy).toHaveBeenCalledWith(chatId, userId);
    });

    it('should return 400 if userId is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const response = await supertest(app).post(`/api/chat/${chatId}/addParticipant`).send({});
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 500 if addParticipantToChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = 'newUser';

      addParticipantSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: userId });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding participant to chat: Service error');
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if populateDocument fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = 'newUser';

      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { ['user1']: false, ['user2']: false },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addParticipantSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Provided ID is undefined.' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: userId });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding participant to chat: Provided ID is undefined.');
    });
  });

  describe('POST /chat/getChatsByUser/:username', () => {
    it('should return 200 with an array of chats', async () => {
      const username = 'user1';

      const chats: DatabaseChat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: { ['user1']: false, ['user2']: false },
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const populatedChats: PopulatedDatabaseChat[] = [
        {
          _id: chats[0]._id,
          participants: { ['user1']: false, ['user2']: false },
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      getChatsByParticipantsSpy.mockResolvedValueOnce(chats);
      populateDocumentSpy.mockResolvedValueOnce(populatedChats[0]);

      const response = await supertest(app).get(`/api/chat/getChatsByUser/${username}`);

      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith([username]);
      expect(populateDocumentSpy).toHaveBeenCalledWith(populatedChats[0]._id.toString(), 'chat');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject([
        {
          _id: populatedChats[0]._id.toString(),
          participants: { ['user1']: false, ['user2']: false },
          messages: [],
          createdAt: populatedChats[0].createdAt.toISOString(),
          updatedAt: populatedChats[0].updatedAt.toISOString(),
        },
      ]);
    });

    it('should return 500 if populateDocument fails for any chat', async () => {
      const username = 'user1';
      const chats: DatabaseChat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: { ['user1']: false, ['user2']: false },
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      getChatsByParticipantsSpy.mockResolvedValueOnce(chats);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Service error' });

      const response = await supertest(app).get(`/api/chat/getChatsByUser/${username}`);

      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith([username]);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chats[0]._id.toString(), 'chat');
      expect(response.status).toBe(500);
      expect(response.text).toBe('Error retrieving chat: Failed populating all retrieved chats');
    });
  });

  describe('Socket handlers', () => {
    let io: Server;
    let serverSocket: ServerSocket;
    let clientSocket: ClientSocket;

    beforeAll(done => {
      const httpServer = createServer();
      io = new Server(httpServer);
      chatController(io);

      httpServer.listen(() => {
        const { port } = httpServer.address() as AddressInfo;
        clientSocket = Client(`http://localhost:${port}`);
        io.on('connection', socket => {
          serverSocket = socket;
        });
        clientSocket.on('connect', done);
      });
    });

    afterAll(() => {
      clientSocket.disconnect();
      serverSocket.disconnect();
      io.close();
    });

    it('should join a chat room when "joinChat" event is emitted', done => {
      serverSocket.on('joinChat', (arg: any) => {
        expect(io.sockets.adapter.rooms.has('chat123')).toBeTruthy();
        expect(arg).toBe('chat123');
        done();
      });
      clientSocket.emit('joinChat', 'chat123');
    });

    it('should leave a chat room when "leaveChat" event is emitted', done => {
      serverSocket.on('joinChat', (arg: any) => {
        expect(io.sockets.adapter.rooms.has('chat123')).toBeTruthy();
        expect(arg).toBe('chat123');
      });
      serverSocket.on('leaveChat', (arg: any) => {
        expect(io.sockets.adapter.rooms.has('chat123')).toBeFalsy();
        expect(arg).toBe('chat123');
        done();
      });

      clientSocket.emit('joinChat', 'chat123');
      clientSocket.emit('leaveChat', 'chat123');
    });
  });

  describe('POST /chat/createChat - Additional Coverage', () => {
    it('should format messages with existing type correctly', async () => {
      const validChatPayload = {
        participants: { user1: true, user2: true },
        messages: [
          {
            msg: 'Friend request',
            msgFrom: 'user1',
            msgTo: 'user2',
            msgDateTime: new Date('2025-01-01'),
            type: 'friendRequest',
          },
        ],
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { user1: true, user2: true },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...chatResponse,
        messages: [],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: ['user2'], blockedUsers: [] })
        .mockResolvedValueOnce({ friends: ['user1'], blockedUsers: [] });
      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app).post('/api/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(200);
      expect(saveChatSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              type: 'friendRequest',
            }),
          ]),
        }),
      );
    });

    it('should return 404 if community not found', async () => {
      const communityId = new mongoose.Types.ObjectId().toString();
      const createPayload = {
        participants: { admin_user: true },
        messages: [],
        isCommunityChat: true,
        communityId,
      };

      getCommunitySpy.mockResolvedValue({ error: 'Community not found' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(404);
      expect(response.text).toBe('Community not found');
    });

    it('should return 403 if creator is not community admin', async () => {
      const communityId = new mongoose.Types.ObjectId().toString();
      const createPayload = {
        participants: { regular_user: true },
        messages: [],
        isCommunityChat: true,
        communityId,
      };

      const community: DatabaseCommunity = {
        _id: new mongoose.Types.ObjectId(communityId),
        name: 'React Fans',
        description: 'test',
        admin: 'admin_user',
        participants: ['admin_user', 'regular_user'],
        visibility: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getCommunitySpy.mockResolvedValue(community);

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Only the community admin can create a community chat');
    });

    it('should handle populateDocument error when returning existing community chat', async () => {
      const communityId = new mongoose.Types.ObjectId().toString();
      const createPayload = {
        participants: { admin_user: true },
        messages: [],
        isCommunityChat: true,
        communityId,
      };

      const community: DatabaseCommunity = {
        _id: new mongoose.Types.ObjectId(communityId),
        name: 'React Fans',
        description: 'test',
        admin: 'admin_user',
        participants: ['admin_user'],
        visibility: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { admin_user: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isCommunityChat: true,
        communityId: community._id,
      };

      getCommunitySpy.mockResolvedValue(community);
      getCommunityChatSpy.mockResolvedValue(existingChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Populate error' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a chat: Populate error');
    });

    it('should return existing 2-person chat if one exists', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [],
      };

      const existingChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...existingChat,
        messages: [],
      };

      getChatsByParticipantsSpy.mockResolvedValue([existingChat]);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(200);
      expect(saveChatSpy).not.toHaveBeenCalled();
      expect(response.body._id).toBe(populatedChat._id.toString());
    });

    it('should handle populateDocument error when returning existing 2-person chat', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [],
      };

      const existingChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatsByParticipantsSpy.mockResolvedValue([existingChat]);
      populateDocumentSpy.mockResolvedValue({ error: 'Populate error' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a chat: Populate error');
    });

    it('should return 403 if users are not friends for 2-person chat', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [{ msg: 'Hello', msgFrom: 'user1', msgDateTime: new Date() }],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: [], blockedUsers: [] })
        .mockResolvedValueOnce({ friends: [], blockedUsers: [] });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);
      expect(response.status).toBe(403);
      expect(response.text).toBe('Users must be friends to create a direct message chat');
    });

    it('should return 500 if getRelations returns error for user1', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [{ msg: 'Hello', msgFrom: 'user1', msgDateTime: new Date() }],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy.mockResolvedValue({ error: 'User not found' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a chat: User not found');
    });

    it('should return 403 if bidirectional friend check fails', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [{ msg: 'Hello', msgFrom: 'user1', msgDateTime: new Date() }],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: ['user2'], blockedUsers: [] })
        .mockResolvedValueOnce({ friends: [], blockedUsers: [] });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Users must be friends to create a direct message chat');
    });

    it('should return 500 if user2 getRelations returns error', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [{ msg: 'Hello', msgFrom: 'user1', msgDateTime: new Date() }],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: ['user2'], blockedUsers: [] })
        .mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a chat: User not found');
    });

    it('should allow creating chat with only friend request messages without friend check', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [
          {
            msg: 'Friend request',
            msgFrom: 'user1',
            msgTo: 'user2',
            msgDateTime: new Date(),
            type: 'friendRequest',
          },
        ],
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { user1: true, user2: true },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...chatResponse,
        messages: [],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(200);
      expect(getRelationsSpy).not.toHaveBeenCalled();
    });

    it('should return 403 if creator is not friends with all participants in group chat', async () => {
      const createPayload = {
        participants: { user1: true, user2: true, user3: true },
        messages: [],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy.mockResolvedValue({ friends: ['user2'], blockedUsers: [] });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(403);
      expect(response.text).toBe('You must be friends with user3 to add them to a group chat');
    });

    it('should return 500 if creator relations lookup fails for group chat creation', async () => {
      const createPayload = {
        participants: { user1: true, user2: true, user3: true },
        messages: [],
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      getRelationsSpy.mockResolvedValueOnce({ error: 'Relations lookup failed' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating a chat: Relations lookup failed');
    });

    it('should handle populateDocument error after saveChat', async () => {
      const createPayload = {
        participants: { user1: true, user2: true },
        messages: [
          {
            msg: 'Friend request',
            msgFrom: 'user1',
            msgTo: 'user2',
            msgDateTime: new Date(),
            type: 'friendRequest',
          },
        ],
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: { user1: true, user2: true },
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatsByParticipantsSpy.mockResolvedValue([]);
      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue({ error: 'Populate error' });

      const response = await supertest(app).post('/api/chat/createChat').send(createPayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a chat: Populate error');
    });
  });

  describe('POST /chat/:chatId/addMessage - Additional Coverage', () => {
    it('should return 500 if getChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      getChatSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chat: Chat not found');
    });

    it('should return 403 if users are not friends for 2-person chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chat);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: [], blockedUsers: [] })
        .mockResolvedValueOnce({ friends: [], blockedUsers: [] });

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(403);
      expect(response.text).toBe('You can only send messages to users who are your friends');
    });

    it('should return 500 if user1 getRelations returns error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chat);
      getRelationsSpy.mockResolvedValue({ error: 'User not found' });

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chat: User not found');
    });

    it('should return 500 if user2 getRelations returns error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chat);
      getRelationsSpy
        .mockResolvedValueOnce({ friends: ['user2'], blockedUsers: [] })
        .mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chat: User not found');
    });

    it('should allow messages in community chats without friend check', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isCommunityChat: true,
      };

      const messageId = new mongoose.Types.ObjectId();
      const savedMessage = {
        _id: messageId,
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
        type: 'direct' as const,
      };

      const updatedChat: DatabaseChat = {
        ...chat,
        messages: [messageId],
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...updatedChat,
        messages: [
          {
            ...savedMessage,
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
            },
          },
        ],
      };

      getChatSpy.mockResolvedValue(chat);
      saveMessageSpy.mockResolvedValue(savedMessage);
      addMessageSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(200);
      expect(getRelationsSpy).not.toHaveBeenCalled();
    });

    it('should return 200 even if populateDocument fails in addMessageToChatRoute', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isCommunityChat: true,
      };

      const messageId = new mongoose.Types.ObjectId();
      const savedMessage = {
        _id: messageId,
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
        type: 'direct' as const,
      };

      const updatedChat: DatabaseChat = {
        ...chat,
        messages: [messageId],
      };

      getChatSpy.mockResolvedValue(chat);
      saveMessageSpy.mockResolvedValue(savedMessage);
      addMessageSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Populate error' } as any);

      const response = await supertest(app).post(`/api/chat/${chatId}/addMessage`).send({
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ error: 'Populate error' });
    });
  });

  describe('POST /chat/:chatId/addParticipant - Additional Coverage', () => {
    it('should return 500 if getChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      getChatSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: 'newUser' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding participant to chat: Chat not found');
    });

    it('should return 400 if chat has less than 2 participants', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chat);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: 'newUser' });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Cannot add participants to this chat');
    });

    it('should return 500 if getRelations fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chat);
      getRelationsSpy.mockResolvedValue({ error: 'User not found' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: 'newUser' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding participant to chat: User not found');
    });

    it('should return 403 if requester is not friends with new participant', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chat);
      getRelationsSpy.mockResolvedValue({ friends: ['user2'], blockedUsers: [] });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ username: 'newUser' });

      expect(response.status).toBe(403);
      expect(response.text).toBe('You must be friends with newUser to add them to the group chat');
    });
  });

  describe('POST /chat/:chatId/toggleNotify', () => {
    it('should toggle notification status successfully', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: false, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...updatedChat,
        messages: [],
      };

      toggleNotifySpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/toggleNotify`)
        .send({ username: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(populatedChat._id.toString());
    });

    it('should return 500 if toggleNotify fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      toggleNotifySpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/toggleNotify`)
        .send({ username: 'user1' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error toggling notification status: Chat not found');
    });

    it('should return 500 if populateDocument fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: false, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      toggleNotifySpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Populate error' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/toggleNotify`)
        .send({ username: 'user1' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error toggling notification status: Populate error');
    });
  });

  describe('POST /chat/:chatId/markAsRead', () => {
    it('should mark messages as read successfully', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        ...chat,
        messages: [],
      };

      markMessagesAsReadSpy.mockResolvedValue({ success: true });
      getChatSpy.mockResolvedValue(chat);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/markAsRead`)
        .send({ username: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should return 500 if markMessagesAsRead fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      markMessagesAsReadSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/markAsRead`)
        .send({ username: 'user1' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error marking messages as read: Chat not found');
    });

    it('should handle getChat error gracefully', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      markMessagesAsReadSpy.mockResolvedValue({ success: true });
      getChatSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/markAsRead`)
        .send({ username: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should handle populateDocument error gracefully', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const chat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { user1: true, user2: true },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      markMessagesAsReadSpy.mockResolvedValue({ success: true });
      getChatSpy.mockResolvedValue(chat);
      populateDocumentSpy.mockResolvedValue({ error: 'Populate error' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/markAsRead`)
        .send({ username: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('Socket handlers - Additional Coverage', () => {
    let io: Server;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let serverAddress: string;

    beforeAll(done => {
      const httpServer = createServer();
      io = new Server(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });
      chatController(io);

      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        serverAddress = `http://localhost:${port}`;
        done();
      });
    });

    afterAll(done => {
      if (clientSocket1?.connected) {
        clientSocket1.disconnect();
      }
      if (clientSocket2?.connected) {
        clientSocket2.disconnect();
      }
      io.close();
      done();
    });

    afterEach(done => {
      if (clientSocket1?.connected) {
        clientSocket1.disconnect();
      }
      if (clientSocket2?.connected) {
        clientSocket2.disconnect();
      }
      // Give Socket.io a moment to clean up rooms
      setTimeout(done, 50);
    });

    it('should join user room when joinUserRoom event is emitted', done => {
      clientSocket1 = Client(serverAddress);
      clientSocket1.on('connect', () => {
        clientSocket1.emit('joinUserRoom', 'user1');
        setTimeout(() => {
          expect(io.sockets.adapter.rooms.has('user:user1')).toBeTruthy();
          done();
        }, 100);
      });
    });

    it('should not join user room when username is empty', done => {
      clientSocket1 = Client(serverAddress);
      clientSocket1.on('connect', () => {
        const roomCountBefore = io.sockets.adapter.rooms.size;
        clientSocket1.emit('joinUserRoom', '');
        setTimeout(() => {
          expect(io.sockets.adapter.rooms.size).toBe(roomCountBefore);
          done();
        }, 100);
      });
    });

    it('should leave user room when leaveUserRoom event is emitted', done => {
      clientSocket1 = Client(serverAddress);

      clientSocket1.on('connect', () => {
        const beforeRoom = io.sockets.adapter.rooms.get('user:user1');
        const sizeBefore = beforeRoom ? beforeRoom.size : 0;

        // Join the room
        clientSocket1.emit('joinUserRoom', 'user1');

        setTimeout(() => {
          // Leave the room
          clientSocket1.emit('leaveUserRoom', 'user1');

          setTimeout(() => {
            const afterRoom = io.sockets.adapter.rooms.get('user:user1');
            const sizeAfter = afterRoom ? afterRoom.size : 0;

            // Our client should have left => size back to what it was
            expect(sizeAfter).toBe(sizeBefore);
            done();
          }, 100);
        }, 100);
      });
    });

    it('should not leave user room when username is empty', done => {
      clientSocket1 = Client(serverAddress);
      clientSocket1.on('connect', () => {
        clientSocket1.emit('joinUserRoom', 'user1');
        setTimeout(() => {
          const roomCountBefore = io.sockets.adapter.rooms.size;
          clientSocket1.emit('leaveUserRoom', '');
          setTimeout(() => {
            expect(io.sockets.adapter.rooms.size).toBeGreaterThanOrEqual(roomCountBefore);
            expect(io.sockets.adapter.rooms.has('user:user1')).toBeTruthy();
            done();
          }, 100);
        }, 100);
      });
    });

    it('should broadcast typingStart event to chat room when chatID is provided', done => {
      clientSocket1 = Client(serverAddress);
      clientSocket2 = Client(serverAddress);

      clientSocket1.on('connect', () => {
        clientSocket2.on('connect', () => {
          clientSocket1.emit('joinChat', 'chat123');
          clientSocket2.emit('joinChat', 'chat123');

          setTimeout(() => {
            clientSocket2.on('typingIndicator', data => {
              expect(data).toEqual({
                username: 'user1',
                chatID: 'chat123',
                isTyping: true,
              });
              done();
            });

            clientSocket1.emit('typingStart', {
              chatID: 'chat123',
              username: 'user1',
            });
          }, 100);
        });
      });
    });

    it('should broadcast typingStop event to chat room when chatID is provided', async () => {
      clientSocket1 = Client(serverAddress);
      clientSocket2 = Client(serverAddress);

      await new Promise<void>(resolve => {
        let connected = 0;
        const onConnect = () => {
          connected += 1;
          if (connected === 2) {
            resolve();
          }
        };
        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
      });

      clientSocket1.emit('joinChat', 'chat123');
      clientSocket2.emit('joinChat', 'chat123');

      await new Promise(resolve => setTimeout(resolve, 100));

      const payloadPromise = new Promise<any>(resolve => {
        clientSocket2.once('typingIndicator', data => {
          resolve(data);
        });
      });

      clientSocket1.emit('typingStop', {
        chatID: 'chat123',
        username: 'user1',
      });

      const data = await payloadPromise;

      expect(data).toEqual({
        username: 'user1',
        chatID: 'chat123',
        isTyping: false,
      });
    });

    it('should not broadcast typingStart when chatID is not provided', async () => {
      clientSocket1 = Client(serverAddress);
      clientSocket2 = Client(serverAddress);
      let receivedEvent = false;

      await new Promise<void>(resolve => {
        let connected = 0;
        const onConnect = () => {
          connected += 1;
          if (connected === 2) {
            resolve();
          }
        };
        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
      });

      clientSocket2.on('typingIndicator', () => {
        receivedEvent = true;
      });

      clientSocket1.emit('typingStart', {
        username: 'user1',
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(receivedEvent).toBe(false);
    });

    it('should not broadcast typingStop when chatID is not provided', done => {
      clientSocket1 = Client(serverAddress);
      clientSocket2 = Client(serverAddress);
      let receivedEvent = false;

      clientSocket1.on('connect', () => {
        clientSocket2.on('connect', () => {
          clientSocket2.on('typingIndicator', () => {
            receivedEvent = true;
          });

          clientSocket1.emit('typingStop', {
            username: 'user1',
          });

          setTimeout(() => {
            expect(receivedEvent).toBe(false);
            done();
          }, 100);
        });
      });
    });
  });
});
