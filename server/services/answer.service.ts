import {
  Answer,
  AnswerResponse,
  DatabaseAnswer,
  DatabaseQuestion,
  PopulatedDatabaseAnswer,
  PopulatedDatabaseQuestion,
  QuestionResponse,
  AnswerNotificationPayload,
} from '../types/types';
import AnswerModel from '../models/answers.model';
import QuestionModel from '../models/questions.model';
import { createNotification, NotificationService } from './notification.service';
import UserModel from '../models/users.model';

const notifier = new NotificationService();

/**
 * Records the most recent answer time for a given question based on its answers.
 *
 * @param {PopulatedDatabaseQuestion} question - The question containing answers to check.
 * @param {Map<string, Date>} mp - A map storing the most recent answer time for each question.
 */
export const getMostRecentAnswerTime = (
  question: PopulatedDatabaseQuestion,
  mp: Map<string, Date>,
): void => {
  question.answers.forEach((answer: PopulatedDatabaseAnswer) => {
    const currentMostRecent = mp.get(question._id.toString());
    if (!currentMostRecent || currentMostRecent < answer.ansDateTime) {
      mp.set(question._id.toString(), answer.ansDateTime);
    }
  });
};

/**
 * Saves a new answer to the database.
 *
 * @param {Answer} answer - The answer object to be saved.
 * @returns {Promise<AnswerResponse>} - A promise resolving to the saved answer or an error message.
 */
export const saveAnswer = async (answer: Answer): Promise<AnswerResponse> => {
  try {
    const result: DatabaseAnswer = await AnswerModel.create(answer);
    return result;
  } catch (error) {
    return { error: 'Error when saving an answer' };
  }
};

/**
 * Adds an existing answer to a specified question in the database.
 *
 * @param {string} qid - The ID of the question to which the answer will be added.
 * @param {DatabaseAnswer} ans - The answer to associate with the question.
 * @returns {Promise<QuestionResponse>} - A promise resolving to the updated question or an error message.
 */
export const addAnswerToQuestion = async (
  qid: string,
  ans: DatabaseAnswer,
): Promise<QuestionResponse> => {
  try {
    if (!ans || !ans.text || !ans.ansBy || !ans.ansDateTime) {
      throw new Error('Invalid answer');
    }

    const result: DatabaseQuestion | null = await QuestionModel.findOneAndUpdate(
      { _id: qid },
      { $push: { answers: { $each: [ans._id], $position: 0 } } },
      { new: true },
    );

    if (result === null) {
      throw new Error('Error when adding answer to question');
    }

    // Send notifications to followers here
    (async () => {
      try {
        // populate follower ids so we can pull user docs
        const q = (await QuestionModel.populate(result, {
          path: 'followers',
          select: 'email username',
        })) as unknown as PopulatedDatabaseQuestion;
        if (!q || !Array.isArray(q.followers) || q.followers.length === 0) return;

        // Load follower users to get email + username
        const followers = await UserModel.find({ _id: { $in: q.followers } })
          .select({ email: 1, username: 1, emailVerified: 1 })
          .lean();

        if (!followers || followers.length === 0) return;

        // ----- DB NOTIFICATIONS -----
        const truncate = (s: string, n = 180) =>
          s.length <= n ? s : s.slice(0, n).trimEnd() + '…';

        const notifDocs = followers
          .filter(
            (u: { username?: string; email?: string; emailVerified?: boolean }) =>
              u && u.username && u.username !== ans.ansBy,
          )
          .map((u: { username?: string; email?: string; emailVerified?: boolean }) => ({
            recipient: u.username as string,
            kind: 'answer' as const,
            title: `New answer on: ${result.title}`,
            preview: truncate(ans.text),
            link: `/question/${result._id.toString()}#answer-${ans._id?.toString?.() ?? ''}`,
            actorUsername: ans.ansBy,
            meta: { questionId: result._id.toString(), answerId: ans._id?.toString?.() },
          }));

        if (notifDocs.length > 0) {
          try {
            await Promise.all(notifDocs.map(doc => createNotification(doc)));
          } catch (insertErr) {
            // console.warn('InsertMany notifications failed (answer):', insertErr);
          }
        }

        // ----- EMAIL NOTIFICATIONS -----
        const toEmail = followers
          .filter(
            (u: { email?: string; emailVerified?: boolean; username?: string }) =>
              u && u.email && u.emailVerified && u.username !== ans.ansBy,
          )
          .map((u: { email?: string }) => u.email!);

        if (toEmail.length === 0) return;

        const payload: AnswerNotificationPayload = {
          toEmail,
          authorName: ans.ansBy,
          questionTitle: q.title ?? result.title,
          answerPreview: truncate(ans.text),
          questionId: result._id.toString(),
        };

        await notifier.sendAnswerNotification(payload);
      } catch (notifyErr) {
        // console.warn('Answer notification failed:', notifyErr);
      }
    })();

    return result;
  } catch (error) {
    return { error: 'Error when adding answer to question' };
  }
};
