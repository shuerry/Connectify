import express, { Response, Request } from 'express';
import { ObjectId } from 'mongodb';
import { Answer, AddAnswerRequest, FakeSOSocket, PopulatedDatabaseAnswer } from '../types/types';
import { addAnswerToQuestion, saveAnswer, deleteAnswer } from '../services/answer.service';
import { populateDocument } from '../utils/database.util';

const answerController = (socket: FakeSOSocket) => {
  const router = express.Router();
  /**
   * Adds a new answer to a question in the database. The answer request and answer are
   * validated and then saved. If successful, the answer is associated with the corresponding
   * question. If there is an error, the HTTP response's status is updated.
   *
   * @param req The AnswerRequest object containing the question ID and answer data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addAnswer = async (req: AddAnswerRequest, res: Response): Promise<void> => {
    const { qid } = req.body;
    const ansInfo: Answer = req.body.ans;

    try {
      const ansFromDb = await saveAnswer(ansInfo);

      if ('error' in ansFromDb) {
        throw new Error(ansFromDb.error as string);
      }

      const status = await addAnswerToQuestion(qid, ansFromDb);

      if (status && 'error' in status) {
        throw new Error(status.error as string);
      }

      const populatedAns = await populateDocument(ansFromDb._id.toString(), 'answer');

      if (populatedAns && 'error' in populatedAns) {
        throw new Error(populatedAns.error);
      }

      // Populates the fields of the answer that was added and emits the new object
      socket.emit('answerUpdate', {
        qid: new ObjectId(qid),
        answer: populatedAns as PopulatedDatabaseAnswer,
      });
      res.json(ansFromDb);
    } catch (err) {
      res.status(500).send(`Error when adding answer: ${(err as Error).message}`);
    }
  };

  // add appropriate HTTP verbs and their endpoints to the router.
  router.post('/addAnswer', addAnswer);

  const deleteAnswerRoute = async (req: Request, res: Response): Promise<void> => {
    const { answerId } = req.params as { answerId: string };
    const { username } = req.body as { username?: string };

    if (!answerId) {
      res.status(400).send('answerId is required');
      return;
    }

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      const result = await deleteAnswer(answerId, username);

      if ('error' in result) {
        if (result.error === 'Answer not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      // emit typed answerDelete with question id returned from service when available
      const qid = 'qid' in result && result.qid ? new ObjectId(result.qid) : undefined;
      socket.emit('answerDelete', { qid: qid ?? new ObjectId(), aid: new ObjectId(answerId) });
      res.json({ message: result.msg });
    } catch (err: unknown) {
      res.status(500).send(`Error when deleting answer: ${(err as Error).message}`);
    }
  };

  router.delete('/deleteAnswer/:answerId', deleteAnswerRoute);

  return router;
};

export default answerController;
