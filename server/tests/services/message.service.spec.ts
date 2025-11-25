import mongoose from 'mongoose';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import ChatModel from '../../models/chat.model';
import {
  getMessages,
  saveMessage,
  getDirectMessages,
  updateFriendRequestStatus,
  sendGameInvitation,
  updateGameInvitationStatus,
  editMessageContent,
  deleteMessageById,
  markMessagesAsRead,
} from '../../services/message.service';
import { Message, DatabaseMessage } from '../../types/types';
import * as userService from '../../services/user.service';

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

describe('Message model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    const mockMessage: Message = {
      msg: 'Hey!',
      msgFrom: 'userX',
      msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
      type: 'direct',
    };

    it('should create a message successfully if user exists', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        username: 'userX',
      });

      // Mock the created message
      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...mockMessage,
      };
      jest
        .spyOn(MessageModel, 'create')
        .mockResolvedValueOnce(mockCreatedMsg as unknown as ReturnType<typeof MessageModel.create>);

      const result = await saveMessage(mockMessage);

      expect(result).toMatchObject({
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      });
    });

    it('should return an error if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const result = await saveMessage(mockMessage);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Message sender is invalid');
      }
    });

    it('should return an error if message creation fails', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({ _id: 'someUserId' });

      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Create failed'));

      const result = await saveMessage(mockMessage);
      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Error when saving a message');
      }
    });
  });

  describe('getMessages', () => {
    it('should return all messages, sorted by date', async () => {
      jest.spyOn(MessageModel, 'find').mockResolvedValueOnce([message2, message1]);

      const messages = await getMessages();

      expect(messages).toMatchObject([message1, message2]);
    });

    it('should return an empty array if error when retrieving messages', async () => {
      jest
        .spyOn(MessageModel, 'find')
        .mockRejectedValueOnce(() => new Error('Error retrieving documents'));

      const messages = await getMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('getDirectMessages', () => {
    const user1 = 'user1';
    const user2 = 'user2';

    const directMessage1: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'Hello from user1',
      msgFrom: user1,
      msgTo: user2,
      msgDateTime: new Date('2024-06-04'),
      type: 'direct',
    };

    const directMessage2: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'Hi from user2',
      msgFrom: user2,
      msgTo: user1,
      msgDateTime: new Date('2024-06-05'),
      type: 'direct',
    };

    const friendRequest: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'Friend request',
      msgFrom: user1,
      msgTo: user2,
      msgDateTime: new Date('2024-06-03'),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    it('should return direct messages between two users, sorted by date', async () => {
      jest
        .spyOn(MessageModel, 'find')
        .mockResolvedValueOnce([directMessage2, directMessage1, friendRequest]);

      const messages = await getDirectMessages(user1, user2);

      expect(messages).toHaveLength(3);
      expect(messages[0]).toMatchObject(friendRequest);
      expect(messages[1]).toMatchObject(directMessage1);
      expect(messages[2]).toMatchObject(directMessage2);
    });

    it('should return an empty array if error when retrieving messages', async () => {
      jest.spyOn(MessageModel, 'find').mockRejectedValueOnce(new Error('DB Error'));

      const messages = await getDirectMessages(user1, user2);

      expect(messages).toEqual([]);
    });
  });

  describe('updateFriendRequestStatus', () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const responderUsername = 'user2';

    const mockFriendRequest: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Friend request',
      msgFrom: 'user1',
      msgTo: responderUsername,
      msgDateTime: new Date(),
      type: 'friendRequest',
      friendRequestStatus: 'pending',
    };

    it('should accept a friend request and add both users as friends', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockFriendRequest as any);
      jest.spyOn(MessageModel, 'findByIdAndUpdate').mockResolvedValueOnce({
        ...mockFriendRequest,
        friendRequestStatus: 'accepted',
      } as any);
      jest
        .spyOn(userService, 'addFriend')
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any);

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(false);
      expect(userService.addFriend).toHaveBeenCalledTimes(2);
      expect(userService.addFriend).toHaveBeenCalledWith('user1', responderUsername);
      expect(userService.addFriend).toHaveBeenCalledWith(responderUsername, 'user1');
    });

    it('should decline a friend request without adding friends', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockFriendRequest as any);
      jest.spyOn(MessageModel, 'findByIdAndUpdate').mockResolvedValueOnce({
        ...mockFriendRequest,
        friendRequestStatus: 'declined',
      } as any);

      const result = await updateFriendRequestStatus(messageId, 'declined', responderUsername);

      expect('error' in result).toBe(false);
      expect(userService.addFriend).not.toHaveBeenCalled();
    });

    it('should return error if message not found', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(null);

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Friend request not found');
      }
    });

    it('should return error if not a friend request message', async () => {
      const nonFriendRequest = {
        ...mockFriendRequest,
        type: 'direct',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(nonFriendRequest as any);

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Not a friend request message');
      }
    });

    it('should return error if message is deleted', async () => {
      const deletedMessage = {
        ...mockFriendRequest,
        isDeleted: true,
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(deletedMessage as any);

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Message has been deleted');
      }
    });

    it('should return error if unauthorized to respond', async () => {
      const unauthorizedMessage = {
        ...mockFriendRequest,
        msgTo: 'otherUser',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(unauthorizedMessage as any);

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Unauthorized to respond to this request');
      }
    });

    it('should return error if update fails', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockFriendRequest as any);
      jest.spyOn(MessageModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Failed to update friend request');
      }
    });

    it('should return error if exception occurs', async () => {
      jest.spyOn(MessageModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await updateFriendRequestStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error updating friend request');
      }
    });
  });

  describe('sendGameInvitation', () => {
    const fromUsername = 'user1';
    const toUsername = 'user2';
    const gameID = 'game123';
    const roomName = 'Test Room';
    const gameType = 'Connect Four' as const;
    const roomCode = 'ABC123';

    const mockFromUser = {
      _id: new mongoose.Types.ObjectId(),
      username: fromUsername,
    };

    const mockToUser = {
      _id: new mongoose.Types.ObjectId(),
      username: toUsername,
    };

    it('should send a game invitation successfully without room code', async () => {
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(mockFromUser as any)
        .mockResolvedValueOnce(mockToUser as any);

      const mockCreatedMessage = {
        _id: new mongoose.Types.ObjectId(),
        msg: `${fromUsername} invited you to join their ${gameType} game: "${roomName}"`,
        msgFrom: fromUsername,
        msgTo: toUsername,
        msgDateTime: new Date(),
        type: 'gameInvitation',
        gameInvitation: {
          gameID,
          roomName,
          roomCode: undefined,
          gameType,
          status: 'pending',
        },
      };

      jest.spyOn(MessageModel, 'create').mockResolvedValueOnce(mockCreatedMessage as any);

      const result = await sendGameInvitation(fromUsername, toUsername, gameID, roomName, gameType);

      expect('error' in result).toBe(false);
      expect(MessageModel.create).toHaveBeenCalled();
    });

    it('should send a game invitation successfully with room code', async () => {
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(mockFromUser as any)
        .mockResolvedValueOnce(mockToUser as any);

      const mockCreatedMessage = {
        _id: new mongoose.Types.ObjectId(),
        msg: `${fromUsername} invited you to join their ${gameType} game: "${roomName}" (Code: ${roomCode})`,
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

      jest.spyOn(MessageModel, 'create').mockResolvedValueOnce(mockCreatedMessage as any);

      const result = await sendGameInvitation(
        fromUsername,
        toUsername,
        gameID,
        roomName,
        gameType,
        roomCode,
      );

      expect('error' in result).toBe(false);
    });

    it('should return error if sender does not exist', async () => {
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockToUser as any);

      const result = await sendGameInvitation(fromUsername, toUsername, gameID, roomName, gameType);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Sender does not exist');
      }
    });

    it('should return error if recipient does not exist', async () => {
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(mockFromUser as any)
        .mockResolvedValueOnce(null);

      const result = await sendGameInvitation(fromUsername, toUsername, gameID, roomName, gameType);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(`User ${toUsername} does not exist`);
      }
    });

    it('should return error if exception occurs', async () => {
      jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('DB Error'));

      const result = await sendGameInvitation(fromUsername, toUsername, gameID, roomName, gameType);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error sending game invitation');
      }
    });
  });

  describe('updateGameInvitationStatus', () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const responderUsername = 'user2';

    const mockGameInvitation: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Game invitation',
      msgFrom: 'user1',
      msgTo: responderUsername,
      msgDateTime: new Date(),
      type: 'gameInvitation',
      gameInvitation: {
        gameID: 'game123',
        roomName: 'Test Room',
        gameType: 'Connect Four',
        status: 'pending',
      },
    };

    it('should accept a game invitation', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockGameInvitation as any);
      jest.spyOn(MessageModel, 'findByIdAndUpdate').mockResolvedValueOnce({
        ...mockGameInvitation,
        gameInvitation: {
          ...mockGameInvitation.gameInvitation!,
          status: 'accepted',
        },
      } as any);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(false);
    });

    it('should decline a game invitation', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockGameInvitation as any);
      jest.spyOn(MessageModel, 'findByIdAndUpdate').mockResolvedValueOnce({
        ...mockGameInvitation,
        gameInvitation: {
          ...mockGameInvitation.gameInvitation!,
          status: 'declined',
        },
      } as any);

      const result = await updateGameInvitationStatus(messageId, 'declined', responderUsername);

      expect('error' in result).toBe(false);
    });

    it('should return error if message not found', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(null);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Game invitation not found');
      }
    });

    it('should return error if not a game invitation message', async () => {
      const nonGameInvitation = {
        ...mockGameInvitation,
        type: 'direct',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(nonGameInvitation as any);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Not a game invitation message');
      }
    });

    it('should return error if message is deleted', async () => {
      const deletedMessage = {
        ...mockGameInvitation,
        isDeleted: true,
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(deletedMessage as any);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Message has been deleted');
      }
    });

    it('should return error if unauthorized to respond', async () => {
      const unauthorizedMessage = {
        ...mockGameInvitation,
        msgTo: 'otherUser',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(unauthorizedMessage as any);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Unauthorized to respond to this invitation');
      }
    });

    it('should return error if invalid game invitation data', async () => {
      const invalidMessage = {
        ...mockGameInvitation,
        gameInvitation: undefined,
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(invalidMessage as any);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Invalid game invitation data');
      }
    });

    it('should return error if update fails', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockGameInvitation as any);
      jest.spyOn(MessageModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Failed to update game invitation');
      }
    });

    it('should return error if exception occurs', async () => {
      jest.spyOn(MessageModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await updateGameInvitationStatus(messageId, 'accepted', responderUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error updating game invitation');
      }
    });
  });

  describe('editMessageContent', () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const editorUsername = 'user1';
    const newBody = 'Updated message content';

    const mockDirectMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Original message',
      msgFrom: editorUsername,
      msgDateTime: new Date(),
      type: 'direct',
    };

    it('should edit message content successfully', async () => {
      const mockMessageDoc = {
        ...mockDirectMessage,
        msg: 'Original message',
        editHistory: [],
        save: jest.fn().mockResolvedValue({
          ...mockDirectMessage,
          msg: newBody.trim(),
          lastEditedAt: expect.any(Date),
          lastEditedBy: editorUsername,
          editHistory: [
            {
              body: 'Original message',
              editedAt: expect.any(Date),
              editedBy: editorUsername,
            },
          ],
        }),
      };

      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockMessageDoc as any);

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(false);
      expect(mockMessageDoc.save).toHaveBeenCalled();
    });

    it('should edit message content successfully when editHistory is undefined', async () => {
      const mockMessageDoc = {
        ...mockDirectMessage,
        msg: 'Original message',
        editHistory: undefined,
        save: jest.fn().mockResolvedValue({
          ...mockDirectMessage,
          msg: newBody.trim(),
          lastEditedAt: expect.any(Date),
          lastEditedBy: editorUsername,
          editHistory: [
            {
              body: 'Original message',
              editedAt: expect.any(Date),
              editedBy: editorUsername,
            },
          ],
        }),
      };

      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockMessageDoc as any);

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(false);
      expect(mockMessageDoc.save).toHaveBeenCalled();
    });

    it('should return error if message not found', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(null);

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Message not found');
      }
    });

    it('should return error if message is deleted', async () => {
      const deletedMessage = {
        ...mockDirectMessage,
        isDeleted: true,
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(deletedMessage as any);

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Message has been deleted');
      }
    });

    it('should return error if unauthorized to edit', async () => {
      const unauthorizedMessage = {
        ...mockDirectMessage,
        msgFrom: 'otherUser',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(unauthorizedMessage as any);

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('You can only edit your own messages');
      }
    });

    it('should return error if message type is not editable', async () => {
      const nonEditableMessage = {
        ...mockDirectMessage,
        type: 'friendRequest',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(nonEditableMessage as any);

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('This message type cannot be edited');
      }
    });

    it('should return error if new body is empty', async () => {
      const mockMessageDoc = {
        ...mockDirectMessage,
        save: jest.fn(),
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockMessageDoc as any);

      const result = await editMessageContent(messageId, editorUsername, '   ');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Updated message cannot be empty');
      }
    });

    it('should return message unchanged if new body is same as current', async () => {
      const mockMessageDoc = {
        ...mockDirectMessage,
        msg: 'Same message',
        save: jest.fn(),
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockMessageDoc as any);

      const result = await editMessageContent(messageId, editorUsername, 'Same message');

      expect('error' in result).toBe(false);
      expect(mockMessageDoc.save).not.toHaveBeenCalled();
    });

    it('should return error if exception occurs', async () => {
      jest.spyOn(MessageModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await editMessageContent(messageId, editorUsername, newBody);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error updating message');
      }
    });
  });

  describe('deleteMessageById', () => {
    const messageId = new mongoose.Types.ObjectId().toString();
    const deleterUsername = 'user1';
    const chatId1 = new mongoose.Types.ObjectId();
    const chatId2 = new mongoose.Types.ObjectId();

    const mockDirectMessage: DatabaseMessage = {
      _id: new mongoose.Types.ObjectId(messageId),
      msg: 'Message to delete',
      msgFrom: deleterUsername,
      msgDateTime: new Date(),
      type: 'direct',
      isDeleted: false,
    };

    it('should delete message successfully', async () => {
      const mockMessageDoc = {
        ...mockDirectMessage,
        isDeleted: false,
        save: jest.fn().mockResolvedValue({
          ...mockDirectMessage,
          isDeleted: true,
          deletedAt: expect.any(Date),
          deletedBy: deleterUsername,
          toObject: () => ({
            ...mockDirectMessage,
            isDeleted: true,
            deletedAt: expect.any(Date),
            deletedBy: deleterUsername,
          }),
        }),
      };

      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(mockMessageDoc as any);
      jest.spyOn(ChatModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: chatId1 }, { _id: chatId2 }]),
        }),
      } as any);
      jest.spyOn(ChatModel, 'updateMany').mockResolvedValueOnce({} as any);

      const result = await deleteMessageById(messageId, deleterUsername);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.message.isDeleted).toBe(true);
        expect(result.chatIds).toHaveLength(2);
        expect(result.chatIds).toContain(chatId1.toString());
        expect(result.chatIds).toContain(chatId2.toString());
      }
      expect(ChatModel.updateMany).toHaveBeenCalled();
      expect(mockMessageDoc.save).toHaveBeenCalled();
    });

    it('should return error if message not found', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(null);

      const result = await deleteMessageById(messageId, deleterUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Message not found');
      }
    });

    it('should return error if message already deleted', async () => {
      const deletedMessage = {
        ...mockDirectMessage,
        isDeleted: true,
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(deletedMessage as any);

      const result = await deleteMessageById(messageId, deleterUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Message already deleted');
      }
    });

    it('should return error if unauthorized to delete', async () => {
      const unauthorizedMessage = {
        ...mockDirectMessage,
        msgFrom: 'otherUser',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(unauthorizedMessage as any);

      const result = await deleteMessageById(messageId, deleterUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('You can only delete your own messages');
      }
    });

    it('should return error if message type is not deletable', async () => {
      const nonDeletableMessage = {
        ...mockDirectMessage,
        type: 'friendRequest',
      };
      jest.spyOn(MessageModel, 'findById').mockResolvedValueOnce(nonDeletableMessage as any);

      const result = await deleteMessageById(messageId, deleterUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('This message type cannot be deleted');
      }
    });

    it('should return error if exception occurs', async () => {
      jest.spyOn(MessageModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await deleteMessageById(messageId, deleterUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error deleting message');
      }
    });
  });

  describe('markMessagesAsRead', () => {
    const chatId = new mongoose.Types.ObjectId().toString();
    const readerUsername = 'user2';
    const messageId1 = new mongoose.Types.ObjectId();
    const messageId2 = new mongoose.Types.ObjectId();

    const mockChat = {
      _id: new mongoose.Types.ObjectId(chatId),
      messages: [messageId1, messageId2],
    };

    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      username: readerUsername,
      readReceiptsEnabled: true,
    };

    const mockMessage1 = {
      _id: messageId1,
      msgFrom: 'user1',
      readBy: [],
    };

    const mockMessage2 = {
      _id: messageId2,
      msgFrom: 'user1',
      readBy: [],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should mark messages as read successfully', async () => {
      jest.spyOn(ChatModel, 'findById').mockResolvedValueOnce(mockChat as any);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(MessageModel, 'find').mockResolvedValueOnce([mockMessage1, mockMessage2] as any);
      jest
        .spyOn(MessageModel, 'findByIdAndUpdate')
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any);

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.success).toBe(true);
      }
      expect(MessageModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('should return error if chat not found', async () => {
      jest.spyOn(ChatModel, 'findById').mockResolvedValueOnce(null);

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Chat not found');
      }
    });

    it('should return error if user not found', async () => {
      jest.spyOn(ChatModel, 'findById').mockResolvedValueOnce(mockChat as any);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('User not found');
      }
    });

    it('should return success without marking if read receipts disabled', async () => {
      const userWithDisabledReceipts = {
        ...mockUser,
        readReceiptsEnabled: false,
      };
      jest.spyOn(ChatModel, 'findById').mockResolvedValueOnce(mockChat as any);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithDisabledReceipts as any);

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.success).toBe(true);
      }
      expect(MessageModel.find).not.toHaveBeenCalled();
    });

    it('should not mark messages sent by the reader', async () => {
      jest.spyOn(ChatModel, 'findById').mockResolvedValueOnce(mockChat as any);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser as any);
      // MessageModel.find should return empty array since messages from reader are filtered out
      jest.spyOn(MessageModel, 'find').mockResolvedValueOnce([] as any);
      const findByIdAndUpdateSpy = jest.spyOn(MessageModel, 'findByIdAndUpdate');

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(false);
      expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
    });

    it('should not mark messages already read by the reader', async () => {
      jest.spyOn(ChatModel, 'findById').mockResolvedValueOnce(mockChat as any);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser as any);
      // MessageModel.find should return empty array since already read messages are filtered out
      jest.spyOn(MessageModel, 'find').mockResolvedValueOnce([] as any);
      const findByIdAndUpdateSpy = jest.spyOn(MessageModel, 'findByIdAndUpdate');

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(false);
      expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
    });

    it('should return error if exception occurs', async () => {
      jest.spyOn(ChatModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await markMessagesAsRead(chatId, readerUsername);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error marking messages as read');
      }
    });
  });
});
