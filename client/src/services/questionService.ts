import { ObjectId } from 'mongodb';
import { PopulatedDatabaseQuestion, Question, VoteInterface } from '../types/types';
import api from './config';

const QUESTION_API_URL = `/api/question`;

/**
 * Function to get questions by filter.
 *
 * @param order - The order in which to fetch questions. Default is 'newest'.
 * @param search - The search term to filter questions. Default is an empty string.
 * @throws Error if there is an issue fetching or filtering questions.
 */
const getQuestionsByFilter = async (
  order: string = 'newest',
  search: string = '',
  viewer?: string,
): Promise<PopulatedDatabaseQuestion[]> => {
  const params = new URLSearchParams({ order, search });
  if (viewer) params.set('viewer', viewer);
  const res = await api.get(`${QUESTION_API_URL}/getQuestion?${params.toString()}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching or filtering questions');
  }
  return res.data;
};

/**
 * Function to get a question by its ID.
 *
 * @param qid - The ID of the question to retrieve.
 * @param username - The username of the user requesting the question.
 * @throws Error if there is an issue fetching the question by ID.
 */
const getQuestionById = async (
  qid: string,
  username: string,
): Promise<PopulatedDatabaseQuestion> => {
  const res = await api.get(`${QUESTION_API_URL}/getQuestionById/${qid}?username=${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching question by id');
  }
  return res.data;
};

/**
 * Function to add a new question.
 *
 * @param q - The question object to add.
 * @throws Error if there is an issue creating the new question.
 */
const addQuestion = async (q: Question): Promise<PopulatedDatabaseQuestion> => {
  const res = await api.post(`${QUESTION_API_URL}/addQuestion`, q);

  if (res.status !== 200) {
    throw new Error('Error while creating a new question');
  }

  return res.data;
};

/**
 * Function to upvote a question.
 *
 * @param qid - The ID of the question to upvote.
 * @param username - The username of the person upvoting the question.
 * @throws Error if there is an issue upvoting the question.
 */
const upvoteQuestion = async (qid: ObjectId, username: string): Promise<VoteInterface> => {
  const data = { qid, username };
  const res = await api.post(`${QUESTION_API_URL}/upvoteQuestion`, data);
  if (res.status !== 200) {
    throw new Error('Error while upvoting the question');
  }
  return res.data;
};

/**
 * Function to downvote a question.
 *
 * @param qid - The ID of the question to downvote.
 * @param username - The username of the person downvoting the question.
 * @throws Error if there is an issue downvoting the question.
 */
const downvoteQuestion = async (qid: ObjectId, username: string): Promise<VoteInterface> => {
  const data = { qid, username };
  const res = await api.post(`${QUESTION_API_URL}/downvoteQuestion`, data);
  if (res.status !== 200) {
    throw new Error('Error while downvoting the question');
  }
  return res.data;
};

/**
 * Function to get community questions by community ID.
 *
 * @param communityId - The ID of the community to fetch questions from.
 * @returns A promise that resolves to an array of populated database questions.
 */
const getCommunityQuestionsById = async (
  communityId: string,
): Promise<PopulatedDatabaseQuestion[]> => {
  const res = await api.get(`${QUESTION_API_URL}/getCommunityQuestions/${communityId}`);

  if (res.status !== 200) {
    throw new Error('Error when fetching community questions');
  }

  return res.data;
};

/**
 * Function to follow a question.
 * @param qid - The ID of the question to follow.
 * @param username - The username of the user following the question.
 * @throws Error if there is an issue adding the follower to the question.
 */
const followQuestion = async (
  qid: ObjectId,
  username: string,
): Promise<void> => {
  const data = { qid, username };
  const res = await api.post(`${QUESTION_API_URL}/followQuestion`, data);

  if (res.status !== 200) {
    throw new Error('Error while adding follower to the question');
  }

  return res.data;
};

export {
  getQuestionsByFilter,
  getQuestionById,
  addQuestion,
  upvoteQuestion,
  downvoteQuestion,
  getCommunityQuestionsById,
  followQuestion,
};

// Reporting helpers
export const reportQuestion = async (
  qid: string,
  reporter: string,
  reason: string,
): Promise<{ _id?: string } | null> => {
  try {
    const res = await api.post(`/api/report`, { qid, reporter, reason });
    return res.status === 200 ? res.data : null;
  } catch (e) {
    return null;
  }
};

export const getQuestionReports = async (
  qid: string,
): Promise<Array<{ reporter: string; reason: string; createdAt: string }> | null> => {
  try {
    const res = await api.get(`/api/report/question/${qid}`);
    return res.status === 200 ? res.data : null;
  } catch (e) {
    return null;
  }
};
