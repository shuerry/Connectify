import { followQuestion } from '../../../services/questionService';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { PopulatedDatabaseQuestion } from '../../../types/types';
import useFollowStatus from '../../../hooks/useFollowStatus';

/**
 * Interface represents the props for the VoteComponent.
 *
 * question - The question object containing voting information.
 */
interface FollowComponentProps {
  question: PopulatedDatabaseQuestion;
}

/**
 * A Follow component that allows users to follow or unfollow a question.
 *
 * @param question - The question object containing voting information.
 */
const FollowComponent = ({ question }: FollowComponentProps) => {
  const { user } = useUserContext();
  const { followed } = useFollowStatus({ question });

  /**
   * Function to handle following a question.
   */
  const handleFollow = async () => {
    try {
      if (question._id) {
        await followQuestion(question._id, user.username);
      }
    } catch (error) {
      // Handle error
    }
  };

  // Kept the classnames so that I can reuse the CSS styles
  return (
    <div className='vote-container'>
      <button
        className={`vote-button ${followed ? 'vote-button-followed' : ''}`}
        onClick={() => handleFollow()}>
        Follow
      </button>
    </div>
  );
};

export default FollowComponent;
