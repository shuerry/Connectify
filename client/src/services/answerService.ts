import { Answer, PopulatedDatabaseAnswer } from '../types/types';
import api from './config';

const ANSWER_API_URL = `/api/answer`;

/**
 * Adds a new answer to a specific question.
 *
 * @param qid - The ID of the question to which the answer is being added.
 * @param ans - The answer object containing the answer details.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
const addAnswer = async (qid: string, ans: Answer): Promise<PopulatedDatabaseAnswer> => {
  const data = { qid, ans };

  const res = await api.post(`${ANSWER_API_URL}/addAnswer`, data);
  if (res.status !== 200) {
    throw new Error('Error while creating a new answer');
  }
  return res.data;
};

export default addAnswer;

export const deleteAnswer = async (
  answerId: string,
  username: string,
): Promise<{ message?: string } | null> => {
  try {
    const res = await api.delete(`${ANSWER_API_URL}/deleteAnswer/${answerId}`, {
      data: { username },
    });
    return res.status === 200 ? res.data : null;
  } catch (e) {
    return null;
  }
};
