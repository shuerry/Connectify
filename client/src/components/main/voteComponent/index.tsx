/* eslint-disable no-console */
import { downvoteQuestion, upvoteQuestion } from '../../../services/questionService';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { PopulatedDatabaseQuestion } from '../../../types/types';
import useVoteStatus from '../../../hooks/useVoteStatus';

/**
 * Interface represents the props for the VoteComponent.
 *
 * question - The question object containing voting information.
 */
interface VoteComponentProps {
  question: PopulatedDatabaseQuestion;
}

/**
 * A Vote component that allows users to upvote or downvote a question.
 *
 * @param question - The question object containing voting information.
 */
const VoteComponent = ({ question }: VoteComponentProps) => {
  const { user } = useUserContext();
  const { count, voted } = useVoteStatus({ question });

  /**
   * Function to handle upvoting or downvoting a question.
   *
   * @param type - The type of vote, either 'upvote' or 'downvote'.
   */
  const handleVote = async (type: string) => {
    try {
      if (question._id && user.username) {
        console.log(`Attempting to ${type} question:`, question._id);
        if (type === 'upvote') {
          await upvoteQuestion(question._id, user.username);
        } else if (type === 'downvote') {
          await downvoteQuestion(question._id, user.username);
        }
        console.log(`${type} completed successfully`);
      }
    } catch (error) {
      console.error(`Error during ${type}:`, error);
    }
  };

  return (
    <div className='vote-container'>
      <button
        className={`vote-button ${voted === 1 ? 'vote-button-upvoted' : ''}`}
        onClick={() => handleVote('upvote')}
        aria-label='Upvote'
        title='Upvote this question'>
        <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M7 14l5-5 5 5H7z' />
        </svg>
      </button>

      <span className='vote-count'>{count}</span>

      <button
        className={`vote-button ${voted === -1 ? 'vote-button-downvoted' : ''}`}
        onClick={() => handleVote('downvote')}
        aria-label='Downvote'
        title='Downvote this question'>
        <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M7 10l5 5 5-5H7z' />
        </svg>
      </button>
    </div>
  );
};

export default VoteComponent;
