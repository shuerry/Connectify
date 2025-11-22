import mongoose from 'mongoose';
import supertest from 'supertest';
import { ObjectId } from 'mongodb';
import express from 'express';

import { app } from '../../app';
import * as answerUtil from '../../services/answer.service';
import * as databaseUtil from '../../utils/database.util';
import answerController from '../../controllers/answer.controller';

const saveAnswerSpy = jest.spyOn(answerUtil, 'saveAnswer');
const addAnswerToQuestionSpy = jest.spyOn(answerUtil, 'addAnswerToQuestion');
const popDocSpy = jest.spyOn(databaseUtil, 'populateDocument');
const deleteAnswerSpy = jest.spyOn(answerUtil, 'deleteAnswer');

describe('POST /addAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new answer to the question', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validAid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      qid: validQid,
      ans: {
        text: 'This is a test answer',
        ansBy: '65e9b716ff0e892116b2de01',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    const mockAnswer = {
      _id: validAid,
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [],
    };
    saveAnswerSpy.mockResolvedValueOnce(mockAnswer as any);

    addAnswerToQuestionSpy.mockResolvedValueOnce({
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [mockAnswer._id],
      comments: [],
      community: null,
      followers: [],
    } as any);

    popDocSpy.mockResolvedValueOnce({
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [mockAnswer],
      comments: [],
      community: null,
      followers: [],
    } as any);

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: validAid.toString(),
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: mockAnswer.ansDateTime.toISOString(),
      comments: [],
    });
  });

  it('should return bad request error if answer text property is missing', async () => {
    const mockReqBody = {
      qid: '65e9b716ff0e892116b2de01',
      ans: {
        ansBy: '65e9b716ff0e892116b2de01',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/ans/text');
  });

  it('should return bad request error if request body has qid property missing', async () => {
    const mockReqBody = {
      ans: {
        ansBy: '65e9b716ff0e892116b2de01',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(400);
  });

  it('should return bad request error if answer object has ansBy property missing', async () => {
    const mockReqBody = {
      qid: 'dummyQuestionId',
      ans: {
        text: 'This is a test answer',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(400);
  });

  it('should return bad request error if answer object has ansDateTime property missing', async () => {
    const mockReqBody = {
      qid: 'dummyQuestionId',
      ans: {
        text: 'This is a test answer',
        ansBy: '65e9b716ff0e892116b2de01',
      },
    };

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(400);
  });

  it('should return bad request error if request body is missing', async () => {
    const response = await supertest(app).post('/api/answer/addAnswer');
    const openApiError = JSON.parse(response.text);

    expect(openApiError.message).toBe('Request Validation Failed');
  });

  it('should return database error in response if saveAnswer method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId().toString();
    const mockReqBody = {
      qid: validQid,
      ans: {
        text: 'This is a test answer',
        ansBy: '65e9b716ff0e892116b2de01',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    saveAnswerSpy.mockResolvedValueOnce({ error: 'Error when saving an answer' } as any);

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(500);
  });

  it('should return database error in response if update question method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId().toString();
    const mockReqBody = {
      qid: validQid,
      ans: {
        text: 'This is a test answer',
        ansBy: '65e9b716ff0e892116b2de01',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    const mockAnswer = {
      _id: new ObjectId('507f191e810c19729de860ea'),
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [],
    };

    saveAnswerSpy.mockResolvedValueOnce(mockAnswer as any);
    addAnswerToQuestionSpy.mockResolvedValueOnce({
      error: 'Error when adding answer to question',
    } as any);

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(500);
  });

  it('should return database error in response if `populateDocument` method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      qid: validQid,
      ans: {
        text: 'This is a test answer',
        ansBy: '65e9b716ff0e892116b2de01',
        ansDateTime: new Date('2024-06-03'),
      },
    };

    const mockAnswer = {
      _id: new ObjectId('507f191e810c19729de860ea'),
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [],
    };

    const mockQuestion = {
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [mockAnswer._id],
      comments: [],
      community: null,
      followers: [],
    };

    saveAnswerSpy.mockResolvedValueOnce(mockAnswer as any);
    addAnswerToQuestionSpy.mockResolvedValueOnce(mockQuestion as any);
    popDocSpy.mockResolvedValueOnce({ error: 'Error when populating document' } as any);

    const response = await supertest(app).post('/api/answer/addAnswer').send(mockReqBody);

    expect(response.status).toBe(500);
  });
});

describe('DELETE /deleteAnswer/:answerId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when username is missing', async () => {
    const res = await supertest(app).delete('/api/answer/deleteAnswer/507f191e810c19729de860ea');

    expect(res.status).toBe(400);
    expect(res.text).toBe('Username is required');
    expect(deleteAnswerSpy).not.toHaveBeenCalled();
  });

  it('should return 404 when service says "Answer not found"', async () => {
    deleteAnswerSpy.mockResolvedValueOnce({ error: 'Answer not found' });

    const res = await supertest(app)
      .delete('/api/answer/deleteAnswer/507f191e810c19729de860ea')
      .send({ username: 'alice' });

    expect(deleteAnswerSpy).toHaveBeenCalledWith('507f191e810c19729de860ea', 'alice');
    expect(res.status).toBe(404);
    expect(res.text).toBe('Answer not found');
  });

  it('should return 403 when service returns Unauthorized error', async () => {
    deleteAnswerSpy.mockResolvedValueOnce({
      error: 'Unauthorized: You can only delete your own answers or answers on your question',
    });

    const res = await supertest(app)
      .delete('/api/answer/deleteAnswer/507f191e810c19729de860ea')
      .send({ username: 'bob' });

    expect(res.status).toBe(403);
    expect(res.text).toContain('Unauthorized');
  });

  it('should return 400 when service returns some other error', async () => {
    deleteAnswerSpy.mockResolvedValueOnce({
      error: 'Some other delete error',
    });

    const res = await supertest(app)
      .delete('/api/answer/deleteAnswer/507f191e810c19729de860ea')
      .send({ username: 'bob' });

    expect(res.status).toBe(400);
    expect(res.text).toBe('Some other delete error');
  });

  it('should return 200 and emit delete event when delete succeeds with qid', async () => {
    const qidStr = new ObjectId().toString();

    deleteAnswerSpy.mockResolvedValueOnce({
      msg: 'Answer deleted successfully',
      qid: qidStr,
    });

    const res = await supertest(app)
      .delete('/api/answer/deleteAnswer/507f191e810c19729de860ea')
      .send({ username: 'alice' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Answer deleted successfully' });
    expect(deleteAnswerSpy).toHaveBeenCalledWith('507f191e810c19729de860ea', 'alice');
  });

  it('should return 200 when delete succeeds without qid (falls back to new ObjectId)', async () => {
    deleteAnswerSpy.mockResolvedValueOnce({
      msg: 'Answer deleted successfully',
    });

    const res = await supertest(app)
      .delete('/api/answer/deleteAnswer/507f191e810c19729de860ea')
      .send({ username: 'alice' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Answer deleted successfully' });
  });

  it('should return 500 when service throws', async () => {
    deleteAnswerSpy.mockRejectedValueOnce(new Error('boom'));

    const res = await supertest(app)
      .delete('/api/answer/deleteAnswer/507f191e810c19729de860ea')
      .send({ username: 'alice' });

    expect(res.status).toBe(500);
    expect(res.text).toContain('Error when deleting answer: boom');
  });
});

describe('deleteAnswerRoute direct handler (answerId required branch)', () => {
  it('should return 400 when answerId param is missing', async () => {
    const fakeSocket = { emit: jest.fn() } as any;
    const router = answerController(fakeSocket);

    const layer = (router as any).stack.find(
      (l: any) => l.route && l.route.path === '/deleteAnswer/:answerId',
    );

    const handler = layer.route.stack[0].handle;

    const req: any = {
      params: {}, // no answerId -> triggers explicit 400 branch
      body: { username: 'alice' },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('answerId is required');
  });
});
