import express, { Response } from 'express';
import { ObjectId } from 'mongodb';
import { Answer, AddAnswerRequest, FakeSOSocket, PopulatedDatabaseAnswer } from '../types/types';
import { addAnswerToQuestion, saveAnswer } from '../services/answer.service';
import { populateDocument } from '../utils/database.util';
import NotificationService from '../services/notification.service';
import QuestionModel from '../models/questions.model';

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

      try {
      const questionDoc = await QuestionModel.findById(qid)
        .populate('followers', '-password')
        .lean();

      if (questionDoc) {
        const followers: any[] = Array.isArray(questionDoc.followers)
          ? questionDoc.followers
          : [];

        const authorName = ansInfo.ansBy

        const authorUsernamesToSkip = new Set<string>([
          String(ansInfo.ansBy || ''),
        ]);

        const toEmail: string[] = followers
          .filter(f => !!f && !!f.email)
          .filter(f => !authorUsernamesToSkip.has(f.username))
          .map(f => f.email);

        if (toEmail.length > 0) {
          const rawText: string =
            (populatedAns as any).text ||
            (ansInfo as any).text ||
            '';

          const answerPreview =
            rawText.length > 200 ? rawText.slice(0, 197) + '…' : rawText;

          const questionTitle: string = (questionDoc as any).title || '';

          const notificationService = new NotificationService();
          await notificationService.sendAnswerNotification({
            toEmail,
            authorName: authorName,
            questionTitle,
            questionId: questionDoc._id.toString(),
            answerPreview,
          });
        }
      }
    } catch (notifyErr) {
      console.error('Failed to send follower notifications:', notifyErr);
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

  return router;
};

export default answerController;
