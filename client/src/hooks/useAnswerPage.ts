import { ObjectId } from 'mongodb';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Comment,
  VoteUpdatePayload,
  PopulatedDatabaseQuestion,
  PopulatedDatabaseAnswer,
} from '../types/types';
import useUserContext from './useUserContext';
import logger from '../utils/logger';
import addComment from '../services/commentService';
import { getQuestionById, getQuestionReports, reportQuestion } from '../services/questionService';

/**
 * Custom hook for managing the answer page's state, navigation, and real-time updates.
 *
 * @returns questionID - The current question ID retrieved from the URL parameters.
 * @returns question - The current question object with its answers, comments, and votes.
 * @returns handleNewComment - Function to handle the submission of a new comment to a question or answer.
 * @returns handleNewAnswer - Function to navigate to the "New Answer" page
 */
const useAnswerPage = () => {
  const { qid } = useParams();
  const navigate = useNavigate();

  const { user, socket } = useUserContext();
  const [questionID, setQuestionID] = useState<string>(qid || '');
  const [question, setQuestion] = useState<PopulatedDatabaseQuestion | null>(null);
  const [reports, setReports] = useState<
    Array<{ reporter: string; reason: string; createdAt: string }>
  >([]);
  const [isReportOpen, setReportOpen] = useState(false);

  /**
   * Function to handle navigation to the "New Answer" page.
   */
  const handleNewAnswer = () => {
    navigate(`/new/answer/${questionID}`);
  };

  /**
   * Function to handle question updates from editing.
   *
   * @param updatedQuestion - The updated question object.
   */
  const handleQuestionUpdate = (updatedQuestion: PopulatedDatabaseQuestion) => {
    setQuestion(updatedQuestion);
  };

  /**
   * Function to check if current user can report this question
   */
  const canReport = (): boolean => {
    if (!question || !user || !user.username) return false;
    return user.username !== question.askedBy;
  };

  /**
   * Function to open the report modal
   */
  const openReportModal = () => {
    setReportOpen(true);
  };

  /**
   * Function to submit a report
   */
  const submitReport = async (reason: string) => {
    if (!question) return;
    await reportQuestion(String(question._id), user.username, reason);
    setReportOpen(false);
  };

  useEffect(() => {
    if (!qid) {
      navigate('/home');
      return;
    }

    setQuestionID(qid);
  }, [qid, navigate]);

  /**
   * Function to handle the submission of a new comment to a question or answer.
   *
   * @param comment - The comment object to be added.
   * @param targetType - The type of target being commented on, either 'question' or 'answer'.
   * @param targetId - The ID of the target being commented on.
   */
  const handleNewComment = async (
    comment: Comment,
    targetType: 'question' | 'answer',
    targetId: string | undefined,
  ) => {
    try {
      if (targetId === undefined) {
        throw new Error('No target ID provided.');
      }

      await addComment(targetId, targetType, comment);
    } catch (error) {
      logger.error('Error adding comment:', error);
    }
  };

  useEffect(() => {
    /**
     * Function to fetch the question data based on the question ID.
     */
    const fetchData = async () => {
      try {
        const res = await getQuestionById(questionID, user.username);
        setQuestion(res || null);
        if (res && res.askedBy === user.username) {
          const r = await getQuestionReports(questionID);
          setReports(Array.isArray(r) ? r : []);
        } else {
          setReports([]);
        }
      } catch (error) {
        logger.error('Error fetching question:', error);
      }
    };

    fetchData().catch(e => logger.error(e));
  }, [questionID, user.username]);

  useEffect(() => {
    /**
     * Function to handle updates to the answers of a question.
     *
     * @param answer - The updated answer object.
     */
    const handleAnswerUpdate = ({
      qid: id,
      answer,
    }: {
      qid: ObjectId;
      answer: PopulatedDatabaseAnswer;
    }) => {
      if (String(id) === questionID) {
        setQuestion(prevQuestion =>
          prevQuestion
            ? // Creates a new Question object with the new answer appended to the end
              { ...prevQuestion, answers: [...prevQuestion.answers, answer] }
            : prevQuestion,
        );
      }
    };

    /**
     * Function to handle updates to the comments of a question or answer.
     *
     * @param result - The updated question or answer object.
     * @param type - The type of the object being updated, either 'question' or 'answer'.
     */
    const handleCommentUpdate = ({
      result,
      type,
    }: {
      result: PopulatedDatabaseQuestion | PopulatedDatabaseAnswer;
      type: 'question' | 'answer';
    }) => {
      if (type === 'question') {
        const questionResult = result as PopulatedDatabaseQuestion;

        if (String(questionResult._id) === questionID) {
          setQuestion(questionResult);
        }
      } else if (type === 'answer') {
        setQuestion(prevQuestion =>
          prevQuestion
            ? // Updates answers with a matching object ID, and creates a new Question object
              {
                ...prevQuestion,
                answers: prevQuestion.answers.map(a =>
                  a._id === result._id ? (result as PopulatedDatabaseAnswer) : a,
                ),
              }
            : prevQuestion,
        );
      }
    };

    /**
     * Function to handle updates to the views of a question.
     *
     * @param q The updated question object.
     */
    const handleViewsUpdate = (q: PopulatedDatabaseQuestion) => {
      if (String(q._id) === questionID) {
        setQuestion(q);
      }
    };

    /**
     * Function to handle vote updates for a question.
     *
     * @param voteData - The updated vote data for a question
     */
    const handleVoteUpdate = (voteData: VoteUpdatePayload) => {
      if (voteData.qid === questionID) {
        setQuestion(prevQuestion =>
          prevQuestion
            ? {
                ...prevQuestion,
                upVotes: [...voteData.upVotes],
                downVotes: [...voteData.downVotes],
              }
            : prevQuestion,
        );
      }
    };

    socket.on('answerUpdate', handleAnswerUpdate);
    socket.on('viewsUpdate', handleViewsUpdate);
    socket.on('commentUpdate', handleCommentUpdate);
    socket.on('voteUpdate', handleVoteUpdate);
    /** Handle deletions so page updates in-place */
    const handleAnswerDelete = ({ qid, aid }: { qid: ObjectId; aid: ObjectId }) => {
      if (String(qid) === questionID) {
        setQuestion(prevQuestion =>
          prevQuestion
            ? {
                ...prevQuestion,
                answers: prevQuestion.answers.filter(a => String(a._id) !== String(aid)),
              }
            : prevQuestion,
        );
      }
    };

    const handleCommentDelete = ({ parentId, cid }: { parentId: ObjectId; cid: ObjectId }) => {
      // If the deleted comment is on the question itself
      if (String(parentId) === questionID) {
        setQuestion(prev =>
          prev
            ? { ...prev, comments: prev.comments.filter(c => String(c._id) !== String(cid)) }
            : prev,
        );
        return;
      }

      // Otherwise the parent is an answer - remove from that answer's comments
      setQuestion(prev =>
        prev
          ? {
              ...prev,
              answers: prev.answers.map(ans =>
                String(ans._id) === String(parentId)
                  ? { ...ans, comments: ans.comments.filter(c => String(c._id) !== String(cid)) }
                  : ans,
              ),
            }
          : prev,
      );
    };

    socket.on('answerDelete', handleAnswerDelete);
    socket.on('commentDelete', handleCommentDelete);

    return () => {
      socket.off('answerUpdate', handleAnswerUpdate);
      socket.off('viewsUpdate', handleViewsUpdate);
      socket.off('commentUpdate', handleCommentUpdate);
      socket.off('voteUpdate', handleVoteUpdate);
      socket.off('answerDelete', handleAnswerDelete);
      socket.off('commentDelete', handleCommentDelete);
    };
  }, [questionID, socket]);

  return {
    questionID,
    question,
    reports,
    handleNewComment,
    handleNewAnswer,
    handleQuestionUpdate,
    canReport,
    openReportModal,
    submitReport,
    isReportOpen,
    setReportOpen,
  };
};

export default useAnswerPage;
