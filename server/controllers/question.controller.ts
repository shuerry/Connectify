import express, { Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  Question,
  FindQuestionRequest,
  FindQuestionByIdRequest,
  AddQuestionRequest,
  EditQuestionRequest,
  VoteRequest,
  FakeSOSocket,
  PopulatedDatabaseQuestion,
  CommunityQuestionsRequest,
} from '../types/types';
import {
  addVoteToQuestion,
  fetchAndIncrementQuestionViewsById,
  filterQuestionsByAskedBy,
  filterQuestionsBySearch,
  getCommunityQuestions,
  getQuestionsByOrder,
  saveQuestion,
  updateQuestion,
} from '../services/question.service';
import { processTags } from '../services/tag.service';
import { populateDocument } from '../utils/database.util';

const questionController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Retrieves a list of questions filtered by a search term and ordered by a specified criterion.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The FindQuestionRequest object containing the query parameters `order` and `search`.
   * @param res The HTTP response object used to send back the filtered list of questions.
   *
   * @returns A Promise that resolves to void.
   */
  const getQuestionsByFilter = async (req: FindQuestionRequest, res: Response): Promise<void> => {
    const { order } = req.query;
    const { search } = req.query;
    const { askedBy } = req.query;
    const { viewer } = req.query as { viewer?: string };

    try {
      let qlist: PopulatedDatabaseQuestion[] = await getQuestionsByOrder(order, viewer);

      // Filter by askedBy if provided
      if (askedBy) {
        qlist = filterQuestionsByAskedBy(qlist, askedBy);
      }

      // Filter by search keyword and tags
      const resqlist: PopulatedDatabaseQuestion[] = filterQuestionsBySearch(qlist, search);
      res.json(resqlist);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching questions by filter: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching questions by filter`);
      }
    }
  };

  /**
   * Retrieves a question by its unique ID, and increments the view count for that question.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The FindQuestionByIdRequest object containing the question ID as a parameter.
   * @param res The HTTP response object used to send back the question details.
   *
   * @returns A Promise that resolves to void.
   */
  const getQuestionById = async (req: FindQuestionByIdRequest, res: Response): Promise<void> => {
    const { qid } = req.params;
    const { username } = req.query;

    if (!ObjectId.isValid(qid)) {
      res.status(400).send('Invalid ID format');
      return;
    }

    try {
      const q = await fetchAndIncrementQuestionViewsById(qid, username);

      if ('error' in q) {
        throw new Error('Error while fetching question by id');
      }

      socket.emit('viewsUpdate', q);
      res.json(q);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching question by id: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching question by id`);
      }
    }
  };

  /**
   * Adds a new question to the database. The question is first validated and then saved.
   * If the tags are invalid or saving the question fails, the HTTP response status is updated.
   *
   * @param req The AddQuestionRequest object containing the question data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addQuestion = async (req: AddQuestionRequest, res: Response): Promise<void> => {
    const question: Question = req.body;

    try {
      const questionswithtags = {
        ...question,
        tags: await processTags(question.tags),
      };

      if (questionswithtags.tags.length === 0) {
        throw new Error('Invalid tags');
      }

      const result = await saveQuestion(questionswithtags);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Populates the fields of the question that was added, and emits the new object
      const populatedQuestion = await populateDocument(result._id.toString(), 'question');

      if ('error' in populatedQuestion) {
        throw new Error(populatedQuestion.error);
      }

      socket.emit('questionUpdate', populatedQuestion as PopulatedDatabaseQuestion);
      res.json(populatedQuestion);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when saving question: ${err.message}`);
      } else {
        res.status(500).send(`Error when saving question`);
      }
    }
  };

  /**
   * Helper function to handle upvoting or downvoting a question.
   *
   * @param req The VoteRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   * @param type The type of vote to perform (upvote or downvote).
   *
   * @returns A Promise that resolves to void.
   */
  const voteQuestion = async (
    req: VoteRequest,
    res: Response,
    type: 'upvote' | 'downvote',
  ): Promise<void> => {
    const { qid, username } = req.body;

    try {
      let status;

      if (type === 'upvote') {
        status = await addVoteToQuestion(qid, username, type);
      } else {
        status = await addVoteToQuestion(qid, username, type);
      }

      if (status && 'error' in status) {
        throw new Error(status.error);
      }

      // Emit the updated vote counts to all connected clients
      socket.emit('voteUpdate', { qid, upVotes: status.upVotes, downVotes: status.downVotes });
      res.json(status);
    } catch (err) {
      res.status(500).send(`Error when ${type}ing: ${(err as Error).message}`);
    }
  };

  /**
   * Handles upvoting a question. The request must contain the question ID (qid) and the username.
   * If the request is invalid or an error occurs, the appropriate HTTP response status and message are returned.
   *
   * @param req The VoteRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const upvoteQuestion = async (req: VoteRequest, res: Response): Promise<void> => {
    voteQuestion(req, res, 'upvote');
  };

  /**
   * Handles downvoting a question. The request must contain the question ID (qid) and the username.
   * If the request is invalid or an error occurs, the appropriate HTTP response status and message are returned.
   *
   * @param req The VoteRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const downvoteQuestion = async (req: VoteRequest, res: Response): Promise<void> => {
    voteQuestion(req, res, 'downvote');
  };

  /**
   * Edits an existing question in the database. The request must contain the updated question data.
   * Only the author of the question can edit it.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The EditQuestionRequest object containing the question ID and updated data.
   * @param res The HTTP response object used to send back the updated question.
   *
   * @returns A Promise that resolves to void.
   */
  const editQuestion = async (req: EditQuestionRequest, res: Response): Promise<void> => {
    const { qid } = req.params;
    const { title, text, tags, username } = req.body;

    // Validate question ID format
    if (!ObjectId.isValid(qid)) {
      res.status(400).send('Invalid question ID format');
      return;
    }

    try {
      // Process the tags
      const processedTags = await processTags(tags);

      if (processedTags.length === 0) {
        res.status(400).send('Invalid tags provided');
        return;
      }

      // Update the question
      const result = await updateQuestion(qid, title, text, processedTags, username);

      if ('error' in result) {
        if (result.error === 'Question not found') {
          res.status(404).send(result.error);
        } else if (result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      // Emit the updated question to all connected clients
      socket.emit('questionUpdate', result);
      res.json(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when updating question: ${err.message}`);
      } else {
        res.status(500).send(`Error when updating question`);
      }
    }
  };

  /**
   * Retrieves a list of questions for a specific community. The community ID is passed as a parameter.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The CommunityQuestionsRequest object containing the community ID as a parameter.
   * @param res The HTTP response object used to send back the list of questions.
   */
  const getCommunityQuestionsRoute = async (
    req: CommunityQuestionsRequest,
    res: Response,
  ): Promise<void> => {
    const { communityId } = req.params;

    try {
      const questions = await getCommunityQuestions(communityId);

      const populatedQuestions = await Promise.all(
        questions.map(async question => {
          const populatedQuestion = await populateDocument(question._id.toString(), 'question');

          if ('error' in populatedQuestion) {
            throw new Error(populatedQuestion.error);
          }

          return populatedQuestion;
        }),
      );

      res.json(populatedQuestions);
    } catch (err: unknown) {
      res.status(500).send(`Error when fetching community questions: ${(err as Error).message}`);
    }
  };

  // add appropriate HTTP verbs and their endpoints to the router
  router.get('/getQuestion', getQuestionsByFilter);
  router.get('/getQuestionById/:qid', getQuestionById);
  router.post('/addQuestion', addQuestion);
  router.put('/editQuestion/:qid', editQuestion);
  router.post('/upvoteQuestion', upvoteQuestion);
  router.post('/downvoteQuestion', downvoteQuestion);
  router.get('/getCommunityQuestions/:communityId', getCommunityQuestionsRoute);

  return router;
};

export default questionController;
