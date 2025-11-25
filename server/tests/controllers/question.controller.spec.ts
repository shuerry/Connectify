import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as questionUtil from '../../services/question.service';
import * as tagUtil from '../../services/tag.service';
import * as databaseUtil from '../../utils/database.util';
import {
  Answer,
  DatabaseQuestion,
  DatabaseTag,
  PopulatedDatabaseAnswer,
  PopulatedDatabaseQuestion,
  Question,
  Tag,
  VoteResponse,
} from '../../types/types';

const addVoteToQuestionSpy = jest.spyOn(questionUtil, 'addVoteToQuestion');
const getQuestionsByOrderSpy: jest.SpyInstance = jest.spyOn(questionUtil, 'getQuestionsByOrder');
const filterQuestionsBySearchSpy: jest.SpyInstance = jest.spyOn(
  questionUtil,
  'filterQuestionsBySearch',
);
const getCommunityQuestionsSpy: jest.SpyInstance = jest.spyOn(
  questionUtil,
  'getCommunityQuestions',
);
const populateDocumentSpy: jest.SpyInstance = jest.spyOn(databaseUtil, 'populateDocument');

const tag1: Tag = {
  name: 'tag1',
  description: 'tag1 description',
};

const dbTag1: DatabaseTag = {
  _id: new mongoose.Types.ObjectId('507f191e810c19729de860ea'),
  ...tag1,
};

const tag2: Tag = {
  name: 'tag2',
  description: 'tag2 description',
};

const dbTag2: DatabaseTag = {
  _id: new mongoose.Types.ObjectId('65e9a5c2b26199dbcc3e6dc8'),
  ...tag2,
};

const mockQuestion: Question = {
  title: 'New Question Title',
  text: 'New Question Text',
  tags: [tag1, tag2],
  answers: [],
  askedBy: 'question3_user',
  askDateTime: new Date('2024-06-06'),
  views: [],
  upVotes: [],
  downVotes: [],
  comments: [],
  community: null,
  followers: [],
};

const mockDatabaseQuestion: DatabaseQuestion = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6fe'),
  title: 'New Question Title',
  text: 'New Question Text',
  tags: [dbTag1._id, dbTag2._id],
  answers: [],
  askedBy: 'question3_user',
  askDateTime: new Date('2024-06-06'),
  views: [],
  upVotes: [],
  downVotes: [],
  comments: [],
  community: null,
  followers: [],
};

const mockPopulatedQuestion: PopulatedDatabaseQuestion = {
  ...mockDatabaseQuestion,
  tags: [dbTag1, dbTag2],
  answers: [],
  comments: [],
  community: null,
  followers: [],
};

const mockCommunityDatabaseQuestion: DatabaseQuestion = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6fe'),
  title: 'New Question Title',
  text: 'New Question Text',
  tags: [dbTag1._id, dbTag2._id],
  answers: [],
  askedBy: 'question3_user',
  askDateTime: new Date('2024-06-05'),
  views: [],
  upVotes: [],
  downVotes: [],
  comments: [],
  community: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6f1'),
  followers: [],
};

const mockCommunityPopulatedQuestion: PopulatedDatabaseQuestion = {
  ...mockCommunityDatabaseQuestion,
  tags: [dbTag1, dbTag2],
  answers: [],
  comments: [],
  community: {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6f1'),
    name: 'cs4530',
    description: '',
    createdAt: new Date('2024-06-05'),
    updatedAt: new Date('2024-06-05'),
    visibility: 'PRIVATE',
    admin: 'question3_user',
    participants: ['question3_user'],
  },
  followers: [],
};

const ans1: PopulatedDatabaseAnswer = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dc'),
  text: 'Answer 1 Text',
  ansBy: 'answer1_user',
  ansDateTime: new Date('2024-06-09'), // The mock date is string type but in the actual implementation it is a Date type
  comments: [],
};

const ans2: PopulatedDatabaseAnswer = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
  text: 'Answer 2 Text',
  ansBy: 'answer2_user',
  ansDateTime: new Date('2024-06-10'),
  comments: [],
};

const ans3: PopulatedDatabaseAnswer = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6df'),
  text: 'Answer 3 Text',
  ansBy: 'answer3_user',
  ansDateTime: new Date('2024-06-11'),
  comments: [],
};

const ans4: PopulatedDatabaseAnswer = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6de'),
  text: 'Answer 4 Text',
  ansBy: 'answer4_user',
  ansDateTime: new Date('2024-06-14'),
  comments: [],
};

const MOCK_POPULATED_QUESTIONS: PopulatedDatabaseQuestion[] = [
  {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dc'),
    title: 'Question 1 Title',
    text: 'Question 1 Text',
    tags: [dbTag1],
    answers: [ans1],
    askedBy: 'question1_user',
    askDateTime: new Date('2024-06-03'),
    views: ['question1_user', 'question2_user'],
    upVotes: [],
    downVotes: [],
    comments: [],
    community: null,
    followers: [],
  },
  {
    _id: new mongoose.Types.ObjectId('65e9b5a995b6c7045a30d823'),
    title: 'Question 2 Title',
    text: 'Question 2 Text',
    tags: [dbTag2],
    answers: [ans2, ans3],
    askedBy: 'question2_user',
    askDateTime: new Date('2024-06-04'),
    views: ['question1_user', 'question2_user', 'question3_user'],
    upVotes: [],
    downVotes: [],
    comments: [],
    community: null,
    followers: [],
  },
  {
    _id: new mongoose.Types.ObjectId('34e9b58910afe6e94fc6e99f'),
    title: 'Question 3 Title',
    text: 'Question 3 Text',
    tags: [dbTag1, dbTag2],
    answers: [ans4],
    askedBy: 'question3_user',
    askDateTime: new Date('2024-06-03'),
    views: ['question3_user'],
    upVotes: [],
    downVotes: [],
    comments: [],
    community: null,
    followers: [],
  },
];

const simplifyQuestion = (question: PopulatedDatabaseQuestion) => ({
  ...question,
  _id: question._id.toString(), // Converting ObjectId to string
  tags: question.tags.map(tag => ({ ...tag, _id: tag._id.toString() })), // Converting tag ObjectId
  answers: question.answers.map(answer => ({
    ...answer,
    _id: answer._id.toString(),
    ansDateTime: (answer as Answer).ansDateTime.toISOString(),
  })), // Converting answer ObjectId
  askDateTime: question.askDateTime.toISOString(),
});

const EXPECTED_QUESTIONS = MOCK_POPULATED_QUESTIONS.map(question => simplifyQuestion(question));

describe('Test questionController', () => {
  describe('POST /addQuestion', () => {
    it('should add a new question', async () => {
      jest.spyOn(tagUtil, 'processTags').mockResolvedValue([dbTag1, dbTag2]);
      jest.spyOn(questionUtil, 'saveQuestion').mockResolvedValueOnce(mockDatabaseQuestion);
      jest.spyOn(databaseUtil, 'populateDocument').mockResolvedValueOnce(mockPopulatedQuestion);

      // Making the request
      const response = await supertest(app).post('/api/question/addQuestion').send(mockQuestion);

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(simplifyQuestion(mockPopulatedQuestion));
    });

    it('should return 500 if error occurs in `saveQuestion` while adding a new question', async () => {
      jest.spyOn(tagUtil, 'processTags').mockResolvedValue([dbTag1, dbTag2]);
      jest
        .spyOn(questionUtil, 'saveQuestion')
        .mockResolvedValueOnce({ error: 'Error while saving question' });

      // Making the request
      const response = await supertest(app).post('/api/question/addQuestion').send(mockQuestion);

      // Asserting the response
      expect(response.status).toBe(500);
    });

    it('should return 500 if error occurs in populateDocument while adding a new question', async () => {
      jest.spyOn(tagUtil, 'processTags').mockResolvedValue([dbTag1, dbTag2]);
      jest.spyOn(questionUtil, 'saveQuestion').mockResolvedValueOnce(mockDatabaseQuestion);
      jest
        .spyOn(databaseUtil, 'populateDocument')
        .mockResolvedValueOnce({ error: 'Error while populating' });

      // Making the request
      const response = await supertest(app).post('/api/question/addQuestion').send(mockQuestion);

      // Asserting the response
      expect(response.status).toBe(500);
    });

    it('should return 500 with generic error message when error is not Error instance in addQuestion', async () => {
      jest.spyOn(tagUtil, 'processTags').mockRejectedValueOnce('String error');

      const response = await supertest(app).post('/api/question/addQuestion').send(mockQuestion);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when saving question');
    });

    it('should return 500 if tag ids could not be retrieved', async () => {
      jest.spyOn(tagUtil, 'processTags').mockResolvedValue([]);

      // Making the request
      const response = await supertest(app).post('/api/question/addQuestion').send(mockQuestion);

      // Asserting the response
      expect(response.status).toBe(500);
    });

    it('should return bad request if question title is empty string', async () => {
      // Making the request
      const response = await supertest(app)
        .post('/api/question/addQuestion')
        .send({ ...mockQuestion, title: '' });

      const openApiError = JSON.parse(response.text);

      // Asserting the response
      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/title');
    });

    it('should return bad request if tags are empty', async () => {
      // Making the request
      const response = await supertest(app)
        .post('/api/question/addQuestion')
        .send({ ...mockQuestion, tags: [] });

      const openApiError = JSON.parse(response.text);

      // Asserting the response
      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/tags');
    });

    it('should return bad request if askedBy is empty string', async () => {
      // Making the request
      const response = await supertest(app)
        .post('/api/question/addQuestion')
        .send({ ...mockQuestion, askedBy: '' });

      const openApiError = JSON.parse(response.text);

      // Asserting the response
      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/askedBy');
    });

    it('should ensure only unique tags are added', async () => {
      // Mock request body with duplicate tags
      const mockQuestionDuplicates: Question = {
        // _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6fe'),
        title: 'New Question Title',
        text: 'New Question Text',
        tags: [dbTag1, dbTag1, dbTag2, dbTag2], // Duplicate tags
        answers: [],
        askedBy: 'question3_user',
        askDateTime: new Date('2024-06-06'),
        views: [],
        upVotes: [],
        downVotes: [],
        comments: [],
        community: null,
        followers: [],
      };

      const result: PopulatedDatabaseQuestion = {
        ...mockQuestionDuplicates,
        _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6fe'),
        tags: [dbTag1, dbTag2], // Duplicate tags
        answers: [],
        comments: [],
        community: null,
      };

      // Set up the mock to resolve with unique tags
      jest.spyOn(tagUtil, 'processTags').mockResolvedValue([dbTag1, dbTag2]);
      jest.spyOn(questionUtil, 'saveQuestion').mockResolvedValueOnce({
        ...result,
        tags: [dbTag1._id, dbTag2._id], // Ensure only unique tags are saved,
        answers: [],
        comments: [],
        community: null,
      } as unknown as DatabaseQuestion);

      jest.spyOn(databaseUtil, 'populateDocument').mockResolvedValueOnce(result);

      // Making the request
      const response = await supertest(app)
        .post('/api/question/addQuestion')
        .send(mockQuestionDuplicates);

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(simplifyQuestion(result)); // Expect only unique tags
    });
  });

  describe('POST /upvoteQuestion', () => {
    it('should return 500 when addVoteToQuestion returns error', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'test-user',
      };

      addVoteToQuestionSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).post('/api/question/upvoteQuestion').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when upvoteing');
    });

    it('should upvote a question successfully', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'new-user',
      };

      const mockResponse = {
        msg: 'Question upvoted successfully',
        upVotes: ['new-user'],
        downVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockResponse);

      const response = await supertest(app).post('/api/question/upvoteQuestion').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should cancel the upvote successfully', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'some-user',
      };

      const mockFirstResponse = {
        msg: 'Question upvoted successfully',
        upVotes: ['some-user'],
        downVotes: [],
      };

      const mockSecondResponse = {
        msg: 'Upvote cancelled successfully',
        upVotes: [],
        downVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockFirstResponse);

      const firstResponse = await supertest(app)
        .post('/api/question/upvoteQuestion')
        .send(mockReqBody);
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toEqual(mockFirstResponse);

      addVoteToQuestionSpy.mockResolvedValueOnce(mockSecondResponse);

      const secondResponse = await supertest(app)
        .post('/api/question/upvoteQuestion')
        .send(mockReqBody);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual(mockSecondResponse);
    });

    it('should handle upvote and then downvote by the same user', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'new-user',
      };

      // First upvote the question
      let mockResponseWithBothVotes: VoteResponse = {
        msg: 'Question upvoted successfully',
        upVotes: ['new-user'],
        downVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockResponseWithBothVotes);

      let response = await supertest(app).post('/api/question/upvoteQuestion').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseWithBothVotes);

      // Now downvote the question
      mockResponseWithBothVotes = {
        msg: 'Question downvoted successfully',
        downVotes: ['new-user'],
        upVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockResponseWithBothVotes);

      response = await supertest(app).post('/api/question/downvoteQuestion').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponseWithBothVotes);
    });

    it('should return bad request error if the request had qid missing', async () => {
      const mockReqBody = {
        username: 'some-user',
      };

      const response = await supertest(app).post(`/api/question/upvoteQuestion`).send(mockReqBody);

      expect(response.status).toBe(400);
    });

    it('should return bad request error if the request had username missing', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
      };

      const response = await supertest(app).post(`/api/question/upvoteQuestion`).send(mockReqBody);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /downvoteQuestion', () => {
    it('should downvote a question successfully', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'new-user',
      };

      const mockResponse = {
        msg: 'Question upvoted successfully',
        downVotes: ['new-user'],
        upVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockResponse);

      const response = await supertest(app)
        .post('/api/question/downvoteQuestion')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should cancel the downvote successfully', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'some-user',
      };

      const mockFirstResponse = {
        msg: 'Question downvoted successfully',
        upVotes: [],
        downVotes: ['some-user'],
      };

      const mockSecondResponse = {
        msg: 'Dwonvote cancelled successfully',
        upVotes: [],
        downVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockFirstResponse);

      const firstResponse = await supertest(app)
        .post('/api/question/downvoteQuestion')
        .send(mockReqBody);
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toEqual(mockFirstResponse);

      addVoteToQuestionSpy.mockResolvedValueOnce(mockSecondResponse);

      const secondResponse = await supertest(app)
        .post('/api/question/downvoteQuestion')
        .send(mockReqBody);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual(mockSecondResponse);
    });

    it('should handle downvote and then upvote by the same user', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
        username: 'new-user',
      };

      // First downvote the question
      let mockResponse: VoteResponse = {
        msg: 'Question downvoted successfully',
        downVotes: ['new-user'],
        upVotes: [],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockResponse);

      let response = await supertest(app).post('/api/question/downvoteQuestion').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);

      // Then upvote the question
      mockResponse = {
        msg: 'Question upvoted successfully',
        downVotes: [],
        upVotes: ['new-user'],
      };

      addVoteToQuestionSpy.mockResolvedValueOnce(mockResponse);

      response = await supertest(app).post('/api/question/upvoteQuestion').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should return bad request error if the request had qid missing', async () => {
      const mockReqBody = {
        username: 'some-user',
      };

      const response = await supertest(app)
        .post(`/api/question/downvoteQuestion`)
        .send(mockReqBody);

      expect(response.status).toBe(400);
    });

    it('should return bad request error if the request had username missing', async () => {
      const mockReqBody = {
        qid: '65e9b5a995b6c7045a30d823',
      };

      const response = await supertest(app)
        .post(`/api/question/downvoteQuestion`)
        .send(mockReqBody);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /getQuestionById/:qid', () => {
    it('should return a question object in the response when the question id is passed as request parameter', async () => {
      // Mock request parameters
      const mockReqParams = {
        qid: '65e9b5a995b6c7045a30d823',
      };
      const mockReqQuery = {
        username: 'question3_user',
      };

      const populatedFindQuestion = MOCK_POPULATED_QUESTIONS.filter(
        q => q._id.toString() === mockReqParams.qid,
      )[0];

      // Provide mock question data
      jest
        .spyOn(questionUtil, 'fetchAndIncrementQuestionViewsById')
        .mockResolvedValueOnce(populatedFindQuestion);

      // Making the request
      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}?username=${mockReqQuery.username}`,
      );

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(simplifyQuestion(populatedFindQuestion));
    });

    it('should not return a question object with a duplicated user in the views if the user is viewing the same question again', async () => {
      // Mock request parameters
      const mockReqParams = {
        qid: '65e9b5a995b6c7045a30d823',
      };
      const mockReqQuery = {
        username: 'question2_user',
      };

      const populatedFindQuestion = MOCK_POPULATED_QUESTIONS.filter(
        q => q._id.toString() === mockReqParams.qid,
      )[0];

      // Provide mock question data
      jest
        .spyOn(questionUtil, 'fetchAndIncrementQuestionViewsById')
        .mockResolvedValueOnce(populatedFindQuestion);

      // Making the request
      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}?username=${mockReqQuery.username}`,
      );

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(simplifyQuestion(populatedFindQuestion));
    });

    it('should return bad request error if the question id is not in the correct format', async () => {
      // Mock request parameters
      const mockReqParams = {
        qid: 'invalid id',
      };
      const mockReqQuery = {
        username: 'question2_user',
      };

      // Making the request
      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}?username=${mockReqQuery.username}`,
      );

      // Asserting the response
      const openApiError = JSON.parse(response.text);

      // Asserting the response
      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/params/qid');
    });

    it('should return bad request error if the username is not provided', async () => {
      // Mock request parameters
      const mockReqParams = {
        qid: '65e9b5a995b6c7045a30d823',
      };

      // Making the request
      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}`,
      );
      const openApiError = JSON.parse(response.text);

      // Asserting the response
      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/query/username');
    });

    it('should return database error if the question id is not found in the database', async () => {
      // Mock request parameters
      const mockReqParams = {
        qid: '65e9b5a995b6c7045a30d823',
      };
      const mockReqQuery = {
        username: 'question2_user',
      };

      jest
        .spyOn(questionUtil, 'fetchAndIncrementQuestionViewsById')
        .mockResolvedValueOnce({ error: 'Failed to get question.' });

      // Making the request
      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}?username=${mockReqQuery.username}`,
      );

      // Asserting the response
      expect(response.status).toBe(500);
      expect(response.text).toBe(
        'Error when fetching question by id: Error while fetching question by id',
      );
    });

    it('should return bad request error if an error occurs when fetching and updating the question', async () => {
      // Mock request parameters
      const mockReqParams = {
        qid: '65e9b5a995b6c7045a30d823',
      };
      const mockReqQuery = {
        username: 'question2_user',
      };

      jest
        .spyOn(questionUtil, 'fetchAndIncrementQuestionViewsById')
        .mockResolvedValueOnce({ error: 'Error when fetching and updating a question' });

      // Making the request
      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}?username=${mockReqQuery.username}`,
      );

      // Asserting the response
      expect(response.status).toBe(500);
      expect(response.text).toBe(
        'Error when fetching question by id: Error while fetching question by id',
      );
    });

    it('should return 500 with generic error message when error is not Error instance in getQuestionById', async () => {
      const mockReqParams = {
        qid: '65e9b5a995b6c7045a30d823',
      };
      const mockReqQuery = {
        username: 'test_user',
      };

      jest
        .spyOn(questionUtil, 'fetchAndIncrementQuestionViewsById')
        .mockRejectedValueOnce('String error');

      const response = await supertest(app).get(
        `/api/question/getQuestionById/${mockReqParams.qid}?username=${mockReqQuery.username}`,
      );

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when fetching question by id');
    });
  });

  describe('GET /getQuestion', () => {
    it('should return the result of filterQuestionsBySearch as response even if request parameters of order and search are absent', async () => {
      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      filterQuestionsBySearchSpy.mockReturnValueOnce(MOCK_POPULATED_QUESTIONS);
      // Making the request
      const response = await supertest(app).get('/api/question/getQuestion');

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(EXPECTED_QUESTIONS);
    });

    it('should filter questions by askedBy when provided', async () => {
      const filteredQuestions = MOCK_POPULATED_QUESTIONS.filter(
        q => q.askedBy === 'question1_user',
      );

      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      jest.spyOn(questionUtil, 'filterQuestionsByAskedBy').mockReturnValueOnce(filteredQuestions);
      filterQuestionsBySearchSpy.mockReturnValueOnce(filteredQuestions);

      const response = await supertest(app).get('/api/question/getQuestion').query({
        askedBy: 'question1_user',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(filteredQuestions.map(q => simplifyQuestion(q)));
    });

    it('should filter by both askedBy and search parameters together', async () => {
      const askedByFiltered = MOCK_POPULATED_QUESTIONS.filter(q => q.askedBy === 'question3_user');
      const finalFiltered = askedByFiltered.filter(q => q.title.includes('Question 3'));

      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      jest.spyOn(questionUtil, 'filterQuestionsByAskedBy').mockReturnValueOnce(askedByFiltered);
      filterQuestionsBySearchSpy.mockReturnValueOnce(finalFiltered);

      const response = await supertest(app).get('/api/question/getQuestion').query({
        order: 'newest',
        search: 'Question 3',
        askedBy: 'question3_user',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(finalFiltered.map(q => simplifyQuestion(q)));
    });

    it('should handle empty search string parameter', async () => {
      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      filterQuestionsBySearchSpy.mockReturnValueOnce(MOCK_POPULATED_QUESTIONS);

      const response = await supertest(app).get('/api/question/getQuestion').query({
        order: 'newest',
        search: '',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(EXPECTED_QUESTIONS);
    });

    it('should return empty array when askedBy filter returns no results', async () => {
      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      jest.spyOn(questionUtil, 'filterQuestionsByAskedBy').mockReturnValueOnce([]);
      filterQuestionsBySearchSpy.mockReturnValueOnce([]);

      const response = await supertest(app).get('/api/question/getQuestion').query({
        askedBy: 'non_existent_user',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return the result of filterQuestionsBySearch as response for an order and search criteria in the request parameters', async () => {
      // Mock request query parameters
      const mockReqQuery = {
        order: 'newest',
        search: 'dummySearch',
      };

      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      filterQuestionsBySearchSpy.mockReturnValueOnce(MOCK_POPULATED_QUESTIONS);

      // Making the request
      const response = await supertest(app).get('/api/question/getQuestion').query(mockReqQuery);

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(EXPECTED_QUESTIONS);
    });

    it('should return error if getQuestionsByOrder throws an error', async () => {
      // Mock request query parameters
      const mockReqQuery = {
        order: 'mostViewed',
        search: 'dummySearch',
      };
      getQuestionsByOrderSpy.mockRejectedValueOnce(new Error('Error fetching questions'));
      // Making the request
      const response = await supertest(app).get('/api/question/getQuestion').query(mockReqQuery);

      // Asserting the response
      expect(response.status).toBe(500);
    });

    it('should return error if filterQuestionsBySearch throws an error', async () => {
      // Mock request query parameters
      const mockReqQuery = {
        order: 'active',
        search: 'dummySearch',
      };
      getQuestionsByOrderSpy.mockResolvedValueOnce(MOCK_POPULATED_QUESTIONS);
      filterQuestionsBySearchSpy.mockImplementationOnce(() => {
        throw new Error('Error filtering questions');
      });
      // Making the request
      const response = await supertest(app).get('/api/question/getQuestion').query(mockReqQuery);

      // Asserting the response
      expect(response.status).toBe(500);
    });

    it('should return 500 with generic error message when error is not Error instance', async () => {
      getQuestionsByOrderSpy.mockRejectedValueOnce('String error');

      const response = await supertest(app).get('/api/question/getQuestion');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when fetching questions by filter');
    });
  });

  describe('GET /getCommunityQuestions', () => {
    it('should return the result of getCommunityQuestions as response', async () => {
      getCommunityQuestionsSpy.mockResolvedValueOnce([mockCommunityDatabaseQuestion]);
      populateDocumentSpy.mockResolvedValueOnce(mockCommunityPopulatedQuestion);

      // Making the request
      const response = await supertest(app).get(
        '/api/question/getCommunityQuestions/65e9b58910afe6e94fc6e6f1',
      );

      // Asserting the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          ...simplifyQuestion(mockCommunityPopulatedQuestion),
          community: {
            ...mockCommunityPopulatedQuestion.community,
            _id: mockCommunityPopulatedQuestion.community?._id.toString(),
            createdAt: mockCommunityPopulatedQuestion.community?.createdAt.toISOString(),
            updatedAt: mockCommunityPopulatedQuestion.community?.updatedAt.toISOString(),
          },
        },
      ]);
    });

    it('should return 404 if no params are provided', async () => {
      // Making the request
      const response = await supertest(app).get('/api/question/getCommunityQuestions');

      // Asserting the response
      expect(response.status).toBe(404);
    });

    it('should return 500 when populateDocument returns error', async () => {
      getCommunityQuestionsSpy.mockResolvedValueOnce([mockCommunityDatabaseQuestion]);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Failed to populate' });

      const response = await supertest(app).get(
        '/api/question/getCommunityQuestions/65e9b58910afe6e94fc6e6f1',
      );

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when fetching community questions');
    });

    it('should return 500 when getCommunityQuestions throws error', async () => {
      getCommunityQuestionsSpy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app).get(
        '/api/question/getCommunityQuestions/65e9b58910afe6e94fc6e6f1',
      );

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when fetching community questions: Database error');
    });
  });

  describe('PUT /editQuestion/:qid', () => {
    let updateQuestionSpy: jest.SpyInstance;
    let processTagsSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      updateQuestionSpy = jest.spyOn(questionUtil, 'updateQuestion');
      processTagsSpy = jest.spyOn(tagUtil, 'processTags');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const validQuestionId = '65e9b58910afe6e94fc6e6dc';
    const editQuestionBody = {
      title: 'Updated Question Title',
      text: 'Updated question text content',
      tags: [{ name: 'updated-tag', description: 'Updated tag description' }],
      username: 'testuser',
    };

    const mockUpdatedQuestion: PopulatedDatabaseQuestion = {
      _id: new mongoose.Types.ObjectId(validQuestionId),
      title: 'Updated Question Title',
      text: 'Updated question text content',
      tags: [dbTag1],
      askedBy: 'testuser',
      askDateTime: new Date('2024-01-01'),
      answers: [],
      views: ['testuser'],
      upVotes: [],
      downVotes: [],
      comments: [],
      community: null,
      followers: [],
    };

    test('should successfully update question with valid data', async () => {
      processTagsSpy.mockResolvedValueOnce([dbTag1]);
      updateQuestionSpy.mockResolvedValueOnce(mockUpdatedQuestion);

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(editQuestionBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(JSON.parse(JSON.stringify(mockUpdatedQuestion, null, 2)));
      expect(processTagsSpy).toHaveBeenCalledWith(editQuestionBody.tags);
      expect(updateQuestionSpy).toHaveBeenCalledWith(
        validQuestionId,
        'Updated Question Title',
        'Updated question text content',
        [dbTag1],
        'testuser',
      );
    });

    test('should return 400 for invalid question ID format', async () => {
      const response = await supertest(app)
        .put('/api/question/editQuestion/invalid-id')
        .send(editQuestionBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Request Validation Failed');
      expect(response.body.errors[0].path).toBe('/params/qid');
    });

    test('should return 404 when question not found', async () => {
      processTagsSpy.mockResolvedValueOnce([dbTag1]);
      updateQuestionSpy.mockResolvedValueOnce({ error: 'Question not found' });

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(editQuestionBody);

      expect(response.status).toBe(404);
      expect(response.text).toBe('Question not found');
    });

    test('should return 403 when user is not authorized', async () => {
      processTagsSpy.mockResolvedValueOnce([dbTag1]);
      updateQuestionSpy.mockResolvedValueOnce({
        error: 'Unauthorized: You can only edit your own questions',
      });

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(editQuestionBody);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Unauthorized: You can only edit your own questions');
    });

    test('should return 400 for validation errors', async () => {
      const invalidBody = {
        ...editQuestionBody,
        title: 'a'.repeat(101),
      };

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(invalidBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Request Validation Failed');
      expect(response.body.errors[0].path).toBe('/body/title');
    });

    test('should return 400 when tags are invalid', async () => {
      processTagsSpy.mockResolvedValueOnce([]);

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(editQuestionBody);

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid tags provided');
    });

    test('should return 500 when service throws an error', async () => {
      processTagsSpy.mockResolvedValueOnce([dbTag1]);
      updateQuestionSpy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(editQuestionBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating question: Database error');
    });

    test('should handle missing required fields', async () => {
      const incompleteBody = {
        title: 'Updated Title',
        // missing text, tags, username
      };

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(incompleteBody);

      expect(response.status).toBe(400);
    });

    test('should handle empty title', async () => {
      const emptyTitleBody = {
        ...editQuestionBody,
        title: '',
      };

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(emptyTitleBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Request Validation Failed');
      expect(response.body.errors[0].path).toBe('/body/title');
    });

    test('should handle empty text', async () => {
      processTagsSpy.mockResolvedValueOnce([dbTag1]);
      updateQuestionSpy.mockResolvedValueOnce({
        error: 'Title and text cannot be empty',
      });

      const emptyTextBody = {
        ...editQuestionBody,
        text: '   ',
      };

      const response = await supertest(app)
        .put(`/api/question/editQuestion/${validQuestionId}`)
        .send(emptyTextBody);

      expect(response.status).toBe(400);
      expect(response.text).toBe('Title and text cannot be empty');
    });
  });

  describe('Draft endpoints', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('POST /saveDraft should save a draft with only title provided', async () => {
      const mockDraft = {
        _id: new mongoose.Types.ObjectId('65e9b5a995b6c7045a30d900'),
        title: 'Draft Title',
        text: '',
        tags: [],
        askedBy: 'testuser',
        community: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      jest.spyOn(tagUtil, 'processTags').mockResolvedValueOnce([]);
      jest.spyOn(questionUtil, 'saveDraft').mockResolvedValueOnce(mockDraft);

      const response = await supertest(app).post('/api/question/saveDraft').send({
        title: 'Draft Title',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(JSON.parse(JSON.stringify(mockDraft)));
    });

    it('POST /saveDraft should return 400 when service returns error', async () => {
      jest.spyOn(tagUtil, 'processTags').mockResolvedValueOnce([]);
      jest
        .spyOn(questionUtil, 'saveDraft')
        .mockResolvedValueOnce({ error: 'Failed to save' } as any);

      const response = await supertest(app).post('/api/question/saveDraft').send({
        title: 'Draft Title',
      });

      expect(response.status).toBe(400);
    });

    it('GET /getUserDrafts should return drafts for a user', async () => {
      const mockDrafts = [
        {
          _id: new mongoose.Types.ObjectId('65e9b5a995b6c7045a30d901'),
          title: 'Draft 1',
          text: '',
          tags: [],
          askedBy: 'testuser',
          community: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any;

      jest.spyOn(questionUtil, 'getUserDrafts').mockResolvedValueOnce(mockDrafts);

      const response = await supertest(app)
        .get('/api/question/getUserDrafts')
        .query({ username: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(JSON.parse(JSON.stringify(mockDrafts)));
    });

    it('DELETE /deleteDraft/:draftId should delete a draft', async () => {
      jest.spyOn(questionUtil, 'deleteDraft').mockResolvedValueOnce({ msg: 'deleted' } as any);

      const draftId = '65e9b5a995b6c7045a30d902';
      const response = await supertest(app)
        .delete(`/api/question/deleteDraft/${draftId}`)
        .send({ username: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Draft deleted successfully' });
    });
  });
});

describe('POST /followQuestion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should follow a question successfully', async () => {
    const mockResult = { followers: ['alice'], msg: 'Followed successfully' } as any;

    jest.spyOn(questionUtil, 'addFollowerToQuestion').mockResolvedValueOnce(mockResult);

    const response = await supertest(app).post('/api/question/followQuestion').send({
      qid: '65e9b5a995b6c7045a30d823',
      username: 'alice',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResult);
  });

  it('should return 500 when addFollowerToQuestion returns error', async () => {
    jest
      .spyOn(questionUtil, 'addFollowerToQuestion')
      .mockResolvedValueOnce({ error: 'Unauthorized' } as any);

    const response = await supertest(app).post('/api/question/followQuestion').send({
      qid: '65e9b5a995b6c7045a30d823',
      username: 'alice',
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when following question: Unauthorized');
  });

  it('should return 500 when addFollowerToQuestion throws', async () => {
    jest
      .spyOn(questionUtil, 'addFollowerToQuestion')
      .mockRejectedValueOnce(new Error('DB failure'));

    const response = await supertest(app).post('/api/question/followQuestion').send({
      qid: '65e9b5a995b6c7045a30d823',
      username: 'alice',
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when following question: DB failure');
  });
});

describe('GET /getQuestionVersions/:qid', () => {
  const validQid = '65e9b58910afe6e94fc6e6dc';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 for invalid question ID format', async () => {
    const response = await supertest(app).get('/api/question/getQuestionVersions/invalid-id');

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid question ID format');
  });

  it('should return 404 when question not found', async () => {
    jest
      .spyOn(questionUtil, 'getQuestionVersions')
      .mockResolvedValueOnce({ error: 'Question not found' } as any);

    const response = await supertest(app)
      .get(`/api/question/getQuestionVersions/${validQid}`)
      .query({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Question not found');
  });

  it('should return 403 when user not authorized', async () => {
    jest.spyOn(questionUtil, 'getQuestionVersions').mockResolvedValueOnce({
      error: 'Unauthorized: Only the author can view versions',
    } as any);

    const response = await supertest(app)
      .get(`/api/question/getQuestionVersions/${validQid}`)
      .query({ username: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: Only the author can view versions');
  });

  it('should return 400 for other errors from service', async () => {
    jest
      .spyOn(questionUtil, 'getQuestionVersions')
      .mockResolvedValueOnce({ error: 'Something else went wrong' } as any);

    const response = await supertest(app)
      .get(`/api/question/getQuestionVersions/${validQid}`)
      .query({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Something else went wrong');
  });

  it('should return versions successfully', async () => {
    const mockVersions = [{ versionNumber: 1, title: 'v1' }] as any;

    jest.spyOn(questionUtil, 'getQuestionVersions').mockResolvedValueOnce(mockVersions);

    const response = await supertest(app)
      .get(`/api/question/getQuestionVersions/${validQid}`)
      .query({ username: 'user1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(JSON.parse(JSON.stringify(mockVersions)));
  });

  it('should return 500 with generic message when non-Error is thrown', async () => {
    jest.spyOn(questionUtil, 'getQuestionVersions').mockRejectedValueOnce('string failure' as any);

    const response = await supertest(app)
      .get(`/api/question/getQuestionVersions/${validQid}`)
      .query({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when fetching question versions');
  });
});

describe('POST /rollbackQuestion/:qid/:versionId', () => {
  const validQid = '65e9b58910afe6e94fc6e6dc';
  const validVid = '65e9b58910afe6e94fc6e6dd';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 for invalid question ID format', async () => {
    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/invalid-qid/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid question ID format');
  });

  it('should return 400 for invalid version ID format', async () => {
    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/invalid-vid`)
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid version ID format');
  });

  it('should return 404 when question not found', async () => {
    jest
      .spyOn(questionUtil, 'rollbackQuestion')
      .mockResolvedValueOnce({ error: 'Question not found' } as any);

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Question not found');
  });

  it('should return 404 when version not found', async () => {
    jest
      .spyOn(questionUtil, 'rollbackQuestion')
      .mockResolvedValueOnce({ error: 'Version not found' } as any);

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Version not found');
  });

  it('should return 403 when user not authorized', async () => {
    jest.spyOn(questionUtil, 'rollbackQuestion').mockResolvedValueOnce({
      error: 'Unauthorized: Only the author can rollback',
    } as any);

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: Only the author can rollback');
  });

  it('should return 400 for other errors from service', async () => {
    jest
      .spyOn(questionUtil, 'rollbackQuestion')
      .mockResolvedValueOnce({ error: 'Some other error' } as any);

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Some other error');
  });

  it('should rollback successfully and emit update', async () => {
    const mockQuestion: PopulatedDatabaseQuestion = {
      _id: new mongoose.Types.ObjectId(validQid),
      title: 'Rolled back title',
      text: 'Rolled back text',
      tags: [],
      askedBy: 'user1',
      askDateTime: new Date(),
      answers: [],
      views: [],
      upVotes: [],
      downVotes: [],
      comments: [],
      community: null,
      followers: [],
    };

    jest.spyOn(questionUtil, 'rollbackQuestion').mockResolvedValueOnce(mockQuestion);

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(JSON.parse(JSON.stringify(mockQuestion)));
  });

  it('should return 500 with detailed message when Error is thrown', async () => {
    jest.spyOn(questionUtil, 'rollbackQuestion').mockRejectedValueOnce(new Error('DB failure'));

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when rolling back question: DB failure');
  });

  it('should return 500 with generic message when non-Error is thrown', async () => {
    jest.spyOn(questionUtil, 'rollbackQuestion').mockRejectedValueOnce('string failure' as any);

    const response = await supertest(app)
      .post(`/api/question/rollbackQuestion/${validQid}/${validVid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when rolling back question');
  });
});

describe('Draft endpoints - extra branches', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /saveDraft should return 400 when title is missing', async () => {
    const response = await supertest(app).post('/api/question/saveDraft').send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe('Title is required');
  });

  it('POST /saveDraft should return 500 when processTags throws', async () => {
    jest.spyOn(tagUtil, 'processTags').mockRejectedValueOnce(new Error('Tag failure'));

    const response = await supertest(app)
      .post('/api/question/saveDraft')
      .send({
        title: 'Draft Title',
        tags: [{ name: 't1', description: '' }],
      });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when saving draft: Tag failure');
  });

  it('PUT /updateDraft/:draftId should return 400 for invalid draft ID', async () => {
    const response = await supertest(app)
      .put('/api/question/updateDraft/invalid-id')
      .send({ title: 'Updated', text: 'text', tags: [], askedBy: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid draft ID format');
  });

  it('PUT /updateDraft/:draftId should return 400 when title is missing', async () => {
    const validDraftId = '65e9b58910afe6e94fc6e6de';

    const response = await supertest(app)
      .put(`/api/question/updateDraft/${validDraftId}`)
      .send({ title: '   ' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Title is required');
  });

  it('PUT /updateDraft/:draftId should map Draft not found -> 404', async () => {
    const validDraftId = '65e9b58910afe6e94fc6e6de';

    jest
      .spyOn(questionUtil, 'updateDraft')
      .mockResolvedValueOnce({ error: 'Draft not found' } as any);
    jest.spyOn(tagUtil, 'processTags').mockResolvedValueOnce([]);

    const response = await supertest(app)
      .put(`/api/question/updateDraft/${validDraftId}`)
      .send({ title: 'Updated', text: 'text', tags: [], askedBy: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Draft not found');
  });

  it('PUT /updateDraft/:draftId should map Unauthorized -> 403', async () => {
    const validDraftId = '65e9b58910afe6e94fc6e6de';

    jest.spyOn(tagUtil, 'processTags').mockResolvedValueOnce([]);
    jest.spyOn(questionUtil, 'updateDraft').mockResolvedValueOnce({
      error: 'Unauthorized: Only the author can edit a draft',
    } as any);

    const response = await supertest(app)
      .put(`/api/question/updateDraft/${validDraftId}`)
      .send({ title: 'Updated', text: 'text', tags: [], askedBy: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: Only the author can edit a draft');
  });

  it('PUT /updateDraft/:draftId should map other errors -> 400', async () => {
    const validDraftId = '65e9b58910afe6e94fc6e6de';

    jest.spyOn(tagUtil, 'processTags').mockResolvedValueOnce([]);
    jest
      .spyOn(questionUtil, 'updateDraft')
      .mockResolvedValueOnce({ error: 'Some other draft error' } as any);

    const response = await supertest(app)
      .put(`/api/question/updateDraft/${validDraftId}`)
      .send({ title: 'Updated', text: 'text', tags: [], askedBy: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Some other draft error');
  });

  it('GET /getUserDrafts should return 400 when username is missing', async () => {
    const response = await supertest(app).get('/api/question/getUserDrafts');

    expect(response.status).toBe(400);
    expect(response.text).toBe('Username is required');
  });

  it('GET /getUserDrafts should return 400 when service returns error', async () => {
    jest
      .spyOn(questionUtil, 'getUserDrafts')
      .mockResolvedValueOnce({ error: 'Error when retrieving drafts' } as any);

    const response = await supertest(app)
      .get('/api/question/getUserDrafts')
      .query({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Error when retrieving drafts');
  });

  it('GET /getUserDrafts should return 500 when service throws', async () => {
    jest.spyOn(questionUtil, 'getUserDrafts').mockRejectedValueOnce(new Error('DB failure'));

    const response = await supertest(app)
      .get('/api/question/getUserDrafts')
      .query({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when fetching user drafts: DB failure');
  });

  it('DELETE /deleteDraft/:draftId should return 400 for invalid draft ID', async () => {
    const response = await supertest(app)
      .delete('/api/question/deleteDraft/invalid-id')
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid draft ID format');
  });

  it('DELETE /deleteDraft/:draftId should return 400 when username missing', async () => {
    const response = await supertest(app).delete(
      '/api/question/deleteDraft/65e9b58910afe6e94fc6e6df',
    );

    expect(response.status).toBe(400);
    expect(response.text).toBe('Username is required');
  });

  it('DELETE /deleteDraft/:draftId should map Draft not found -> 404', async () => {
    jest
      .spyOn(questionUtil, 'deleteDraft')
      .mockResolvedValueOnce({ error: 'Draft not found' } as any);

    const response = await supertest(app)
      .delete('/api/question/deleteDraft/65e9b58910afe6e94fc6e6df')
      .send({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Draft not found');
  });

  it('DELETE /deleteDraft/:draftId should map Unauthorized -> 403', async () => {
    jest.spyOn(questionUtil, 'deleteDraft').mockResolvedValueOnce({
      error: 'Unauthorized: Only the author can delete a draft',
    } as any);

    const response = await supertest(app)
      .delete('/api/question/deleteDraft/65e9b58910afe6e94fc6e6df')
      .send({ username: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: Only the author can delete a draft');
  });

  it('DELETE /deleteDraft/:draftId should map other errors -> 400', async () => {
    jest
      .spyOn(questionUtil, 'deleteDraft')
      .mockResolvedValueOnce({ error: 'Some other delete error' } as any);

    const response = await supertest(app)
      .delete('/api/question/deleteDraft/65e9b58910afe6e94fc6e6df')
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Some other delete error');
  });

  it('DELETE /deleteDraft/:draftId should return 500 when service throws', async () => {
    jest.spyOn(questionUtil, 'deleteDraft').mockRejectedValueOnce(new Error('DB failure'));

    const response = await supertest(app)
      .delete('/api/question/deleteDraft/65e9b58910afe6e94fc6e6df')
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when deleting draft: DB failure');
  });
});

describe('DELETE /deleteQuestion/:qid', () => {
  const validQid = '65e9b58910afe6e94fc6e6e0';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 for invalid question ID', async () => {
    const response = await supertest(app)
      .delete('/api/question/deleteQuestion/invalid-id')
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid question ID format');
  });

  it('should return 400 when username is missing', async () => {
    const response = await supertest(app).delete(`/api/question/deleteQuestion/${validQid}`);

    expect(response.status).toBe(400);
    expect(response.text).toBe('Username is required');
  });

  it('should map Question not found -> 404', async () => {
    jest
      .spyOn(questionUtil, 'deleteQuestion')
      .mockResolvedValueOnce({ error: 'Question not found' } as any);

    const response = await supertest(app)
      .delete(`/api/question/deleteQuestion/${validQid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Question not found');
  });

  it('should map Unauthorized -> 403', async () => {
    jest.spyOn(questionUtil, 'deleteQuestion').mockResolvedValueOnce({
      error: 'Unauthorized: You can only delete your own questions',
    } as any);

    const response = await supertest(app)
      .delete(`/api/question/deleteQuestion/${validQid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: You can only delete your own questions');
  });

  it('should map other errors -> 400', async () => {
    jest
      .spyOn(questionUtil, 'deleteQuestion')
      .mockResolvedValueOnce({ error: 'Some other delete error' } as any);

    const response = await supertest(app)
      .delete(`/api/question/deleteQuestion/${validQid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Some other delete error');
  });

  it('should delete successfully and emit event', async () => {
    jest
      .spyOn(questionUtil, 'deleteQuestion')
      .mockResolvedValueOnce({ msg: 'Question deleted successfully' } as any);

    const response = await supertest(app)
      .delete(`/api/question/deleteQuestion/${validQid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Question deleted successfully' });
  });

  it('should return 500 when deleteQuestion throws', async () => {
    jest.spyOn(questionUtil, 'deleteQuestion').mockRejectedValueOnce(new Error('DB failure'));

    const response = await supertest(app)
      .delete(`/api/question/deleteQuestion/${validQid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when deleting question: DB failure');
  });

  it('should return 500 with generic message when non-Error thrown', async () => {
    jest.spyOn(questionUtil, 'deleteQuestion').mockRejectedValueOnce('string failure' as any);

    const response = await supertest(app)
      .delete(`/api/question/deleteQuestion/${validQid}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when deleting question');
  });
});

describe('POST /publishDraft/:draftId', () => {
  const validDraftId = '65e9b58910afe6e94fc6e6e1';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 for invalid draft ID format', async () => {
    const response = await supertest(app)
      .post('/api/question/publishDraft/invalid-id')
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid draft ID format');
  });

  it('should return 400 when username is missing', async () => {
    const response = await supertest(app).post(`/api/question/publishDraft/${validDraftId}`);

    expect(response.status).toBe(400);
    expect(response.text).toBe('Username is required');
  });

  it('should map Draft not found -> 404', async () => {
    jest
      .spyOn(questionUtil, 'publishDraft')
      .mockResolvedValueOnce({ error: 'Draft not found' } as any);

    const response = await supertest(app)
      .post(`/api/question/publishDraft/${validDraftId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Draft not found');
  });

  it('should map Unauthorized -> 403', async () => {
    jest.spyOn(questionUtil, 'publishDraft').mockResolvedValueOnce({
      error: 'Unauthorized: Only the author can publish this draft',
    } as any);

    const response = await supertest(app)
      .post(`/api/question/publishDraft/${validDraftId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(403);
    expect(response.text).toBe('Unauthorized: Only the author can publish this draft');
  });

  it('should map other errors -> 400', async () => {
    jest
      .spyOn(questionUtil, 'publishDraft')
      .mockResolvedValueOnce({ error: 'Some other publish error' } as any);

    const response = await supertest(app)
      .post(`/api/question/publishDraft/${validDraftId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Some other publish error');
  });

  it('should publish successfully and return 201 with populated question', async () => {
    const mockQuestion = {
      _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6e2'),
    } as any;
    const populated = {
      ...mockQuestion,
      title: 'Published from draft',
      text: 'content',
      tags: [],
      askedBy: 'user1',
    } as any;

    jest.spyOn(questionUtil, 'publishDraft').mockResolvedValueOnce(mockQuestion);
    jest.spyOn(databaseUtil, 'populateDocument').mockResolvedValueOnce(populated);

    const response = await supertest(app)
      .post(`/api/question/publishDraft/${validDraftId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(JSON.parse(JSON.stringify(populated)));
  });

  it('should return 500 when populateDocument returns error', async () => {
    const mockQuestion = {
      _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6e2'),
    } as any;

    jest.spyOn(questionUtil, 'publishDraft').mockResolvedValueOnce(mockQuestion);
    jest
      .spyOn(databaseUtil, 'populateDocument')
      .mockResolvedValueOnce({ error: 'Populate error' } as any);

    const response = await supertest(app)
      .post(`/api/question/publishDraft/${validDraftId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when publishing draft: Populate error');
  });

  it('should return 500 with generic message when non-Error thrown', async () => {
    jest.spyOn(questionUtil, 'publishDraft').mockRejectedValueOnce('string failure' as any);

    const response = await supertest(app)
      .post(`/api/question/publishDraft/${validDraftId}`)
      .send({ username: 'user1' });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when publishing draft');
  });
});
