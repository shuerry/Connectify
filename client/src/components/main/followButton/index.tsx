import React from 'react';
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

  const [isLoading, setIsLoading] = React.useState(false);

  const handleFollow = async () => {
    if (!question?._id || !user?.username || isLoading) return;

    setIsLoading(true);
    const originalState = followed;
    setFollowed(prev => !prev);

    try {
      const res = await followQuestion(question._id, user.username);

      // reconcile with server response if it includes followers
      if (
        Array.isArray(
          (res as unknown as { followers?: (string | { username: string })[] })?.followers,
        )
      ) {
        const isFollowing = (
          res as unknown as { followers: (string | { username: string })[] }
        ).followers.some((f: string | { username: string }) =>
          typeof f === 'string' ? f === user.username : f?.username === user.username,
        );
        setFollowed(isFollowing);
      }
    } catch {
      // revert on error
      setFollowed(originalState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='follow-container'>
      <button
        className={`follow-btn ${followed ? 'followed' : 'not-followed'}`}
        onClick={handleFollow}
        disabled={isLoading}
        title={followed ? 'Click to unfollow' : 'Click to follow'}>
        <span className='follow-icon'>
          {followed ? (
            <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
            </svg>
          ) : (
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'>
              <path d='M12 4.5v15m7.5-7.5h-15' />
            </svg>
          )}
        </span>
        <span className='follow-text'>{followed ? 'Following' : 'Follow'}</span>
      </button>
    </div>
  );
};

export default FollowButton;
