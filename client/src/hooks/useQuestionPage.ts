import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ObjectId } from 'mongodb';
import useUserContext from './useUserContext';
import { AnswerUpdatePayload, OrderType, PopulatedDatabaseQuestion } from '../types/types';
import logger from '../utils/logger';
import { getQuestionsByFilter } from '../services/questionService';

/**
 * Custom hook for managing the question page state, filtering, and real-time updates.
 *
 * @returns titleText - The current title of the question page
 * @returns qlist - The list of questions to display
 * @returns setQuestionOrder - Function to set the sorting order of questions (e.g., newest, oldest).
 */
const useQuestionPage = () => {
  const { socket, user } = useUserContext();

  const [searchParams] = useSearchParams();
  const [titleText, setTitleText] = useState<string>('All Questions');
  const [questionOrder, setQuestionOrder] = useState<OrderType>('newest');
  const [qlist, setQlist] = useState<PopulatedDatabaseQuestion[]>([]);

  useEffect(() => {
    /**
     * Derive title and search string from URL params on every change.
     */
    let pageTitle = 'All Questions';
    let searchString = '';

    const searchQuery = searchParams.get('search');
    const tagQuery = searchParams.get('tag');

    if (searchQuery) {
      pageTitle = 'Search Results';
      searchString = searchQuery;
    } else if (tagQuery) {
      pageTitle = tagQuery;
      searchString = `[${tagQuery}]`;
    }

    setTitleText(pageTitle);

    const fetchData = async () => {
      try {
        const res = await getQuestionsByFilter(questionOrder, searchString, user.username);
        setQlist(res || []);
      } catch (error) {
        logger.error(error);
      }
    };

    const handleQuestionUpdate = (question: PopulatedDatabaseQuestion) => {
      setQlist(prevQlist => {
        const questionExists = prevQlist.some(q => q._id === question._id);

        if (questionExists) {
          return prevQlist.map(q => (q._id === question._id ? question : q));
        }

        return [question, ...prevQlist];
      });
    };

    const handleAnswerUpdate = ({ qid, answer }: AnswerUpdatePayload) => {
      setQlist(prevQlist =>
        prevQlist.map(q =>
          String(q._id) === String(qid) ? { ...q, answers: [...q.answers, answer] } : q,
        ),
      );
    };

    const handleViewsUpdate = (question: PopulatedDatabaseQuestion) => {
      setQlist(prevQlist => prevQlist.map(q => (q._id === question._id ? question : q)));
    };

    const handleQuestionDelete = ({ qid }: { qid: ObjectId }) => {
      setQlist(prevQlist => prevQlist.filter(q => String(q._id) !== String(qid)));
    };

    const handleAnswerDelete = ({ qid, aid }: { qid: ObjectId; aid: ObjectId }) => {
      setQlist(prevQlist =>
        prevQlist.map(q =>
          String(q._id) === String(qid)
            ? { ...q, answers: q.answers.filter(a => String(a._id) !== String(aid)) }
            : q,
        ),
      );
    };

    fetchData();

    socket.on('questionUpdate', handleQuestionUpdate);
    socket.on('answerUpdate', handleAnswerUpdate);
    socket.on('viewsUpdate', handleViewsUpdate);
    socket.on('questionDelete', handleQuestionDelete);
    socket.on('answerDelete', handleAnswerDelete);

    return () => {
      socket.off('questionUpdate', handleQuestionUpdate);
      socket.off('answerUpdate', handleAnswerUpdate);
      socket.off('viewsUpdate', handleViewsUpdate);
      socket.off('questionDelete', handleQuestionDelete);
      socket.off('answerDelete', handleAnswerDelete);
    };
  }, [searchParams, questionOrder, socket, user.username]);

  return { titleText, qlist, setQuestionOrder };
};

export default useQuestionPage;
