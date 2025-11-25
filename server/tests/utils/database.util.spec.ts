import { populateDocument } from '../../utils/database.util';
import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import ChatModel from '../../models/chat.model';
import UserModel from '../../models/users.model';
import CollectionModel from '../../models/collection.model';
import { ObjectId } from 'mongodb';

jest.mock('../../models/questions.model');
jest.mock('../../models/answers.model');
jest.mock('../../models/chat.model');
jest.mock('../../models/messages.model');
jest.mock('../../models/users.model');
jest.mock('../../models/tags.model');
jest.mock('../../models/comments.model');
jest.mock('../../models/collection.model');

describe('populateDocument', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and populate a question document', async () => {
    const mockQuestion = {
      _id: 'questionId',
      tags: ['tagId'],
      answers: ['answerId'],
      comments: ['commentId'],
    };
    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockQuestion),
    });

    const result = await populateDocument('questionId', 'question');

    expect(QuestionModel.findOne).toHaveBeenCalledWith({ _id: 'questionId' });
    expect(result).toEqual(mockQuestion);
  });

  it('should return an error message if question document is not found', async () => {
    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const questionID = 'invalidQuestionId';
    const result = await populateDocument(questionID, 'question');

    expect(result).toEqual({
      error: `Error when fetching and populating a document: Failed to fetch and populate question with ID: ${
        questionID
      }`,
    });
  });

  it('should return an error message if fetching a question document throws an error', async () => {
    (QuestionModel.findOne as jest.Mock).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await populateDocument('questionId', 'question');

    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Database error',
    });
  });

  it('should fetch and populate an answer document', async () => {
    const mockAnswer = {
      _id: 'answerId',
      comments: ['commentId'],
    };
    (AnswerModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockAnswer),
    });

    const result = await populateDocument('answerId', 'answer');

    expect(AnswerModel.findOne).toHaveBeenCalledWith({ _id: 'answerId' });
    expect(result).toEqual(mockAnswer);
  });

  it('should return an error message if answer document is not found', async () => {
    (AnswerModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const answerID = 'invalidAnswerId';
    const result = await populateDocument(answerID, 'answer');

    expect(result).toEqual({
      error: `Error when fetching and populating a document: Failed to fetch and populate answer with ID: ${
        answerID
      }`,
    });
  });

  it('should return an error message if fetching an answer document throws an error', async () => {
    (AnswerModel.findOne as jest.Mock).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await populateDocument('answerId', 'answer');

    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Database error',
    });
  });

  it('should fetch and populate a chat document', async () => {
    const messageDate = new Date();
    const mockMessage = {
      _id: 'messageId',
      msg: 'Hello',
      msgFrom: 'user1',
      msgDateTime: messageDate,
      type: 'text',
    };

    const mockChat = {
      _id: 'chatId',
      participants: new Map([['user1', true]]),
      messages: [mockMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUser = {
      _id: 'userId',
      username: 'user1',
    };

    (ChatModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockChat),
    });
    (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

    const result = await populateDocument('chatId', 'chat');

    expect(ChatModel.findOne).toHaveBeenCalledWith({ _id: 'chatId' });

    // Since populateChat returns a transformed object, we need to check the specific structure
    expect(result).toEqual(
      expect.objectContaining({
        _id: 'chatId',
        participants: new Map([['user1', true]]),
        messages: expect.arrayContaining([
          expect.objectContaining({
            _id: 'messageId',
            msg: 'Hello',
            msgFrom: 'user1',
            msgDateTime: messageDate,
            type: 'text',
            user: {
              _id: 'userId',
              username: 'user1',
            },
          }),
        ]),
      }),
    );
  });

  it('should return an error message if chat document is not found', async () => {
    (ChatModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const result = await populateDocument('invalidChatId', 'chat');

    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Chat not found',
    });
  });

  it('should return an error message if fetching a chat document throws an error', async () => {
    (ChatModel.findOne as jest.Mock).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await populateDocument('chatId', 'chat');

    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Database error',
    });
  });

  it('should return an error message if type is invalid', async () => {
    const invalidType = 'invalidType' as 'question' | 'answer' | 'chat';
    const result = await populateDocument('someId', invalidType);
    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Invalid type provided.',
    });
  });

  it('should return an error when id is undefined', async () => {
    const result = await populateDocument(undefined as unknown as string, 'question');
    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Provided ID is undefined.',
    });
  });

  it('should fetch and populate a collection document', async () => {
    const questionId = new ObjectId();
    const mockQuestion = {
      _id: questionId.toString(),
      title: 'Test Question',
      tags: [],
      answers: [],
      comments: [],
    };

    const collectionDoc = {
      _id: new ObjectId(),
      name: 'Favorites',
      questions: [questionId],
      toObject: jest.fn().mockReturnValue({
        _id: 'collectionId',
        name: 'Favorites',
        questions: [mockQuestion],
      }),
    };

    (CollectionModel.findOne as jest.Mock).mockResolvedValue(collectionDoc);
    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockQuestion),
    });

    const result = await populateDocument('collectionId', 'collection');

    expect(CollectionModel.findOne).toHaveBeenCalledWith({ _id: 'collectionId' });
    expect(QuestionModel.findOne).toHaveBeenCalledWith({ _id: questionId.toString() });
    expect(result).toEqual(
      expect.objectContaining({
        _id: 'collectionId',
        name: 'Favorites',
        questions: [mockQuestion],
      }),
    );
  });

  it('should return null when collection is not found', async () => {
    (CollectionModel.findOne as jest.Mock).mockResolvedValue(null);

    const result = await populateDocument('invalidCollectionId', 'collection');

    expect(result).toEqual({
      error:
        'Error when fetching and populating a document: Failed to fetch and populate collection with ID: invalidCollectionId',
    });
  });

  it('should return an error when a question in the collection is not found', async () => {
    const questionId = new ObjectId();
    const collectionDoc = {
      _id: new ObjectId(),
      name: 'Favorites',
      questions: [questionId],
      toObject: jest.fn().mockReturnValue({
        _id: 'collectionId',
        name: 'Favorites',
        questions: [questionId],
      }),
    };

    (CollectionModel.findOne as jest.Mock).mockResolvedValue(collectionDoc);
    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const result = await populateDocument('collectionId', 'collection');

    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Question not found',
    });
  });

  it('should return an error when fetching a collection document throws an error', async () => {
    (CollectionModel.findOne as jest.Mock).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await populateDocument('collectionId', 'collection');

    expect(result).toEqual({
      error: 'Error when fetching and populating a document: Database error',
    });
  });
});
