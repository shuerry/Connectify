import express, { Response, Request } from 'express';
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
  FollowRequest,
  GetQuestionVersionsRequest,
  RollbackQuestionRequest,
  SaveDraftRequest,
  UpdateDraftRequest,
  GetUserDraftsRequest,
  DeleteDraftRequest,
  PublishDraftRequest,
} from '../types/types';
import {
  addFollowerToQuestion,
  addVoteToQuestion,
  fetchAndIncrementQuestionViewsById,
  filterQuestionsByAskedBy,
  filterQuestionsBySearch,
  getCommunityQuestions,
  getQuestionsByOrder,
  saveQuestion,
  updateQuestion,
  getQuestionVersions,
  rollbackQuestion,
  saveDraft,
  updateDraft,
  getUserDrafts,
  deleteDraft,
  publishDraft,
  deleteQuestion,
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
    const { viewer } = req.query;

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
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
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

  /**
   * Handles following a question. The request must contain the question ID (qid) and the username.
   * If the request is invalid or an error occurs, the appropriate HTTP response status and message are returned.
   *
   * @param req The FollowRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const followQuestion = async (req: FollowRequest, res: Response): Promise<void> => {
    const { qid, username } = req.body;

    try {
      const result = await addFollowerToQuestion(qid, username);

      if (result && 'error' in result) {
        throw new Error(result.error);
      }

      res.json(result);
    } catch (err: unknown) {
      res.status(500).send(`Error when following question: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves the version history for a question.
   * Only the question author can view version history.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The GetQuestionVersionsRequest object containing the question ID and username.
   * @param res The HTTP response object used to send back the version history.
   *
   * @returns A Promise that resolves to void.
   */
  const getQuestionVersionsRoute = async (
    req: GetQuestionVersionsRequest,
    res: Response,
  ): Promise<void> => {
    const { qid } = req.params;
    const { username } = req.query;

    // Validate question ID format
    if (!ObjectId.isValid(qid)) {
      res.status(400).send('Invalid question ID format');
      return;
    }

    try {
      const result = await getQuestionVersions(qid, username);

      if ('error' in result) {
        if (result.error === 'Question not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      res.json(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching question versions: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching question versions`);
      }
    }
  };

  /**
   * Rolls back a question to a previous version.
   * Only the question author can rollback.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The RollbackQuestionRequest object containing the question ID, version ID, and username.
   * @param res The HTTP response object used to send back the rolled back question.
   *
   * @returns A Promise that resolves to void.
   */
  const rollbackQuestionRoute = async (
    req: RollbackQuestionRequest,
    res: Response,
  ): Promise<void> => {
    const { qid, versionId } = req.params;
    const { username } = req.body;

    // Validate question ID format
    if (!ObjectId.isValid(qid)) {
      res.status(400).send('Invalid question ID format');
      return;
    }

    // Validate version ID format
    if (!ObjectId.isValid(versionId)) {
      res.status(400).send('Invalid version ID format');
      return;
    }

    try {
      const result = await rollbackQuestion(qid, versionId, username);

      if ('error' in result) {
        if (result.error === 'Question not found' || result.error === 'Version not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
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
        res.status(500).send(`Error when rolling back question: ${err.message}`);
      } else {
        res.status(500).send(`Error when rolling back question`);
      }
    }
  };

  /**
   * Saves a new draft question.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The SaveDraftRequest object containing the draft data in the body.
   * @param res The HTTP response object used to send back the saved draft.
   *
   * @returns A Promise that resolves to void.
   */
  const saveDraftRoute = async (req: SaveDraftRequest, res: Response): Promise<void> => {
    try {
      const { title, text, tags, askedBy, community } = req.body;

      // Only title is required for saving drafts; other fields are optional
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).send('Title is required');
        return;
      }

      // Ensure tags/text/askedBy have safe defaults if omitted
      const incomingTags = Array.isArray(tags) ? tags : [];
      const incomingText = typeof text === 'string' ? text : '';
      const incomingAskedBy =
        typeof askedBy === 'string' && askedBy.trim().length > 0 ? askedBy : 'unknown';

      // Process tags to get ObjectIds
      const processedTags = await processTags(incomingTags);
      const tagIds = processedTags.map(tag => tag._id);

      const result = await saveDraft(title, incomingText, tagIds, incomingAskedBy, community);

      if ('error' in result) {
        // service returned an error object; log it and forward
        // eslint-disable-next-line no-console
        console.error('saveDraft service error:', result.error);
        res.status(400).send(result.error);
        return;
      }

      res.status(201).json(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when saving draft: ${err.message}`);
      } else {
        res.status(500).send(`Error when saving draft`);
      }
    }
  };

  /**
   * Updates an existing draft question.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The UpdateDraftRequest object containing the draft ID in params and updated data in body.
   * @param res The HTTP response object used to send back the updated draft.
   *
   * @returns A Promise that resolves to void.
   */
  const updateDraftRoute = async (req: UpdateDraftRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { title, text, tags, askedBy, community } = req.body;

    // Validate draft ID format
    if (!ObjectId.isValid(draftId)) {
      res.status(400).send('Invalid draft ID format');
      return;
    }

    // Only title is required for updating drafts; other fields optional
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).send('Title is required');
      return;
    }

    const incomingTags = Array.isArray(tags) ? tags : [];
    const incomingText = typeof text === 'string' ? text : '';
    const incomingAskedBy =
      typeof askedBy === 'string' && askedBy.trim().length > 0 ? askedBy : 'unknown';

    try {
      // Process tags to get ObjectIds
      const processedTags = await processTags(incomingTags);
      const tagIds = processedTags.map(tag => tag._id);

      const result = await updateDraft(
        draftId,
        title,
        incomingText,
        tagIds,
        incomingAskedBy,
        community,
      );

      if ('error' in result) {
        if (result.error === 'Draft not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      res.json(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when updating draft: ${err.message}`);
      } else {
        res.status(500).send(`Error when updating draft`);
      }
    }
  };

  /**
   * Retrieves all drafts for a specific user.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The GetUserDraftsRequest object containing the username in query.
   * @param res The HTTP response object used to send back the user's drafts.
   *
   * @returns A Promise that resolves to void.
   */
  const getUserDraftsRoute = async (req: GetUserDraftsRequest, res: Response): Promise<void> => {
    const { username } = req.query;

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      const result = await getUserDrafts(username);

      if ('error' in result) {
        res.status(400).send(result.error);
        return;
      }

      res.json(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching user drafts: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching user drafts`);
      }
    }
  };

  /**
   * Deletes a draft question.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The DeleteDraftRequest object containing the draft ID in params and username in body.
   * @param res The HTTP response object used to send back the success message.
   *
   * @returns A Promise that resolves to void.
   */
  const deleteDraftRoute = async (req: DeleteDraftRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { username } = req.body;

    // Validate draft ID format
    if (!ObjectId.isValid(draftId)) {
      res.status(400).send('Invalid draft ID format');
      return;
    }

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      const result = await deleteDraft(draftId, username);

      if ('error' in result) {
        if (result.error === 'Draft not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      res.json({ message: 'Draft deleted successfully' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when deleting draft: ${err.message}`);
      } else {
        res.status(500).send(`Error when deleting draft`);
      }
    }
  };

  /**
   * Deletes a question. Only the author may delete their question.
   */
  const deleteQuestionRoute = async (req: Request, res: Response): Promise<void> => {
    const { qid } = req.params as { qid: string };
    const { username } = req.body as { username?: string };

    if (!ObjectId.isValid(qid)) {
      res.status(400).send('Invalid question ID format');
      return;
    }

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      const result = await deleteQuestion(qid, username);

      if ('error' in result) {
        if (result.error === 'Question not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      // Emit a delete event so clients can remove the question from UI
      (socket as any).emit('questionDelete', { qid });
      res.json({ message: 'Question deleted successfully' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when deleting question: ${err.message}`);
      } else {
        res.status(500).send(`Error when deleting question`);
      }
    }
  };

  /**
   * Publishes a draft as a question.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The PublishDraftRequest object containing the draft ID in params and username in body.
   * @param res The HTTP response object used to send back the published question.
   *
   * @returns A Promise that resolves to void.
   */
  const publishDraftRoute = async (req: PublishDraftRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { username } = req.body;

    // Validate draft ID format
    if (!ObjectId.isValid(draftId)) {
      res.status(400).send('Invalid draft ID format');
      return;
    }

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      const result = await publishDraft(draftId, username);

      if ('error' in result) {
        if (result.error === 'Draft not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      // Populate the fields of the published question and emit it
      const populatedQuestion = await populateDocument(result._id.toString(), 'question');

      if ('error' in populatedQuestion) {
        throw new Error(populatedQuestion.error);
      }

      // Emit the new question to all connected clients
      socket.emit('questionUpdate', populatedQuestion as PopulatedDatabaseQuestion);
      res.status(201).json(populatedQuestion);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when publishing draft: ${err.message}`);
      } else {
        res.status(500).send(`Error when publishing draft`);
      }
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
  router.post('/followQuestion', followQuestion);
  router.get('/getQuestionVersions/:qid', getQuestionVersionsRoute);
  router.post('/rollbackQuestion/:qid/:versionId', rollbackQuestionRoute);

  // Draft endpoints
  router.post('/saveDraft', saveDraftRoute);
  router.put('/updateDraft/:draftId', updateDraftRoute);
  router.get('/getUserDrafts', getUserDraftsRoute);
  router.delete('/deleteDraft/:draftId', deleteDraftRoute);
  router.post('/publishDraft/:draftId', publishDraftRoute);
  router.delete('/deleteQuestion/:qid', deleteQuestionRoute);

  return router;
};

export default questionController;
