import mongoose from 'mongoose';
import AnswerModel from '../../models/answers.model';
import QuestionModel from '../../models/questions.model';
import CommentModel from '../../models/comments.model';
import UserModel from '../../models/users.model';

import {
  saveAnswer,
  addAnswerToQuestion,
  deleteAnswer,
  getMostRecentAnswerTime,
} from '../../services/answer.service';

import {
  DatabaseAnswer,
  DatabaseQuestion,
  PopulatedDatabaseQuestion,
} from '../../types/types';
import { QUESTIONS, ans1, ans4 } from '../mockData.models';
import * as notificationServiceModule from '../../services/notification.service';

describe('Answer service - saveAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveAnswer should return the saved answer', async () => {
    const mockAnswer = {
      text: 'This is a test answer',
      ansBy: 'dummyUserId',
      ansDateTime: new Date('2024-06-06'),
      comments: [],
    };
    const mockDBAnswer = {
      ...mockAnswer,
      _id: new mongoose.Types.ObjectId(),
    };

    jest
      .spyOn(AnswerModel, 'create')
      .mockResolvedValueOnce(mockDBAnswer as unknown as ReturnType<
        typeof AnswerModel.create
      >);

    const result = (await saveAnswer(mockAnswer)) as DatabaseAnswer;

    expect(result._id).toBeDefined();
    expect(result.text).toEqual(mockAnswer.text);
    expect(result.ansBy).toEqual(mockAnswer.ansBy);
    expect(result.ansDateTime).toEqual(mockAnswer.ansDateTime);
  });

  test('saveAnswer should return error when AnswerModel.create rejects', async () => {
    const mockAnswer = {
      text: 'This is a test answer',
      ansBy: 'dummyUserId',
      ansDateTime: new Date('2024-06-06'),
      comments: [],
    };

    jest
      .spyOn(AnswerModel, 'create')
      .mockRejectedValueOnce(new Error('Database connection failed') as any);

    const result = await saveAnswer(mockAnswer);

    expect(result).toEqual({ error: 'Error when saving an answer' });
  });
});

describe('Answer service - getMostRecentAnswerTime', () => {
  it('sets map entry to the most recent ansDateTime for a question', () => {
    const qid = new mongoose.Types.ObjectId();
    const older = new Date('2024-01-01T00:00:00Z');
    const newer = new Date('2024-02-01T00:00:00Z');

    const question: PopulatedDatabaseQuestion = {
      _id: qid,
      title: 'Q',
      text: 'T',
      tags: [],
      askedBy: 'user1',
      askDateTime: new Date('2023-12-01'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [
        {
          _id: new mongoose.Types.ObjectId(),
          text: 'a1',
          ansBy: 'u',
          ansDateTime: older,
        } as any,
        {
          _id: new mongoose.Types.ObjectId(),
          text: 'a2',
          ansBy: 'u',
          ansDateTime: newer,
        } as any,
      ],
      comments: [],
      community: null,
      followers: [],
    };

    const mp = new Map<string, Date>();
    getMostRecentAnswerTime(question, mp);

    const stored = mp.get(qid.toString());
    expect(stored).toEqual(newer);
  });

  it('does not overwrite when existing time is more recent', () => {
    const qid = new mongoose.Types.ObjectId();
    const existing = new Date('2024-03-01T00:00:00Z');
    const answerTime = new Date('2024-02-01T00:00:00Z');

    const question: PopulatedDatabaseQuestion = {
      _id: qid,
      title: 'Q',
      text: 'T',
      tags: [],
      askedBy: 'user1',
      askDateTime: new Date('2023-12-01'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [
        {
          _id: new mongoose.Types.ObjectId(),
          text: 'a1',
          ansBy: 'u',
          ansDateTime: answerTime,
        } as any,
      ],
      comments: [],
      community: null,
      followers: [],
    };

    const mp = new Map<string, Date>([[qid.toString(), existing]]);
    getMostRecentAnswerTime(question, mp);

    expect(mp.get(qid.toString())).toEqual(existing);
  });
});

describe('Answer service - addAnswerToQuestion', () => {
  let populateSpy: jest.SpyInstance;
  let userFindSpy: jest.SpyInstance;
  let createNotificationSpy: jest.SpyInstance;
  let sendAnswerNotificationSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    populateSpy = jest.spyOn(QuestionModel, 'populate').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      title: 'Q',
      followers: [],
    } as any);

    userFindSpy = jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    } as any);

    createNotificationSpy = jest
      .spyOn(notificationServiceModule, 'createNotification')
      .mockResolvedValue({ ok: true } as any);

    sendAnswerNotificationSpy = jest
      .spyOn(
        notificationServiceModule.NotificationService.prototype,
        'sendAnswerNotification',
      )
      .mockResolvedValue(undefined as any);
  });

  test('addAnswerToQuestion should return the updated question', async () => {
    const question: DatabaseQuestion = QUESTIONS.filter(
      q => q._id && q._id.toString() === '65e9b5a995b6c7045a30d823',
    )[0] as DatabaseQuestion;

    jest
      .spyOn(QuestionModel, 'findOneAndUpdate')
      .mockResolvedValueOnce({ ...question, answers: [...question.answers, ans4._id] } as any);

    const result = (await addAnswerToQuestion(
      '65e9b5a995b6c7045a30d823',
      ans4,
    )) as DatabaseQuestion;

    expect(result.answers.length).toEqual(4);
    expect(result.answers).toContain(ans4._id);
  });

  test('addAnswerToQuestion returns error if findOneAndUpdate throws', async () => {
    jest
      .spyOn(QuestionModel, 'findOneAndUpdate')
      .mockRejectedValueOnce(new Error('Database error'));

    const result = await addAnswerToQuestion('65e9b5a995b6c7045a30d823', ans1);

    expect(result).toHaveProperty('error', 'Error when adding answer to question');
  });

  test('addAnswerToQuestion returns error if findOneAndUpdate returns null', async () => {
    jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(null as any);

    const result = await addAnswerToQuestion('65e9b5a995b6c7045a30d823', ans1);

    expect(result).toHaveProperty('error', 'Error when adding answer to question');
  });

  test('addAnswerToQuestion returns error if answer is invalid (missing required fields)', async () => {
    const invalidAnswer: Partial<DatabaseAnswer> = {
      text: 'This is an answer text',
      ansBy: 'user123', // missing ansDateTime
    };

    const qid = 'validQuestionId';

    const result = await addAnswerToQuestion(qid, invalidAnswer as DatabaseAnswer);

    expect(result).toEqual({
      error: 'Error when adding answer to question',
    });
  });

  test('addAnswerToQuestion triggers DB + email notifications for followers', async () => {
    const question: DatabaseQuestion = {
      ...(QUESTIONS[0] as DatabaseQuestion),
      _id: new mongoose.Types.ObjectId(),
      title: 'Question title',
      followers: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    } as any;

    const answer: DatabaseAnswer = {
      ...(ans4 as any),
      text: 'This is a new answer text that is quite long',
      ansBy: 'authorUser',
      _id: new mongoose.Types.ObjectId(),
      ansDateTime: new Date(),
    };

    jest
      .spyOn(QuestionModel, 'findOneAndUpdate')
      .mockResolvedValueOnce(question as any);

    populateSpy.mockResolvedValueOnce({
      ...question,
      followers: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    } as any);

    const leanMock = jest.fn().mockResolvedValue([
      { username: 'follower1', email: 'f1@example.com', emailVerified: true },
      { username: 'authorUser', email: 'author@example.com', emailVerified: true },
      { username: 'follower2', email: 'f2@example.com', emailVerified: false },
    ]);

    userFindSpy.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: leanMock,
    } as any);

    const result = (await addAnswerToQuestion(
      question._id.toString(),
      answer,
    )) as DatabaseQuestion;

    expect(result._id.toString()).toBe(question._id.toString());

    // Let the async notification IIFE run
    await new Promise(resolve => setImmediate(resolve));

    // DB notifications for followers except the author
    expect(createNotificationSpy.mock.calls.length).toBeGreaterThan(0);
    const notifDocs = createNotificationSpy.mock.calls.map(call => call[0]);
    expect(notifDocs.every((d: any) => d.recipient !== 'authorUser')).toBe(true);

    // Email notifications only for emailVerified followers != author
    expect(sendAnswerNotificationSpy).toHaveBeenCalledTimes(1);
    const payload = sendAnswerNotificationSpy.mock.calls[0][0];

    expect(payload.toEmail).toEqual(['f1@example.com']);
    expect(payload.questionTitle).toBe('Question title');
    expect(payload.answerPreview).toContain('This is a new answer text');
  });

  test('addAnswerToQuestion swallows errors from createNotification and sendAnswerNotification', async () => {
    const question: DatabaseQuestion = {
      ...(QUESTIONS[0] as DatabaseQuestion),
      _id: new mongoose.Types.ObjectId(),
      title: 'Another question',
      followers: [new mongoose.Types.ObjectId()],
    } as any;

    const answer: DatabaseAnswer = {
      ...(ans4 as any),
      text: 'Another answer text',
      ansBy: 'authorUser',
      _id: new mongoose.Types.ObjectId(),
      ansDateTime: new Date(),
    };

    jest
      .spyOn(QuestionModel, 'findOneAndUpdate')
      .mockResolvedValueOnce(question as any);

    populateSpy.mockResolvedValueOnce({
      ...question,
      followers: [new mongoose.Types.ObjectId()],
    } as any);

    const leanMock = jest.fn().mockResolvedValue([
      { username: 'follower1', email: 'f1@example.com', emailVerified: true },
    ]);

    userFindSpy.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: leanMock,
    } as any);

    // Force both notification paths to throw, to ensure they are swallowed
    createNotificationSpy.mockRejectedValueOnce(new Error('insert fail'));
    sendAnswerNotificationSpy.mockRejectedValueOnce(new Error('email fail'));

    const result = await addAnswerToQuestion(question._id.toString(), answer);

    expect((result as any)._id.toString()).toBe(question._id.toString());

    // Allow IIFE to run
    await new Promise(resolve => setImmediate(resolve));

    // Test passes if no exception bubbles up
    expect(true).toBe(true);
  });
});

describe('Answer service - deleteAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns error when answer is not found', async () => {
    jest.spyOn(AnswerModel, 'findById').mockResolvedValueOnce(null as any);

    const result = await deleteAnswer('aid1', 'user1');

    expect(result).toEqual({ error: 'Answer not found' });
  });

  test('returns unauthorized error when user is neither answer author nor question owner', async () => {
    jest.spyOn(AnswerModel, 'findById').mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId('507f191e810c19729de860ea'),
      ansBy: 'alice',
      comments: [],
    } as any);

    jest.spyOn(QuestionModel, 'findOne').mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId('507f191e810c19729de860eb'),
      askedBy: 'owner',
    } as any);

    const result = await deleteAnswer('aid1', 'bob');

    expect(result).toEqual({
      error:
        'Unauthorized: You can only delete your own answers or answers on your question',
    });
  });

  test('deletes answer and comments when authorized and question exists', async () => {
    const answerId = '507f191e810c19729de860ea';
    const ansObjectId = new mongoose.Types.ObjectId(answerId);
    const questionId = new mongoose.Types.ObjectId('507f191e810c19729de860eb');

    jest.spyOn(AnswerModel, 'findById').mockResolvedValueOnce({
      _id: ansObjectId,
      ansBy: 'alice',
      comments: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    } as any);

    jest.spyOn(QuestionModel, 'findOne').mockResolvedValueOnce({
      _id: questionId,
      askedBy: 'owner',
    } as any);

    const deleteManySpy = jest
      .spyOn(CommentModel, 'deleteMany')
      .mockResolvedValueOnce({ acknowledged: true, deletedCount: 2 } as any);

    const findByIdAndUpdateSpy = jest
      .spyOn(QuestionModel, 'findByIdAndUpdate')
      .mockResolvedValueOnce({} as any);

    const findByIdAndDeleteSpy = jest
      .spyOn(AnswerModel, 'findByIdAndDelete')
      .mockResolvedValueOnce({} as any);

    const result = await deleteAnswer(answerId, 'alice');

    expect(deleteManySpy).toHaveBeenCalledTimes(1);
    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(questionId, {
      $pull: { answers: ansObjectId },
    });
    expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(answerId);
    expect(result).toEqual({
      msg: 'Answer deleted successfully',
      qid: questionId.toString(),
    });
  });

  test('ignores errors when deleting comments and still deletes answer', async () => {
    const answerId = '507f191e810c19729de860ea';
    const ansObjectId = new mongoose.Types.ObjectId(answerId);

    jest.spyOn(AnswerModel, 'findById').mockResolvedValueOnce({
      _id: ansObjectId,
      ansBy: 'alice',
      comments: [new mongoose.Types.ObjectId()],
    } as any);

    jest.spyOn(QuestionModel, 'findOne').mockResolvedValueOnce(null as any);

    jest
      .spyOn(CommentModel, 'deleteMany')
      .mockRejectedValueOnce(new Error('comment delete fail') as any);

    const findByIdAndUpdateSpy = jest.spyOn(QuestionModel, 'findByIdAndUpdate');
    const findByIdAndDeleteSpy = jest
      .spyOn(AnswerModel, 'findByIdAndDelete')
      .mockResolvedValueOnce({} as any);

    const result = await deleteAnswer(answerId, 'alice');

    expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
    expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(answerId);
    expect(result).toEqual({
      msg: 'Answer deleted successfully',
      qid: undefined,
    });
  });

  test('returns error when outer try/catch fails (e.g., AnswerModel.findById throws)', async () => {
    jest.spyOn(AnswerModel, 'findById').mockRejectedValueOnce(new Error('boom') as any);

    const result = await deleteAnswer('aid1', 'user1');

    expect(result).toEqual({ error: 'Error when deleting answer' });
  });
});
