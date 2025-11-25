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
import { DatabaseMessage, Message, DatabaseChat, PopulatedDatabaseChat } from '../../types/types';
import messageController from '../../controllers/message.controller';

const saveMessageSpy = jest.spyOn(messageService, 'saveMessage');
const getMessagesSpy = jest.spyOn(messageService, 'getMessages');
const getDirectMessagesSpy = jest.spyOn(messageService, 'getDirectMessages');
const updateFriendRequestStatusSpy = jest.spyOn(messageService, 'updateFriendRequestStatus');
const sendGameInvitationSpy = jest.spyOn(messageService, 'sendGameInvitation');
const updateGameInvitationStatusSpy = jest.spyOn(messageService, 'updateGameInvitationStatus');
const editMessageContentSpy = jest.spyOn(messageService, 'editMessageContent');
const deleteMessageByIdSpy = jest.spyOn(messageService, 'deleteMessageById');
const getChatsByParticipantsSpy = jest.spyOn(chatService, 'getChatsByParticipants');
const saveChatSpy = jest.spyOn(chatService, 'saveChat');
const addMessageToChatSpy = jest.spyOn(chatService, 'addMessageToChat');
const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

describe('POST /addMessage', () => {
  it('should add a new message', async () => {
    const validId = new mongoose.Types.ObjectId();

    const requestMessage: Message = {
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
      type: 'global',
    };

    const message: DatabaseMessage = {
      ...requestMessage,
      _id: validId,
    };

    saveMessageSpy.mockResolvedValue(message);

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: message._id.toString(),
      msg: message.msg,
      msgFrom: message.msgFrom,
      msgDateTime: message.msgDateTime.toISOString(),
      type: 'global',
    });
  });

  it('should return bad request error if messageToAdd is missing', async () => {
    const response = await supertest(app).post('/api/message/addMessage').send({});

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd');
  });

  it('should return bad message body error if msg is empty', async () => {
    const badMessage = {
      msg: '',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msg');
  });

  it('should return bad message body error if msg is missing', async () => {
    const badMessage = {
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msg');
  });

  it('should return bad message body error if msgFrom is empty', async () => {
    const badMessage = {
      msg: 'Hello',
      msgFrom: '',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgFrom');
  });

  it('should return bad message body error if msgFrom is missing', async () => {
    const badMessage = {
      msg: 'Hello',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgFrom');
  });

  it('should return bad message body error if msgDateTime is missing', async () => {
    const badMessage = {
      msg: 'Hello',
      msgFrom: 'User1',
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgDateTime');
  });

  it('should return bad message body error if msgDateTime is null', async () => {
    const badMessage = {
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: null,
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgDateTime');
  });

  it('should return internal server error if saveMessage fails', async () => {
    const validId = new mongoose.Types.ObjectId();
    const message = {
      _id: validId,
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
    };

    saveMessageSpy.mockResolvedValue({ error: 'Error saving document' });

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: message });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding a message: Error saving document');
  });
});

describe('GET /getMessages', () => {
  it('should return all messages', async () => {
    const message1: Message = {
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
      type: 'global',
    };

    const message2: Message = {
      msg: 'Hi',
      msgFrom: 'User2',
      msgDateTime: new Date('2024-06-05'),
      type: 'global',
    };

    const dbMessage1: DatabaseMessage = {
      ...message1,
      _id: new mongoose.Types.ObjectId(),
    };

    const dbMessage2: DatabaseMessage = {
      ...message2,
      _id: new mongoose.Types.ObjectId(),
    };

    getMessagesSpy.mockResolvedValue([dbMessage1, dbMessage2]);

    const response = await supertest(app).get('/api/message/getMessages');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        ...dbMessage1,
        _id: dbMessage1._id.toString(),
        msgDateTime: dbMessage1.msgDateTime.toISOString(),
      },
      {
        ...dbMessage2,
        _id: dbMessage2._id.toString(),
        msgDateTime: dbMessage2.msgDateTime.toISOString(),
      },
    ]);
  });
});

describe('POST /addDirectMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a direct message successfully', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const requestMessage: Message = {
      msg: 'Hello',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
    };

    const savedMessage: DatabaseMessage = {
      ...requestMessage,
      _id: messageId,
    };

    saveMessageSpy.mockResolvedValue(savedMessage);

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: savedMessage._id.toString(),
      msg: savedMessage.msg,
      msgFrom: savedMessage.msgFrom,
      msgTo: savedMessage.msgTo,
      type: 'direct',
    });
  });

  it('should create a new chat for friend request', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const chatId = new mongoose.Types.ObjectId();
    const requestMessage: Message = {
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    const savedMessage: DatabaseMessage = {
      ...requestMessage,
      _id: messageId,
    };

    const newChat: DatabaseChat = {
      _id: chatId,
      participants: { user1: true, user2: true },
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedChat: DatabaseChat = {
      ...newChat,
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

    saveMessageSpy.mockResolvedValue(savedMessage);
    getChatsByParticipantsSpy.mockResolvedValue([]);
    saveChatSpy.mockResolvedValue(newChat);
    addMessageToChatSpy.mockResolvedValue(updatedChat);
    populateDocumentSpy.mockResolvedValue(populatedChat);

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(saveChatSpy).toHaveBeenCalled();
    expect(addMessageToChatSpy).toHaveBeenCalled();
  });

  it('should use existing chat for friend request', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const chatId = new mongoose.Types.ObjectId();
    const requestMessage: Message = {
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    const savedMessage: DatabaseMessage = {
      ...requestMessage,
      _id: messageId,
    };

    const existingChat: DatabaseChat = {
      _id: chatId,
      participants: { user1: true, user2: true },
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedChat: DatabaseChat = {
      ...existingChat,
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

    saveMessageSpy.mockResolvedValue(savedMessage);
    getChatsByParticipantsSpy.mockResolvedValue([existingChat]);
    addMessageToChatSpy.mockResolvedValue(updatedChat);
    populateDocumentSpy.mockResolvedValue(populatedChat);

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(saveChatSpy).not.toHaveBeenCalled();
    expect(addMessageToChatSpy).toHaveBeenCalled();
  });

  it('should return error if saveMessage fails', async () => {
    const requestMessage: Message = {
      msg: 'Hello',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
    };

    saveMessageSpy.mockResolvedValue({ error: 'Error saving message' });

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when adding a direct message');
  });

  it('should handle error when adding friend request to existing chat', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const chatId = new mongoose.Types.ObjectId();
    const requestMessage: Message = {
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    const savedMessage: DatabaseMessage = {
      ...requestMessage,
      _id: messageId,
    };

    const existingChat: DatabaseChat = {
      _id: chatId,
      participants: { user1: true, user2: true },
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveMessageSpy.mockResolvedValue(savedMessage);
    getChatsByParticipantsSpy.mockResolvedValue([existingChat]);
    addMessageToChatSpy.mockResolvedValue({ error: 'Error adding message to chat' });

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: savedMessage._id.toString(),
    });
  });

  it('should handle error when creating chat for friend request', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const requestMessage: Message = {
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    const savedMessage: DatabaseMessage = {
      ...requestMessage,
      _id: messageId,
    };

    saveMessageSpy.mockResolvedValue(savedMessage);
    getChatsByParticipantsSpy.mockResolvedValue([]);
    saveChatSpy.mockResolvedValue({ error: 'Error creating chat' });

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: savedMessage._id.toString(),
    });
  });

  it('should handle error when adding friend request to new chat', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const chatId = new mongoose.Types.ObjectId();
    const requestMessage: Message = {
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    const savedMessage: DatabaseMessage = {
      ...requestMessage,
      _id: messageId,
    };

    const newChat: DatabaseChat = {
      _id: chatId,
      participants: { user1: true, user2: true },
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveMessageSpy.mockResolvedValue(savedMessage);
    getChatsByParticipantsSpy.mockResolvedValue([]);
    saveChatSpy.mockResolvedValue(newChat);
    addMessageToChatSpy.mockResolvedValue({ error: 'Error adding message to new chat' });

    const response = await supertest(app)
      .post('/api/message/addDirectMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: savedMessage._id.toString(),
    });
  });
});

describe('GET /getDirectMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return direct messages between two users', async () => {
    const message1: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'Hello',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
    };

    const message2: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'Hi',
      msgFrom: 'user2',
      msgTo: 'user1',
      msgDateTime: new Date('2024-06-05'),
      type: 'direct',
    };

    getDirectMessagesSpy.mockResolvedValue([message1, message2]);

    const response = await supertest(app)
      .get('/api/message/getDirectMessages')
      .query({ user1: 'user1', user2: 'user2' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('should return error if getDirectMessages fails', async () => {
    getDirectMessagesSpy.mockRejectedValue(new Error('Database error'));

    const response = await supertest(app)
      .get('/api/message/getDirectMessages')
      .query({ user1: 'user1', user2: 'user2' });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when fetching direct messages');
  });
});

describe('POST /respondToFriendRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should respond to friend request successfully', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const updatedMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'friendRequest',
      friendRequestStatus: 'accepted',
    };

    updateFriendRequestStatusSpy.mockResolvedValue(updatedMessage);

    const response = await supertest(app)
      .post('/api/message/respondToFriendRequest')
      .send({
        messageId,
        status: 'accepted',
        responderUsername: 'user2',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: updatedMessage._id.toString(),
      friendRequestStatus: 'accepted',
    });
  });

  it('should return error if updateFriendRequestStatus fails', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    updateFriendRequestStatusSpy.mockResolvedValue({ error: 'Friend request not found' });

    const response = await supertest(app)
      .post('/api/message/respondToFriendRequest')
      .send({
        messageId,
        status: 'accepted',
        responderUsername: 'user2',
      });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when responding to friend request');
  });
});

describe('POST /sendGameInvitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send game invitation successfully', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const gameInvitation: DatabaseMessage = {
      _id: messageId,
      msg: 'user1 invited you to join their Connect Four game: "Test Room"',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'gameInvitation',
      gameInvitation: {
        gameID: 'game123',
        roomName: 'Test Room',
        gameType: 'Connect Four',
        status: 'pending',
      },
    };

    sendGameInvitationSpy.mockResolvedValue(gameInvitation);

    const response = await supertest(app)
      .post('/api/message/sendGameInvitation')
      .send({
        fromUsername: 'user1',
        toUsername: 'user2',
        gameID: 'game123',
        roomName: 'Test Room',
        gameType: 'Connect Four',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: gameInvitation._id.toString(),
      type: 'gameInvitation',
    });
  });

  it('should send game invitation with room code', async () => {
    const messageId = new mongoose.Types.ObjectId();
    const gameInvitation: DatabaseMessage = {
      _id: messageId,
      msg: 'user1 invited you to join their Connect Four game: "Test Room" (Code: ABC123)',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'gameInvitation',
      gameInvitation: {
        gameID: 'game123',
        roomName: 'Test Room',
        roomCode: 'ABC123',
        gameType: 'Connect Four',
        status: 'pending',
      },
    };

    sendGameInvitationSpy.mockResolvedValue(gameInvitation);

    const response = await supertest(app)
      .post('/api/message/sendGameInvitation')
      .send({
        fromUsername: 'user1',
        toUsername: 'user2',
        gameID: 'game123',
        roomName: 'Test Room',
        gameType: 'Connect Four',
        roomCode: 'ABC123',
      });

    expect(response.status).toBe(200);
    expect(response.body.gameInvitation.roomCode).toBe('ABC123');
  });

  it('should return error if sendGameInvitation fails', async () => {
    sendGameInvitationSpy.mockResolvedValue({ error: 'Sender does not exist' });

    const response = await supertest(app)
      .post('/api/message/sendGameInvitation')
      .send({
        fromUsername: 'user1',
        toUsername: 'user2',
        gameID: 'game123',
        roomName: 'Test Room',
        gameType: 'Connect Four',
      });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when sending game invitation');
  });
});

describe('POST /respondToGameInvitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should respond to game invitation successfully', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const updatedMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Game invitation',
      msgFrom: 'user1',
      msgTo: 'user2',
      msgDateTime: new Date('2024-06-04'),
      type: 'gameInvitation',
      gameInvitation: {
        gameID: 'game123',
        roomName: 'Test Room',
        gameType: 'Connect Four',
        status: 'accepted',
      },
    };

    updateGameInvitationStatusSpy.mockResolvedValue(updatedMessage);

    const response = await supertest(app)
      .post('/api/message/respondToGameInvitation')
      .send({
        messageId,
        status: 'accepted',
        responderUsername: 'user2',
      });

    expect(response.status).toBe(200);
    expect(response.body.gameInvitation.status).toBe('accepted');
  });

  it('should return error if updateGameInvitationStatus fails', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    updateGameInvitationStatusSpy.mockResolvedValue({ error: 'Game invitation not found' });

    const response = await supertest(app)
      .post('/api/message/respondToGameInvitation')
      .send({
        messageId,
        status: 'accepted',
        responderUsername: 'user2',
      });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when responding to game invitation');
  });
});

describe('PATCH /:messageId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should edit message successfully', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const updatedMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Updated message',
      msgFrom: 'user1',
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
      lastEditedAt: new Date(),
      lastEditedBy: 'user1',
    };

    editMessageContentSpy.mockResolvedValue(updatedMessage);

    const response = await supertest(app)
      .patch(`/api/message/${messageId}`)
      .send({
        newMessage: 'Updated message',
        editorUsername: 'user1',
      });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Updated message');
  });

  it('should return 400 if newMessage is missing', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();

    const response = await supertest(app)
      .patch(`/api/message/${messageId}`)
      .send({
        editorUsername: 'user1',
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Updated message is required');
  });

  it('should return 400 if newMessage is not a string', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();

    const response = await supertest(app)
      .patch(`/api/message/${messageId}`)
      .send({
        newMessage: 123,
        editorUsername: 'user1',
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Updated message is required');
  });

  it('should return 400 if editorUsername is missing', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();

    const response = await supertest(app)
      .patch(`/api/message/${messageId}`)
      .send({
        newMessage: 'Updated message',
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Editor username is required');
  });

  it('should return 400 if editMessageContent returns error', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    editMessageContentSpy.mockResolvedValue({ error: 'Message not found' });

    const response = await supertest(app)
      .patch(`/api/message/${messageId}`)
      .send({
        newMessage: 'Updated message',
        editorUsername: 'user1',
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Message not found');
  });

  it('should return 500 if editMessageContent throws', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    editMessageContentSpy.mockRejectedValue(new Error('Database error'));

    const response = await supertest(app)
      .patch(`/api/message/${messageId}`)
      .send({
        newMessage: 'Updated message',
        editorUsername: 'user1',
      });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when editing message');
  });
});

describe('DELETE /:messageId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete message successfully', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const chatId1 = new mongoose.Types.ObjectId().toString();
    const chatId2 = new mongoose.Types.ObjectId().toString();
    const deletedMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Deleted message',
      msgFrom: 'user1',
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: 'user1',
    };

    const populatedChat1: PopulatedDatabaseChat = {
      _id: new mongoose.Types.ObjectId(chatId1),
      participants: { user1: true, user2: true },
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const populatedChat2: PopulatedDatabaseChat = {
      _id: new mongoose.Types.ObjectId(chatId2),
      participants: { user1: true, user3: true },
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    deleteMessageByIdSpy.mockResolvedValue({
      message: deletedMessage,
      chatIds: [chatId1, chatId2],
    });
    populateDocumentSpy
      .mockResolvedValueOnce(populatedChat1)
      .mockResolvedValueOnce(populatedChat2);

    const response = await supertest(app)
      .delete(`/api/message/${messageId}`)
      .send({
        username: 'user1',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      messageId,
    });
    expect(populateDocumentSpy).toHaveBeenCalledTimes(2);
  });

  it('should return 400 if username is missing', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();

    const response = await supertest(app).delete(`/api/message/${messageId}`).send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe('Username is required to delete a message');
  });

  it('should return 400 if deleteMessageById returns error', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    deleteMessageByIdSpy.mockResolvedValue({ error: 'Message not found' });

    const response = await supertest(app)
      .delete(`/api/message/${messageId}`)
      .send({
        username: 'user1',
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Message not found');
  });

  it('should return 500 if deleteMessageById throws', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    deleteMessageByIdSpy.mockRejectedValue(new Error('Database error'));

    const response = await supertest(app)
      .delete(`/api/message/${messageId}`)
      .send({
        username: 'user1',
      });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when deleting message');
  });

  it('should handle populateDocument errors gracefully', async () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const chatId1 = new mongoose.Types.ObjectId().toString();
    const deletedMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Deleted message',
      msgFrom: 'user1',
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: 'user1',
    };

    deleteMessageByIdSpy.mockResolvedValue({
      message: deletedMessage,
      chatIds: [chatId1],
    });
    populateDocumentSpy.mockResolvedValue({ error: 'Chat not found' });

    const response = await supertest(app)
      .delete(`/api/message/${messageId}`)
      .send({
        username: 'user1',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('Socket Events - Typing Indicators', () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: Server;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let serverAddress: string;

  beforeAll(done => {
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Set up message controller with socket
    messageController(io);

    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      serverAddress = `http://localhost:${port}`;
      done();
    });
  });

  afterAll(done => {
    io.close();
    httpServer.close();
    done();
  });

  afterEach(done => {
    if (clientSocket1?.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect();
    }
    done();
  });

  it('should broadcast typingStart event for global chat', done => {
    clientSocket1 = Client(serverAddress);
    clientSocket2 = Client(serverAddress);

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        clientSocket2.on('typingIndicator', data => {
          expect(data).toEqual({
            username: 'user1',
            isTyping: true,
          });
          done();
        });

        clientSocket1.emit('typingStart', {
          username: 'user1',
        });
      });
    });
  });

  it('should broadcast typingStop event for global chat', done => {
    clientSocket1 = Client(serverAddress);
    clientSocket2 = Client(serverAddress);

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        clientSocket2.on('typingIndicator', data => {
          expect(data).toEqual({
            username: 'user1',
            isTyping: false,
          });
          done();
        });

        clientSocket1.emit('typingStop', {
          username: 'user1',
        });
      });
    });
  });

  it('should not broadcast typingStart when chatID is provided', done => {
    clientSocket1 = Client(serverAddress);
    clientSocket2 = Client(serverAddress);
    let receivedEvent = false;

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        clientSocket2.on('typingIndicator', () => {
          receivedEvent = true;
        });

        clientSocket1.emit('typingStart', {
          chatID: 'chat123',
          username: 'user1',
        });

        // Wait a bit to ensure no event is received
        setTimeout(() => {
          expect(receivedEvent).toBe(false);
          done();
        }, 100);
      });
    });
  });

  it('should not broadcast typingStop when chatID is provided', done => {
    clientSocket1 = Client(serverAddress);
    clientSocket2 = Client(serverAddress);
    let receivedEvent = false;

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        clientSocket2.on('typingIndicator', () => {
          receivedEvent = true;
        });

        clientSocket1.emit('typingStop', {
          chatID: 'chat123',
          username: 'user1',
        });

        // Wait a bit to ensure no event is received
        setTimeout(() => {
          expect(receivedEvent).toBe(false);
          done();
        }, 100);
      });
    });
  });
});
