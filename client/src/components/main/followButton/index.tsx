import { followQuestion } from '../../../services/questionService';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { PopulatedDatabaseQuestion } from '../../../types/types';
import useFollowStatus from '../../../hooks/useFollowStatus';

/**
 * Interface represents the props for the FollowComponent.
 *
 * question - The question object containing follow information.
 */
interface FollowButtonProps {
  question: PopulatedDatabaseQuestion;
}

/**
 * A Follow component that allows users to follow or unfollow a question.
 *
 * @param question - The question object containing voting information.
 */
const FollowButton = ({ question }: FollowButtonProps) => {
  const { user } = useUserContext();
  const { followed, setFollowed } = useFollowStatus({ question });

  const handleFollow = async () => {
    if (!question?._id || !user?.username) return;

    setFollowed(prev => !prev);

    try {
      const res = await followQuestion(question._id, user.username);

      // reconcile with server response if it includes followers
      if (Array.isArray((res as any)?.followers)) {
        const isFollowing = (res as any).followers.some((f: any) =>
          typeof f === 'string' ? f === user.username : f?.username === user.username,
        );
        setFollowed(isFollowing);
      }
    } catch {
      // revert on error
      setFollowed(prev => !prev);
    }
  };

  return (
    <div className='vote-container'>
      <button
        className={`vote-button ${followed ? 'vote-button-followed' : ''}`}
        onClick={handleFollow}>
        {followed ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  );
};

export default FollowButton;
