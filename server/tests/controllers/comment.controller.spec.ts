import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import commentController from '../../controllers/comment.controller';
import * as commentUtil from '../../services/comment.service';
import * as databaseUtil from '../../utils/database.util';
import { AddCommentRequest, FakeSOSocket } from '../../types/types';

const saveCommentSpy = jest.spyOn(commentUtil, 'saveComment');
const addCommentSpy = jest.spyOn(commentUtil, 'addComment');
const popDocSpy = jest.spyOn(databaseUtil, 'populateDocument');
const deleteCommentSpy = jest.spyOn(commentUtil, 'deleteComment');

type MockResponse = Response & {
  status: jest.Mock;
  send: jest.Mock;
  json: jest.Mock;
};

const createMockResponse = (): MockResponse => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    json: jest.fn(),
  };
  return res as unknown as MockResponse;
};

const getRouteHandler = (method: 'post' | 'delete', path: string) => {
  const fakeSocket = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    on: jest.fn(),
  } as unknown as FakeSOSocket;

  const router = commentController(fakeSocket);
  const routerStack = (router as unknown as {
    stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: { handle: unknown }[] } }>;
  }).stack;
  const layer = routerStack.find(
    stackLayer => stackLayer.route && stackLayer.route.path === path && stackLayer.route.methods[method],
  );

  if (!layer || !layer.route) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[0].handle as (req: Request, res: Response) => Promise<void> | void;
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /addComment', () => {
  it('should add a new comment to the question', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment._id],
      community: null,
      followers: [],
    });

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
      answers: [],
      comments: [mockComment],
      community: null,
      followers: [],
    });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: validCid.toString(),
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: mockComment.commentDateTime.toISOString(),
    });
  });

  it('should add a new comment to the answer', async () => {
    const validAid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validAid.toString(),
      type: 'answer',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);

    addCommentSpy.mockResolvedValueOnce({
      _id: validAid,
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [mockComment._id],
    });

    popDocSpy.mockResolvedValueOnce({
      _id: validAid,
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [mockComment],
    });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: validCid.toString(),
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: mockComment.commentDateTime.toISOString(),
    });
  });

  it('should return bad request error if id property missing', async () => {
    const mockReqBody = {
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toContain('/body/id');
  });

  it('should return bad request error if type property is missing', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      comment: {
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toContain('/body/type');
  });

  it('should return bad request error if type property is not `question` or `answer` ', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'invalidType',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].message).toContain('must be equal to one of the allowed values');
  });

  it('should return bad request error if comment text property is missing', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment/text');
  });

  it('should return bad request error if text property of comment is empty', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'answer',
      comment: {
        text: '',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment/text');
  });

  it('should return bad request error if commentBy property missing', async () => {
    const mockReqBody = {
      id: 'dummyQuestionId',
      type: 'question',
      com: {
        text: 'This is a test comment',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment');
  });

  it('should return bad request error if commentDateTime property missing', async () => {
    const mockReqBody = {
      id: '65e9b716ff0e892116b2de02',
      type: 'answer',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment/commentDateTime');
  });

  it('should return bad request error if request body is missing', async () => {
    const response = await supertest(app).post('/api/comment/addComment');

    expect(response.status).toBe(415);
  });

  it('should return bad request error if qid is not a valid ObjectId', async () => {
    const mockReqBody = {
      id: 'invalidObjectId',
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/id');
  });

  it('should return database error in response if saveComment method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'answer',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    saveCommentSpy.mockResolvedValueOnce({ error: 'Error when saving a comment' });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding comment: Error when saving a comment');
  });

  it('should return database error in response if `addComment` method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      error: 'Error when adding comment',
    });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding comment: Error when adding comment');
  });

  it('should return database error in response if `populateDocument` method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
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
      answers: [],
      comments: [mockComment._id],
      community: null,
      followers: [],
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce(mockQuestion);
    popDocSpy.mockResolvedValueOnce({ error: 'Error when populating document' });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding comment: Error when populating document');
  });
});

describe('comment controller internal validation guards', () => {
  it('should short-circuit with 400 when id is not a valid ObjectId', async () => {
    const addHandler = getRouteHandler('post', '/addComment');
    const res = createMockResponse();

    await addHandler(
      {
        body: {
          id: 'not-an-object-id',
          type: 'question',
          comment: {
            text: 'Hello',
            commentBy: 'user1',
            commentDateTime: new Date('2024-06-03'),
          },
        },
      } as AddCommentRequest,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid ID format');
    expect(saveCommentSpy).not.toHaveBeenCalled();
  });

  it('should return 400 when delete comment route is hit without commentId param', async () => {
    const deleteHandler = getRouteHandler('delete', '/deleteComment/:commentId');
    const res = createMockResponse();

    await deleteHandler(
      {
        params: {},
        body: { username: 'user1' },
      } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('commentId is required');
    expect(deleteCommentSpy).not.toHaveBeenCalled();
  });
});

describe('DELETE /deleteComment/:commentId', () => {
  it('should delete the comment when user is authorized', async () => {
    const commentId = new mongoose.Types.ObjectId().toString();
    const username = 'authorizedUser';

    deleteCommentSpy.mockResolvedValueOnce({
      msg: 'Comment deleted successfully',
      parentId: new mongoose.Types.ObjectId().toString(),
    });

    const response = await supertest(app)
      .delete(`/api/comment/deleteComment/${commentId}`)
      .send({ username });

    expect(deleteCommentSpy).toHaveBeenCalledWith(commentId, username);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Comment deleted successfully' });
  });

  it('should return 400 if username is missing', async () => {
    const commentId = new mongoose.Types.ObjectId().toString();

    const response = await supertest(app)
      .delete(`/api/comment/deleteComment/${commentId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe('Username is required');
    expect(deleteCommentSpy).not.toHaveBeenCalled();
  });

  it('should return 404 when comment is not found', async () => {
    const commentId = new mongoose.Types.ObjectId().toString();
    deleteCommentSpy.mockResolvedValueOnce({ error: 'Comment not found' });

    const response = await supertest(app)
      .delete(`/api/comment/deleteComment/${commentId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Comment not found');
  });

  it('should return 403 when deleteComment reports unauthorized', async () => {
    const commentId = new mongoose.Types.ObjectId().toString();
    deleteCommentSpy.mockResolvedValueOnce({ error: 'Unauthorized: Cannot delete this comment' });

    const response = await supertest(app)
      .delete(`/api/comment/deleteComment/${commentId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: Cannot delete this comment');
  });

  it('should return 400 for other deleteComment errors', async () => {
    const commentId = new mongoose.Types.ObjectId().toString();
    deleteCommentSpy.mockResolvedValueOnce({ error: 'Comment parent not found' });

    const response = await supertest(app)
      .delete(`/api/comment/deleteComment/${commentId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Comment parent not found');
  });

  it('should return 500 when deleteComment throws', async () => {
    const commentId = new mongoose.Types.ObjectId().toString();
    deleteCommentSpy.mockRejectedValueOnce(new Error('database offline'));

    const response = await supertest(app)
      .delete(`/api/comment/deleteComment/${commentId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when deleting comment: database offline');
  });
});
